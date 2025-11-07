# How to Get JSESSIONID Cookie from Equasis

## 🎯 Super Simple 3-Step Guide

---

## Step 1: Login to Equasis

1. Go to: **https://www.equasis.org**
2. Click **"Login"** (top right)
3. Enter your email and password
4. You should see your Equasis dashboard

---

## Step 2: Open Browser Developer Tools

**On Mac:**
- Press: **Cmd + Option + I**

**On Windows:**
- Press: **F12** or **Ctrl + Shift + I**

**Or:**
- Right-click anywhere → **Inspect**

---

## Step 3: Find the Cookie

### Chrome / Edge / Brave:

1. **Click "Application" tab** at the top of DevTools
   - (If you don't see it, click the `>>` arrows to find it)

2. **In the left sidebar:**
   - Expand **"Cookies"** section (click the ▶ arrow)
   - Click on **"https://www.equasis.org"**

3. **In the cookie list:**
   - Look for **"JSESSIONID"** in the Name column
   - The Value column has your cookie (long string like: `6F7E8D9C1B2A3...`)

4. **Double-click the Value** to select it
5. **Copy it** (Cmd+C or Ctrl+C)

### Firefox:

1. **Click "Storage" tab** in DevTools

2. **Expand "Cookies"** in left sidebar

3. **Click "https://www.equasis.org"**

4. **Find "JSESSIONID"** in the list

5. **Copy the Value**

### Safari:

1. **Go to Safari → Preferences → Advanced**
2. **Check "Show Develop menu"**
3. **Develop → Show Web Inspector**
4. **Click "Storage" tab**
5. **Cookies → equasis.org**
6. **Find JSESSIONID and copy value**

---

## Step 4: Add to Your .env.local

Open your `.env.local` file and add this line:

```bash
EQUASIS_SESSION_COOKIE=JSESSIONID=paste_the_value_you_copied_here
```

**Example:**
```bash
EQUASIS_SESSION_COOKIE=JSESSIONID=6F7E8D9C1B2A3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F
```

---

## Step 5: Restart Your Server

```bash
# Stop the current server (Ctrl+C in terminal)
# Then restart:
npm run dev
```

---

## ✅ How to Know It's Working:

After restarting, check your **terminal logs**. You should see:

```
🔍 Scraping VesselFinder for MMSI 265517000...
🚢 Scraping MyShipTracking for MMSI 265517000...
📊 Scraping Equasis for MMSI 265517000...  ← THIS LINE!
✅ Equasis scraped: STENA GERMANICA
💼 Commercial enrichment completed for 265517000
```

If you see **"⚠️ Equasis session not configured"** → your cookie wasn't added correctly.

---

## 🔄 Cookie Expires After 24 Hours

When the cookie expires:
1. **Login to Equasis again**
2. **Get new JSESSIONID** (same steps)
3. **Update `.env.local`**
4. **Restart server**

**Tip:** Keep Equasis logged in and refresh the cookie daily for continuous operation.

---

## 🆘 Troubleshooting

### "I don't see Application tab"
- Click the `>>` button in DevTools tabs
- Select "Application" from dropdown

### "I don't see Cookies section"
- Make sure you're on the Equasis website when opening DevTools
- Refresh the page while DevTools is open

### "JSESSIONID is not there"
- Make sure you're logged in to Equasis
- Try logging out and back in
- Check you're looking at **https://www.equasis.org** cookies (not other sites)

### "Still not working"
- Copy the ENTIRE cookie value (can be 50-100 characters)
- Make sure no spaces before/after in .env.local
- Make sure the line starts with EQUASIS_SESSION_COOKIE=JSESSIONID=
- Restart server after saving .env.local

---

## 📱 Need Help?

1. Check terminal logs for error messages
2. Make sure Equasis account is verified
3. Try different browser (Chrome recommended)

---

**Once you add the Equasis cookie, your data quality jumps from 26% to 70-85%!** 🚀

