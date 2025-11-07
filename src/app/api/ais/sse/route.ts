import { NextRequest } from 'next/server';
import { parseAISMessage, createAISStreamSubscription, isInBalticBBox, VesselPosition } from '@/lib/ais';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { globalVesselLookup } from '@/lib/globalVesselLookup';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// In-memory store for broadcasting
const clients = new Set<ReadableStreamDefaultController>();

// In-memory vessel cache for batch updates
const vesselCache = new Map<number, VesselPosition>();
let lastDbUpdate = Date.now();
const DB_UPDATE_INTERVAL = 60000; // Update database every 60 seconds

// Track scraped vessels to avoid re-scraping
const scrapedVessels = new Set<number>();

// Connect to AISStream WebSocket (singleton pattern)
let wsConnection: WebSocket | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;

async function batchUpdateDatabase() {
  if (vesselCache.size === 0) return;

  try {
    const vessels = Array.from(vesselCache.values()).map(v => ({
      mmsi: v.mmsi,
      name: v.name || null,
      ship_type: v.ship_type || null,
      last_lat: v.lat,
      last_lng: v.lng,
      sog: v.sog || null,
      cog: v.cog || null,
      last_seen: v.ts.toISOString(),
    }));

    console.log(`📦 Batch updating ${vessels.length} vessels to database...`);

    const { error } = await supabaseAdmin
      .from('vessels')
      .upsert(vessels, { onConflict: 'mmsi' });

    if (error) {
      console.error('❌ Error updating vessels:', error);
    } else {
      console.log(`✅ Updated ${vessels.length} vessels in database`);
      
      // AUTO-SCRAPE new vessels in background
      vessels.forEach(async (v) => {
        if (!scrapedVessels.has(v.mmsi)) {
          scrapedVessels.add(v.mmsi);
          
          // Scrape in background (don't await)
          globalVesselLookup(v.mmsi).then(data => {
            if (data) {
              console.log(`🔍 Auto-enriched: ${data.vesselName || v.mmsi} (Quality: ${data.dataQualityScore}%)`);
            }
          }).catch(err => {
            console.error(`Failed to enrich ${v.mmsi}:`, err);
          });
        }
      });
      
      vesselCache.clear();
    }
  } catch (error) {
    console.error('❌ Database batch update failed:', error);
  }
}

function connectToAISStream() {
  if (wsConnection?.readyState === WebSocket.OPEN) {
    return;
  }

  const apiKey = process.env.AISSTREAM_API_KEY;
  if (!apiKey) {
    console.log('⚠️  No AISSTREAM_API_KEY - using demo data only');
    return;
  }

  const wsUrl = 'wss://stream.aisstream.io/v0/stream';

  try {
    console.log('🌐 Connecting to AISStream...');
    wsConnection = new WebSocket(wsUrl);

    wsConnection.onopen = () => {
      console.log('✅ Connected to AISStream');
      
      // Subscribe to Baltic Sea region with proper format
      const subscribeMessage = createAISStreamSubscription(apiKey);

      wsConnection?.send(JSON.stringify(subscribeMessage));
      console.log('📡 Subscribed to Baltic Sea region', {
        bbox: subscribeMessage.BoundingBoxes[0],
        filters: subscribeMessage.FilterMessageTypes
      });
    };

    wsConnection.onmessage = (event) => {
      try {
        const aisData = JSON.parse(event.data);
        const vessel = parseAISMessage(aisData);

        if (vessel && isInBalticBBox(vessel.lat, vessel.lng)) {
          // Add to cache for batch update
          vesselCache.set(vessel.mmsi, vessel);

          // Broadcast to connected SSE clients for instant updates
          const message = `data: ${JSON.stringify(vessel)}\n\n`;
          clients.forEach(controller => {
            try {
              controller.enqueue(new TextEncoder().encode(message));
            } catch (e) {
              // Client disconnected
            }
          });

          // Batch update database every minute
          const now = Date.now();
          if (now - lastDbUpdate >= DB_UPDATE_INTERVAL) {
            lastDbUpdate = now;
            batchUpdateDatabase();
          }
        }
      } catch (err) {
        console.error('Error processing AIS message:', err);
      }
    };

    wsConnection.onerror = (error) => {
      console.error('❌ AISStream WebSocket error:', error);
    };

    wsConnection.onclose = () => {
      console.log('🔌 AISStream connection closed, reconnecting in 5s...');
      wsConnection = null;
      
      // Save any pending updates before reconnecting
      if (vesselCache.size > 0) {
        batchUpdateDatabase();
      }

      // Reconnect after delay
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      reconnectTimeout = setTimeout(() => {
        connectToAISStream();
      }, 5000);
    };
  } catch (error) {
    console.error('❌ Failed to connect to AISStream:', error);
  }
}

// Initialize connection when module loads
if (typeof WebSocket !== 'undefined') {
  connectToAISStream();
  
  // Also set up periodic database updates
  setInterval(() => {
    if (vesselCache.size > 0) {
      batchUpdateDatabase();
    }
  }, DB_UPDATE_INTERVAL);
}

export async function GET(request: NextRequest) {
  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller);

      // Send heartbeat every 30 seconds
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      // Ensure AISStream connection is active
      connectToAISStream();
    },
    cancel(controller) {
      clients.delete(controller);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
