"use client"

import { useRouter } from 'next/navigation';
import { VesselPosition } from '@/lib/ais';
import { Card } from './ui/card';
import { Navigation, Gauge } from 'lucide-react';

interface VesselCardProps {
  vessel: VesselPosition;
  onClick?: () => void;
  isSelected?: boolean;
}

export function VesselCard({ vessel, onClick, isSelected }: VesselCardProps) {
  const router = useRouter();

  return (
    <Card
      className={`cursor-pointer transition-colors hover:bg-accent ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/app/vessel/${vessel.mmsi}`);
      }}
    >
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">
              {vessel.name || `MMSI: ${vessel.mmsi}`}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {vessel.ship_type && <span>{vessel.ship_type}</span>}
              {vessel.sog !== undefined && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-0.5">
                    <Gauge className="h-2.5 w-2.5" />
                    {vessel.sog.toFixed(1)}kn
                  </span>
                </>
              )}
              {vessel.cog !== undefined && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-0.5">
                    <Navigation className="h-2.5 w-2.5" />
                    {vessel.cog.toFixed(0)}°
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

