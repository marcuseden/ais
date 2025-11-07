# Twilio SMS Setup for Erik's Alerts

## Get Free Twilio Account (5 minutes)

### Step 1: Sign Up
1. Go to: **https://www.twilio.com/try-twilio**
2. Sign up (free - no credit card for trial)
3. Get **$15 free credit** for testing

### Step 2: Get Your Credentials
After signup, go to Twilio Console:
- **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Auth Token**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 3: Get a Phone Number
1. In Twilio Console → Phone Numbers
2. Click "Buy a number"
3. Search for Swedish number (+46) if available
4. Or use any number (will work with verified numbers)

### Step 4: Verify Erik's Phone
For trial accounts:
1. Go to: Phone Numbers → Verified Caller IDs
2. Add: **+46738484828**
3. Twilio sends verification code via SMS
4. Enter code to verify

### Step 5: Add to .env.local

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+46xxxxxxxxxx
```

## Quick Copy-Paste Setup

Once you have your Twilio credentials, run:

```bash
# Add Twilio credentials to .env.local
cat >> .env.local << 'EOF'
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_number_here
EOF
```

Then restart the server:
```bash
npm run dev
```

## Test SMS Manually

I've created a test script for you:

```bash
npm run test-sms
```

This will send a test message to Erik's phone to verify everything works!

## What Happens When a Vessel Enters:

```
Commercial Vessel Detected in Baltic/Kattegatt
  ↓
🔍 Auto-scrape vessel data (VesselFinder + MyShipTracking)
  ↓
✅ Save owner contact info to database
  ↓
📱 Send SMS to Erik: "Hi Erik, commercial vessel [NAME] just entered the Baltic Sea"
  ↓
📊 Log SMS in database for tracking
```

## SMS Message Format:

```
Hi Erik, commercial vessel "STENA GERMANICA" (MMSI: 265517000, Passenger) just entered the Baltic Sea.
```

## Anti-Spam Protection:

✅ Max 1 SMS per vessel per hour
✅ Only commercial vessels (cargo/tanker)
✅ Only on first entry to geofence

## Pricing:

- **SMS to Sweden**: ~$0.0075 per message
- **Free trial**: $15 = ~2,000 SMS messages
- **After trial**: Pay as you go

## Need Help?

Twilio Support: https://www.twilio.com/help

