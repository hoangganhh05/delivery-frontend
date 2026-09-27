import type { Province, Ward } from "../types/administrative";

// V2 is the official provider dataset after the 07/2025 administrative change.
// Vietnam now uses the province/city → ward/commune hierarchy in this dataset.
const API_BASE_URL = (import.meta.env.VITE_PROVINCES_API_BASE_URL || "https://provinces.open-api.vn/api/v2").replace(/\/$/, "");
const CACHE_PREFIX = "giaotin:administrative:v2:";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const memoryCache = new Map<string, unknown>();

type CachedValue<T> = {
  savedAt: number;
  data: T;
};

function readCache<T>(key: string): T | null {
  const memoryValue = memoryCache.get(key) as CachedValue<T> | undefined;
  if (memoryValue && Date.now() - memoryValue.savedAt < CACHE_TTL_MS) {
    return memoryValue.data;
  }

  try {
    const rawValue = window.sessionStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!rawValue) return null;
    const cachedValue = JSON.parse(rawValue) as CachedValue<T>;
    if (!cachedValue || !Array.isArray(cachedValue.data) || Date.now() - cachedValue.savedAt >= CACHE_TTL_MS) {
      window.sessionStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }
    memoryCache.set(key, cachedValue);
    return cachedValue.data;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T): T {
  const cachedValue: CachedValue<T> = { savedAt: Date.now(), data };
  memoryCache.set(key, cachedValue);
  try {
    window.sessionStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cachedValue));
  } catch {
    // Storage can be unavailable or full; the in-memory cache remains usable.
  }
  return data;
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { signal });
  if (!response.ok) {
    throw new Error("Không thể tải danh mục địa chỉ hành chính");
  }
  return response.json() as Promise<T>;
}

export async function getProvinces(signal?: AbortSignal): Promise<Province[]> {
  const cachedProvinces = readCache<Province[]>("provinces");
  if (cachedProvinces) return cachedProvinces;
  return request<Province[]>("/p/", signal).then((items) => writeCache("provinces", items));
}

export async function getWards(provinceCode: number, signal?: AbortSignal): Promise<Ward[]> {
  const cacheKey = `wards:${provinceCode}`;
  const cachedWards = readCache<Ward[]>(cacheKey);
  if (cachedWards) return cachedWards;
  return request<Ward[]>(`/w/?province=${encodeURIComponent(provinceCode)}`, signal)
    .then((items) => writeCache(cacheKey, items));
}
