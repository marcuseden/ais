import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isPointInPolygon } from '@/lib/geo';
import { sendErikAlert, shouldSendAlert } from '@/lib/sms';
import { globalVesselLookup } from '@/lib/globalVesselLookup';
import type { Feature, Polygon, MultiPolygon } from 'geojson';

export const dynamic = 'force-dynamic';

// In-memory cache to track vessel states (in production, use Redis)
const vesselStates = new Map<string, boolean>(); // key: mmsi-geofenceId, value: isInside
const scrapedVessels = new Set<number>(); // Track which vessels we've already scraped

export async function GET() {
  try {
    console.log('Running geofence check...');

    // Get recently updated vessels (last 2 minutes)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    
    const { data: vesselsData, error: vesselsError } = await supabaseAdmin
      .from('vessels')
      .select('*')
      .gte('last_seen', twoMinutesAgo)
      .not('last_lat', 'is', null)
      .not('last_lng', 'is', null);

    if (vesselsError) {
      console.error('Error fetching vessels:', vesselsError);
      return NextResponse.json({ error: vesselsError.message }, { status: 500 });
    }

    const vessels = vesselsData as any[];

    if (!vessels || vessels.length === 0) {
      return NextResponse.json({ 
        message: 'No recent vessels to check',
        checked: 0 
      });
    }

    // Get all active alert rules with their geofences
    const { data: rulesData, error: rulesError } = await supabaseAdmin
      .from('alert_rules')
      .select(`
        *,
        geofences (
          id,
          name,
          region_geojson
        )
      `)
      .eq('is_active', true);

    if (rulesError) {
      console.error('Error fetching rules:', rulesError);
      return NextResponse.json({ error: rulesError.message }, { status: 500 });
    }

    const rules = rulesData as any[];

    if (!rules || rules.length === 0) {
      return NextResponse.json({ 
        message: 'No active alert rules',
        checked: 0 
      });
    }

    let alertsCreated = 0;

    // Check each vessel against each geofence
    for (const vessel of vessels) {
      if (!vessel.last_lat || !vessel.last_lng) continue;

      for (const rule of rules) {
        if (!rule.geofences) continue;

        const geofence = rule.geofences as any;
        const polygon = geofence.region_geojson as Feature<Polygon | MultiPolygon>;
        
        const isInside = isPointInPolygon(vessel.last_lat, vessel.last_lng, polygon);
        const stateKey = `${vessel.mmsi}-${geofence.id}`;
        const wasInside = vesselStates.get(stateKey) ?? false;

        // Detect entry event
        if (isInside && !wasInside) {
          console.log(`🚨 VESSEL ENTERING: ${vessel.name || vessel.mmsi} → ${geofence.name}`);
          
          // IMMEDIATELY scrape vessel data on entry (if not already scraped)
          if (!scrapedVessels.has(vessel.mmsi)) {
            console.log(`🔍 Auto-scraping vessel data for MMSI ${vessel.mmsi}...`);
            
            try {
              const vesselData = await globalVesselLookup(vessel.mmsi);
              if (vesselData) {
                scrapedVessels.add(vessel.mmsi);
                console.log(`✅ Scraped ${vesselData.vesselName || vessel.mmsi} - Owner: ${vesselData.registeredOwner || 'Unknown'}, Quality: ${vesselData.dataQualityScore}%`);
                
                if (vesselData.companyEmail || vesselData.companyPhone) {
                  console.log(`📧 Contact found: ${vesselData.companyEmail || ''} ${vesselData.companyPhone || ''}`);
                }
              }
            } catch (scrapeError) {
              console.error('Scraping failed for', vessel.mmsi, scrapeError);
            }
          }

          // Create alert event
          const { data: alertData, error: alertError } = await (supabaseAdmin
            .from('alert_events')
            .insert as any)({
              rule_id: rule.id,
              mmsi: vessel.mmsi,
              vessel_name: vessel.name,
              event_type: 'enter',
              details: {
                geofence_name: geofence.name,
                lat: vessel.last_lat,
                lng: vessel.last_lng,
                sog: vessel.sog,
                cog: vessel.cog,
              },
            })
            .select()
            .single();

          if (alertError) {
            console.error('Error creating alert:', alertError);
          } else {
            alertsCreated++;
            console.log(`✅ Alert created: ${vessel.name || vessel.mmsi} entered ${geofence.name}`);

            // Send SMS to Erik for commercial vessels (cargo ships)
            const isCommercial = vessel.ship_type?.toLowerCase().includes('cargo') || 
                                vessel.ship_type?.toLowerCase().includes('tanker');
            
            if (isCommercial && await shouldSendAlert(vessel.mmsi)) {
              const smsResult = await sendErikAlert({
                vesselName: vessel.name || `Vessel ${vessel.mmsi}`,
                mmsi: vessel.mmsi,
                shipType: vessel.ship_type || undefined,
                alertEventId: alertData?.id,
              });

              if (smsResult.success) {
                console.log(`📱 SMS sent to Erik about ${vessel.name || vessel.mmsi}`);
              }
            }
          }
        }

        // Update state
        vesselStates.set(stateKey, isInside);
      }
    }

    return NextResponse.json({
      message: 'Geofence check completed',
      vesselsChecked: vessels.length,
      rulesChecked: rules.length,
      alertsCreated,
    });
  } catch (error) {
    console.error('Unexpected error in geofence check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

