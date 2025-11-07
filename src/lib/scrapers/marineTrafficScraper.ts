// MarineTraffic API Integration
// https://www.marinetraffic.com/en/ais-api-services
// Best for: Port calls, ETA, vessel events

export interface MarineTrafficVessel {
  mmsi: number;
  imo?: number;
  shipName?: string;
  nextPortName?: string;
  nextPortCountry?: string;
  nextPortUnlocode?: string;
  eta?: string;
  lastPort?: string;
  lastPortTime?: string;
  destination?: string;
}

export interface PortCall {
  mmsi: number;
  portName: string;
  portCountry: string;
  portUnlocode: string;
  timeOfArrival: string;
  timeOfDeparture?: string;
  cargoOperation?: string;
}

/**
 * Get vessel expected arrivals and port data
 * API: PS07 - Expected Arrivals
 */
export async function getExpectedArrivals(mmsi: number): Promise<MarineTrafficVessel | null> {
  const apiKey = process.env.MARINETRAFFIC_API_KEY;
  if (!apiKey) {
    console.log('⚠️  MarineTraffic API key not configured');
    return null;
  }

  try {
    const url = `https://services.marinetraffic.com/api/expectedarrivals/v:3/${apiKey}/portid:all/mmsi:${mmsi}/protocol:jsono`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data || data.length === 0) return null;
    
    const arrival = data[0];
    
    return {
      mmsi,
      imo: arrival.IMO,
      shipName: arrival.SHIPNAME,
      nextPortName: arrival.PORT_NAME,
      nextPortCountry: arrival.COUNTRY_NAME,
      nextPortUnlocode: arrival.PORT_UNLOCODE,
      eta: arrival.ETA,
      destination: arrival.DESTINATION,
    };
  } catch (error) {
    console.error('MarineTraffic Expected Arrivals error:', error);
    return null;
  }
}

/**
 * Get vessel port call history
 * API: PS05 - Port Calls
 */
export async function getPortCallHistory(mmsi: number, days: number = 30): Promise<PortCall[]> {
  const apiKey = process.env.MARINETRAFFIC_API_KEY;
  if (!apiKey) return [];

  try {
    const url = `https://services.marinetraffic.com/api/portcalls/v:4/${apiKey}/mmsi:${mmsi}/timespan:${days}/protocol:jsono`;
    
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const data = await response.json();
    if (!data) return [];
    
    return data.map((call: any) => ({
      mmsi,
      portName: call.PORT_NAME,
      portCountry: call.COUNTRY_NAME,
      portUnlocode: call.PORT_UNLOCODE,
      timeOfArrival: call.TIMESTAMP_ARRIVAL,
      timeOfDeparture: call.TIMESTAMP_DEPARTURE,
      cargoOperation: call.CARGO_TYPE,
    }));
  } catch (error) {
    console.error('MarineTraffic Port Calls error:', error);
    return [];
  }
}

/**
 * Get comprehensive vessel data
 * API: VD01 - Vessel Data
 */
export async function getVesselMasterData(mmsi: number) {
  const apiKey = process.env.MARINETRAFFIC_API_KEY;
  if (!apiKey) return null;

  try {
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
    };
  } catch (error) {
    console.error('MarineTraffic Vessel Data error:', error);
    return null;
  }
}

