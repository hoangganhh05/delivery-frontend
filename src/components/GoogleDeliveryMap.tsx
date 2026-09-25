import { useEffect, useRef, useState } from "react";
import { AlertCircle, LoaderCircle } from "lucide-react";

declare global {
  interface Window {
    google?: any;
    giaotinGoogleMapsPromise?: Promise<void>;
  }
}

interface GoogleDeliveryMapProps {
  latitude: number;
  longitude: number;
  destination?: string | null;
  driverName?: string | null;
}

function loadGoogleMaps(apiKey: string) {
  if (window.google?.maps) return Promise.resolve();
  if (window.giaotinGoogleMapsPromise) return window.giaotinGoogleMapsPromise;

  window.giaotinGoogleMapsPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Không tải được Google Maps"));
    document.head.appendChild(script);
  });
  return window.giaotinGoogleMapsPromise;
}

/**
 * Renders a real Google Map only when a browser-restricted API key is configured.
 * The DirectionsService draws the polyline and destination coordinate from the address.
 */
export default function GoogleDeliveryMap({ latitude, longitude, destination, driverName }: GoogleDeliveryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();

  useEffect(() => {
    if (!apiKey || !containerRef.current) return;
    let active = true;
    let renderer: any;
    let driverMarker: any;
    let destinationMarker: any;

    loadGoogleMaps(apiKey)
      .then(() => {
        if (!active || !containerRef.current) return;
        const google = window.google;
        const origin = { lat: latitude, lng: longitude };
        const map = new google.maps.Map(containerRef.current, {
          center: origin,
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        driverMarker = new google.maps.Marker({
          map,
          position: origin,
          title: driverName ? `Tài xế: ${driverName}` : "Vị trí tài xế",
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: "#2563eb",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
            rotation: 0,
          },
        });

        if (!destination) {
          setState("ready");
          return;
        }
        renderer = new google.maps.DirectionsRenderer({ map, suppressMarkers: true, preserveViewport: false });
        new google.maps.DirectionsService().route(
          { origin, destination, travelMode: google.maps.TravelMode.DRIVING },
          (result: any, status: string) => {
            if (!active) return;
            if (status === "OK" && result) {
              renderer.setDirections(result);
              const endLocation = result.routes?.[0]?.legs?.[0]?.end_location;
              if (endLocation) {
                destinationMarker = new google.maps.Marker({
                  map,
                  position: endLocation,
                  title: "Điểm giao hàng",
                  icon: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                });
              }
              setState("ready");
              return;
            }
            // The driver marker remains useful even if Google cannot geocode an incomplete address.
            setState("ready");
          },
        );
      })
      .catch(() => {
        if (active) setState("error");
      });

    return () => {
      active = false;
      renderer?.setMap(null);
      driverMarker?.setMap(null);
      destinationMarker?.setMap(null);
    };
  }, [apiKey, latitude, longitude, destination, driverName]);

  if (!apiKey) return null;

  return (
    <div className="relative h-64 bg-slate-100 sm:h-72">
      <div ref={containerRef} className="h-full w-full" aria-label="Bản đồ hành trình giao hàng" />
      {state === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-white/80 text-xs font-600 text-slate-500">
          <LoaderCircle size={15} className="animate-spin" /> Đang tải bản đồ
        </div>
      )}
      {state === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white p-4 text-center text-xs text-red-600">
          <AlertCircle size={20} /> Không thể tải Google Maps. Kiểm tra API key và các API đã bật.
        </div>
      )}
    </div>
  );
}
