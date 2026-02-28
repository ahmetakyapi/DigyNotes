function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function hasCoordinates(lat?: number | null, lng?: number | null) {
  return Number.isFinite(lat) && Number.isFinite(lng);
}

export function formatCoordinate(value: number) {
  return value.toFixed(4);
}

export function buildOpenStreetMapLink(lat: number, lng: number) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=10/${lat}/${lng}`;
}

export function buildOpenStreetMapEmbedUrl(lat: number, lng: number, delta = 0.18) {
  const boundedLat = clamp(lat, -85, 85);
  const boundedLng = clamp(lng, -180, 180);
  const south = clamp(boundedLat - delta, -85, 85);
  const north = clamp(boundedLat + delta, -85, 85);
  const west = clamp(boundedLng - delta, -180, 180);
  const east = clamp(boundedLng + delta, -180, 180);

  return `https://www.openstreetmap.org/export/embed.html?bbox=${west}%2C${south}%2C${east}%2C${north}&layer=mapnik&marker=${boundedLat}%2C${boundedLng}`;
}
