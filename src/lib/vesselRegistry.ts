// Vessel owner lookup from LEGAL public sources only
// GDPR-compliant: Only uses publicly available business registry data

import { supabaseAdmin } from './supabaseAdmin';

export interface VesselOwnerInfo {
  mmsi: number;
  companyName?: string;
  registrationNumber?: string;
  businessEmail?: string;
  businessPhone?: string;
  registrySource: string;
  registryUrl?: string;
  lastVerified: string;
  dataSource: 'public_registry' | 'opt_in' | 'manual_verification';
}

// IMO Number lookup (International Maritime Organization)
// Public database for commercial vessels
async function lookupIMO(mmsi: number): Promise<Partial<VesselOwnerInfo> | null> {
  // Note: Real implementation would use IMO API or public databases
  // This is a placeholder structure
  
  console.log(`🔍 Looking up vessel ${mmsi} in IMO registry...`);
  
  // TODO: Implement actual IMO API lookup
  // Example sources:
  // - https://gisis.imo.org (free public access)
  // - https://www.equasis.org (free registration required)
  
  return null; // Placeholder
}

// Swedish vessels - Bolagsverket (Swedish Companies Registration Office)
// Only for Swedish-registered vessels (MMSI starting with 265, 266)
async function lookupBolagsverket(mmsi: number): Promise<Partial<VesselOwnerInfo> | null> {
  const mmsiStr = mmsi.toString();
  
  // Check if Swedish vessel
  if (!mmsiStr.startsWith('265') && !mmsiStr.startsWith('266')) {
    return null;
  }

  console.log(`🇸🇪 Looking up Swedish vessel ${mmsi} in Bolagsverket...`);
  
  // TODO: Implement Bolagsverket API lookup
  // API: https://www.bolagsverket.se/om/oppnadata
  // Free public API for company information
  
  return null; // Placeholder
}

// Main lookup function - checks multiple sources
export async function lookupVesselOwner(mmsi: number): Promise<VesselOwnerInfo | null> {
  try {
    // First check if we have cached data
    const { data: existing } = await supabaseAdmin
      .from('vessel_contacts')
      .select('*')
      .eq('mmsi', mmsi)
      .single();

    if (existing) {
      // Check if data is still fresh (less than 30 days old)
      const lastVerified = new Date(existing.last_verified || existing.created_at);
      const daysSinceVerification = (Date.now() - lastVerified.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceVerification < 30) {
        console.log(`✅ Using cached contact data for ${mmsi}`);
        return existing as any;
      }
    }

    // Try different sources in order of reliability
    let ownerInfo: Partial<VesselOwnerInfo> | null = null;

    // 1. Try IMO registry (international)
    ownerInfo = await lookupIMO(mmsi);
    
    // 2. Try Bolagsverket (Swedish vessels)
    if (!ownerInfo) {
      ownerInfo = await lookupBolagsverket(mmsi);
    }

    if (ownerInfo) {
      // Store in database
      const contactData = {
        mmsi,
        company_name: ownerInfo.companyName,
        company_registration_number: ownerInfo.registrationNumber,
        business_email: ownerInfo.businessEmail,
        business_phone: ownerInfo.businessPhone,
        registry_source: ownerInfo.registrySource,
        registry_url: ownerInfo.registryUrl,
        data_source: ownerInfo.dataSource,
        last_verified: new Date().toISOString(),
      };

      await supabaseAdmin
        .from('vessel_contacts')
        .upsert(contactData, { onConflict: 'mmsi' });

      return ownerInfo as VesselOwnerInfo;
    }

    console.log(`⚠️  No public registry data found for ${mmsi}`);
    return null;

  } catch (error) {
    console.error('Error looking up vessel owner:', error);
    return null;
  }
}

// Verify vessel ownership (for opt-in system)
export async function initiateOwnerVerification(mmsi: number, claimedBy: string) {
  // Generate verification code
  const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  console.log(`📧 Verification code for MMSI ${mmsi}: ${verificationCode}`);
  
  // In production, this would:
  // 1. Send email to vessel's registered email
  // 2. Require captain to enter verification code
  // 3. Only then allow contact preferences to be set
  
  return verificationCode;
}

