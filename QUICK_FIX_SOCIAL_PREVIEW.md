# ⚡ QUICK FIX: Show Your Logo on Social Media

## 🎯 What You Need to Do

### Step 1: Update Your Domain in index.html

**If your Vercel URL is NOT `playarena.gg`**, open `index.html` and replace ALL instances of `https://playarena.gg` with your actual Vercel URL.

**Find your Vercel URL:**
- Go to your Vercel dashboard
- Look for your deployment URL (e.g., `https://playarena-escrow.vercel.app`)

**Replace in these lines:**
- Line 27: `<meta property="og:image" content="https://YOUR-DOMAIN/icons/icon-512.png" />`
- Line 28: `<meta property="og:image:secure_url" content="https://YOUR-DOMAIN/icons/icon-512.png" />`
- Line 33: `<meta property="og:url" content="https://YOUR-DOMAIN" />`
- Line 41: `<meta name="twitter:image" content="https://YOUR-DOMAIN/icons/icon-512.png" />`
- Line 44: `<link rel="canonical" href="https://YOUR-DOMAIN" />`

### Step 2: Deploy to Vercel

```bash
git add index.html
git commit -m "Fix: Update social media preview to show PlayArena logo"
git push
```

Wait 1-2 minutes for Vercel to deploy.

### Step 3: Clear Social Media Caches

#### Facebook/WhatsApp/LinkedIn:
1. Go to: https://developers.facebook.com/tools/debug/
2. Paste your URL
3. Click **"Scrape Again"**
4. ✅ Should show your icon!

#### Twitter/X:
1. Go to: https://cards-dev.twitter.com/validator
2. Paste your URL
3. Click **"Preview card"**
4. ✅ Should show your icon!

#### Discord:
- Add `?v=1` to your URL when sharing (e.g., `https://your-domain.vercel.app/?v=1`)
- Or wait 24 hours for cache to clear

### Step 4: Test It!

Share your link on:
- Twitter DM
- Discord
- WhatsApp
- Telegram

You should see **YOUR logo** instead of Lovable's! 🎉

## 🚨 Common Issues

### Issue: Still showing Lovable logo
**Solution:** Clear the cache using the tools above. Social media platforms cache images for 24-48 hours.

### Issue: Image not loading
**Solution:** Make sure `public/icons/icon-512.png` exists and is deployed to Vercel.

### Issue: Wrong domain
**Solution:** Double-check you replaced ALL instances of `playarena.gg` with your actual Vercel domain.

## ✅ Done!

After following these steps, your PlayArena logo will show when sharing links on social media! 🚀

