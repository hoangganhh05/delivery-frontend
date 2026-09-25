export interface AdministrativeUnit {
  code: number;
  name: string;
  division_type: string;
  codename: string;
}

export interface Province extends AdministrativeUnit {
  phone_code?: number;
  districts?: District[];
}

export interface District extends AdministrativeUnit {
  province_code: number;
  wards?: Ward[];
}

export interface Ward extends AdministrativeUnit {
  district_code: number;
  province_code: number;
}

export interface AdministrativeAddressValue {
  detail: string;
  provinceCode: number | null;
  provinceName: string;
  districtCode: number | null;
  districtName: string;
  wardCode: number | null;
  wardName: string;
}

export const EMPTY_ADMINISTRATIVE_ADDRESS: AdministrativeAddressValue = {
  detail: "",
  provinceCode: null,
  provinceName: "",
  districtCode: null,
  districtName: "",
  wardCode: null,
  wardName: "",
};

export function formatAdministrativeAddress(value: AdministrativeAddressValue) {
  return [value.detail, value.wardName, value.districtName, value.provinceName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}
