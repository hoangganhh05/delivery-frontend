type Point = { latitude: number; longitude: number };

async function geocode(address: string): Promise<Point> {
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  const queries = [
    `${address}, Việt Nam`,
    `${parts.slice(1).join(", ")}, Việt Nam`,
    `${parts.at(-1) || address}, Việt Nam`,
  ].filter((query, index, all) => all.indexOf(query) === index);

  for (const query of queries) {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=vn&accept-language=vi&q=${encodeURIComponent(query)}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) continue;
    const items = await response.json() as Array<{ lat: string; lon: string }>;
    if (items[0]) return { latitude: Number(items[0].lat), longitude: Number(items[0].lon) };
  }
  throw new Error("Không tìm thấy vị trí địa chỉ. Hãy kiểm tra lại tỉnh và xã/phường.");
}

export async function calculateRoadDistanceKm(senderAddress: string, receiverAddress: string): Promise<number> {
  const [sender, receiver] = await Promise.all([geocode(senderAddress), geocode(receiverAddress)]);
  const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${sender.longitude},${sender.latitude};${receiver.longitude},${receiver.latitude}?overview=false`);
  if (!response.ok) throw new Error("Không thể tính khoảng cách giao hàng");
  const result = await response.json() as { code?: string; routes?: Array<{ distance: number }> };
  const distanceKm = (result.routes?.[0]?.distance || 0) / 1000;
  if (result.code !== "Ok" || !Number.isFinite(distanceKm) || distanceKm <= 0 || distanceKm > 5000) {
    throw new Error("Khoảng cách giao hàng không hợp lệ");
  }
  return Math.ceil(distanceKm * 10) / 10;
}
