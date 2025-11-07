// Enhanced commercial data scraper for B2B vessel sales
// Integrates: MarineTraffic, VesselFinder, Datalastic, Equasis, Class Registries

import * as cheerio from 'cheerio';
import { supabaseAdmin } from './supabaseAdmin';
import { getExpectedArrivals, getPortCallHistory, getVesselMasterData } from './scrapers/marineTrafficScraper';
import { getVesselFinderArrivals } from './scrapers/vesselFinderScraper';
import { getDatalasticVesselData } from './scrapers/datalasticScraper';
import { scrapeEquasis } from './scrapers/equasisScraper';
import { getClassificationData } from './scrapers/classRegistryScraper';
import { scrapeProcurementEmails } from './scrapers/procurementEmailScraper';

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

  // PHASE 1: Port & ETA data (MarineTraffic or VesselFinder)
  try {
    const mtArrival = await getExpectedArrivals(mmsi);
    if (mtArrival) {
      commercialData.nextPort = mtArrival.nextPortName;
      commercialData.nextPortCountry = mtArrival.nextPortCountry;
      commercialData.eta = mtArrival.eta;
      commercialData.dataSources!.push('MarineTraffic');
      
      // Get port call history
      const portHistory = await getPortCallHistory(mmsi, 90);
      if (portHistory.length > 0) {
        // Store in port_calls table
        await Promise.all(portHistory.map(call => 
          (supabaseAdmin.from('port_calls').insert as any)({
            mmsi: call.mmsi,
            port_name: call.portName,
            port_country: call.portCountry,
            port_unlocode: call.portUnlocode,
            ata: call.timeOfArrival,
            atd: call.timeOfDeparture,
            cargo_operation: call.cargoOperation,
          })
        ));
        console.log(`✅ Saved ${portHistory.length} port calls for ${mmsi}`);
      }
    }
  } catch (error) {
    console.error('Port data enrichment error:', error);
  }

  // PHASE 2: Try Datalastic for quick all-in-one data
  try {
    const datalasticData = await getDatalasticVesselData(mmsi);
    if (datalasticData) {
      commercialData.commercialOperator = datalasticData.operator;
      commercialData.technicalManager = datalasticData.manager;
      commercialData.classificationSociety = datalasticData.classification;
      commercialData.dataSources!.push('Datalastic');
    }
  } catch (error) {
    console.error('Datalastic enrichment error:', error);
  }

  // PHASE 3: Equasis for ownership hierarchy (best free source)
  try {
    const equasisSession = process.env.EQUASIS_SESSION_COOKIE;
    if (equasisSession) {
      const equasisData = await scrapeEquasis(mmsi, equasisSession);
      if (equasisData) {
        commercialData.commercialOperator = equasisData.commercialOperator || commercialData.commercialOperator;
        commercialData.technicalManager = equasisData.technicalManager || commercialData.technicalManager;
        commercialData.shipManager = equasisData.ismManager;
        commercialData.classificationSociety = equasisData.classificationSociety || commercialData.classificationSociety;
        commercialData.pAndIClub = equasisData.pAndIClub;
        commercialData.dataSources!.push('Equasis');
      }
    }
  } catch (error) {
    console.error('Equasis enrichment error:', error);
  }

  // PHASE 4: Classification society check (for survey dates - sales trigger!)
  if (basicData.imoNumber) {
    try {
      const classData = await getClassificationData(mmsi, basicData.imoNumber);
      if (classData) {
        commercialData.classificationSociety = classData.society;
        commercialData.lastDrydock = classData.lastDrydock;
        commercialData.dataSources!.push('Class Registry');
      }
    } catch (error) {
      console.error('Class registry error:', error);
    }
  }

  // PHASE 5: Scrape operator website for procurement emails (THE GOLD)
  if (basicData.companyWebsite) {
    try {
      const procurementContacts = await scrapeProcurementEmails(basicData.companyWebsite);
      Object.assign(commercialData, procurementContacts);
      if (Object.keys(procurementContacts).length > 0) {
        commercialData.dataSources!.push('Company Website');
        console.log(`✅ Found procurement emails:`, procurementContacts);
      }
    } catch (error) {
      console.error('Procurement email scraping error:', error);
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

