const SECRET_KEY = "admin_secret";
const API_URL_KEY = "admin_api_url";

// Automatically migrate localhost:5000 to 127.0.0.1:5000 to bypass HSTS browser policy
const rawUrl = localStorage.getItem(API_URL_KEY);
if (rawUrl && rawUrl.includes("localhost:5000")) {
  localStorage.setItem(API_URL_KEY, rawUrl.replace("localhost:5000", "127.0.0.1:5000"));
}

const BASE_URL = localStorage.getItem(API_URL_KEY) || "http://127.0.0.1:5000/api/v1";

export function getApiUrl(): string {
  return localStorage.getItem(API_URL_KEY) || "http://127.0.0.1:5000/api/v1";
}

export function setApiUrl(url: string): void {
  const trimmed = url.trim().replace(/\/$/, "");
  localStorage.setItem(API_URL_KEY, trimmed);
}

export function getSecret(): string {
  return localStorage.getItem(SECRET_KEY) || "";
}

export function setSecret(secret: string): void {
  localStorage.setItem(SECRET_KEY, secret);
}

export function clearAuth(): void {
  localStorage.removeItem(SECRET_KEY);
}

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${getApiUrl()}${path}`;
  const secret = getSecret();

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Secret": secret,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data?.error?.message || `Request failed: ${res.status}`);
  }

  return data.data as T;
}

export const api = {
  get: <T = unknown>(path: string) => request<T>("GET", path),
  post: <T = unknown>(path: string, body: unknown) => request<T>("POST", path, body),
  patch: <T = unknown>(path: string, body: unknown) => request<T>("PATCH", path, body),
  delete: <T = unknown>(path: string) => request<T>("DELETE", path),
};

export type PaginatedResponse<K extends string, T> = {
  [key in K]: T[];
} & { total: number; page: number; limit: number };
