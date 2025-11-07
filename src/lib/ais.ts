import { z } from 'zod';

// AIS Message Type schemas based on aisstream.io
export const AISPositionSchema = z.object({
  MessageType: z.literal('PositionReport'),
  Message: z.object({
    PositionReport: z.object({
      Latitude: z.number(),
      Longitude: z.number(),
      Sog: z.number().optional(), // Speed over ground
      Cog: z.number().optional(), // Course over ground
      TrueHeading: z.number().optional(),
    }),
  }),
  MetaData: z.object({
    MMSI: z.number(),
    ShipName: z.string().optional(),
    ShipType: z.number().optional(),
    time_utc: z.string(),
  }),
});

export const AISShipStaticSchema = z.object({
  MessageType: z.literal('ShipStaticData'),
  Message: z.object({
    ShipStaticData: z.object({
      Name: z.string().optional(),
      Type: z.number().optional(),
      Destination: z.string().optional(),
    }),
  }),
  MetaData: z.object({
    MMSI: z.number(),
    time_utc: z.string(),
  }),
});

export type AISPosition = z.infer<typeof AISPositionSchema>;
export type AISShipStatic = z.infer<typeof AISShipStaticSchema>;

// Normalized vessel position for internal use
export interface VesselPosition {
  mmsi: number;
  name?: string;
  ship_type?: string;
  lat: number;
  lng: number;
  sog?: number;
  cog?: number;
  ts: Date;
}

// Ship type mappings (AIS ship type codes)
export const SHIP_TYPE_MAP: Record<number, string> = {
  30: 'Fishing',
  31: 'Towing',
  32: 'Towing (large)',
  33: 'Dredging',
  34: 'Diving',
  35: 'Military',
  36: 'Sailing',
  37: 'Pleasure craft',
  50: 'Pilot vessel',
  51: 'Search and rescue',
  52: 'Tug',
  53: 'Port tender',
  55: 'Law enforcement',
  60: 'Passenger',
  70: 'Cargo',
  80: 'Tanker',
  90: 'Other',
};

export function parseAISMessage(rawMessage: unknown): VesselPosition | null {
  try {
    // Try position report
    const posResult = AISPositionSchema.safeParse(rawMessage);
    if (posResult.success) {
      const data = posResult.data;
      return {
        mmsi: data.MetaData.MMSI,
        name: data.MetaData.ShipName,
        ship_type: data.MetaData.ShipType 
          ? SHIP_TYPE_MAP[data.MetaData.ShipType] || 'Unknown'
          : undefined,
        lat: data.Message.PositionReport.Latitude,
        lng: data.Message.PositionReport.Longitude,
        sog: data.Message.PositionReport.Sog,
        cog: data.Message.PositionReport.Cog,
        ts: new Date(data.MetaData.time_utc),
      };
    }

    // Ship static data doesn't contain position, skip for now
    return null;
  } catch (error) {
    console.error('Failed to parse AIS message:', error);
    return null;
  }
}

// Baltic Sea bounding box for filtering
export const BALTIC_BBOX = {
  minLat: 53.5,
  maxLat: 66.0,
  minLng: 10.5,
  maxLng: 30.0,
};

export function isInBalticBBox(lat: number, lng: number): boolean {
  return (
    lat >= BALTIC_BBOX.minLat &&
    lat <= BALTIC_BBOX.maxLat &&
    lng >= BALTIC_BBOX.minLng &&
    lng <= BALTIC_BBOX.maxLng
  );
}

// Create AISStream WebSocket subscription filter
// Based on https://github.com/aisstream official examples
export function createAISStreamSubscription(apiKey: string) {
  return {
    APIKey: apiKey,
    BoundingBoxes: [
      [
        [BALTIC_BBOX.minLng, BALTIC_BBOX.minLat], 
        [BALTIC_BBOX.maxLng, BALTIC_BBOX.maxLat]
      ]
    ],
    // Optional: Filter for specific message types (PositionReport is most common)
    FilterMessageTypes: ['PositionReport', 'ShipStaticData'],
  };
}

