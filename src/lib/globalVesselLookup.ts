// Global vessel registry lookup from international maritime databases
// Uses LEGAL public data sources only
// Data sources: VesselFinder (public), MarineTraffic (API), FleetMon (public)

import { supabaseAdmin } from './supabaseAdmin';
import * as cheerio from 'cheerio';
import { enrichCommercialData } from './commercialDataScraper';

export interface GlobalVesselData {
  mmsi: number;
  imoNumber?: number;
  vesselName?: string;
  callSign?: string;
  flagCountry?: string;
  flagCountryCode?: string;
  
  // Owner/Operator (PUBLIC business data only)
  registeredOwner?: string;
  ownerCountry?: string;
  operatorName?: string;
  operatorAddress?: string;
  operatorCity?: string;
  operatorCountry?: string;
  
  // Contact (PUBLIC business data only - NO personal data)
  companyEmail?: string;
  companyPhone?: string;
  companyWebsite?: string;
  
  // COMMERCIAL PROCUREMENT DATA
  commercialOperator?: string;
  technicalManager?: string;
  shipManager?: string;
  procurementEmail?: string;
  suppliesEmail?: string;
  sparesEmail?: string;
  opsEmail?: string;
  purchasingEmail?: string;
  
  // Port & delivery
  nextPort?: string;
  eta?: string;
  portAgent?: string;
  agentPhone?: string;
  agentEmail?: string;
  
  // Fleet information
  fleetName?: string;
  fleetSize?: number;
  sisterVessels?: number[];
  
  // Technical/class
  classificationSociety?: string;
  lastDrydock?: string;
  nextSurveyDue?: string;
  pAndIClub?: string;
  
  // Crew
  crewSize?: number;
  crewNationality?: string;
  
  // Vessel details
  vesselType?: string;
  grossTonnage?: number;
  deadweight?: number;
  lengthMeters?: number;
  widthMeters?: number;
  yearBuilt?: number;
  
  // Data provenance
  dataSources: string[];
  dataQualityScore: number; // 0-100
}

/**
 * Lookup vessel from VesselFinder (public website scraping)
 * FREE public data - respects robots.txt and rate limits
 * https://www.vesselfinder.com
 */
async function scrapeVesselFinder(mmsi: number): Promise<Partial<GlobalVesselData> | null> {
  console.log(`🔍 Scraping VesselFinder for MMSI ${mmsi}...`);
  
  try {
    // First, search for the vessel to get its detail page URL
    const searchUrl = `https://www.vesselfinder.com/vessels?name=${mmsi}`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!searchResponse.ok) return null;

    const html = await searchResponse.text();
    const $ = cheerio.load(html);

    // Extract detailed vessel data
    const vesselName = $('h1.vsl').text().trim() || 
                      $('.ship-name').text().trim() ||
                      $('[itemprop="name"]').text().trim() || 
                      undefined;
                      
    const imoText = $('td:contains("IMO")').next().text().trim() ||
                    $('[itemprop="identifier"]').text().trim();
    const callSign = $('td:contains("Call")').next().text().trim() || undefined;
    const flagText = $('td:contains("Flag")').next().text().trim() ||
                    $('[itemprop="nationality"]').text().trim();
    const typeText = $('td:contains("Type")').next().text().trim() ||
                    $('[itemprop="type"]').text().trim();
    
    // Owner/operator information
    const ownerText = $('td:contains("Owner")').next().text().trim() ||
                     $('td:contains("Registered owner")').next().text().trim() ||
                     undefined;
    const operatorText = $('td:contains("Manager")').next().text().trim() ||
                        $('td:contains("Operator")').next().text().trim() ||
                        undefined;
    
    // Vessel dimensions
    const lengthText = $('td:contains("Length")').next().text().trim();
    const beamText = $('td:contains("Beam")').next().text().trim();
    const gtText = $('td:contains("Gross")').next().text().trim();
    const dwText = $('td:contains("Deadweight")').next().text().trim();
    const yearText = $('td:contains("Year")').next().text().trim();
    
    const imoNumber = imoText ? parseInt(imoText.replace(/\D/g, '')) : undefined;
    const lengthMeters = lengthText ? parseFloat(lengthText.replace(/[^\d.]/g, '')) : undefined;
    const widthMeters = beamText ? parseFloat(beamText.replace(/[^\d.]/g, '')) : undefined;
    const grossTonnage = gtText ? parseInt(gtText.replace(/\D/g, '')) : undefined;
    const deadweight = dwText ? parseInt(dwText.replace(/\D/g, '')) : undefined;
    const yearBuilt = yearText ? parseInt(yearText.replace(/\D/g, '')) : undefined;

    // Look for contact information (email, phone) in the page
    const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = html.match(/\+?[\d\s\-()]{10,20}/);

    return {
      mmsi,
      vesselName,
      imoNumber,
      callSign,
      flagCountry: flagText || undefined,
      vesselType: typeText || undefined,
      registeredOwner: ownerText || undefined,
      operatorName: operatorText || undefined,
      companyEmail: emailMatch ? emailMatch[0] : undefined,
      companyPhone: phoneMatch ? phoneMatch[0] : undefined,
      lengthMeters,
      widthMeters,
      grossTonnage,
      deadweight,
      yearBuilt,
      dataSources: ['VesselFinder'],
    };
  } catch (error) {
    console.error('VesselFinder scraping error:', error);
    return null;
  }
}

/**
 * Lookup vessel from MarineTraffic public API
 * Requires API key but has free tier
 * https://www.marinetraffic.com/en/ais-api-services
 */
async function lookupMarineTraffic(mmsi: number): Promise<Partial<GlobalVesselData> | null> {
  const apiKey = process.env.MARINETRAFFIC_API_KEY;
  if (!apiKey) return null;
  
  console.log(`🌊 Looking up MMSI ${mmsi} in MarineTraffic...`);
  
  try {
    // MarineTraffic API endpoint
    const url = `https://services.marinetraffic.com/api/exportvessel/v:8/${apiKey}/timespan:20/msgtype:extended/protocol:jsono/mmsi:${mmsi}`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data || data.length === 0) return null;
    
    const vessel = data[0];
    
    return {
      mmsi,
      imoNumber: vessel.IMO,
      vesselName: vessel.SHIPNAME,
      callSign: vessel.CALLSIGN,
      flagCountry: vessel.FLAG,
      vesselType: vessel.TYPE_NAME,
      grossTonnage: vessel.GT,
      deadweight: vessel.DWT,
      lengthMeters: vessel.LENGTH,
      widthMeters: vessel.WIDTH,
      yearBuilt: vessel.YEAR_BUILT,
      dataSources: ['MarineTraffic'],
    };
  } catch (error) {
    console.error('MarineTraffic lookup error:', error);
    return null;
  }
}

/**
 * Lookup vessel from MyShipTracking (public data)
 * FREE public vessel database with owner information
 * https://www.myshiptracking.com
 */
async function scrapeMyShipTracking(mmsi: number): Promise<Partial<GlobalVesselData> | null> {
  console.log(`🚢 Scraping MyShipTracking for MMSI ${mmsi}...`);
  
  try {
    const url = `https://www.myshiptracking.com/?mmsi=${mmsi}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract structured data
    const vesselName = $('h1').first().text().trim() || undefined;
    const specs: any = {};
    
    $('table.table-striped tr').each((_, row) => {
      const label = $(row).find('td').first().text().trim().toLowerCase();
      const value = $(row).find('td').last().text().trim();
      
      if (label.includes('imo')) specs.imoNumber = parseInt(value.replace(/\D/g, ''));
      if (label.includes('call')) specs.callSign = value;
      if (label.includes('flag')) specs.flagCountry = value;
      if (label.includes('type')) specs.vesselType = value;
      if (label.includes('owner')) specs.registeredOwner = value;
      if (label.includes('manager') || label.includes('operator')) specs.operatorName = value;
      if (label.includes('gross')) specs.grossTonnage = parseInt(value.replace(/\D/g, ''));
      if (label.includes('deadweight')) specs.deadweight = parseInt(value.replace(/\D/g, ''));
      if (label.includes('length')) specs.lengthMeters = parseFloat(value.replace(/[^\d.]/g, ''));
      if (label.includes('beam') || label.includes('width')) specs.widthMeters = parseFloat(value.replace(/[^\d.]/g, ''));
      if (label.includes('year') || label.includes('built')) specs.yearBuilt = parseInt(value.replace(/\D/g, ''));
    });

    return {
      mmsi,
      vesselName,
      ...specs,
      dataSources: ['MyShipTracking'],
    };
  } catch (error) {
    console.error('MyShipTracking scraping error:', error);
    return null;
  }
}

/**
 * Main global lookup function - aggregates data from multiple sources
 */
export async function globalVesselLookup(mmsi: number): Promise<GlobalVesselData | null> {
  try {
    // Check cache first
    const { data: cached } = await supabaseAdmin
      .from('vessel_registry')
      .select('*')
      .eq('mmsi', mmsi)
      .single();

    if (cached) {
      const cacheAge = (Date.now() - new Date((cached as any).last_updated).getTime()) / (1000 * 60 * 60 * 24);
      
      if (cacheAge < 7) { // Cache valid for 7 days
        console.log(`✅ Using cached registry data for MMSI ${mmsi}`);
        return cached as any;
      }
    }

    console.log(`🌐 Performing global lookup for MMSI ${mmsi}...`);

    // Try multiple sources in parallel
    const sources = await Promise.allSettled([
      scrapeVesselFinder(mmsi),
      lookupMarineTraffic(mmsi),
      scrapeMyShipTracking(mmsi),
    ]);

    // Merge data from all successful sources
    const mergedData: Partial<GlobalVesselData> = {
      mmsi,
      dataSources: [],
      dataQualityScore: 0,
    };

    let sourceCount = 0;

    sources.forEach((result, idx) => {
      if (result.status === 'fulfilled' && result.value) {
        const sourceName = ['VesselFinder', 'MarineTraffic', 'MyShipTracking'][idx];
        mergedData.dataSources!.push(sourceName);
        
        // Merge non-null values
        Object.keys(result.value).forEach((key) => {
          if (result.value![key as keyof GlobalVesselData] && !mergedData[key as keyof GlobalVesselData]) {
            (mergedData as any)[key] = result.value![key as keyof GlobalVesselData];
          }
        });
        
        sourceCount++;
      }
    });

    if (sourceCount === 0) {
      console.log(`⚠️  No global data found for MMSI ${mmsi}`);
      return null;
    }

    // Calculate data quality score
    const hasIMO = !!mergedData.imoNumber;
    const hasOwner = !!mergedData.registeredOwner || !!mergedData.operatorName;
    const hasContact = !!mergedData.companyEmail || !!mergedData.companyPhone;
    
    mergedData.dataQualityScore = 
      (hasIMO ? 40 : 0) +
      (hasOwner ? 30 : 0) +
      (hasContact ? 20 : 0) +
      (sourceCount * 3);

    // Store in database
    await (supabaseAdmin
      .from('vessel_registry')
      .upsert as any)({
        mmsi,
        imo_number: mergedData.imoNumber || null,
        vessel_name: mergedData.vesselName || null,
        call_sign: mergedData.callSign || null,
        flag_country: mergedData.flagCountry || null,
        flag_country_code: mergedData.flagCountryCode || null,
        registered_owner: mergedData.registeredOwner || null,
        owner_country: mergedData.ownerCountry || null,
        operator_name: mergedData.operatorName || null,
        operator_address: mergedData.operatorAddress || null,
        operator_city: mergedData.operatorCity || null,
        operator_country: mergedData.operatorCountry || null,
        company_email: mergedData.companyEmail || null,
        company_phone: mergedData.companyPhone || null,
        company_website: mergedData.companyWebsite || null,
        vessel_type: mergedData.vesselType || null,
        gross_tonnage: mergedData.grossTonnage || null,
        deadweight: mergedData.deadweight || null,
        length_meters: mergedData.lengthMeters || null,
        width_meters: mergedData.widthMeters || null,
        year_built: mergedData.yearBuilt || null,
        data_sources: mergedData.dataSources,
        data_quality_score: mergedData.dataQualityScore,
        last_updated: new Date().toISOString(),
      }, { onConflict: 'mmsi' });

    console.log(`✅ Global lookup completed for ${mergedData.vesselName || mmsi} (${sourceCount} sources, quality: ${mergedData.dataQualityScore}%)`);

    // PHASE 2: Enrich with commercial/procurement data
    try {
      const commercialData = await enrichCommercialData(mmsi, mergedData);
      Object.assign(mergedData, commercialData);
      console.log(`💼 Commercial enrichment completed for ${mmsi}`);
    } catch (error) {
      console.error('Commercial enrichment failed:', error);
    }

    return mergedData as GlobalVesselData;

  } catch (error) {
    console.error('Global vessel lookup error:', error);
    return null;
  }
}

/**
 * Batch lookup for multiple vessels
 */
export async function batchGlobalLookup(mmsiList: number[]): Promise<Map<number, GlobalVesselData>> {
  const results = new Map<number, GlobalVesselData>();
  
  console.log(`🌐 Batch lookup for ${mmsiList.length} vessels...`);
  
  // Lookup in parallel (with rate limiting)
  const batchSize = 5; // Don't overwhelm APIs
  for (let i = 0; i < mmsiList.length; i += batchSize) {
    const batch = mmsiList.slice(i, i + batchSize);
    
    const batchResults = await Promise.allSettled(
      batch.map(mmsi => globalVesselLookup(mmsi))
    );
    
    batchResults.forEach((result, idx) => {
      if (result.status === 'fulfilled' && result.value) {
        results.set(batch[idx], result.value);
      }
    });
    
    // Rate limiting delay
    if (i + batchSize < mmsiList.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`✅ Batch lookup completed: ${results.size}/${mmsiList.length} vessels found`);
  
  return results;
}

