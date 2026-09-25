import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import {
  type AdministrativeAddressValue,
  type District,
  type Province,
  type Ward,
} from "../types/administrative";
import { getDistricts, getProvinces, getWards } from "../services/vietnamAdministrativeApi";

interface AdministrativeAddressFieldsProps {
  value: AdministrativeAddressValue;
  onChange: (value: AdministrativeAddressValue) => void;
  detailLabel?: string;
}

function SelectLoading() {
  return <LoaderCircle size={13} className="absolute right-8 top-1/2 -translate-y-1/2 animate-spin text-blue-500" aria-label="Đang tải" />;
}

export default function AdministrativeAddressFields({
  value,
  onChange,
  detailLabel = "Số nhà, đường, thôn/xóm",
}: AdministrativeAddressFieldsProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoadingProvinces(true);
    getProvinces(controller.signal)
      .then((items) => setProvinces(items))
      .catch((requestError: unknown) => {
        if ((requestError as { name?: string }).name !== "AbortError") {
          setError("Không tải được danh mục tỉnh/thành. Vui lòng thử lại.");
        }
      })
      .finally(() => setLoadingProvinces(false));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (value.provinceCode === null) {
      setDistricts([]);
      return;
    }
    const controller = new AbortController();
    setLoadingDistricts(true);
    getDistricts(value.provinceCode, controller.signal)
      .then((items) => setDistricts(items))
      .catch((requestError: unknown) => {
        if ((requestError as { name?: string }).name !== "AbortError") setError("Không tải được quận/huyện.");
      })
      .finally(() => setLoadingDistricts(false));
    return () => controller.abort();
  }, [value.provinceCode]);

  useEffect(() => {
    if (value.districtCode === null) {
      setWards([]);
      return;
    }
    const controller = new AbortController();
    setLoadingWards(true);
    getWards(value.districtCode, controller.signal)
      .then((items) => setWards(items))
      .catch((requestError: unknown) => {
        if ((requestError as { name?: string }).name !== "AbortError") setError("Không tải được xã/phường.");
      })
      .finally(() => setLoadingWards(false));
    return () => controller.abort();
  }, [value.districtCode]);

  const selectClassName = "w-full h-10 appearance-none px-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-600 text-slate-700 mb-1">{detailLabel}</label>
        <input
          type="text"
          value={value.detail}
          onChange={(event) => onChange({ ...value, detail: event.target.value })}
          placeholder="VD: Số 12, ngõ 8, xóm Trung Thành"
          className={selectClassName}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="relative">
          <label className="block text-xs font-600 text-slate-700 mb-1">Tỉnh / Thành phố</label>
          <select
            value={value.provinceCode ?? ""}
            disabled={loadingProvinces}
            onChange={(event) => {
              const province = provinces.find((item) => item.code === Number(event.target.value));
              onChange({
                ...value,
                provinceCode: province?.code ?? null,
                provinceName: province?.name ?? "",
                districtCode: null,
                districtName: "",
                wardCode: null,
                wardName: "",
              });
            }}
            className={selectClassName}
          >
            <option value="">Chọn tỉnh / thành</option>
            {provinces.map((province) => <option key={province.code} value={province.code}>{province.name}</option>)}
          </select>
          {loadingProvinces && <SelectLoading />}
        </div>
        <div className="relative">
          <label className="block text-xs font-600 text-slate-700 mb-1">Quận / Huyện</label>
          <select
            value={value.districtCode ?? ""}
            disabled={value.provinceCode === null || loadingDistricts}
            onChange={(event) => {
              const district = districts.find((item) => item.code === Number(event.target.value));
              onChange({
                ...value,
                districtCode: district?.code ?? null,
                districtName: district?.name ?? "",
                wardCode: null,
                wardName: "",
              });
            }}
            className={selectClassName}
          >
            <option value="">Chọn quận / huyện</option>
            {districts.map((district) => <option key={district.code} value={district.code}>{district.name}</option>)}
          </select>
          {loadingDistricts && <SelectLoading />}
        </div>
        <div className="relative">
          <label className="block text-xs font-600 text-slate-700 mb-1">Xã / Phường</label>
          <select
            value={value.wardCode ?? ""}
            disabled={value.districtCode === null || loadingWards}
            onChange={(event) => {
              const ward = wards.find((item) => item.code === Number(event.target.value));
              onChange({ ...value, wardCode: ward?.code ?? null, wardName: ward?.name ?? "" });
            }}
            className={selectClassName}
          >
            <option value="">Chọn xã / phường</option>
            {wards.map((ward) => <option key={ward.code} value={ward.code}>{ward.name}</option>)}
          </select>
          {loadingWards && <SelectLoading />}
        </div>
      </div>
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
      <p className="text-[11px] text-slate-400">Chọn đủ ba cấp để tạo địa chỉ chi tiết và dễ định vị hơn.</p>
    </div>
  );
}
