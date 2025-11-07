"use client"

import { useState, useEffect } from 'react';
import { MapView } from '@/components/map/MapView';
import { VesselList } from '@/components/VesselList';
import { MapLegend } from '@/components/MapLegend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Bell, Menu, Search, Ship, User } from 'lucide-react';
import { VesselPosition } from '@/lib/ais';
import { useSSE } from '@/hooks/useSSE';
import useSWR from 'swr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function MapPage() {
  const [vessels, setVessels] = useState<VesselPosition[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVessel, setSelectedVessel] = useState<VesselPosition | null>(null);
  const [showList, setShowList] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([59.0, 18.0]);
  const router = useRouter();
  const supabase = createClient();

  // Poll vessels every 60 seconds
  const { data: vesselsData } = useSWR('/api/vessels', fetcher, {
    refreshInterval: 60000,
  });

  // Subscribe to SSE for live updates
  const { data: liveVessel } = useSSE('/api/ais/sse', true);

  // Update vessels from polling
  useEffect(() => {
    if (vesselsData?.vessels) {
      setVessels(vesselsData.vessels);
    }
  }, [vesselsData]);

  // Update vessels from live stream
  useEffect(() => {
    if (liveVessel) {
      setVessels(prev => {
        const existing = prev.findIndex(v => v.mmsi === liveVessel.mmsi);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = liveVessel;
          return updated;
        }
        return [liveVessel, ...prev];
      });
    }
  }, [liveVessel]);

  const filteredVessels = vessels.filter(v =>
    !searchTerm ||
    v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.mmsi.toString().includes(searchTerm) ||
    v.ship_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleVesselClick = (vessel: VesselPosition) => {
    setSelectedVessel(vessel);
    setMapCenter([vessel.lat, vessel.lng]);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Ship className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold text-lg">AIS Alert</span>
        </div>

        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search MMSI, name, or ship type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/app/alerts">
              <Bell className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link href="/app/settings">
              <User className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            onClick={() => setShowList(!showList)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Mobile Search */}
      <div className="md:hidden p-4 bg-white border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vessels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Main Content - Full Height */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          {/* Map - 100% Height */}
          <div className="flex-1 relative h-full">
            <div className="absolute inset-0">
              <MapView
                vessels={filteredVessels}
                center={selectedVessel ? [selectedVessel.lat, selectedVessel.lng] : undefined}
                zoom={selectedVessel ? 10 : 6}
                onVesselClick={handleVesselClick}
              />
            </div>

            {/* Vessel Count Badge */}
            <div className="absolute top-4 right-4 z-[1000]">
              <Card className="px-4 py-2 shadow-lg">
                <div className="text-sm font-medium">
                  {filteredVessels.length} vessels
                </div>
              </Card>
            </div>

            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 z-[1000]">
              <MapLegend />
            </div>
          </div>

          {/* Desktop Sidebar - Full Height */}
          <div className="hidden md:block w-96 bg-white border-l flex-shrink-0 h-full">
            <VesselList
              vessels={filteredVessels}
              onVesselClick={handleVesselClick}
              selectedVessel={selectedVessel}
            />
          </div>
        </div>

        {/* Selected Vessel Info Bar - Below Map */}
        {selectedVessel && (
          <div className="hidden md:block border-t bg-white">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="font-semibold text-lg">
                    {selectedVessel.name || `MMSI: ${selectedVessel.mmsi}`}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedVessel.ship_type || 'Unknown Type'}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-3">
                    <span>Speed: {selectedVessel.sog?.toFixed(1) || 'N/A'} kn</span>
                    <span>•</span>
                    <span>Course: {selectedVessel.cog?.toFixed(0) || 'N/A'}°</span>
                    <span>•</span>
                    <span>Position: {selectedVessel.lat.toFixed(4)}, {selectedVessel.lng.toFixed(4)}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedVessel(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Bottom Sheet */}
        {showList && (
          <div className="md:hidden absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl z-[1000] max-h-[70vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="font-semibold">Vessels</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowList(false)}
              >
                Close
              </Button>
            </div>
            <VesselList
              vessels={filteredVessels}
              onVesselClick={(v) => {
                handleVesselClick(v);
                setShowList(false);
              }}
              selectedVessel={selectedVessel}
            />
          </div>
        )}
      </div>
    </div>
  );
}

