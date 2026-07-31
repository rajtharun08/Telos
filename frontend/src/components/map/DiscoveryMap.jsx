import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Eye, Lock } from 'lucide-react';

function MapRecenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

// Custom Figma Price Badge Pins ($5/d, FREE, etc)
const createFigmaPricePin = (item, isSelected) => {
  const priceText = item.mode === 'BORROW' ? 'FREE' : `$${item.price}/d`;

  const html = `
    <div style="
      background: ${isSelected ? '#00C853' : '#0F172A'};
      color: white;
      font-family: 'Inter', sans-serif;
      font-weight: 800;
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 20px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);
      border: 2px solid ${isSelected ? '#ffffff' : '#1e293b'};
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
      transition: all 0.2s ease;
      white-space: nowrap;
    ">
      ${priceText}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'figma-map-pin',
    iconSize: [50, 26],
    iconAnchor: [25, 13]
  });
};

const createUserPin = () => {
  const html = `
    <div style="
      width: 20px;
      height: 20px;
      background: #0f172a;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 6px rgba(0, 200, 83, 0.3);
    "></div>
  `;
  return L.divIcon({
    html,
    className: 'user-pin',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

export const DiscoveryMap = ({
  items = [],
  center,
  radiusKm = 2.0,
  selectedItemId,
  onSelectItem,
  onOpenDetail
}) => {
  const mapCenter = [center.lat, center.lng];

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden border border-slate-200 shadow-lg">
      
      {/* Figma Top Radial Badge Overlay */}
      <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md border border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-800">
        <span className="w-2.5 h-2.5 rounded-full bg-forest-600 animate-pulse" />
        <span>{radiusKm} km radius</span>
        <span className="text-slate-300">•</span>
        <span className="text-slate-500 font-semibold">{items.length} items in this area</span>
      </div>

      {/* Recenter Button */}
      <div className="absolute bottom-4 right-4 z-[400]">
        <button
          onClick={() => {}}
          className="p-3 rounded-full bg-white text-slate-800 shadow-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
          title="Recenter location"
        >
          <Navigation className="w-4 h-4 text-forest-600" />
        </button>
      </div>

      <MapContainer
        center={mapCenter}
        zoom={14}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <MapRecenter center={mapCenter} zoom={14 - Math.floor(radiusKm / 5)} />

        {/* Crisp Light Map Tiles */}
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Figma Teal / Emerald Radial Zone Circle */}
        <Circle
          center={mapCenter}
          radius={radiusKm * 1000}
          pathOptions={{
            color: '#00C853',
            fillColor: '#00C853',
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '6, 6'
          }}
        />

        {/* User Pin */}
        <Marker position={mapCenter} icon={createUserPin()}>
          <Popup>
            <div className="text-xs font-bold p-1 text-slate-800">Your Location</div>
          </Popup>
        </Marker>

        {/* Item Price Pins */}
        {items.map((item) => {
          const isSelected = item.id === selectedItemId;
          return (
            <Marker
              key={item.id}
              position={[item.lat, item.lng]}
              icon={createFigmaPricePin(item, isSelected)}
              eventHandlers={{
                click: () => onSelectItem(item.id)
              }}
            >
              <Popup>
                <div className="w-52 p-1 space-y-2">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-24 object-cover rounded-xl"
                  />
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{item.title}</h4>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-forest-600">
                      {item.mode === 'BORROW' ? 'Free' : `$${item.price}/day`}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">{item.distanceKm} km</span>
                  </div>
                  <button
                    onClick={() => onOpenDetail(item)}
                    className="w-full py-1.5 rounded-xl bg-forest-600 text-white font-bold text-xs shadow-sm cursor-pointer hover:bg-forest-500"
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
