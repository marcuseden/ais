// Supabase Edge Function for scheduled geofence checking
// Deploy with: supabase functions deploy check-geofences

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as turf from 'https://esm.sh/@turf/turf@6';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface VesselState {
  mmsi: number;
  geofenceId: string;
  isInside: boolean;
  lastChecked: string;
}

// In-memory cache (resets on cold start, but that's okay for this use case)
const vesselStates = new Map<string, boolean>();

Deno.serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting geofence check...');

    // Get vessels updated in last 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    
    const { data: vessels, error: vesselsError } = await supabase
      .from('vessels')
      .select('*')
      .gte('last_seen', twoMinutesAgo)
      .not('last_lat', 'is', null)
      .not('last_lng', 'is', null);

    if (vesselsError) {
      throw vesselsError;
    }

    if (!vessels || vessels.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No recent vessels to check', checked: 0 }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get all active alert rules with geofences
    const { data: rules, error: rulesError } = await supabase
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
      throw rulesError;
    }

    if (!rules || rules.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active alert rules', checked: 0 }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    let alertsCreated = 0;

    // Check each vessel against each geofence
    for (const vessel of vessels) {
      if (!vessel.last_lat || !vessel.last_lng) continue;

      const point = turf.point([vessel.last_lng, vessel.last_lat]);

      for (const rule of rules) {
        if (!rule.geofences) continue;

        const geofence: any = rule.geofences;
        const polygon = geofence.region_geojson;
        
        const isInside = turf.booleanPointInPolygon(point, polygon);
        const stateKey = `${vessel.mmsi}-${geofence.id}`;
        const wasInside = vesselStates.get(stateKey) ?? false;

        // Detect entry event
        if (isInside && !wasInside) {
          // Create alert event
          const { error: alertError } = await supabase
            .from('alert_events')
            .insert({
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
            });

          if (alertError) {
            console.error('Error creating alert:', alertError);
          } else {
            alertsCreated++;
            console.log(`Alert created: ${vessel.name || vessel.mmsi} entered ${geofence.name}`);
          }
        }

        // Update state
        vesselStates.set(stateKey, isInside);
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Geofence check completed',
        vesselsChecked: vessels.length,
        rulesChecked: rules.length,
        alertsCreated,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

