/**
 * Walrus client setup
 * Walrus is a decentralized storage layer for Sui
 * 
 * According to Walrus documentation:
 * - Blob storage requires WAL token and SUI for payment
 * - Supports shared blobs
 * - Supports multiple files at once (batch with PTB)
 * - Mainnet is live with 100+ storage nodes
 * 
 * For frontend, we use HTTP API endpoints provided by Walrus storage nodes.
 * The official TypeScript SDK is planned for release.
 */

// Walrus Publisher Service API endpoint
// According to: https://docs.wal.app/docs/usage/web-api
// Can be configured via environment variable
// Testnet: https://publisher.walrus-testnet.walrus.space
// Mainnet: https://publisher.walrus.walrus.space (when available)
// 
// Note: For reading blobs, use aggregator service:
// Testnet: https://aggregator.walrus-testnet.walrus.space
// Mainnet: https://aggregator.walrus.walrus.space
const WALRUS_API_URL = import.meta.env.VITE_WALRUS_API_URL || 'https://sui-walrus-testnet-publisher.bwarelabs.com';
const WALRUS_AGGREGATOR_URL = import.meta.env.VITE_WALRUS_AGGREGATOR_URL || 'https://sui-walrus-tn-aggregator.bwarelabs.com';

export interface WalrusClientConfig {
  apiUrl?: string; // Publisher service URL
  aggregatorUrl?: string; // Aggregator service URL (for reading blobs)
  apiKey?: string;
}

class WalrusClient {
  private apiUrl: string;
  private aggregatorUrl: string;
  private apiKey?: string;

  constructor(config: WalrusClientConfig = {}) {
    this.apiUrl = config.apiUrl || WALRUS_API_URL;
    // If aggregator URL is not provided, try to derive it from publisher URL
    this.aggregatorUrl = config.aggregatorUrl || 
      (config.apiUrl ? config.apiUrl.replace('publisher', 'aggregator') : WALRUS_AGGREGATOR_URL);
    this.apiKey = config.apiKey;
  }


  /**
   * Upload a blob to Walrus Publisher Service
   * Returns the blob ID that can be used to retrieve the blob
   * 
   * According to Walrus documentation (https://docs.wal.app/docs/usage/web-api):
   * - Uses PUT method to /v1/blobs endpoint
   * - Request body is the raw blob data (not FormData)
   * - Returns JSON with newlyCreated or alreadyCertified structure
   * - Blob storage requires WAL token and SUI for payment
   * 
   * @param data - Blob or string data to upload
   * @returns Blob ID that can be used to construct the blob URL
   */
  async uploadBlob(data: Blob | string): Promise<string> {
    // Convert data to Blob if it's a string
    let blob: Blob;
    if (typeof data === 'string') {
      blob = new Blob([data], { type: 'application/json' });
    } else {
      blob = data;
    }

    const headers: Record<string, string> = {};
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    // Walrus Publisher Service API endpoint: PUT /v1/blobs
    // According to: https://docs.wal.app/docs/usage/web-api
    const uploadEndpoint = `${this.apiUrl}/v1/blobs`;
    
    const response = await fetch(uploadEndpoint, {
      method: 'PUT',
      body: blob,
      headers,
    });

    if (!response.ok) {
      let errorText: string;
      try {
        errorText = await response.text();
      } catch {
        errorText = response.statusText;
      }
      throw new Error(`Failed to upload to Walrus (${response.status}): ${errorText}`);
    }

    let result: any;
    try {
      result = await response.json();
    } catch (error) {
      throw new Error(`Invalid JSON response from Walrus API: ${error}`);
    }
    
    // Walrus returns either newlyCreated or alreadyCertified structure
    // See: https://docs.wal.app/docs/usage/web-api#store
    let blobId: string | undefined;
    
    if (result.newlyCreated?.blobObject?.blobId) {
      // New blob was created
      blobId = result.newlyCreated.blobObject.blobId;
    } else if (result.alreadyCertified?.blobId) {
      // Blob already exists and is certified
      blobId = result.alreadyCertified.blobId;
    } else {
      console.error('Walrus Publisher Service API response:', result);
      throw new Error(
        `Invalid response format from Walrus API: Expected newlyCreated or alreadyCertified. ` +
        `Response: ${JSON.stringify(result)}`
      );
    }
    
    if (!blobId || typeof blobId !== 'string') {
      throw new Error(`Invalid blob ID returned from Walrus: ${blobId}`);
    }
    
    // Return blob ID - the aggregator URL can be constructed as:
    // ${AGGREGATOR_URL}/v1/blobs/${blobId}
    // For now, we return the blob ID and let the caller construct the full URL if needed
    return blobId;
  }

  /**
   * Get blob from Walrus Aggregator by blob ID
   * 
   * According to Walrus documentation (https://docs.wal.app/docs/usage/web-api#read):
   * - Uses GET method to /v1/blobs/<blob-id> endpoint
   * - Blobs are accessible via aggregator, not publisher
   * 
   * @param blobId - Blob ID returned from uploadBlob
   * @param aggregatorUrl - Optional aggregator URL (defaults to using publisher URL as aggregator)
   * @returns Blob data
   */
  async getBlob(blobId: string, aggregatorUrl?: string): Promise<Blob> {
    if (!blobId || typeof blobId !== 'string') {
      throw new Error('Invalid Walrus blob ID');
    }

    // Use provided aggregator URL or default aggregator URL
    const baseUrl = aggregatorUrl || this.aggregatorUrl;
    const blobEndpoint = `${baseUrl}/v1/blobs/${blobId}`;

    const headers: Record<string, string> = {};
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(blobEndpoint, { headers });
    if (!response.ok) {
      let errorText: string;
      try {
        errorText = await response.text();
      } catch {
        errorText = response.statusText;
      }
      throw new Error(`Failed to fetch blob from Walrus (${response.status}): ${errorText}`);
    }
    return response.blob();
  }

  /**
   * Get JSON data from Walrus Aggregator by blob ID
   * 
   * Fetches JSON metadata stored in Walrus blobs.
   * Used for event metadata, ticket metadata, etc.
   * 
   * @param blobId - Blob ID returned from uploadBlob
   * @param aggregatorUrl - Optional aggregator URL
   * @returns Parsed JSON data
   */
  async getJSON<T>(blobId: string, aggregatorUrl?: string): Promise<T> {
    if (!blobId || typeof blobId !== 'string') {
      throw new Error('Invalid Walrus blob ID');
    }

    // Use provided aggregator URL or default aggregator URL
    const baseUrl = aggregatorUrl || this.aggregatorUrl;
    const blobEndpoint = `${baseUrl}/v1/blobs/${blobId}`;

    const headers: Record<string, string> = {};
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(blobEndpoint, { headers });
    if (!response.ok) {
      let errorText: string;
      try {
        errorText = await response.text();
      } catch {
        errorText = response.statusText;
      }
      throw new Error(`Failed to fetch JSON from Walrus (${response.status}): ${errorText}`);
    }
    
    try {
      return await response.json();
    } catch (error) {
      throw new Error(`Invalid JSON response from Walrus: ${error}`);
    }
  }
}

// Singleton instance
let walrusClient: WalrusClient | null = null;

/**
 * Get or create Walrus client instance
 */
export function getWalrusClient(config?: WalrusClientConfig): WalrusClient {
  if (!walrusClient) {
    walrusClient = new WalrusClient(config);
  }
  return walrusClient;
}

/**
 * Initialize Walrus client
 */
export function initWalrusClient(config: WalrusClientConfig): WalrusClient {
  walrusClient = new WalrusClient(config);
  return walrusClient;
}

/**
 * Construct aggregator URL for a blob ID
 * 
 * @param blobId - Blob ID returned from uploadBlob
 * @param aggregatorUrl - Optional aggregator URL (defaults to testnet)
 * @returns Full URL to access the blob
 */
export function getBlobUrl(blobId: string, aggregatorUrl?: string): string {
  const baseUrl = aggregatorUrl || WALRUS_AGGREGATOR_URL;
  return `${baseUrl}/v1/blobs/${blobId}`;
}

