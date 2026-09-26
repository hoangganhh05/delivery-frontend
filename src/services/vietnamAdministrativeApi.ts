import type { Province, Ward } from "../types/administrative";

// V2 is the official provider dataset after the 07/2025 administrative change.
// Vietnam now uses the province/city → ward/commune hierarchy in this dataset.
const API_BASE_URL = (import.meta.env.VITE_PROVINCES_API_BASE_URL || "https://provinces.open-api.vn/api/v2").replace(/\/$/, "");

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { signal });
  if (!response.ok) {
    throw new Error("Không thể tải danh mục địa chỉ hành chính");
  }
  return response.json() as Promise<T>;
}

export async function getProvinces(signal?: AbortSignal): Promise<Province[]> {
  return request<Province[]>("/p/", signal);
}

export async function getWards(provinceCode: number, signal?: AbortSignal): Promise<Ward[]> {
  return request<Ward[]>(`/w/?province=${encodeURIComponent(provinceCode)}`, signal);
}
