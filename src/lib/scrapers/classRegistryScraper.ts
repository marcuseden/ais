// Classification Society Registry Scrapers
// DNV, Lloyd's Register, ABS - for survey dates and drydock triggers

import * as cheerio from 'cheerio';

export interface ClassificationData {
  mmsi: number;
  society: string; // 'DNV', 'LR', 'ABS', etc.
  classNotation?: string;
  lastSurvey?: string;
  nextSurveyDue?: string;
  lastDrydock?: string;
  nextDrydock?: string;
  certificateStatus?: string;
}

/**
 * Scrape DNV Vessel Register
 * https://vesselregister.dnv.com
 */
export async function scrapeDNV(imoNumber: number): Promise<ClassificationData | null> {
  if (!imoNumber) return null;
  
  console.log(`🔍 Checking DNV Register for IMO ${imoNumber}...`);
  
  try {
    const url = `https://vesselregister.dnv.com/VesselRegister/vessels/${imoNumber}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract survey and class data
    const classNotation = $('.class-notation').text().trim();
    const lastSurvey = $('td:contains("Last Survey")').next().text().trim();
    const nextSurvey = $('td:contains("Next Survey")').next().text().trim();

    return {
      mmsi: 0, // Will be filled by caller
      society: 'DNV',
      classNotation: classNotation || undefined,
      lastSurvey: lastSurvey || undefined,
      nextSurveyDue: nextSurvey || undefined,
    };
  } catch (error) {
    console.error('DNV scraping error:', error);
    return null;
  }
}

/**
 * Scrape Lloyd's Register
 * https://www.lr.org/en/ships-in-class/
 */
export async function scrapeLloydsRegister(imoNumber: number): Promise<ClassificationData | null> {
  if (!imoNumber) return null;
  
  console.log(`🔍 Checking Lloyd's Register for IMO ${imoNumber}...`);
  
  try {
    const url = `https://www.lr.org/en/ships-in-class/?imo=${imoNumber}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    return {
      mmsi: 0,
      society: 'Lloyd\'s Register',
      classNotation: $('.class-details').text().trim() || undefined,
    };
  } catch (error) {
    console.error('Lloyd\'s Register scraping error:', error);
    return null;
  }
}

/**
 * Check ABS Record
 * https://ww2.eagle.org/abs-record/
 */
export async function scrapeABS(imoNumber: number): Promise<ClassificationData | null> {
  if (!imoNumber) return null;
  
  console.log(`🔍 Checking ABS Record for IMO ${imoNumber}...`);
  
  try {
    const url = `https://ww2.eagle.org/abs-record/ships/${imoNumber}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    return {
      mmsi: 0,
      society: 'ABS',
      classNotation: $('.notation').text().trim() || undefined,
    };
  } catch (error) {
    console.error('ABS scraping error:', error);
    return null;
  }
}

/**
 * Try all classification societies
 */
export async function getClassificationData(mmsi: number, imoNumber?: number): Promise<ClassificationData | null> {
  if (!imoNumber) return null;

  // Try all major societies
  const results = await Promise.allSettled([
    scrapeDNV(imoNumber),
    scrapeLloydsRegister(imoNumber),
    scrapeABS(imoNumber),
  ]);

  // Return first successful result
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      return { ...result.value, mmsi };
    }
  }

  return null;
}

