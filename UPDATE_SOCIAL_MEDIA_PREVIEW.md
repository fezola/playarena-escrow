# 🔧 Fix Social Media Preview - Show Your Logo Instead of Lovable

## 🐛 The Problem

When you share your link on social media (Twitter, Discord, WhatsApp, etc.), it's showing the **Lovable logo** instead of your PlayArena logo.

## 🔍 Why This Happens

Social media platforms need **absolute URLs** (full URLs with domain) to fetch preview images. The old meta tags were pointing to Lovable's image:
```html
<!-- OLD - Shows Lovable logo ❌ -->
<meta property="og:image" content="https://lovable.dev/opengraph-image-p98pqg.png" />
```

## ✅ What I Fixed

Updated `index.html` to use your icon with absolute URLs:
```html
<!-- NEW - Shows YOUR logo ✅ -->
<meta property="og:image" content="https://playarena.gg/icons/icon-512.png" />
<meta name="twitter:image" content="https://playarena.gg/icons/icon-512.png" />
```

## 🚨 IMPORTANT: Update Your Domain

**If your Vercel domain is NOT `playarena.gg`**, you need to update the URLs in `index.html`:

### Find Your Vercel Domain:
1. Go to your Vercel dashboard
2. Find your deployment URL (e.g., `playarena-escrow.vercel.app`)

### Update index.html:
Replace `https://playarena.gg` with your actual domain in these lines:

```html
<!-- Line 27 -->
<meta property="og:image" content="https://YOUR-DOMAIN.vercel.app/icons/icon-512.png" />

<!-- Line 28 -->
<meta property="og:image:secure_url" content="https://YOUR-DOMAIN.vercel.app/icons/icon-512.png" />

<!-- Line 33 -->
<meta property="og:url" content="https://YOUR-DOMAIN.vercel.app" />

<!-- Line 41 -->
<meta name="twitter:image" content="https://YOUR-DOMAIN.vercel.app/icons/icon-512.png" />

<!-- Line 44 -->
<link rel="canonical" href="https://YOUR-DOMAIN.vercel.app" />
```

## 🧪 How to Test

### Step 1: Deploy to Vercel
```bash
git add .
git commit -m "Fix: Update social media preview to show PlayArena logo"
git push
```

### Step 2: Clear Social Media Cache

After deploying, you need to **clear the cache** on social media platforms:

#### Facebook/WhatsApp/LinkedIn:
1. Go to: https://developers.facebook.com/tools/debug/
2. Enter your URL
3. Click "Scrape Again"
4. Should now show your icon!

#### Twitter/X:
1. Go to: https://cards-dev.twitter.com/validator
2. Enter your URL
3. Click "Preview card"
4. Should now show your icon!

#### Discord:
Discord caches aggressively. To force refresh:
1. Add `?v=1` to your URL when sharing (e.g., `https://playarena.gg/?v=1`)
2. Or wait 24 hours for cache to expire

### Step 3: Test the Preview
Share your link in:
- ✅ Twitter DM
- ✅ Discord
- ✅ WhatsApp
- ✅ Telegram
- ✅ Facebook

You should see your PlayArena icon!

## 📊 What Changed

### Before:
```html
<meta property="og:image" content="https://lovable.dev/opengraph-image-p98pqg.png" />
<meta name="twitter:image" content="https://lovable.dev/opengraph-image-p98pqg.png" />
```
**Result:** Shows Lovable logo ❌

### After:
```html
<meta property="og:image" content="https://playarena.gg/icons/icon-512.png" />
<meta property="og:image:secure_url" content="https://playarena.gg/icons/icon-512.png" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:width" content="512" />
<meta property="og:image:height" content="512" />
<meta property="og:image:alt" content="PlayArena Logo" />
<meta name="twitter:image" content="https://playarena.gg/icons/icon-512.png" />
<meta name="twitter:image:alt" content="PlayArena Logo" />
```
**Result:** Shows YOUR logo ✅

## 🎨 Optional: Create a Custom Social Media Image

For even better social media previews, create a custom 1200x630px image:

### Step 1: Create the Image
- **Size:** 1200x630px
- **Format:** PNG or JPG
- **Content:** Your logo + tagline + branding
- **Save as:** `public/og-image.png`

### Step 2: Update index.html
```html
<meta property="og:image" content="https://YOUR-DOMAIN/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:image" content="https://YOUR-DOMAIN/og-image.png" />
```

## ✅ Checklist

- [x] Updated `index.html` with absolute URLs
- [ ] Replace `playarena.gg` with your actual Vercel domain (if different)
- [ ] Deploy to Vercel
- [ ] Clear Facebook cache (https://developers.facebook.com/tools/debug/)
- [ ] Clear Twitter cache (https://cards-dev.twitter.com/validator)
- [ ] Test sharing on Discord, WhatsApp, Telegram
- [ ] Verify your logo shows instead of Lovable logo

## 🚀 Quick Fix Commands

```bash
# 1. Commit changes
git add index.html
git commit -m "Fix: Update social media preview to show PlayArena logo"

# 2. Push to deploy
git push

# 3. Wait 1-2 minutes for Vercel to deploy

# 4. Clear social media caches using the tools above
```

## 📝 Summary

**The issue:** Social media platforms were fetching Lovable's logo from their CDN.

**The fix:** Updated meta tags to use absolute URLs pointing to your icon on your domain.

**Next step:** Deploy to Vercel and clear social media caches!

**Result:** Your PlayArena logo will show when sharing links! 🎉

