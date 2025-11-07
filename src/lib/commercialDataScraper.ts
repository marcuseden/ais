// Enhanced commercial data scraper for B2B vessel sales
// Extracts procurement emails, port agents, ETAs, operator fleets

import * as cheerio from 'cheerio';
import { supabaseAdmin } from './supabaseAdmin';

export interface CommercialVesselData {
  mmsi: number;
  
  // Operator hierarchy
  commercialOperator?: string;
  technicalManager?: string;
  shipManager?: string;
  
  // Procurement contacts (THE MONEY)
  procurementEmail?: string;
  suppliesEmail?: string;
  sparesEmail?: string;
  opsEmail?: string;
  purchasingEmail?: string;
  technicalEmail?: string;
  
  // Port information
  nextPort?: string;
  nextPortCountry?: string;
  eta?: string;
  etd?: string;
  portAgent?: string;
  agentPhone?: string;
  agentEmail?: string;
  
  // Fleet data
  fleetName?: string;
  fleetSize?: number;
  sisterVessels?: number[];
  
  // Technical
  classificationSociety?: string;
  lastDrydock?: string;
  pAndIClub?: string;
  
  // Crew
  crewSize?: number;
  crewNationality?: string;
  
  // Data quality
  dataSources: string[];
}

/**
 * Scrape Equasis for comprehensive commercial data
 * FREE but requires registration
 * https://www.equasis.org
 */
async function scrapeEquasis(mmsi: number): Promise<Partial<CommercialVesselData> | null> {
  console.log(`📊 Scraping Equasis for MMSI ${mmsi}...`);
  
  try {
    // Equasis has the BEST commercial data:
    // - Commercial operator
    // - Technical manager
    // - Ship manager
    // - Complete company details
    // - Classification society
    // - Survey dates
    
    // TODO: Implement Equasis login + search
    // Requires cookie-based session
    
    return {
      mmsi,
      dataSources: ['Equasis'],
    };
  } catch (error) {
    console.error('Equasis scraping error:', error);
    return null;
  }
}

/**
 * Get port call data from MarineTraffic API
 * Requires paid API but gives ETA, port agents, history
 */
async function getPortCallData(mmsi: number): Promise<Partial<CommercialVesselData> | null> {
  const apiKey = process.env.MARINETRAFFIC_API_KEY;
  if (!apiKey) return null;
  
  console.log(`🚢 Getting port data for MMSI ${mmsi} from MarineTraffic...`);
  
  try {
    // Get expected arrivals
    const etaUrl = `https://services.marinetraffic.com/api/exportvessel/v:8/${apiKey}/timespan:20/msgtype:extended/protocol:jsono/mmsi:${mmsi}`;
    const response = await fetch(etaUrl);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data || data.length === 0) return null;
    
    const vessel = data[0];
    
    return {
      mmsi,
      nextPort: vessel.NEXT_PORT_NAME,
      nextPortCountry: vessel.NEXT_PORT_COUNTRY,
      eta: vessel.ETA,
      dataSources: ['MarineTraffic'],
    };
  } catch (error) {
    console.error('MarineTraffic port data error:', error);
    return null;
  }
}

/**
 * Scrape operator website for procurement emails
 * This is where the GOLD is - direct buyer contacts
 */
async function scrapeOperatorWebsite(operatorName: string, website?: string): Promise<string[]> {
  if (!website) return [];
  
  console.log(`📧 Scraping ${operatorName} website for procurement emails...`);
  
  try {
    const response = await fetch(website, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) return [];
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Look for procurement-related emails
    const emails: string[] = [];
    const text = $('body').text();
    
    // Match procurement-related emails
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const matches = text.match(emailRegex) || [];
    
    matches.forEach(email => {
      const lower = email.toLowerCase();
      if (
        lower.includes('procurement') ||
        lower.includes('purchasing') ||
        lower.includes('supplies') ||
        lower.includes('spares') ||
        lower.includes('ops') ||
        lower.includes('fleet') ||
        lower.includes('chartering')
      ) {
        emails.push(email);
      }
    });
    
    // Also check contact/procurement pages
    const contactLinks = $('a[href*="contact"], a[href*="procurement"]').toArray();
    // TODO: Follow these links and scrape for more emails
    
    console.log(`✅ Found ${emails.length} procurement emails for ${operatorName}`);
    return [...new Set(emails)]; // Deduplicate
  } catch (error) {
    console.error('Website scraping error:', error);
    return [];
  }
}

/**
 * Main commercial data enrichment function
 */
export async function enrichCommercialData(mmsi: number, basicData: any): Promise<CommercialVesselData> {
  console.log(`💼 Enriching commercial data for MMSI ${mmsi}...`);
  
  const commercialData: Partial<CommercialVesselData> = {
    mmsi,
    dataSources: [],
  };

  // Get port call data
  const portData = await getPortCallData(mmsi);
  if (portData) {
    Object.assign(commercialData, portData);
    commercialData.dataSources!.push('MarineTraffic');
  }

  // Get Equasis data (operator, manager, class)
  const equasisData = await scrapeEquasis(mmsi);
  if (equasisData) {
    Object.assign(commercialData, equasisData);
    commercialData.dataSources!.push('Equasis');
  }

  // If we have operator info, scrape their website for procurement emails
  if (basicData.operatorName && basicData.companyWebsite) {
    const procurementEmails = await scrapeOperatorWebsite(
      basicData.operatorName,
      basicData.companyWebsite
    );
    
    if (procurementEmails.length > 0) {
      commercialData.procurementEmail = procurementEmails[0];
      commercialData.suppliesEmail = procurementEmails.find(e => e.includes('supplies'));
      commercialData.sparesEmail = procurementEmails.find(e => e.includes('spares'));
      commercialData.purchasingEmail = procurementEmails.find(e => e.includes('purchasing'));
    }
  }

  // Save to database
  await saveProcurementData(commercialData);

  return commercialData as CommercialVesselData;
}

async function saveProcurementData(data: Partial<CommercialVesselData>) {
  try {
    await (supabaseAdmin
      .from('vessel_procurement')
      .upsert as any)({
        mmsi: data.mmsi,
        commercial_operator: data.commercialOperator,
        technical_manager: data.technicalManager,
        ship_manager: data.shipManager,
        procurement_email: data.procurementEmail,
        supplies_email: data.suppliesEmail,
        spares_email: data.sparesEmail,
        ops_email: data.opsEmail,
        purchasing_email: data.purchasingEmail,
        technical_manager_email: data.technicalEmail,
        port_agent: data.portAgent,
        agent_phone: data.agentPhone,
        agent_email: data.agentEmail,
        fleet_name: data.fleetName,
        fleet_size: data.fleetSize,
        classification_society: data.classificationSociety,
        p_and_i_club: data.pAndIClub,
        crew_size: data.crewSize,
        crew_nationality: data.crewNationality,
        data_sources: data.dataSources,
        last_updated: new Date().toISOString(),
      }, { onConflict: 'mmsi' });

    // Also update vessel_status with port/ETA data
    if (data.nextPort || data.eta) {
      await (supabaseAdmin
        .from('vessel_status')
        .upsert as any)({
          mmsi: data.mmsi,
          next_port: data.nextPort,
          next_port_country: data.nextPortCountry,
          eta: data.eta,
          etd: data.etd,
          destination_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'mmsi' });
    }

    console.log(`✅ Saved commercial procurement data for ${data.mmsi}`);
  } catch (error) {
    console.error('Error saving procurement data:', error);
  }
}

export default enrichCommercialData;

