"use client";

import { MapContainer, TileLayer, Marker, Circle, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Pin tùy chỉnh có hiệu ứng pulse (tránh icon mặc định lỗi trong bundler)
const pawPin = L.divIcon({
  className: "",
  html: `
    <div class="ps-pin">
      <span class="ps-pin__pulse"></span>
      <span class="ps-pin__dot">🐾</span>
    </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
});

export default function ScanMap({
  lat,
  lng,
  label,
  accuracy = 120,
}: {
  lat: number;
  lng: number;
  label?: string;
  accuracy?: number;
}) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={16}
      scrollWheelZoom={false}
      zoomControl={false}
      attributionControl={false}
      style={{ height: "100%", width: "100%", background: "#e8eef5" }}
    >
      {/* CartoDB Voyager — bản đồ sạch, hiện đại, free, không cần API key */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={20}
      />
      {/* Vòng tròn ước lượng khu vực */}
      <Circle
        center={[lat, lng]}
        radius={accuracy}
        pathOptions={{ color: "#EF4444", weight: 1.5, fillColor: "#EF4444", fillOpacity: 0.12 }}
      />
      <Marker position={[lat, lng]} icon={pawPin}>
        {label && <Popup>{label}</Popup>}
      </Marker>
    </MapContainer>
  );
}
