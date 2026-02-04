const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const AUTH_TOKEN_KEY = "tickert_auth_token";
const WALLET_ADDRESS_KEY = "tickert_wallet_address";

// In-memory cache for faster access
let cachedToken: string | null = null;
let cachedWalletAddress: string | null = null;

// ========== Token Management ==========

export function setAuthToken(token: string, walletAddress: string): void {
  cachedToken = token;
  cachedWalletAddress = walletAddress;
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(WALLET_ADDRESS_KEY, walletAddress);
  } catch {
    // localStorage might not be available (SSR, private browsing, etc.)
  }
}

export function getAuthToken(): string | null {
  if (cachedToken) return cachedToken;
  try {
    cachedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    return cachedToken;
  } catch {
    return null;
  }
}

export function getStoredWalletAddress(): string | null {
  if (cachedWalletAddress) return cachedWalletAddress;
  try {
    cachedWalletAddress = localStorage.getItem(WALLET_ADDRESS_KEY);
    return cachedWalletAddress;
  } catch {
    return null;
  }
}

export function clearAuthToken(): void {
  cachedToken = null;
  cachedWalletAddress = null;
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(WALLET_ADDRESS_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

// ========== API Response Types ==========

export interface WalletAuthResponse {
  accessToken: string;
  userId: string;
  walletAddress: string;
}

// ========== API Functions ==========

export async function connectWallet(
  walletAddress: string,
  signature: string,
  signedMessageBytes: string,
): Promise<WalletAuthResponse> {
  const response = await fetch(`${API_BASE_URL}/users/connect-wallet`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ walletAddress, signature, signedMessageBytes }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to connect wallet (${response.status}): ${errorText}`,
    );
  }

  const data: WalletAuthResponse = await response.json();

  // Store the token automatically
  if (data.accessToken) {
    setAuthToken(data.accessToken, data.walletAddress);
  }

  return data;
}

// ========== Authenticated Fetch Helper ==========

export async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getAuthToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  return fetch(url, {
    ...options,
    headers,
  });
}

export async function authenticatedGet<T>(endpoint: string): Promise<T> {
  const response = await authenticatedFetch(endpoint, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

export async function authenticatedPost<T>(
  endpoint: string,
  body: unknown,
): Promise<T> {
  const response = await authenticatedFetch(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}
