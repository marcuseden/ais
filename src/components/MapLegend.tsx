"use client"

import { Card } from './ui/card';
import { VESSEL_TYPE_COLORS } from '@/lib/vesselIcons';

export function MapLegend() {
  return (
    <Card className="p-3 shadow-lg">
      <div className="text-xs font-semibold mb-2">Vessel Types</div>
      <div className="space-y-1">
        {Object.entries(VESSEL_TYPE_COLORS).map(([key, { color, label }]) => (
          <div key={key} className="flex items-center gap-2 text-xs">
            <div 
              className="w-3 h-3 rounded-full border-2" 
              style={{ backgroundColor: color, borderColor: color }}
            />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

