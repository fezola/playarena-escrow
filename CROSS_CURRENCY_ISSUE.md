# ⚠️ CRITICAL: Cross-Currency Match Issue

## 🚨 **Problem Identified**

**Your Question:** "What if a user has USDT and others has USDC, can they still play together?"

**Current Status:** ❌ **NOT SAFE - NEEDS FIX**

---

## ⚠️ **What's Wrong**

### **Current Behavior:**
```
User A creates match:
- Stake: $5 USDC
- Currency: USDC
- Match created ✅

User B joins match:
- Has: $5 USDT (not USDC!)
- System deducts: $5 USDT ❌
- Match starts with mixed currencies ❌❌❌
```

### **The Problem:**
1. ❌ User A deposited USDC
2. ❌ User B deposited USDT
3. ❌ Escrow has mixed currencies
4. ❌ Winner gets paid in... what currency? 🤔
5. ❌ **BROKEN!**

---

## ✅ **How It SHOULD Work**

### **Option 1: Same Currency Only (Recommended)**
```
User A creates match:
- Stake: $5 USDC
- Currency: USDC
- Match created ✅

User B tries to join:
- Has: $5 USDT
- System checks: Match currency = USDC
- User B has USDT, not USDC
- ❌ BLOCKED: "This match requires USDC. You have USDT."
```

### **Option 2: Currency Conversion (Complex)**
```
User A creates match:
- Stake: $5 USDC
- Currency: USDC

User B joins:
- Has: $5 USDT
- System converts: USDT → USDC (using exchange rate)
- Deducts: $5 USDT
- Adds to escrow: $5 USDC equivalent
- ✅ Works but complex
```

---

## 🔧 **Recommended Solution: Same Currency Only**

### **Why:**
- ✅ Simple and safe
- ✅ No exchange rate issues
- ✅ No conversion fees
- ✅ Clear for users
- ✅ Easy to implement

### **How It Works:**
```
Match Creation:
- User selects currency: [BASE] [USDC] [USDT]
- Match is created with that currency
- Only users with that currency can join

Match Joining:
- System checks: Does user have enough of THAT currency?
- If yes: Allow join
- If no: Block with clear message
```

---

## 💡 **Implementation Plan**

### **Step 1: Add Currency Selector to Match Creation**
```typescript
// CreateMatch.tsx
const [currency, setCurrency] = useState<'BASE' | 'USDC' | 'USDT'>('USDC');

// When creating match
await supabase.from('matches').insert({
  game_type: gameType,
  stake_amount: stakeAmount,
  currency: currency,  // ← Add this
  ...
});
```

### **Step 2: Check Currency When Joining**
```typescript
// JoinByCodeDialog.tsx
const match = invite.matches;

// Check if user has enough of the MATCH currency
let userBalance = 0;
if (match.currency === 'USDC') {
  userBalance = profile.wallet_balance || 0;
} else if (match.currency === 'BASE') {
  userBalance = profile.base_balance || 0;
} else if (match.currency === 'USDT') {
  userBalance = profile.usdt_balance || 0;
}

if (userBalance < match.stake_amount) {
  toast({
    title: 'Insufficient balance',
    description: `You need $${match.stake_amount} ${match.currency}. You have $${userBalance.toFixed(2)} ${match.currency}.`,
    variant: 'destructive',
  });
  return;
}
```

### **Step 3: Deduct from Correct Balance**
```typescript
// Deduct from the correct currency balance
const updateData: any = {};
if (match.currency === 'USDC') {
  updateData.wallet_balance = userBalance - match.stake_amount;
} else if (match.currency === 'BASE') {
  updateData.base_balance = userBalance - match.stake_amount;
} else if (match.currency === 'USDT') {
  updateData.usdt_balance = userBalance - match.stake_amount;
}

await supabase
  .from('profiles')
  .update(updateData)
  .eq('id', profile.id);
```

### **Step 4: Update Escrow to Track Currency**
```sql
-- Add currency to escrow table
ALTER TABLE public.escrow
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USDC';
```

### **Step 5: Update Payout Function**
```sql
-- release_escrow_to_winner function
-- Pay winner in the SAME currency as the match
UPDATE profiles
SET 
  wallet_balance = CASE WHEN currency = 'USDC' THEN wallet_balance + payout ELSE wallet_balance END,
  base_balance = CASE WHEN currency = 'BASE' THEN base_balance + payout ELSE base_balance END,
  usdt_balance = CASE WHEN currency = 'USDT' THEN usdt_balance + payout ELSE usdt_balance END
WHERE id = winner_id;
```

---

## 🎯 **User Experience**

### **Creating Match:**
```
┌─────────────────────────────────────┐
│ Create Match                        │
├─────────────────────────────────────┤
│ Game: Tic-Tac-Toe                   │
│ Stake: $5                           │
│                                     │
│ Currency:                           │
│ ○ BASE  ($4.58 available)           │
│ ● USDC  ($6.89 available)           │
│ ○ USDT  ($0.00 available)           │
│                                     │
│ [Create Match]                      │
└─────────────────────────────────────┘
```

### **Joining Match:**
```
Match Details:
- Stake: $5 USDC
- Your USDC: $6.89 ✅
- Your USDT: $10.00 (not needed)

[Join Match] ← Works!
```

```
Match Details:
- Stake: $5 USDC
- Your USDC: $2.00 ❌
- Your USDT: $10.00 (can't use)

❌ Insufficient USDC balance
You need $5 USDC but only have $2 USDC
```

---

## ⚠️ **Current Risk**

**Without this fix:**
- ❌ Users can join with wrong currency
- ❌ Escrow gets mixed currencies
- ❌ Payouts might fail
- ❌ Money could be lost
- ❌ **CRITICAL BUG!**

**With this fix:**
- ✅ Users can only join with correct currency
- ✅ Escrow has single currency per match
- ✅ Payouts work correctly
- ✅ Clear user experience
- ✅ **SAFE!**

---

## 📋 **Action Items**

1. ✅ Add currency selector to match creation
2. ✅ Validate currency when joining
3. ✅ Deduct from correct balance
4. ✅ Update escrow to track currency
5. ✅ Update payout function for multi-currency
6. ✅ Show currency in match listings
7. ✅ Test thoroughly

---

## 🎯 **Summary**

**Question:** "Can user with USDT play with user with USDC?"

**Answer:** **NO - And we need to prevent this!**

**Why:**
- Different currencies can't mix in same match
- Would break escrow and payouts
- Confusing for users

**Solution:**
- Match has ONE currency
- Only users with THAT currency can join
- Clear error messages
- Simple and safe

**Status:** ❌ **NEEDS IMPLEMENTATION**

**Priority:** 🔴 **CRITICAL** (before real money is used!)

---

Want me to implement this fix now?

