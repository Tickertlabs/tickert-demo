# Event Creation Flow & Data Architecture

## Genel Bakış

Bu doküman, organizer'ın event oluşturma sürecini, veri saklama stratejisini ve event discovery mekanizmasını detaylandırır.

## Veri Saklama Stratejisi

### 1. Blockchain'de Saklanan Veriler (Sui Move Contract)

**Neden blockchain'de?**
- Doğrulanabilirlik ve şeffaflık
- Immutable event kayıtları
- Trustless payment ve ticket minting
- On-chain query'ler için gerekli

**Event Struct (contracts/sources/event.move):**
```move
struct Event has key, store {
    id: ID,
    organizer: address,           // Event sahibi
    metadata_url: String,        // Walrus blob URL pointer
    capacity: u64,                // Max ticket sayısı
    price: u64,                   // Ticket fiyatı (MIST cinsinden)
    sold: u64,                    // Satılan ticket sayısı
    status: u8,                   // 0: Draft, 1: Active, 2: Cancelled, 3: Completed
    start_time: u64,              // Unix timestamp
    end_time: u64,                // Unix timestamp
    created_at: u64,              // Creation timestamp
    requires_approval: bool,      // Approval flow gerekli mi?
    is_public: bool,              // Public listing'de görünsün mü?
}
```

**Blockchain'de saklanan veriler:**
- ✅ Event ID (unique identifier)
- ✅ Organizer address
- ✅ Metadata URL (Walrus pointer)
- ✅ Capacity (max tickets)
- ✅ Price (Sui token amount)
- ✅ Sold count (current ticket count)
- ✅ Status (draft, active, cancelled, completed)
- ✅ Start/End time (Unix timestamps)
- ✅ Approval requirement flag
- ✅ Public visibility flag
- ✅ Creation timestamp

### 2. Walrus'ta Saklanan Veriler

**Neden Walrus'ta?**
- Büyük metadata dosyaları (resimler, açıklamalar)
- Merkezi olmayan storage
- Düşük maliyet
- IPFS benzeri ama Sui-native

**Event Metadata JSON (Walrus blob):**
```json
{
  "title": "Sui Developer Conference 2024",
  "description": "Annual conference for Sui developers...",
  "image": "https://walrus.xyz/.../event-image.jpg",
  "location": {
    "name": "San Francisco Convention Center",
    "address": "123 Main St, San Francisco, CA",
    "coordinates": {
      "lat": 37.7749,
      "lng": -122.4194
    }
  },
  "category": "Technology",
  "tags": ["blockchain", "web3", "sui"],
  "agenda": [
    {
      "time": "09:00",
      "title": "Opening Keynote",
      "speaker": "John Doe"
    }
  ],
  "speakers": [
    {
      "name": "John Doe",
      "bio": "...",
      "image": "https://..."
    }
  ],
  "announcements": [],
  "ics_calendar": "BEGIN:VCALENDAR\n..." // ICS file content
}
```

**Walrus'ta saklanan veriler:**
- ✅ Title
- ✅ Description (uzun metin)
- ✅ Image/Media files
- ✅ Location details (public)
- ✅ Category & Tags
- ✅ Agenda (detaylı program)
- ✅ Speaker information
- ✅ Announcements
- ✅ ICS calendar file

**Not:** Location bilgisi public olarak Walrus'ta saklanır. Eğer private location gerekiyorsa, bu Seal ile encrypt edilip ticket metadata'sına eklenir.

### 3. Indexer/Database İhtiyacı

**Kendi database'imiz olmalı mı?**

**Evet, ama minimal ve optional:**

**Neden gerekli?**
- ⚡ **Performance**: Blockchain query'leri yavaş ve pahalı
- 🔍 **Search & Filter**: Title, category, location'a göre arama
- 📊 **Analytics**: Organizer dashboard için istatistikler
- 🗂️ **Indexing**: Event listing için hızlı erişim
- 💾 **Cache**: Walrus metadata'larını cache'lemek

**Neden optional?**
- 🚫 **Decentralization**: Merkezi database merkeziyetsizlik prensibine aykırı
- ✅ **Fallback**: Blockchain'den direkt query mümkün (yavaş ama çalışır)
- 🔄 **Sync**: Database blockchain ile sync tutulmalı

**Önerilen Yaklaşım: Hybrid Indexer**

**Option 1: Sui Indexer Service (Önerilen)**
- Sui'nin kendi indexer servisini kullan
- GraphQL veya REST API ile event'leri query et
- Blockchain'den otomatik sync
- Merkezi olmayan yapıyı korur

**Option 2: Minimal PostgreSQL/SQLite**
- Sadece indexing için
- Event ID, title, category, organizer, status
- Walrus URL'leri cache'lemek için
- Blockchain'den periyodik sync (cron job)

**Indexer'da saklanan minimal veriler:**
```typescript
interface EventIndex {
  event_id: string;           // Sui object ID
  organizer: string;           // Address
  metadata_url: string;        // Walrus URL
  title: string;              // Cached from Walrus
  category: string;
  start_time: number;
  end_time: number;
  status: number;
  capacity: number;
  sold: number;
  price: number;
  is_public: boolean;
  created_at: number;
  updated_at: number;
}
```

## Event Creation Flow

### Adım 1: Form Doldurma (Frontend)

**Sayfa:** `src/pages/organizer/create.tsx`

Organizer şu bilgileri girer:
- Title (required)
- Description (required)
- Image upload (optional)
- Start date/time (required)
- End date/time (required)
- Location (required)
- Category (required)
- Tags (optional)
- Capacity (required)
- Price in SUI (required)
- Requires approval? (checkbox)
- Public listing? (checkbox)

**Validasyon:**
- Tüm required field'lar dolu olmalı
- Start time < End time
- Capacity > 0
- Price >= 0

### Adım 2: Metadata Hazırlama ve Walrus'a Upload

**Fonksiyon:** `src/lib/walrus/storage.ts`

```typescript
async function uploadEventMetadata(eventData: EventFormData): Promise<string> {
  // 1. Image'ı Walrus'a upload et (eğer varsa)
  const imageUrl = eventData.image 
    ? await uploadImageToWalrus(eventData.image)
    : null;

  // 2. ICS calendar file oluştur
  const icsContent = generateICSFile(eventData);

  // 3. Metadata JSON'u oluştur
  const metadata = {
    title: eventData.title,
    description: eventData.description,
    image: imageUrl,
    location: eventData.location,
    category: eventData.category,
    tags: eventData.tags,
    agenda: eventData.agenda || [],
    speakers: eventData.speakers || [],
    announcements: [],
    ics_calendar: icsContent
  };

  // 4. JSON'u Walrus'a upload et
  const metadataUrl = await uploadJSONToWalrus(metadata);
  
  return metadataUrl; // Walrus blob URL döner
}
```

**Transaction öncesi:**
- ✅ Metadata Walrus'a yüklenmiş olmalı
- ✅ Metadata URL alınmış olmalı
- ✅ Form validasyonu tamamlanmış olmalı

**Hata durumu:**
- Walrus upload başarısız olursa, kullanıcıya hata göster
- Transaction'a geçme

### Adım 3: Blockchain Transaction (Sui Move)

**Ne zaman transaction atılır?**
- ✅ Metadata Walrus'a başarıyla yüklendikten SONRA
- ✅ Kullanıcı "Create Event" butonuna tıkladığında
- ✅ Wallet bağlı ve yeterli gas var

**Transaction Flow:**

```typescript
// src/lib/sui/transactions.ts

async function createEventTransaction(
  organizer: string,
  metadataUrl: string,
  eventParams: EventParams
): Promise<TransactionBlock> {
  const txb = new TransactionBlock();
  
  // Move contract'ındaki create_event fonksiyonunu çağır
  txb.moveCall({
    target: `${PACKAGE_ID}::event::create_event`,
    arguments: [
      txb.pure.string(metadataUrl),
      txb.pure.u64(eventParams.capacity),
      txb.pure.u64(eventParams.price),
      txb.pure.u64(eventParams.startTime),
      txb.pure.u64(eventParams.endTime),
      txb.pure.bool(eventParams.requiresApproval),
      txb.pure.bool(eventParams.isPublic),
    ],
  });

  return txb;
}
```

**Move Contract Function:**
```move
public entry fun create_event(
    organizer: &signer,
    metadata_url: vector<u8>,
    capacity: u64,
    price: u64,
    start_time: u64,
    end_time: u64,
    requires_approval: bool,
    is_public: bool,
    ctx: &mut TxContext
) {
    // Validation
    assert!(capacity > 0, E_INVALID_CAPACITY);
    assert!(start_time < end_time, E_INVALID_TIME);
    assert!(start_time > timestamp::now_seconds(ctx), E_PAST_START_TIME);
    
    // Event object oluştur
    let event = Event {
        id: object::id_from_address(@0x0), // Unique ID generation
        organizer: tx_context::sender(ctx),
        metadata_url: string::utf8(metadata_url),
        capacity,
        price,
        sold: 0,
        status: EVENT_STATUS_ACTIVE,
        start_time,
        end_time,
        created_at: timestamp::now_seconds(ctx),
        requires_approval,
        is_public,
    };
    
    // Event'i transfer et (organizer'a)
    transfer::transfer(event, tx_context::sender(ctx));
}
```

**Transaction Sonrası:**
- ✅ Transaction başarılı olursa, event object ID alınır
- ✅ Frontend'de success mesajı gösterilir
- ✅ Organizer'ın event listesine yönlendirilir
- ⏳ Indexer'a event eklenir (async, background job)

### Adım 4: Indexer Sync (Background)

**Ne zaman?**
- Transaction başarılı olduktan sonra (async)
- Indexer service blockchain'i dinler ve yeni event'leri yakalar

**Sync Process:**
```typescript
// services/indexer/sync.ts

async function syncEventToIndexer(eventId: string) {
  // 1. Blockchain'den event object'i oku
  const eventObject = await suiClient.getObject({
    id: eventId,
    options: { showContent: true }
  });

  // 2. Walrus'tan metadata'yı oku
  const metadata = await fetchWalrusMetadata(eventObject.metadata_url);

  // 3. Indexer database'ine ekle
  await db.events.create({
    event_id: eventId,
    organizer: eventObject.organizer,
    metadata_url: eventObject.metadata_url,
    title: metadata.title,
    category: metadata.category,
    start_time: eventObject.start_time,
    end_time: eventObject.end_time,
    status: eventObject.status,
    capacity: eventObject.capacity,
    sold: eventObject.sold,
    price: eventObject.price,
    is_public: eventObject.is_public,
    created_at: eventObject.created_at,
  });
}
```

## Event Listing & Discovery

### Attendee'ler Event'leri Nasıl Görür?

**Option 1: Indexer API (Önerilen - Hızlı)**

**Endpoint:** `GET /api/events`

```typescript
// services/api/events.ts

async function getEvents(filters: EventFilters) {
  // Indexer database'inden query
  const events = await db.events.findMany({
    where: {
      is_public: true,
      status: EVENT_STATUS_ACTIVE,
      start_time: { gte: Date.now() },
      ...filters
    },
    orderBy: { start_time: 'asc' },
    limit: 20
  });

  // Her event için Walrus metadata'yı cache'den veya direkt fetch et
  const eventsWithMetadata = await Promise.all(
    events.map(async (event) => {
      const metadata = await getCachedOrFetchMetadata(event.metadata_url);
      return {
        ...event,
        metadata
      };
    })
  );

  return eventsWithMetadata;
}
```

**Avantajlar:**
- ⚡ Hızlı response time
- 🔍 Search ve filter kolay
- 📊 Pagination desteği
- 💾 Metadata cache

**Dezavantajlar:**
- 🔄 Indexer sync gerekli
- 🗄️ Merkezi database (ama optional)

**Option 2: Direct Blockchain Query (Fallback - Yavaş)**

**Fonksiyon:** `src/lib/sui/queries.ts`

```typescript
async function getEventsFromBlockchain() {
  // Sui'den tüm Event object'lerini query et
  // Bu yavaş ve pahalı olabilir
  const events = await suiClient.getOwnedObjects({
    owner: PUBLIC_EVENT_REGISTRY, // Tüm event'lerin tutulduğu registry
    filter: { StructType: 'Event' },
    options: { showContent: true }
  });

  // Filter: is_public = true, status = active
  const publicEvents = events.filter(e => 
    e.content.fields.is_public && 
    e.content.fields.status === EVENT_STATUS_ACTIVE
  );

  return publicEvents;
}
```

**Kullanım Senaryosu:**
- Indexer down olduğunda fallback
- Decentralized mode (indexer kullanmak istemeyenler için)

### Event Detail Sayfası

**Sayfa:** `src/pages/events/[id].tsx`

**Data Flow:**
1. Event ID'den blockchain'den event object'i çek
2. `metadata_url`'den Walrus'tan full metadata'yı çek
3. Event detay sayfasında göster

```typescript
async function getEventDetails(eventId: string) {
  // 1. Blockchain'den event object
  const eventObject = await suiClient.getObject({
    id: eventId,
    options: { showContent: true }
  });

  // 2. Walrus'tan metadata
  const metadata = await fetchWalrusMetadata(
    eventObject.content.fields.metadata_url
  );

  return {
    ...eventObject.content.fields,
    metadata
  };
}
```

## Özet: Data Flow Diagram

```
┌─────────────────┐
│  Organizer      │
│  Form Doldurur  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Walrus Upload  │
│  (Metadata JSON) │
└────────┬────────┘
         │
         ▼ metadata_url
┌─────────────────┐
│  Sui Transaction│
│  (Event Object)  │
└────────┬────────┘
         │
         ├─────────────────┐
         ▼                 ▼
┌─────────────────┐  ┌──────────────┐
│  Blockchain     │  │  Indexer     │
│  (Immutable)    │  │  (Cache)     │
└─────────────────┘  └──────┬───────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Event Listing  │
                    │  (Fast Query)   │
                    └─────────────────┘
```

## Önemli Notlar

1. **Transaction Timing:**
   - ❌ Metadata upload'tan ÖNCE transaction atma
   - ✅ Metadata upload'tan SONRA transaction at
   - ✅ Transaction başarısız olursa, metadata Walrus'ta kalır (orphan data - temizlenebilir)

2. **Error Handling:**
   - Walrus upload başarısız → Transaction'a geçme
   - Transaction başarısız → Metadata Walrus'ta kalır (cleanup job gerekebilir)
   - Indexer sync başarısız → Event blockchain'de var, indexer'da yok (retry mekanizması)

3. **Decentralization:**
   - Indexer optional, blockchain her zaman source of truth
   - Indexer down olsa bile, direkt blockchain query mümkün
   - Walrus metadata her zaman erişilebilir

4. **Performance:**
   - Event listing için indexer kullan (hızlı)
   - Event detail için direkt blockchain + Walrus (güvenilir)
   - Metadata cache'le (Walrus response time'ı azalt)

5. **Privacy:**
   - Public location → Walrus metadata'da
   - Private location → Seal ile encrypt, ticket metadata'da

