import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { globalVesselLookup } from '@/lib/globalVesselLookup';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

// Scrape all vessels in the database
export async function GET() {
  try {
    console.log('🔍 Starting batch scraping of all vessels...');

    // Get all vessels from database
    const { data: vessels, error } = await supabaseAdmin
      .from('vessels')
      .select('mmsi, name, ship_type')
      .not('last_lat', 'is', null)
      .order('last_seen', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!vessels || vessels.length === 0) {
      return NextResponse.json({ message: 'No vessels to scrape', scraped: 0 });
    }

    console.log(`📦 Found ${vessels.length} vessels to scrape`);

    let scraped = 0;
    let cached = 0;
    let failed = 0;

    // Process in batches of 5 to avoid overwhelming APIs
    const batchSize = 5;
    
    for (let i = 0; i < vessels.length; i += batchSize) {
      const batch = vessels.slice(i, i + batchSize);
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vessels.length / batchSize)}...`);

      const results = await Promise.allSettled(
        batch.map(async (vessel: any) => {
          // Check if already scraped recently (within 7 days)
          const { data: existing } = await supabaseAdmin
            .from('vessel_registry')
            .select('last_updated')
            .eq('mmsi', vessel.mmsi)
            .single();

          if (existing) {
            const cacheAge = (Date.now() - new Date((existing as any).last_updated).getTime()) / (1000 * 60 * 60 * 24);
            if (cacheAge < 7) {
              console.log(`✓ Cached: ${vessel.name || vessel.mmsi}`);
              return { status: 'cached', mmsi: vessel.mmsi };
            }
          }

          // Scrape vessel data
          console.log(`🔍 Scraping: ${vessel.name || vessel.mmsi}...`);
          const data = await globalVesselLookup(vessel.mmsi);
          
          if (data) {
            console.log(`✅ Scraped: ${data.vesselName || vessel.mmsi} (Quality: ${data.dataQualityScore}%)`);
            return { status: 'scraped', mmsi: vessel.mmsi, quality: data.dataQualityScore };
          } else {
            console.log(`⚠️  Failed: ${vessel.name || vessel.mmsi}`);
            return { status: 'failed', mmsi: vessel.mmsi };
          }
        })
      );

      // Count results
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          if (result.value.status === 'scraped') scraped++;
          else if (result.value.status === 'cached') cached++;
          else failed++;
        } else {
          failed++;
        }
      });

      // Rate limiting delay between batches
      if (i + batchSize < vessels.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const summary = {
      total: vessels.length,
      scraped,
      cached,
      failed,
      message: `Batch scraping completed: ${scraped} scraped, ${cached} cached, ${failed} failed`,
    };

    console.log('✅ Batch scraping completed:', summary);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Batch scraping error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

