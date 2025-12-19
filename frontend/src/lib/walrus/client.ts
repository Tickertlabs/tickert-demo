/**
 * Walrus client setup
 * Walrus is a decentralized storage layer for Sui
 */

const WALRUS_API_URL = import.meta.env.VITE_WALRUS_API_URL || 'https://api.walrus.xyz';

export interface WalrusClientConfig {
  apiUrl?: string;
  apiKey?: string;
}

class WalrusClient {
  private apiUrl: string;
  private apiKey?: string;

  constructor(config: WalrusClientConfig = {}) {
    this.apiUrl = config.apiUrl || WALRUS_API_URL;
    this.apiKey = config.apiKey;
  }

  private async request<T>(
    endpoint: string,
    _options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(_options.headers as Record<string, string>),
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      ..._options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Walrus API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Upload a blob to Walrus
   */
  async uploadBlob(data: Blob | string): Promise<string> {
    const formData = new FormData();
    
    if (typeof data === 'string') {
      formData.append('file', new Blob([data], { type: 'application/json' }), 'data.json');
    } else {
      formData.append('file', data);
    }

    const response = await fetch(`${this.apiUrl}/upload`, {
      method: 'POST',
      body: formData,
      headers: this.apiKey ? {
        'Authorization': `Bearer ${this.apiKey}`,
      } : {},
    });

    if (!response.ok) {
      throw new Error(`Failed to upload to Walrus: ${response.statusText}`);
    }

    const result = await response.json();
    return result.url || result.blobUrl;
  }

  /**
   * Get blob from Walrus by URL
   */
  async getBlob(url: string): Promise<Blob> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch blob from Walrus: ${response.statusText}`);
    }
    return response.blob();
  }

  /**
   * Get JSON data from Walrus by URL
   */
  async getJSON<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch JSON from Walrus: ${response.statusText}`);
    }
    return response.json();
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

