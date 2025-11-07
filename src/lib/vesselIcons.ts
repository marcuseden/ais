import L from 'leaflet';

// Realistic vessel icons based on ship type
// Different colors and shapes for easy identification

const createVesselIcon = (svg: string) => {
  return new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(svg),
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

// Cargo Ship - Blue container ship
const cargoSVG = `
<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 20 L8 16 L12 14 L16 14 L20 14 L24 14 L28 16 L28 20 L26 22 L10 22 Z" fill="#2563eb" stroke="#1e40af" stroke-width="1.5"/>
  <rect x="12" y="10" width="4" height="4" fill="#3b82f6"/>
  <rect x="16" y="10" width="4" height="4" fill="#60a5fa"/>
  <rect x="20" y="10" width="4" height="4" fill="#3b82f6"/>
  <circle cx="18" cy="18" r="14" stroke="#1e40af" stroke-width="2" fill="none" opacity="0.3"/>
</svg>
`;

// Tanker - Red/orange tanker
const tankerSVG = `
<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="18" cy="18" rx="10" ry="5" fill="#dc2626" stroke="#991b1b" stroke-width="1.5"/>
  <path d="M10 18 L10 14 L26 14 L26 18" fill="#ef4444" stroke="#991b1b" stroke-width="1.5"/>
  <circle cx="18" cy="12" r="2" fill="#fca5a5"/>
  <circle cx="18" cy="18" r="14" stroke="#dc2626" stroke-width="2" fill="none" opacity="0.3"/>
</svg>
`;

// Passenger Ship - Green ferry
const passengerSVG = `
<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 20 L8 14 L12 12 L24 12 L28 14 L28 20 L26 22 L10 22 Z" fill="#16a34a" stroke="#15803d" stroke-width="1.5"/>
  <rect x="12" y="14" width="3" height="4" fill="#86efac" rx="0.5"/>
  <rect x="16" y="14" width="3" height="4" fill="#86efac" rx="0.5"/>
  <rect x="21" y="14" width="3" height="4" fill="#86efac" rx="0.5"/>
  <path d="M14 10 L22 10 L22 12 L14 12 Z" fill="#22c55e"/>
  <circle cx="18" cy="18" r="14" stroke="#16a34a" stroke-width="2" fill="none" opacity="0.3"/>
</svg>
`;

// Fishing Vessel - Yellow
const fishingSVG = `
<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 20 L12 16 L15 14 L21 14 L24 16 L26 20 L24 22 L12 22 Z" fill="#eab308" stroke="#ca8a04" stroke-width="1.5"/>
  <path d="M16 12 L20 12 L20 14 L16 14 Z" fill="#fbbf24"/>
  <line x1="22" y1="14" x2="26" y2="10" stroke="#ca8a04" stroke-width="1.5"/>
  <circle cx="18" cy="18" r="14" stroke="#eab308" stroke-width="2" fill="none" opacity="0.3"/>
</svg>
`;

// Tug/Pilot - Purple
const tugSVG = `
<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 20 L12 16 L16 14 L20 14 L24 16 L24 20 L22 22 L14 22 Z" fill="#9333ea" stroke="#7e22ce" stroke-width="1.5"/>
  <rect x="16" y="11" width="4" height="3" fill="#c084fc" rx="1"/>
  <circle cx="18" cy="18" r="14" stroke="#9333ea" stroke-width="2" fill="none" opacity="0.3"/>
</svg>
`;

// Military/Law Enforcement - Gray
const militarySVG = `
<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 20 L10 14 L14 12 L22 12 L26 14 L28 20 L26 22 L10 22 Z" fill="#6b7280" stroke="#374151" stroke-width="1.5"/>
  <path d="M16 10 L20 10 L20 12 L16 12 Z" fill="#9ca3af"/>
  <circle cx="18" cy="18" r="14" stroke="#6b7280" stroke-width="2" fill="none" opacity="0.3"/>
</svg>
`;

// Sailing/Pleasure - Cyan
const sailingSVG = `
<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 22 L14 20 L18 14 L22 20 L22 22 L20 23 L16 23 Z" fill="#06b6d4" stroke="#0891b2" stroke-width="1.5"/>
  <path d="M18 14 L18 9 L22 12 Z" fill="#22d3ee"/>
  <circle cx="18" cy="18" r="14" stroke="#06b6d4" stroke-width="2" fill="none" opacity="0.3"/>
</svg>
`;

// Default/Unknown - Orange (current icon)
const defaultSVG = `
<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 20 L14 16 L18 14 L22 16 L26 20 L24 22 L12 22 Z" fill="#f97316" stroke="#ea580c" stroke-width="1.5"/>
  <path d="M18 9 L18 14" stroke="#ea580c" stroke-width="2"/>
  <circle cx="18" cy="18" r="14" stroke="#f97316" stroke-width="2" fill="none" opacity="0.3"/>
</svg>
`;

// Icon cache
const iconCache: { [key: string]: L.Icon } = {};

export function getVesselIcon(shipType?: string): L.Icon {
  if (!shipType) {
    if (!iconCache.default) {
      iconCache.default = createVesselIcon(defaultSVG);
    }
    return iconCache.default;
  }

  const type = shipType.toLowerCase();
  
  // Cargo ships
  if (type.includes('cargo') || type.includes('container') || type.includes('bulk') || type.includes('freighter')) {
    if (!iconCache.cargo) iconCache.cargo = createVesselIcon(cargoSVG);
    return iconCache.cargo;
  }
  
  // Tankers
  if (type.includes('tanker') || type.includes('oil') || type.includes('chemical')) {
    if (!iconCache.tanker) iconCache.tanker = createVesselIcon(tankerSVG);
    return iconCache.tanker;
  }
  
  // Passenger ships
  if (type.includes('passenger') || type.includes('ferry') || type.includes('cruise')) {
    if (!iconCache.passenger) iconCache.passenger = createVesselIcon(passengerSVG);
    return iconCache.passenger;
  }
  
  // Fishing vessels
  if (type.includes('fish')) {
    if (!iconCache.fishing) iconCache.fishing = createVesselIcon(fishingSVG);
    return iconCache.fishing;
  }
  
  // Tugs, pilots, port tenders
  if (type.includes('tug') || type.includes('pilot') || type.includes('port')) {
    if (!iconCache.tug) iconCache.tug = createVesselIcon(tugSVG);
    return iconCache.tug;
  }
  
  // Military and law enforcement
  if (type.includes('military') || type.includes('law') || type.includes('patrol') || type.includes('naval')) {
    if (!iconCache.military) iconCache.military = createVesselIcon(militarySVG);
    return iconCache.military;
  }
  
  // Sailing and pleasure craft
  if (type.includes('sail') || type.includes('pleasure') || type.includes('yacht')) {
    if (!iconCache.sailing) iconCache.sailing = createVesselIcon(sailingSVG);
    return iconCache.sailing;
  }
  
  // Default
  if (!iconCache.default) {
    iconCache.default = createVesselIcon(defaultSVG);
  }
  return iconCache.default;
}

// Export color legend for UI
export const VESSEL_TYPE_COLORS = {
  cargo: { color: '#2563eb', label: 'Cargo' },
  tanker: { color: '#dc2626', label: 'Tanker' },
  passenger: { color: '#16a34a', label: 'Passenger' },
  fishing: { color: '#eab308', label: 'Fishing' },
  tug: { color: '#9333ea', label: 'Tug/Pilot' },
  military: { color: '#6b7280', label: 'Military' },
  sailing: { color: '#06b6d4', label: 'Sailing' },
  default: { color: '#f97316', label: 'Other' },
};

