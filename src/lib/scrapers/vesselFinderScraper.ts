// VesselFinder API Integration
// https://www.vesselfinder.com/api/docs
// Best for: Port calls, expected arrivals, master data

export interface VesselFinderData {
  mmsi: number;
  imo?: number;
  name?: string;
  flag?: string;
  type?: string;
  destination?: string;
  eta?: string;
  lastPort?: string;
  nextPort?: string;
}

/**
 * Get expected arrivals from VesselFinder
 */
export async function getVesselFinderArrivals(mmsi: number): Promise<VesselFinderData | null> {
  const apiKey = process.env.VESSELFINDER_API_KEY;
  if (!apiKey) {
    console.log('⚠️  VesselFinder API key not configured');
    return null;
  }

  try {
    const url = `https://api.vesselfinder.com/vesselfinder?userkey=${apiKey}&mmsi=${mmsi}&sat=0`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    
    return {
      mmsi: data.MMSI,
      imo: data.IMO,
      name: data.NAME,
      flag: data.FLAG,
      type: data.TYPE,
      destination: data.DESTINATION,
      eta: data.ETA,
    };
  } catch (error) {
    console.error('VesselFinder API error:', error);
    return null;
  }
}

