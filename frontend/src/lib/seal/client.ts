/**
 * Seal client setup
 * Seal is a decentralized secrets management service for Sui
 * Used for encrypting ticket metadata (location, access links, etc.)
 */

const SEAL_API_URL = import.meta.env.VITE_SEAL_API_URL || 'https://sealplus.wal.app';

export interface SealClientConfig {
  apiUrl?: string;
  apiKey?: string;
}

class SealClient {
  private apiUrl: string;
  private apiKey?: string;

  constructor(config: SealClientConfig = {}) {
    this.apiUrl = config.apiUrl || SEAL_API_URL;
    this.apiKey = config.apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Seal API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create an encryption key
   */
  async createKey(): Promise<string> {
    const response = await this.request<{ keyId: string }>('/keys', {
      method: 'POST',
    });
    return response.keyId;
  }

  /**
   * Encrypt data
   */
  async encrypt(keyId: string, data: string): Promise<string> {
    const response = await this.request<{ encrypted: string }>('/encrypt', {
      method: 'POST',
      body: JSON.stringify({ keyId, data }),
    });
    return response.encrypted;
  }

  /**
   * Decrypt data
   */
  async decrypt(keyId: string, encrypted: string): Promise<string> {
    const response = await this.request<{ decrypted: string }>('/decrypt', {
      method: 'POST',
      body: JSON.stringify({ keyId, encrypted }),
    });
    return response.decrypted;
  }
}

// Singleton instance
let sealClient: SealClient | null = null;

/**
 * Get or create Seal client instance
 */
export function getSealClient(config?: SealClientConfig): SealClient {
  if (!sealClient) {
    sealClient = new SealClient(config);
  }
  return sealClient;
}

/**
 * Initialize Seal client
 */
export function initSealClient(config: SealClientConfig): SealClient {
  sealClient = new SealClient(config);
  return sealClient;
}

