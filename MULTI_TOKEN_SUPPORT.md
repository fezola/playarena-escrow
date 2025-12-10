# Multi-Token Support Implementation

## ✅ **Good News: Your $5 ETH is Perfect!**

You can now use ETH to play games! We'll add support for:
- ✅ **ETH (Base)** - Native token (what you have!)
- ✅ **USDC** - Stablecoin
- ✅ **USDT** - Stablecoin

## 🎯 **What Needs to Change**

### **1. Database** ✅ Already Ready!
- `currency` field exists in `transactions` table
- `currency` field exists in `escrow` table
- Just need to track multiple balances

### **2. Profile Balances**
Need to add separate balance fields for each token:
- `wallet_balance` → Keep for USDC
- `eth_balance` → Add for ETH
- `usdt_balance` → Add for USDT

### **3. Match Creation**
Allow users to choose which token to stake:
- Select token (ETH/USDC/USDT)
- Check balance for that specific token
- Deduct from correct balance

### **4. Deposit Monitoring**
Monitor all 3 tokens:
- ETH balance (native)
- USDC balance (ERC20)
- USDT balance (ERC20)

### **5. Withdrawals**
Support withdrawing any token:
- ETH withdrawals (native transfer)
- USDC withdrawals (ERC20 transfer)
- USDT withdrawals (ERC20 transfer)

## 📊 **Token Addresses on Base**

| Token | Address | Decimals |
|-------|---------|----------|
| **ETH** | Native (0x0) | 18 |
| **USDC** | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | 6 |
| **USDT** | `0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2` | 6 |

## 🚀 **Implementation Plan**

### **Phase 1: Add Balance Fields** (Quick)
```sql
ALTER TABLE profiles 
ADD COLUMN eth_balance DECIMAL DEFAULT 0,
ADD COLUMN usdt_balance DECIMAL DEFAULT 0;
```

### **Phase 2: Update Deposit Monitoring** (Medium)
- Check ETH balance (native)
- Check USDC balance (existing)
- Check USDT balance (new)
- Update correct balance field

### **Phase 3: Update Match Creation** (Medium)
- Add currency selector
- Check correct balance
- Deduct from correct balance
- Store currency in match/escrow

### **Phase 4: Update Withdrawals** (Medium)
- Support ETH withdrawals
- Support USDC withdrawals (existing)
- Support USDT withdrawals

## 💡 **Quick Fix for Your $5 ETH**

**Option 1: Manual Update (Fastest)**
Run this SQL in Supabase:
```sql
-- Add ETH balance column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS eth_balance DECIMAL DEFAULT 0;

-- Update your balance manually
UPDATE profiles 
SET eth_balance = 0.00166  -- Your ~$5 worth
WHERE wallet_address = '0x7bf933dd6bacc4319c326c919f271213ebcd6bb6';
```

**Option 2: Auto-Detect (Better)**
Update deposit monitoring to check ETH balance too.

## 🎮 **User Experience**

### **Before (USDC Only):**
```
Balance: $0 USDC
Can't play ❌
```

### **After (Multi-Token):**
```
Balances:
- ETH: $5.00
- USDC: $0.00
- USDT: $0.00

Create Match:
- Choose token: [ETH] [USDC] [USDT]
- Stake: $25 in ETH ✅
```

## ⚡ **Quick Implementation**

Want me to:
1. ✅ Add ETH/USDT balance columns
2. ✅ Update deposit monitoring for all 3 tokens
3. ✅ Add token selector to match creation
4. ✅ Update withdrawals for all tokens
5. ✅ Manually credit your $5 ETH

**This will take ~30 minutes to implement.**

Ready to proceed?

