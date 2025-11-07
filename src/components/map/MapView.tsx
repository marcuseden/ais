"use client"

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Ship } from 'lucide-react';
import { VesselPosition } from '@/lib/ais';

// Dynamically import the map component with no SSR
const MapViewClient = dynamic(
  () => import('./MapViewClient').then((mod) => ({ default: mod.MapViewClient })),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="text-center">
          <Ship className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    )
  }
);

interface MapViewProps {
  vessels: VesselPosition[];
  center?: [number, number];
  zoom?: number;
  onVesselClick?: (vessel: VesselPosition) => void;
}

export function MapView({ vessels, center, zoom = 6, onVesselClick }: MapViewProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="text-center">
          <Ship className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <MapViewClient 
      vessels={vessels} 
      center={center} 
      zoom={zoom} 
      onVesselClick={onVesselClick}
    />
  );
}

