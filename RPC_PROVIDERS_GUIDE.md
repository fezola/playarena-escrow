# Base Network RPC Providers Guide

## 🎯 Quick Answer

**Can't login to Alchemy?** No problem! Use one of these alternatives:

### **Easiest (No Signup):**
```bash
# Ankr - Free, no signup, better than public RPC
supabase secrets set BASE_RPC_URL=https://rpc.ankr.com/base
```

### **Public RPC (Backup):**
```bash
# Official Base RPC - Free, no signup
supabase secrets set BASE_RPC_URL=https://mainnet.base.org
```

---

## 📊 All RPC Provider Options

### **Option 1: Public Base RPC** ⭐ Simplest

**URL:** `https://mainnet.base.org`

**Setup:**
```bash
supabase secrets set BASE_RPC_URL=https://mainnet.base.org
```

**Pros:**
- ✅ Completely free
- ✅ No signup required
- ✅ Works immediately
- ✅ Official Base endpoint

**Cons:**
- ⚠️ Rate limited
- ⚠️ May be slow with high traffic
- ⚠️ No guaranteed uptime

**Best for:** Testing, MVP, low-traffic apps

---

### **Option 2: Ankr** ⭐ Recommended Free Option

**URL:** `https://rpc.ankr.com/base`

**Setup:**
```bash
supabase secrets set BASE_RPC_URL=https://rpc.ankr.com/base
```

**Pros:**
- ✅ Completely free
- ✅ No signup required
- ✅ Better reliability than public RPC
- ✅ Higher rate limits
- ✅ Multiple regions

**Cons:**
- ⚠️ Still has rate limits (but higher)

**Best for:** Production apps (free tier), better than public RPC

**Testnet:**
```bash
supabase secrets set BASE_RPC_URL=https://rpc.ankr.com/base_sepolia
```

---

### **Option 3: Infura** ⭐ Professional Option

**URL:** `https://base-mainnet.infura.io/v3/YOUR_API_KEY`

**Setup:**
1. Sign up at https://infura.io
2. Create new project
3. Select "Base" network
4. Copy API key
5. Set secret:
```bash
supabase secrets set BASE_RPC_URL=https://base-mainnet.infura.io/v3/YOUR_API_KEY
```

**Pros:**
- ✅ Free tier: 100,000 requests/day
- ✅ Excellent reliability
- ✅ Fast response times
- ✅ 99.9% uptime SLA
- ✅ Professional support

**Cons:**
- ⚠️ Requires signup
- ⚠️ Paid plans for higher usage

**Best for:** Production apps with moderate traffic

**Testnet:**
```bash
supabase secrets set BASE_RPC_URL=https://base-sepolia.infura.io/v3/YOUR_API_KEY
```

---

### **Option 4: QuickNode**

**URL:** `https://your-endpoint.base.quiknode.pro/YOUR_TOKEN/`

**Setup:**
1. Sign up at https://www.quicknode.com
2. Create new endpoint
3. Select "Base" network
4. Copy endpoint URL
5. Set secret:
```bash
supabase secrets set BASE_RPC_URL=https://your-endpoint.base.quiknode.pro/YOUR_TOKEN/
```

**Pros:**
- ✅ Free tier available
- ✅ Very fast
- ✅ Excellent reliability
- ✅ Good documentation
- ✅ Professional support

**Cons:**
- ⚠️ Requires signup
- ⚠️ Free tier limited

**Best for:** Production apps, need speed

---

### **Option 5: Coinbase Cloud** (Base's Official Provider)

**URL:** `https://api.developer.coinbase.com/rpc/v1/base/YOUR_API_KEY`

**Setup:**
1. Sign up at https://www.coinbase.com/cloud
2. Create Base endpoint
3. Copy API key
4. Set secret:
```bash
supabase secrets set BASE_RPC_URL=https://api.developer.coinbase.com/rpc/v1/base/YOUR_API_KEY
```

**Pros:**
- ✅ Official Base provider (Coinbase built Base)
- ✅ Excellent reliability
- ✅ Direct support from Base team
- ✅ Free tier available

**Cons:**
- ⚠️ Requires signup
- ⚠️ May require Coinbase account

**Best for:** Production apps, want official support

---

### **Option 6: Blast API**

**URL:** `https://base-mainnet.public.blastapi.io`

**Setup:**
```bash
supabase secrets set BASE_RPC_URL=https://base-mainnet.public.blastapi.io
```

**Pros:**
- ✅ Free
- ✅ No signup required
- ✅ RPC aggregator (uses multiple providers)

**Cons:**
- ⚠️ Rate limited

**Best for:** Backup option, testing

**Testnet:**
```bash
supabase secrets set BASE_RPC_URL=https://base-sepolia.public.blastapi.io
```

---

## 🎯 Recommendations

### For Testing/Development:
**Use Public Base RPC:**
```bash
supabase secrets set BASE_RPC_URL=https://mainnet.base.org
```
- No signup needed
- Works immediately
- Good enough for testing

### For Production (Free):
**Use Ankr:**
```bash
supabase secrets set BASE_RPC_URL=https://rpc.ankr.com/base
```
- No signup needed
- Better than public RPC
- Free forever
- Good for production

### For Production (Professional):
**Use Infura or QuickNode:**
```bash
# Infura
supabase secrets set BASE_RPC_URL=https://base-mainnet.infura.io/v3/YOUR_API_KEY

# Or QuickNode
supabase secrets set BASE_RPC_URL=https://your-endpoint.base.quiknode.pro/YOUR_TOKEN/
```
- Professional reliability
- Better support
- Higher rate limits

---

## 📋 Quick Setup Guide

### If Alchemy Won't Work:

**Step 1: Choose a provider**
- **Easiest:** Ankr (no signup)
- **Professional:** Infura (requires signup)

**Step 2: Set the secret**
```bash
# For Ankr (no signup needed)
supabase secrets set BASE_RPC_URL=https://rpc.ankr.com/base

# Or for Infura (after signing up)
supabase secrets set BASE_RPC_URL=https://base-mainnet.infura.io/v3/YOUR_API_KEY
```

**Step 3: Verify**
```bash
supabase secrets list
```

**Step 4: Redeploy functions**
```bash
supabase functions deploy monitor-deposits
supabase functions deploy process-withdrawal
```

**Done!** ✅

---

## 🧪 Test Your RPC Connection

After setting up, test it works:

```bash
# Test deposit monitoring
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/monitor-deposits \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

Expected response:
```json
{
  "success": true,
  "walletsChecked": 0,
  "depositsDetected": 0
}
```

If you get this, your RPC is working! ✅

---

## ❌ Troubleshooting

### Error: "RPC request failed"

**Try these in order:**

1. **Switch to Ankr:**
```bash
supabase secrets set BASE_RPC_URL=https://rpc.ankr.com/base
```

2. **Try public RPC:**
```bash
supabase secrets set BASE_RPC_URL=https://mainnet.base.org
```

3. **Check network:**
```bash
curl https://mainnet.base.org
```
Should return JSON response.

4. **Redeploy functions:**
```bash
supabase functions deploy monitor-deposits
supabase functions deploy process-withdrawal
```

---

## 📊 Comparison Table

| Provider | Free? | Signup? | Rate Limit | Speed | Reliability | Best For |
|----------|-------|---------|------------|-------|-------------|----------|
| **Public Base** | ✅ | ❌ | Low | Medium | Medium | Testing |
| **Ankr** | ✅ | ❌ | Medium | Good | Good | Production (free) |
| **Infura** | ✅ Tier | ✅ | 100k/day | Fast | Excellent | Production |
| **QuickNode** | ✅ Tier | ✅ | Varies | Very Fast | Excellent | Production |
| **Coinbase Cloud** | ✅ Tier | ✅ | Varies | Fast | Excellent | Official support |
| **Blast API** | ✅ | ❌ | Low | Medium | Good | Backup |

---

## ✅ Final Recommendation

**Can't use Alchemy? Use Ankr!**

```bash
supabase secrets set BASE_RPC_URL=https://rpc.ankr.com/base
```

**Why Ankr?**
- ✅ No signup required
- ✅ Better than public RPC
- ✅ Free forever
- ✅ Good enough for production
- ✅ Works immediately

**Done!** You're all set. 🚀

