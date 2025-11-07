// Datalastic API Integration  
// https://datalastic.com/api-maritime/
// All-in-one: vessels, ports, historical AIS, company fields

export interface DatalasticVessel {
  mmsi: number;
  imo?: number;
  name?: string;
  type?: string;
  flag?: string;
  owner?: string;
  manager?: string;
  operator?: string;
  classification?: string;
  built?: number;
  gt?: number;
  dwt?: number;
}

/**
 * Get comprehensive vessel data from Datalastic
 * Easy-to-use all-in-one API
 */
export async function getDatalasticVesselData(mmsi: number): Promise<DatalasticVessel | null> {
  const apiKey = process.env.DATALASTIC_API_KEY;
  if (!apiKey) {
    console.log('⚠️  Datalastic API key not configured');
    return null;
  }

  try {
    const url = `https://api.datalastic.com/api/v0/vessel?api-key=${apiKey}&mmsi=${mmsi}`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    
    return {
      mmsi: data.mmsi,
      imo: data.imo,
      name: data.name,
      type: data.type,
      flag: data.flag,
      owner: data.owner,
      manager: data.manager,
      operator: data.operator,
      classification: data.class_society,
      built: data.year_built,
      gt: data.gross_tonnage,
      dwt: data.deadweight,
    };
  } catch (error) {
    console.error('Datalastic API error:', error);
    return null;
  }
}

/**
 * Get port information from Datalastic
 */
export async function getDatalasticPortInfo(portName: string): Promise<any> {
  const apiKey = process.env.DATALASTIC_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://api.datalastic.com/api/v0/port?api-key=${apiKey}&name=${encodeURIComponent(portName)}`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    return await response.json();
  } catch (error) {
    console.error('Datalastic Port API error:', error);
    return null;
  }
}

