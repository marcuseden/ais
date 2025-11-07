# Get Real AIS Data - Complete Setup

## 1. Sign Up for AISStream (FREE)

1. Go to: **https://aisstream.io**
2. Click "Sign Up" - it's FREE
3. Verify your email
4. Go to Dashboard and copy your **API Key**

### Free Tier Includes:
- ✅ Up to 1,000 vessels tracked
- ✅ Baltic Sea coverage
- ✅ Real-time WebSocket stream
- ✅ Position updates every few seconds
- ✅ All commercial vessels included

## 2. Add Your API Key

Add this line to your `.env.local` file:

```bash
AISSTREAM_API_KEY=your_actual_api_key_here
```

## 3. Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## 4. How It Works

Once your API key is added:

### Automatic Updates Every Minute:
- **SWR** fetches all vessels from database every 60 seconds
- **SSE** provides instant updates when new vessels appear
- **WebSocket** continuously receives AIS data and stores in database

### What You'll See:
- 🚢 ALL cargo/freight ships in Baltic Sea
- 🛳️ Passenger ferries
- ⛴️ Tankers
- 🚤 All vessel types (configurable)

### Real-Time Features:
- Live position updates
- Speed and heading (SOG/COG)
- Vessel names and types
- Last seen timestamp

## 5. Expected Results

Within 1 minute of restarting with API key:
- You'll see **hundreds of vessels** appear on the map
- Updates every 60 seconds automatically
- New vessels added as they enter Baltic Sea
- Old vessel positions updated continuously

## 6. No API Key? Demo Mode

Without an API key, the app shows:
- Demo vessels I added (18 ships)
- Map still works perfectly
- All features functional
- Just no real-time data

## 7. Troubleshooting

**Not seeing vessels after adding key?**
```bash
# Check the terminal logs
# You should see: "Connected to AISStream"
# And: "Fetching vessels from database..."
```

**Want to see terminal logs?**
Open the terminal where `npm run dev` is running
Watch for vessel updates in real-time!

