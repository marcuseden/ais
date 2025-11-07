// Batch enrich all vessels with Equasis data
// Pre-populates database with commercial operator, technical manager, etc.

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { globalVesselLookup } from '../src/lib/globalVesselLookup';

// Load .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function batchEnrich() {
  console.log('🌐 Starting batch Equasis enrichment...\n');
  
  if (!process.env.EQUASIS_SESSION_COOKIE) {
    console.error('❌ EQUASIS_SESSION_COOKIE not found in .env.local');
    console.log('\n📝 Add this line to .env.local:');
    console.log('EQUASIS_SESSION_COOKIE=JSESSIONID=3DD89290598A7ACD6DAFF014A0D8645C');
    process.exit(1);
  }
  
  console.log('✅ Equasis session found');
  console.log(`   Cookie: ${process.env.EQUASIS_SESSION_COOKIE.substring(0, 30)}...`);
  console.log('');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get all vessels
  const { data: vessels, error } = await supabase
    .from('vessels')
    .select('mmsi, name, ship_type')
    .order('last_seen', { ascending: false });

  if (error || !vessels) {
    console.error('Failed to fetch vessels:', error);
    process.exit(1);
  }

  console.log(`📦 Found ${vessels.length} vessels to enrich\n`);
  console.log('═'.repeat(60));

  let enriched = 0;
  let cached = 0;
  let failed = 0;

  for (let i = 0; i < vessels.length; i++) {
    const vessel = vessels[i];
    const progress = `[${i + 1}/${vessels.length}]`;
    
    console.log(`\n${progress} Processing: ${vessel.name || vessel.mmsi}`);
    console.log('─'.repeat(60));

    try {
      // Check if already enriched recently
      const { data: existing } = await supabase
        .from('vessel_registry')
        .select('last_updated, data_quality_score, data_sources')
        .eq('mmsi', vessel.mmsi)
        .single();

      if (existing) {
        const cacheAge = (Date.now() - new Date(existing.last_updated).getTime()) / (1000 * 60 * 60 * 24);
        console.log(`   ✓ Cached (${cacheAge.toFixed(1)} days old, quality: ${existing.data_quality_score}%)`);
        console.log(`   Sources: ${existing.data_sources?.join(', ')}`);
        cached++;
        
        // Skip if recent and high quality
        if (cacheAge < 7 && existing.data_quality_score > 50) {
          continue;
        }
      }

      // Scrape with full enrichment
      console.log('   🔍 Scraping from all sources...');
      const data = await globalVesselLookup(vessel.mmsi);

      if (data) {
        console.log(`   ✅ SUCCESS!`);
        console.log(`   │  Vessel: ${data.vesselName || vessel.name || 'Unknown'}`);
        console.log(`   │  IMO: ${data.imoNumber || 'N/A'}`);
        console.log(`   │  Commercial Op: ${data.commercialOperator || 'N/A'}`);
        console.log(`   │  Technical Mgr: ${data.technicalManager || 'N/A'}`);
        console.log(`   │  Procurement: ${data.procurementEmail || 'N/A'}`);
        console.log(`   │  Quality Score: ${data.dataQualityScore}%`);
        console.log(`   │  Sources: ${data.dataSources.join(', ')}`);
        enriched++;
      } else {
        console.log(`   ⚠️  No data found`);
        failed++;
      }

      // Rate limiting - be nice to APIs
      if (i < vessels.length - 1) {
        console.log('   ⏳ Waiting 3 seconds (rate limit)...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

    } catch (error) {
      console.error(`   ❌ ERROR:`, error instanceof Error ? error.message : error);
      failed++;
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 BATCH ENRICHMENT COMPLETE\n');
  console.log(`Total vessels: ${vessels.length}`);
  console.log(`✅ Newly enriched: ${enriched}`);
  console.log(`💾 Used cache: ${cached}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('\n🎉 Your vessels now have commercial-grade procurement data!');
  console.log('\nRefresh your browser and click any vessel to see the results!');
}

batchEnrich();

