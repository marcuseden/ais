# Quick Setup Guide

## 1. Create .env.local File

Create a `.env.local` file in the project root with your credentials:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://tvurbkuyfwpclgoxlrab.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dXJia3V5ZndwY2xnb3hscmFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1Mzc2MzUsImV4cCI6MjA3ODExMzYzNX0.IMEx3Iml1V4p_0gszURvyrnsWVDca8SteISzolEGJnk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dXJia3V5ZndwY2xnb3hscmFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUzNzYzNSwiZXhwIjoyMDc4MTEzNjM1fQ.ZdBlUoqEMQE9UPMi12-R2qLNHMx_RJat42rsCPOZIu8
OPENAI_API_KEY=sk-your-key-here
AISSTREAM_API_KEY=your-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

## 2. Set Up Supabase Database

Go to your Supabase Dashboard → SQL Editor and run the migration:

\`\`\`bash
# Copy and paste the contents of:
cat supabase/migrations/001_init.sql
\`\`\`

Or if you have Supabase CLI installed:

\`\`\`bash
supabase db push
\`\`\`

## 3. Seed the Baltic Sea Geofence

\`\`\`bash
npm run seed
\`\`\`

This creates the system-wide Baltic Sea monitoring zone.

## 4. Enable Supabase Auth

In your Supabase Dashboard:

1. Go to **Authentication → Providers**
2. Enable **Email** provider
3. Configure email templates (optional)
4. Add your site URL (`http://localhost:3000`) to **URL Configuration → Site URL**
5. Add `http://localhost:3000/auth/callback` to **Redirect URLs**

## 5. Run the Development Server

\`\`\`bash
npm run dev
\`\`\`

Visit [http://localhost:3000](http://localhost:3000)

## 6. Create Your First User

1. Go to `/login`
2. Enter your email
3. Check your email for the magic link
4. Click the link to authenticate

## 7. Optional: Get AIS Data

For real AIS data, sign up at [AISStream.io](https://aisstream.io):

1. Create a free account
2. Get your API key
3. Add it to `.env.local` as `AISSTREAM_API_KEY`

Without an AIS key, the map will still work but won't show real-time vessels.

## 8. Deploy to Vercel

\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel Dashboard
# Then deploy to production
vercel --prod
\`\`\`

## 9. Set Up Cron Job

The geofence checker needs to run every minute. Two options:

### Option A: Vercel Cron (Recommended)

Already configured in `vercel.json`. Will work automatically on Vercel Pro plan.

### Option B: Supabase Edge Function

\`\`\`bash
# Deploy the edge function
supabase functions deploy check-geofences

# Set up a cron trigger in Supabase Dashboard
# Or use an external cron service to hit the function URL
\`\`\`

## Troubleshooting

### Leaflet CSS Not Loading

Make sure `leaflet/dist/leaflet.css` is imported in `src/app/globals.css`.

### WebSocket Connection Fails

The AIS SSE endpoint will work in Node.js runtime. If deploying to Vercel Edge, you may need to adjust the runtime or use a separate service for WebSocket handling.

### Authentication Redirect Issues

Ensure your site URL and redirect URLs are correctly configured in Supabase Dashboard → Authentication → URL Configuration.

### Database Permission Errors

Check that RLS policies are properly set up by running the migration file.

## Next Steps

1. Customize the Baltic Sea geofence polygon in `src/lib/baltic.geojson`
2. Add more geofences through the UI (feature to be implemented)
3. Set up email notifications for alerts
4. Add user profile management
5. Implement vessel search and filtering
6. Add clustering for dense vessel areas

## Support

For issues, check the main README.md or open a GitHub issue.

