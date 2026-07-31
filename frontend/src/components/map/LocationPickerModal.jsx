import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { MapPin, Check } from 'lucide-react';

const createPickerIcon = () => {
  const html = `
    <div style="
      width: 32px;
      height: 32px;
      background: #00C853;
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 15px rgba(0, 200, 83, 0.5);
    "></div>
  `;
  return L.divIcon({
    html,
    className: 'picker-location-pin',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });
};

function LocationEvents({ onLocationSelected }) {
  useMapEvents({
    click(e) {
      onLocationSelected({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export const LocationPickerModal = ({ isOpen, onClose, initialLocation, onConfirm }) => {
  const [selectedLoc, setSelectedLoc] = useState(
    initialLocation || { lat: 12.9345, lng: 77.6265 }
  );

  // Return null immediately when closed so Leaflet map tiles never leak z-index into the DOM
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(selectedLoc);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pick Item Location Pin" maxWidth="max-w-2xl">
      <div className="space-y-4 text-slate-900 dark:text-white">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Click anywhere on the map to set your item origin pin. Nearby borrowers will see fuzzy vicinity range until item request is approved.
        </p>

        <div className="h-80 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 relative shadow-inner">
          <MapContainer
            center={[selectedLoc.lat, selectedLoc.lng]}
            zoom={14}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationEvents onLocationSelected={setSelectedLoc} />
            <Marker position={[selectedLoc.lat, selectedLoc.lng]} icon={createPickerIcon()} />
          </MapContainer>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Lat: {selectedLoc.lat.toFixed(4)}, Lng: {selectedLoc.lng.toFixed(4)}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" icon={Check} onClick={handleConfirm}>
              Confirm Location
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
