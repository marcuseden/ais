// Equasis Web Scraper (Free but requires login)
// https://www.equasis.org
// GOLD STANDARD for: Owner, Operator, Technical Manager, ISM Manager

import * as cheerio from 'cheerio';

export interface EquasisData {
  mmsi: number;
  imo?: number;
  vesselName?: string;
  
  // The critical hierarchy
  registeredOwner?: string;
  ownerAddress?: string;
  ownerCountry?: string;
  
  commercialOperator?: string;
  operatorAddress?: string;
  operatorCountry?: string;
  
  technicalManager?: string;
  managerAddress?: string;
  managerCountry?: string;
  
  ismManager?: string; // ISM Document of Compliance manager
  
  // Class & certificates
  classificationSociety?: string;
  classNotation?: string;
  lastSurvey?: string;
  nextSurvey?: string;
  
  // P&I
  pAndIClub?: string;
}

/**
 * Scrape Equasis for comprehensive ownership data
 * NOTE: Requires session cookies from login
 * In production, maintain a logged-in session
 */
export async function scrapeEquasis(mmsi: number, sessionCookie?: string): Promise<EquasisData | null> {
  console.log(`📊 Scraping Equasis for MMSI ${mmsi}...`);
  
  if (!sessionCookie) {
    console.log('⚠️  Equasis session not configured - skipping');
    // TODO: Implement Equasis login automation
    // Would need to:
    // 1. POST to login page with credentials
    // 2. Store session cookie
    // 3. Use cookie for subsequent requests
    return null;
  }

  try {
    // Equasis ship particulars page
    const url = `https://www.equasis.org/EquasisWeb/restricted/ShipInfo?P_MMSI=${mmsi}`;
    
    const response = await fetch(url, {
      headers: {
        'Cookie': sessionCookie,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract ownership hierarchy (Equasis has structured tables)
    const data: EquasisData = { mmsi };
    
    // Ship particulars table
    $('table tr').each((_, row) => {
      const label = $(row).find('td').first().text().trim().toLowerCase();
      const value = $(row).find('td').last().text().trim();
      
      if (label.includes('imo')) data.imo = parseInt(value.replace(/\D/g, ''));
      if (label.includes('name')) data.vesselName = value;
      if (label.includes('registered owner')) data.registeredOwner = value;
      if (label.includes('operator') && !label.includes('technical')) data.commercialOperator = value;
      if (label.includes('technical manager')) data.technicalManager = value;
      if (label.includes('ism manager')) data.ismManager = value;
      if (label.includes('class society')) data.classificationSociety = value;
      if (label.includes('p&i')) data.pAndIClub = value;
    });

    console.log(`✅ Equasis scraped: ${data.vesselName || mmsi}`);
    return data;
  } catch (error) {
    console.error('Equasis scraping error:', error);
    return null;
  }
}

/**
 * Login to Equasis and get session cookie
 * Store this for subsequent requests
 */
export async function loginToEquasis(username: string, password: string): Promise<string | null> {
  try {
    const response = await fetch('https://www.equasis.org/EquasisWeb/authen/HomePage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        j_email: username,
        j_password: password,
      }),
    });

    const cookies = response.headers.get('set-cookie');
    if (cookies) {
      // Extract session cookie
      const jsessionMatch = cookies.match(/JSESSIONID=([^;]+)/);
      if (jsessionMatch) {
        return `JSESSIONID=${jsessionMatch[1]}`;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Equasis login error:', error);
    return null;
  }
}

