"use client"

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { VesselPosition } from '@/lib/ais';
import { getVesselIcon } from '@/lib/vesselIcons';
import { formatDistanceToNow } from 'date-fns';

interface MapViewClientProps {
  vessels: VesselPosition[];
  center?: [number, number];
  zoom?: number;
  onVesselClick?: (vessel: VesselPosition) => void;
}

export function MapViewClient({ vessels, center, zoom = 6, onVesselClick }: MapViewClientProps) {
  const defaultCenter: [number, number] = center || [59.0, 18.0];
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  
  useEffect(() => {
    // Only initialize if map doesn't exist
    if (containerRef.current && !mapInstanceRef.current) {
      // Create map
      const map = L.map(containerRef.current).setView(defaultCenter, zoom);
      
      // Add tile layer
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      
      mapInstanceRef.current = map;
    }
    
    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run once
  
  // Update map view when center/zoom changes
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center, zoom]);
  
  // Update markers when vessels change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    const map = mapInstanceRef.current;
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();
    
    // Add new markers
    vessels.forEach((vessel) => {
      if (!vessel.lat || !vessel.lng) return;
      
      const marker = L.marker([vessel.lat, vessel.lng], {
        icon: getVesselIcon(vessel.ship_type),
      }).addTo(map);
      
      // Store marker reference
      markersRef.current.set(vessel.mmsi, marker);
      
      // Add popup
      const popupContent = `
        <div class="text-sm space-y-1">
          <div class="font-semibold text-base">
            ${vessel.name || `MMSI: ${vessel.mmsi}`}
          </div>
          ${vessel.ship_type ? `<div class="text-gray-600">${vessel.ship_type}</div>` : ''}
          <div class="grid grid-cols-2 gap-x-2 gap-y-1 pt-2 text-xs">
            <div><span class="font-medium">MMSI:</span> ${vessel.mmsi}</div>
            ${vessel.sog !== undefined ? `<div><span class="font-medium">Speed:</span> ${vessel.sog.toFixed(1)} kn</div>` : ''}
            ${vessel.cog !== undefined ? `<div><span class="font-medium">Course:</span> ${vessel.cog.toFixed(0)}°</div>` : ''}
            <div class="col-span-2">
              <span class="font-medium">Last seen:</span> ${formatDistanceToNow(new Date(vessel.ts), { addSuffix: true })}
            </div>
          </div>
          <div class="mt-2 pt-2 border-t">
            <a href="/app/vessel/${vessel.mmsi}" class="text-blue-600 hover:underline text-xs font-medium">
              View Full Details →
            </a>
          </div>
        </div>
      `;
      
      marker.bindPopup(popupContent);
      
      // Click navigates to vessel page
      marker.on('click', () => {
        if (onVesselClick) {
          onVesselClick(vessel);
        }
        // Also navigate to vessel page
        window.location.href = `/app/vessel/${vessel.mmsi}`;
      });
    });
  }, [vessels, onVesselClick]);
  
  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
      style={{ minHeight: '400px' }}
    />
  );
}

