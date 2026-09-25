import type { District, Province, Ward } from "../types/administrative";

// V1 retains the requested three-tier province → district → ward hierarchy.
// The provider marks V1 as the dataset from before the 07/2025 administrative change.
const API_BASE_URL = (import.meta.env.VITE_PROVINCES_API_BASE_URL || "https://provinces.open-api.vn/api/v1").replace(/\/$/, "");

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { signal });
  if (!response.ok) {
    throw new Error("Không thể tải danh mục địa chỉ hành chính");
  }
  return response.json() as Promise<T>;
}

export async function getProvinces(signal?: AbortSignal): Promise<Province[]> {
  return request<Province[]>("/p", signal);
}

export async function getDistricts(provinceCode: number, signal?: AbortSignal): Promise<District[]> {
  const province = await request<Province>(`/p/${provinceCode}?depth=2`, signal);
  return province.districts || [];
}

export async function getWards(districtCode: number, signal?: AbortSignal): Promise<Ward[]> {
  const district = await request<District>(`/d/${districtCode}?depth=2`, signal);
  return district.wards || [];
}
