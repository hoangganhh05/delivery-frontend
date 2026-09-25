import { ExternalLink, MapPin, Truck } from "lucide-react";
import GoogleDeliveryMap from "./GoogleDeliveryMap";

interface LiveTrackingMapProps {
  latitude?: number | string | null;
  longitude?: number | string | null;
  accuracy?: number | string | null;
  updatedAt?: string | null;
  driverName?: string | null;
  driverAvatar?: string | null;
  destination?: string | null;
}

function toNumber(value: number | string | null | undefined) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function LiveTrackingMap({
  latitude,
  longitude,
  accuracy,
  updatedAt,
  driverName,
  driverAvatar,
  destination,
}: LiveTrackingMapProps) {
  const lat = toNumber(latitude);
  const lng = toNumber(longitude);
  const accuracyMeters = toNumber(accuracy);
  if (lat === null || lng === null) return null;

  const radiusDegrees = Math.max(0.003, Math.min(0.04, ((accuracyMeters || 80) / 111_000) * 3));
  const bbox = `${lng - radiusDegrees},${lat - radiusDegrees},${lng + radiusDegrees},${lat + radiusDegrees}`;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lng}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
  const hasGoogleMapsKey = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim());
  const updatedDate = updatedAt ? new Date(updatedAt) : null;
  const isRecent = updatedDate && !Number.isNaN(updatedDate.getTime())
    ? Date.now() - updatedDate.getTime() < 120_000
    : false;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-blue-600">
            {driverAvatar ? <img src={driverAvatar} alt="Ảnh tài xế" className="h-full w-full object-cover" /> : <Truck size={17} />}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-700 text-slate-900">{driverName || "Tài xế"}</p>
            <p className={`text-[11px] font-600 ${isRecent ? "text-emerald-600" : "text-amber-600"}`}>
              {isRecent ? "Đang cập nhật vị trí" : "Vị trí cập nhật đã lâu"}
            </p>
          </div>
        </div>
        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1 rounded-lg border border-blue-200 px-2.5 text-[11px] font-600 text-blue-600 hover:bg-blue-50">
          Google Maps <ExternalLink size={12} />
        </a>
      </div>
      {hasGoogleMapsKey ? (
        <GoogleDeliveryMap latitude={lat} longitude={lng} destination={destination} driverName={driverName} />
      ) : (
        <div className="relative h-64 bg-slate-100 sm:h-72">
          <iframe
            title="Vị trí tài xế trên bản đồ"
            src={mapUrl}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1.5 text-[11px] font-700 text-slate-700 shadow-md">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <MapPin size={12} className="text-blue-600" /> Tài xế đang ở đây
          </div>
          <div className="pointer-events-none absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-lg">
            {driverAvatar ? <img src={driverAvatar} alt="" className="h-full w-full rounded-full object-cover" /> : <Truck size={18} />}
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-[11px] text-slate-500">
        <span>Độ chính xác GPS: {accuracyMeters === null ? "—" : `khoảng ${Math.round(accuracyMeters)} m`}</span>
        {destination && <span className="max-w-full truncate sm:max-w-[55%]" title={destination}>Điểm giao: {destination}</span>}
        <span className="basis-full text-[10px] text-slate-400">Bản đồ © OpenStreetMap</span>
      </div>
    </section>
  );
}
