export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      vessels: {
        Row: {
          mmsi: number
          name: string | null
          ship_type: string | null
          last_lat: number | null
          last_lng: number | null
          sog: number | null
          cog: number | null
          last_seen: string
        }
        Insert: {
          mmsi: number
          name?: string | null
          ship_type?: string | null
          last_lat?: number | null
          last_lng?: number | null
          sog?: number | null
          cog?: number | null
          last_seen?: string
        }
        Update: {
          mmsi?: number
          name?: string | null
          ship_type?: string | null
          last_lat?: number | null
          last_lng?: number | null
          sog?: number | null
          cog?: number | null
          last_seen?: string
        }
      }
      vessel_positions: {
        Row: {
          id: number
          mmsi: number | null
          lat: number
          lng: number
          sog: number | null
          cog: number | null
          ts: string
        }
        Insert: {
          id?: number
          mmsi?: number | null
          lat: number
          lng: number
          sog?: number | null
          cog?: number | null
          ts?: string
        }
        Update: {
          id?: number
          mmsi?: number | null
          lat?: number
          lng?: number
          sog?: number | null
          cog?: number | null
          ts?: string
        }
      }
      geofences: {
        Row: {
          id: string
          owner: string | null
          name: string
          region_geojson: Json
          created_at: string
        }
        Insert: {
          id?: string
          owner?: string | null
          name: string
          region_geojson: Json
          created_at?: string
        }
        Update: {
          id?: string
          owner?: string | null
          name?: string
          region_geojson?: Json
          created_at?: string
        }
      }
      alert_rules: {
        Row: {
          id: string
          owner: string | null
          name: string
          geofence_id: string | null
          created_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          owner?: string | null
          name: string
          geofence_id?: string | null
          created_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          owner?: string | null
          name?: string
          geofence_id?: string | null
          created_at?: string
          is_active?: boolean
        }
      }
      alert_events: {
        Row: {
          id: number
          rule_id: string | null
          mmsi: number
          vessel_name: string | null
          event_type: string
          event_ts: string
          details: Json | null
        }
        Insert: {
          id?: number
          rule_id?: string | null
          mmsi: number
          vessel_name?: string | null
          event_type: string
          event_ts?: string
          details?: Json | null
        }
        Update: {
          id?: number
          rule_id?: string | null
          mmsi?: number
          vessel_name?: string | null
          event_type?: string
          event_ts?: string
          details?: Json | null
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}

