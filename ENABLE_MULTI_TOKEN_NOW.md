# Enable Multi-Token Support NOW

## 🚀 Quick Setup (3 Steps)

### **Step 1: Run This SQL in Supabase Dashboard**

Go to Supabase Dashboard → SQL Editor → New Query

```sql
-- Add ETH and USDT balance columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS eth_balance DECIMAL(18, 6) DEFAULT 0,
ADD COLUMN IF NOT EXISTS usdt_balance DECIMAL(18, 6) DEFAULT 0;

-- Add currency to matches
ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USDC' CHECK (currency IN ('ETH', 'USDC', 'USDT'));

-- Update existing matches
UPDATE public.matches SET currency = 'USDC' WHERE currency IS NULL;

-- Credit your ETH balance (your $5 ETH)
UPDATE public.profiles 
SET eth_balance = 0.00166
WHERE wallet_address = '0x7bf933dd6bacc4319c326c919f271213ebcd6bb6';

-- Verify it worked
SELECT 
  wallet_address,
  wallet_balance as usdc_balance,
  eth_balance,
  usdt_balance
FROM public.profiles 
WHERE wallet_address = '0x7bf933dd6bacc4319c326c919f271213ebcd6bb6';
```

**Expected output:**
```
wallet_address: 0x7bf933dd6bacc4319c326c919f271213ebcd6bb6
usdc_balance: 0
eth_balance: 0.00166
usdt_balance: 0
```

---

### **Step 2: Update Frontend to Show All Balances**

Your profile should now show:
- ETH Balance: $5.00
- USDC Balance: $0.00  
- USDT Balance: $0.00

---

### **Step 3: Allow Token Selection in Match Creation**

Users can choose which token to stake when creating a match.

---

## ✅ **What This Enables**

### **Before:**
```
Balance: $0 USDC
Can't create match ❌
```

### **After:**
```
Balances:
- ETH: $5.00 ✅
- USDC: $0.00
- USDT: $0.00

Create Match:
Choose currency: [ETH] [USDC] [USDT]
Stake: $25 in ETH ✅
```

---

## 📊 **Token Addresses (For Reference)**

| Token | Base Mainnet Address | Decimals |
|-------|---------------------|----------|
| **ETH** | Native (no address) | 18 |
| **USDC** | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | 6 |
| **USDT** | `0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2` | 6 |

---

## 🔄 **Updated Deposit Monitoring**

The deposit monitoring function will now check:
1. ✅ ETH balance (native)
2. ✅ USDC balance (ERC20)
3. ✅ USDT balance (ERC20)

And update the correct balance field.

---

## 💰 **Your Current Situation**

**Your wallet:** `0x7bf933dd6bacc4319c326c919f271213ebcd6bb6`

**Current balances:**
- ETH: 0.00166 (~$5) ✅ **Can play with this!**
- USDC: 0
- USDT: 0

**After running the SQL above:**
- ✅ Database will show your ETH balance
- ✅ You can create matches with ETH
- ✅ You can play games with your $5 ETH

---

## 🎮 **How to Play with ETH**

1. Run the SQL above to credit your ETH balance
2. Go to Create Match
3. Select "ETH" as currency
4. Set stake amount (e.g., $5)
5. Create match
6. Friend joins with ETH
7. Play and win! 🎉

---

## ⚡ **Next: Update Frontend**

I'll update the frontend to:
1. Show all 3 token balances
2. Add currency selector to match creation
3. Update deposit/withdrawal UI for multi-token

**Ready to proceed with frontend updates?**

