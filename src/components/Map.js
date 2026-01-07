// Map komponenta - Leaflet mapa

'use client';

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MARKER_COLORS, STATUS_LABELS, PRIORITY_LABELS } from '@/utils/constants';

// Fix za Leaflet ikone u Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Komponenta za dodavanje novog problema klikom na mapu
function AddMarkerOnClick({ onAddMarker }) {
  useMapEvents({
    click(e) {
      onAddMarker(e.latlng);
    },
  });
  return null;
}

export default function Map({ 
  problems = [], 
  onAddMarker, 
  onMarkerClick,
  center = [43.3209, 21.8958], // Niš koordinate
  zoom = 13 
}) {
  
  // Kreiranje custom ikona po statusu
  const createCustomIcon = (status) => {
    const color = MARKER_COLORS[status] || MARKER_COLORS.prijavljeno;
    
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 25px;
          height: 25px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [25, 25],
      iconAnchor: [12, 24],
      popupAnchor: [0, -24],
    });
  };

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Dodavanje markera klikom */}
      {onAddMarker && <AddMarkerOnClick onAddMarker={onAddMarker} />}

      {/* Prikaz svih problema */}
      {problems.map((problem) => (
        <Marker
          key={problem.id}
          position={[problem.latitude, problem.longitude]}
          icon={createCustomIcon(problem.status)}
          eventHandlers={{
            click: () => onMarkerClick && onMarkerClick(problem),
          }}
        >
          <Popup>
            <div className="min-w-[200px]">
              <h3 className="font-bold text-lg mb-2">{problem.title}</h3>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Tip:</strong> {problem.problemType}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Status:</strong>{' '}
                <span
                  className="px-2 py-1 rounded text-xs font-semibold"
                  style={{
                    backgroundColor: MARKER_COLORS[problem.status],
                    color: 'white',
                  }}
                >
                  {STATUS_LABELS[problem.status]}
                </span>
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Prioritet:</strong> {PRIORITY_LABELS[problem.priority]}
              </p>
              {problem.description && (
                <p className="text-sm mt-2">{problem.description}</p>
              )}
              {problem.imageUrl && (
                <img
                  src={problem.imageUrl}
                  alt={problem.title}
                  className="mt-2 w-full h-32 object-cover rounded"
                />
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}