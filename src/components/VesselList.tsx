"use client"

import { VesselPosition } from '@/lib/ais';
import { VesselCard } from './VesselCard';
import { Ship } from 'lucide-react';

interface VesselListProps {
  vessels: VesselPosition[];
  onVesselClick?: (vessel: VesselPosition) => void;
  selectedVessel?: VesselPosition | null;
}

export function VesselList({ vessels, onVesselClick, selectedVessel }: VesselListProps) {
  if (vessels.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center py-12 px-4">
          <Ship className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No vessels found in this area</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b bg-white sticky top-0 z-10">
        <h3 className="text-sm font-semibold">
          {vessels.length} {vessels.length === 1 ? 'Vessel' : 'Vessels'}
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {vessels.map((vessel) => (
          <VesselCard
            key={vessel.mmsi}
            vessel={vessel}
            onClick={() => onVesselClick?.(vessel)}
            isSelected={selectedVessel?.mmsi === vessel.mmsi}
          />
        ))}
      </div>
    </div>
  );
}

