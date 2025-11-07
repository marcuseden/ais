# Project Structure

## Overview

Complete production-ready AIS vessel tracker with all features implemented.

## Directory Structure

\`\`\`
AIS-Alert/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx          # Magic link authentication page
│   │   │   └── callback/route.ts       # Auth callback handler
│   │   ├── app/
│   │   │   ├── map/page.tsx            # Main map interface
│   │   │   ├── alerts/page.tsx         # Alert management
│   │   │   └── settings/page.tsx       # User settings
│   │   ├── api/
│   │   │   ├── vessels/route.ts        # Vessel data API
│   │   │   ├── alerts/
│   │   │   │   ├── route.ts            # Alert CRUD
│   │   │   │   └── [id]/route.ts       # Individual alert operations
│   │   │   ├── ais/
│   │   │   │   └── sse/route.ts        # Server-Sent Events stream
│   │   │   └── _tasks/
│   │   │       └── check-geofences/    # Cron geofence checker
│   │   │           └── route.ts
│   │   ├── page.tsx                     # Landing page with OpenAI copy
│   │   ├── layout.tsx                   # Root layout
│   │   └── globals.css                  # Global styles + Leaflet
│   ├── components/
│   │   ├── ui/                          # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── toast.tsx
│   │   │   └── toaster.tsx
│   │   ├── map/
│   │   │   └── MapView.tsx              # React-Leaflet map component
│   │   └── VesselList.tsx               # Vessel list with search
│   ├── lib/
│   │   ├── supabase.ts                  # Browser Supabase client
│   │   ├── supabaseAdmin.ts             # Server Supabase client
│   │   ├── database.types.ts            # TypeScript database types
│   │   ├── ais.ts                       # AIS message parsers
│   │   ├── geo.ts                       # Geospatial utilities
│   │   ├── utils.ts                     # UI utilities
│   │   └── baltic.geojson               # Baltic Sea polygon
│   ├── hooks/
│   │   ├── use-toast.ts                 # Toast notification hook
│   │   └── useSSE.ts                    # Server-Sent Events hook
│   └── middleware.ts                    # Auth protection middleware
├── supabase/
│   ├── migrations/
│   │   └── 001_init.sql                 # Complete database schema
│   └── functions/
│       └── check-geofences/
│           └── index.ts                 # Supabase Edge Function
├── scripts/
│   └── seed.ts                          # Database seeding script
├── public/                              # Static assets
├── .env.local.example                   # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── postcss.config.mjs
├── vercel.json                          # Vercel cron configuration
├── README.md                            # Complete documentation
├── SETUP.md                             # Quick setup guide
└── PROJECT_STRUCTURE.md                 # This file
\`\`\`

## Key Features Implemented

### ✅ Core Features
- [x] Next.js 15 with App Router and TypeScript
- [x] Supabase authentication with magic links
- [x] PostgreSQL database with RLS
- [x] Real-time AIS data via WebSocket
- [x] Server-Sent Events for live updates
- [x] 60-second polling + instant SSE updates
- [x] Baltic Sea geofencing
- [x] Alert system with events tracking
- [x] OpenStreetMap integration
- [x] React-Leaflet map with custom markers

### ✅ UI/UX
- [x] Mobile-first responsive design
- [x] Claude-style minimal aesthetics
- [x] Tailwind CSS + shadcn/ui
- [x] Toast notifications
- [x] Bottom sheet for mobile
- [x] Vessel search and filtering
- [x] Interactive map popups

### ✅ Backend
- [x] RESTful API routes
- [x] Row Level Security (RLS)
- [x] Geofence checking logic
- [x] Cron job endpoint
- [x] Edge function for Supabase
- [x] AIS message parsing
- [x] Geospatial calculations with Turf.js

### ✅ Deployment
- [x] Vercel-ready configuration
- [x] Environment variable setup
- [x] Database migration files
- [x] Seed scripts
- [x] Comprehensive documentation

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, React 18, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui, class-variance-authority |
| **Backend** | Next.js API Routes, Supabase Edge Functions |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | Supabase Auth (magic links) |
| **Maps** | React-Leaflet, OpenStreetMap |
| **AIS Data** | AISStream WebSocket API |
| **Real-time** | Server-Sent Events, SWR |
| **AI** | OpenAI GPT (marketing copy) |
| **Geospatial** | Turf.js, GeoJSON |
| **Deployment** | Vercel |
| **Cron** | Vercel Cron / Supabase Functions |

## Database Schema

### Tables
- `vessels` - Current vessel positions (MMSI as PK)
- `vessel_positions` - Historical tracking data
- `geofences` - User and system geofences (GeoJSON)
- `alert_rules` - User-configured alerts
- `alert_events` - Triggered alert history

### Security
- Row Level Security (RLS) on all tables
- User can only access their own alerts and events
- Vessels readable by all authenticated users
- System geofences (owner = null) readable by all

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vessels?bbox=` | Fetch vessels in bounding box |
| GET | `/api/alerts` | Get user's rules and events |
| POST | `/api/alerts` | Create new alert rule |
| PATCH | `/api/alerts/[id]` | Update alert rule |
| DELETE | `/api/alerts/[id]` | Delete alert rule |
| GET | `/api/ais/sse` | SSE stream for live updates |
| GET | `/api/_tasks/check-geofences` | Cron geofence checker |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Optional |
| `AISSTREAM_API_KEY` | AISStream API key | Optional |
| `NEXT_PUBLIC_APP_URL` | App URL | Yes |

## Getting Started

1. Install dependencies: `npm install`
2. Create `.env.local` with credentials
3. Run database migration in Supabase
4. Seed Baltic geofence: `npm run seed`
5. Start dev server: `npm run dev`
6. Visit http://localhost:3000

See SETUP.md for detailed instructions.

## Deployment

### Vercel
\`\`\`bash
vercel deploy --prod
\`\`\`

### Supabase Edge Function
\`\`\`bash
supabase functions deploy check-geofences
\`\`\`

## Testing Checklist

- [ ] Landing page loads with marketing copy
- [ ] Login flow works (magic link)
- [ ] Map displays with OpenStreetMap tiles
- [ ] Vessels appear on map (if AIS data available)
- [ ] Search filters vessels
- [ ] Alert rules can be toggled
- [ ] Settings page displays user info
- [ ] Sign out redirects to home
- [ ] Mobile responsive design works
- [ ] Toast notifications appear

## Production Considerations

### Performance
- Vessel data cached with 60s refresh
- SSE for instant updates without polling
- Indexed database queries
- Proper Next.js caching strategies

### Security
- RLS enforced on all tables
- Service role key never exposed to client
- CORS configured properly
- Rate limiting recommended for production

### Scalability
- Consider Redis for vessel state cache
- Add database read replicas for high traffic
- Implement proper WebSocket scaling
- Use CDN for static assets

### Monitoring
- Add error tracking (Sentry)
- Monitor API response times
- Track AIS data freshness
- Alert on geofence check failures

## License

MIT License - see LICENSE file for details.

