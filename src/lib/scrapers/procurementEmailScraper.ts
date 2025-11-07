// Procurement Email Scraper
// Crawls operator websites to find purchasing/procurement contacts

import * as cheerio from 'cheerio';

export interface ProcurementContacts {
  procurementEmail?: string;
  suppliesEmail?: string;
  sparesEmail?: string;
  opsEmail?: string;
  purchasingEmail?: string;
  technicalEmail?: string;
  fleetEmail?: string;
  charteringEmail?: string;
}

/**
 * Scrape company website for ALL procurement-related emails
 */
export async function scrapeProcurementEmails(companyWebsite: string): Promise<ProcurementContacts> {
  console.log(`📧 Scraping ${companyWebsite} for procurement emails...`);
  
  const emails: ProcurementContacts = {};
  
  try {
    // Crawl main page
    const mainPage = await crawlForEmails(companyWebsite);
    Object.assign(emails, mainPage);
    
    // Try to find and crawl contact page
    const contactPageEmails = await crawlContactPage(companyWebsite);
    Object.assign(emails, contactPageEmails);
    
    // Try procurement/purchasing specific pages
    const procurementPageEmails = await crawlProcurementPages(companyWebsite);
    Object.assign(emails, procurementPageEmails);
    
    console.log(`✅ Found ${Object.keys(emails).length} procurement contacts for ${companyWebsite}`);
    return emails;
  } catch (error) {
    console.error('Procurement email scraping error:', error);
    return emails;
  }
}

async function crawlForEmails(url: string): Promise<ProcurementContacts> {
  const emails: ProcurementContacts = {};
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) return emails;
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract all emails
    const text = $('body').html() || '';
    const emailMatches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    
    // Categorize by keyword
    emailMatches.forEach(email => {
      const lower = email.toLowerCase();
      
      if (lower.includes('procurement') && !emails.procurementEmail) {
        emails.procurementEmail = email;
      }
      if (lower.includes('supplies') || lower.includes('supply')) {
        emails.suppliesEmail = email;
      }
      if (lower.includes('spare') || lower.includes('parts')) {
        emails.sparesEmail = email;
      }
      if (lower.includes('ops') || lower.includes('operations')) {
        emails.opsEmail = email;
      }
      if (lower.includes('purchasing') || lower.includes('purchase')) {
        emails.purchasingEmail = email;
      }
      if (lower.includes('technical') || lower.includes('tech')) {
        emails.technicalEmail = email;
      }
      if (lower.includes('fleet')) {
        emails.fleetEmail = email;
      }
      if (lower.includes('chartering') || lower.includes('charter')) {
        emails.charteringEmail = email;
      }
    });
    
    return emails;
  } catch (error) {
    return emails;
  }
}

async function crawlContactPage(baseUrl: string): Promise<ProcurementContacts> {
  try {
    const contactUrl = new URL('/contact', baseUrl).href;
    return await crawlForEmails(contactUrl);
  } catch (error) {
    return {};
  }
}

async function crawlProcurementPages(baseUrl: string): Promise<ProcurementContacts> {
  const emails: ProcurementContacts = {};
  
  const pagesToTry = [
    '/procurement',
    '/purchasing',
    '/services',
    '/fleet',
    '/about/contact',
  ];
  
  for (const page of pagesToTry) {
    try {
      const url = new URL(page, baseUrl).href;
      const pageEmails = await crawlForEmails(url);
      Object.assign(emails, pageEmails);
    } catch (error) {
      // Page doesn't exist, continue
    }
  }
  
  return emails;
}

