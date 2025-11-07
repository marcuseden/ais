# AIS Alert - Baltic Sea Vessel Tracker

A production-ready, mobile-first AIS (Automatic Identification System) vessel tracking application for the Baltic Sea region. Built with Next.js 15, Supabase, and real-time AIS data streaming.

## Features

- **Real-time Vessel Tracking**: Live AIS data from the Baltic Sea via WebSocket
- **Interactive Map**: OpenStreetMap with custom vessel markers and clustering
- **Geofencing & Alerts**: Get notified when vessels enter monitored zones
- **Mobile-First UI**: Responsive design with Claude-style minimal aesthetics
- **Authentication**: Secure email magic link authentication via Supabase
- **Real-time Updates**: 60-second polling + SSE for instant position updates

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, RLS, Realtime, Edge Functions)
- **Maps**: React-Leaflet + OpenStreetMap tiles
- **AIS Data**: AISStream WebSocket API
- **AI**: OpenAI GPT (marketing copy generation)
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- AISStream API key (optional, has free tier)
- OpenAI API key (optional, for landing page copy)

## Setup Instructions

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://tvurbkuyfwpclgoxlrab.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
OPENAI_API_KEY=your_openai_key_here
AISSTREAM_API_KEY=your_aisstream_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

### 3. Set Up Supabase Database

Run the migration file to create all tables:

\`\`\`bash
# Using Supabase CLI
supabase db push

# Or manually execute the SQL in Supabase Dashboard > SQL Editor
cat supabase/migrations/001_init.sql
\`\`\`

This creates:
- `vessels` - Current vessel positions
- `vessel_positions` - Historical position data
- `geofences` - Geographic boundaries
- `alert_rules` - User-defined alert configurations
- `alert_events` - Triggered alerts

### 4. Seed the Database

Seed the Baltic Sea geofence:

\`\`\`bash
npx tsx scripts/seed.ts
\`\`\`

This creates a system-wide geofence for the Baltic Sea region.

### 5. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add all environment variables from `.env.local`
4. Deploy!

\`\`\`bash
vercel deploy --prod
\`\`\`

### Deploy Supabase Edge Function

For automated geofence checking (runs every minute):

\`\`\`bash
supabase functions deploy check-geofences
\`\`\`

Set up a Supabase cron job or use Vercel Cron:

\`\`\`json
// vercel.json
{
  "crons": [{
    "path": "/api/_tasks/check-geofences",
    "schedule": "* * * * *"
  }]
}
\`\`\`

## Architecture

### Data Flow

1. **AIS Ingestion**: WebSocket connection to AISStream filters Baltic Sea region
2. **SSE Broadcasting**: Server-side events fan out to connected clients
3. **Database Updates**: Vessel positions upserted every N seconds
4. **Geofence Checking**: Cron job runs every minute to detect zone entries
5. **Alert Creation**: Events inserted and pushed via Supabase Realtime
6. **Client Updates**: Map updates via 60s polling + instant SSE updates

### Security

- **Row Level Security (RLS)**: All user data protected at database level
- **Authentication**: Supabase Auth with magic links
- **API Routes**: Server-side only with user verification
- **GDPR Compliance**: Only public AIS data, no personal information

## API Endpoints

- `GET /api/vessels?bbox=` - Fetch vessels in bounding box
- `GET /api/alerts` - Get user's alert rules and events
- `POST /api/alerts` - Create new alert rule
- `PATCH /api/alerts/[id]` - Update alert rule
- `DELETE /api/alerts/[id]` - Delete alert rule
- `GET /api/ais/sse` - Server-Sent Events stream for live updates
- `GET /api/_tasks/check-geofences` - Cron endpoint for geofence checking

## Data Sources

- **AIS Data**: [AISStream](https://aisstream.io) - Real-time global AIS via WebSocket
- **Map Tiles**: [OpenStreetMap](https://www.openstreetmap.org) - Free, open-source maps
- **Baltic Sea Polygon**: [Marine Regions](https://www.marineregions.org) - Geographic boundaries

## Legal & Privacy

### AIS Data Usage

AIS (Automatic Identification System) data is publicly broadcast by vessels for maritime safety. This application uses only publicly available AIS data and complies with:

- Maritime regulations
- GDPR requirements (EU)
- OpenStreetMap tile usage policy

### Owner Lookup

The `/api/owner-lookup` endpoint is a placeholder. To implement:

1. Use only official registries (IMO, flag state databases)
2. Commercial vessels only (no private boats)
3. Provide opt-in verification for voluntary contact sharing
4. Implement purpose limitation and data retention policies
5. Document legal basis under GDPR Article 6

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- AIS data provided by [AISStream](https://aisstream.io)
- Map tiles © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright)
- Built with [Next.js](https://nextjs.org), [Supabase](https://supabase.com), and [shadcn/ui](https://ui.shadcn.com)

## Support

For issues or questions, please open a GitHub issue or contact the maintainer.

---

**Note**: This is a maritime tracking application for informational purposes. Always consult official sources for navigation and safety decisions.

