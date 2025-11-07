// Bulk scrape Equasis for ALL Baltic Sea vessels
// Proactively build commercial database before vessels even appear on AIS

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EQUASIS_SESSION = process.env.EQUASIS_SESSION_COOKIE;

interface EquasisSearchResult {
  mmsi: number;
  imo: number;
  name: string;
  flag: string;
}

/**
 * Search Equasis for all vessels by region/flag
 * Returns list of vessels to scrape
 */
async function searchEquasisByRegion(country: string): Promise<EquasisSearchResult[]> {
  if (!EQUASIS_SESSION) return [];
  
  console.log(`🔍 Searching Equasis for ${country} vessels...`);
  
  try {
    const url = `https://www.equasis.org/EquasisWeb/restricted/Search?fs=Search&P_FLAG=${country}`;
    
    const response = await fetch(url, {
      headers: {
        'Cookie': EQUASIS_SESSION,
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      console.log(`   ⚠️  Failed to search ${country} (status: ${response.status})`);
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const vessels: EquasisSearchResult[] = [];

    // Parse search results table
    $('table.results tr').each((_, row) => {
      const cols = $(row).find('td');
      if (cols.length >= 4) {
        const mmsiText = $(cols[0]).text().trim();
        const imoText = $(cols[1]).text().trim();
        const name = $(cols[2]).text().trim();
        const flag = $(cols[3]).text().trim();

        const mmsi = parseInt(mmsiText);
        const imo = parseInt(imoText);

        if (mmsi && imo && name) {
          vessels.push({ mmsi, imo, name, flag });
        }
      }
    });

    console.log(`   ✅ Found ${vessels.length} ${country} vessels`);
    return vessels;
  } catch (error) {
    console.error(`Error searching ${country}:`, error);
    return [];
  }
}

/**
 * Scrape full details for a specific vessel
 */
async function scrapeVesselDetails(mmsi: number, imo: number): Promise<any> {
  if (!EQUASIS_SESSION) return null;

  try {
    const url = `https://www.equasis.org/EquasisWeb/restricted/ShipInfo?P_MMSI=${mmsi}`;
    
    const response = await fetch(url, {
      headers: {
        'Cookie': EQUASIS_SESSION,
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    const data: any = { mmsi, imo };

    // Extract company information
    $('table tr').each((_, row) => {
      const label = $(row).find('td').first().text().trim().toLowerCase();
      const value = $(row).find('td').last().text().trim();

      if (label.includes('ship name')) data.vesselName = value;
      if (label.includes('registered owner')) data.registeredOwner = value;
      if (label.includes('commercial operator') || label.includes('operator')) {
        data.commercialOperator = value;
      }
      if (label.includes('technical manager') || label.includes('manager')) {
        data.technicalManager = value;
      }
      if (label.includes('ism') && label.includes('manager')) data.ismManager = value;
      if (label.includes('classification') || label.includes('class society')) {
        data.classificationSociety = value;
      }
      if (label.includes('p&i') || label.includes('p & i')) data.pAndIClub = value;
      if (label.includes('flag')) data.flagCountry = value;
      if (label.includes('call')) data.callSign = value;
      if (label.includes('gross')) data.grossTonnage = parseInt(value.replace(/\D/g, ''));
      if (label.includes('deadweight')) data.deadweight = parseInt(value.replace(/\D/g, ''));
      if (label.includes('built') || label.includes('year')) {
        data.yearBuilt = parseInt(value.replace(/\D/g, ''));
      }
    });

    // Extract company addresses
    $('.company-address').each((idx, el) => {
      const address = $(el).text().trim();
      if (idx === 0 && data.registeredOwner) data.ownerAddress = address;
      if (idx === 1 && data.commercialOperator) data.operatorAddress = address;
      if (idx === 2 && data.technicalManager) data.managerAddress = address;
    });

    return data;
  } catch (error) {
    console.error(`Error scraping vessel ${mmsi}:`, error);
    return null;
  }
}

/**
 * Main bulk scraping function
 */
async function bulkScrapeEquasis() {
  console.log('🌐 BULK EQUASIS SCRAPER\n');
  console.log('═'.repeat(60));
  
  if (!EQUASIS_SESSION) {
    console.error('\n❌ EQUASIS_SESSION_COOKIE not found');
    console.log('Add to .env.local and try again');
    process.exit(1);
  }

  console.log('✅ Equasis session active\n');

  // Baltic Sea countries to scrape
  const balticCountries = [
    'Sweden',      // Major Baltic operator
    'Finland',     // Major Baltic operator
    'Estonia',     // Baltic ferries
    'Denmark',     // Kattegatt/Baltic
    'Germany',     // Baltic ports
    'Poland',      // Baltic ports
    'Lithuania',   // Baltic ports
    'Latvia',      // Baltic ports
  ];

  let totalVessels = 0;
  let scraped = 0;
  let failed = 0;

  for (const country of balticCountries) {
    console.log(`\n🇪🇺 Processing ${country}...`);
    console.log('─'.repeat(60));

    // Search for vessels by country
    const vessels = await searchEquasisByRegion(country);
    
    if (vessels.length === 0) {
      console.log('   No vessels found');
      continue;
    }

    totalVessels += vessels.length;

    // Scrape details for each vessel (with rate limiting)
    for (let i = 0; i < vessels.length && i < 50; i++) { // Limit per country
      const vessel = vessels[i];
      
      console.log(`\n   [${i + 1}/${Math.min(vessels.length, 50)}] ${vessel.name}`);

      // Check if already in database
      const { data: existing } = await supabase
        .from('vessel_registry')
        .select('last_updated')
        .eq('mmsi', vessel.mmsi)
        .single();

      if (existing) {
        const age = (Date.now() - new Date(existing.last_updated).getTime()) / (1000 * 60 * 60 * 24);
        if (age < 30) {
          console.log(`      ✓ Cached (${age.toFixed(0)} days old)`);
          continue;
        }
      }

      // Scrape full details
      const details = await scrapeVesselDetails(vessel.mmsi, vessel.imo);

      if (details) {
        // Save to database
        const { error } = await (supabase
          .from('vessel_registry')
          .upsert as any)({
            mmsi: details.mmsi,
            imo_number: details.imo,
            vessel_name: details.vesselName || vessel.name,
            call_sign: details.callSign,
            flag_country: details.flagCountry || vessel.flag,
            registered_owner: details.registeredOwner,
            operator_name: details.commercialOperator,
            operator_address: details.operatorAddress,
            company_email: null, // Will be filled by website scraper
            vessel_type: null,
            gross_tonnage: details.grossTonnage,
            deadweight: details.deadweight,
            year_built: details.yearBuilt,
            data_sources: ['Equasis'],
            last_updated: new Date().toISOString(),
            data_quality_score: 60, // Equasis gives good baseline
          }, { onConflict: 'mmsi' });

        if (!error) {
          console.log(`      ✅ Operator: ${details.commercialOperator || 'Unknown'}`);
          console.log(`      ✅ Tech Mgr: ${details.technicalManager || 'Unknown'}`);
          console.log(`      ✅ Class: ${details.classificationSociety || 'Unknown'}`);
          scraped++;
        } else {
          console.log(`      ❌ DB Error: ${error.message}`);
          failed++;
        }
      } else {
        console.log('      ⚠️  Scraping failed');
        failed++;
      }

      // Rate limiting - be respectful
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`\n   ${country} summary: ${Math.min(vessels.length, 50)} processed`);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 BULK SCRAPING COMPLETE\n');
  console.log(`Total vessels found: ${totalVessels}`);
  console.log(`Successfully scraped: ${scraped}`);
  console.log(`Failed: ${failed}`);
  console.log('\n✅ Your database now has comprehensive Baltic Sea vessel data!');
  console.log('🔄 Run migration 003 to create procurement tables');
  console.log('🌐 Real-time AIS will update positions as vessels move');
}

bulkScrapeEquasis();

