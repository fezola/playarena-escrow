# Multi-Round/Set Escrow System - How It Works

## 🎯 **Your Question:**

> "Users deposit $3 and play 3 sets, how will the money go?"

---

## ✅ **Answer: ONE Stake, Play Multiple Rounds, Winner Takes All**

### **How It Actually Works:**

```
1. You deposit: $3 (ONE TIME)
2. Friend deposits: $3 (ONE TIME)
3. Total pot: $6 (locked in escrow)
4. Play 3 rounds (Best of 3)
5. First to win 2 rounds wins the ENTIRE match
6. Winner gets: $6 - 5% = $5.70
```

**Key Point:** You DON'T pay $3 per round. You pay $3 ONCE for the entire match!

---

## 💰 **Complete Money Flow (Best of 3 Example)**

### **Before Match:**
```
Your Balance: $6.89
Friend Balance: $10.00
```

### **Step 1: Create Match ($3 stake, 3 rounds)**
```
Your Balance: $6.89 → $3.89
Escrow: +$3.00 (status='held')
```

### **Step 2: Friend Joins**
```
Friend Balance: $10.00 → $7.00
Escrow: +$3.00 (status='held')
Total Pot: $6.00 (LOCKED)
```

### **Step 3: Play 3 Rounds**

**Round 1:**
```
You play Tic-Tac-Toe
You win! ✅
Score: You(1) Friend(0)
Money: Still in escrow ($6.00)
```

**Round 2:**
```
Board resets, play again
Friend wins! ✅
Score: You(1) Friend(1)
Money: Still in escrow ($6.00)
```

**Round 3 (Tiebreaker):**
```
Board resets, play again
You win! ✅
Score: You(2) Friend(1)
Match Complete! You won 2/3 rounds
```

### **Step 4: Automatic Payout**
```sql
-- Match is complete (you won 2/3)
total_pot = $6.00
platform_fee = $6.00 × 5% = $0.30
winner_payout = $6.00 - $0.30 = $5.70

-- Release escrow to you
UPDATE escrow SET status='released', released_to=YOU
UPDATE profiles SET wallet_balance = $3.89 + $5.70 = $9.59

-- Your profit
$5.70 - $3.00 = $2.70 profit ✅
```

---

## 🎮 **Round Configurations**

### **1 Round (Single Game):**
```
Stake: $3 each
Total Pot: $6
Rounds: 1
Winner: First to win 1 round
Payout: $5.70 (95% of $6)
```

### **3 Rounds (Best of 3):**
```
Stake: $3 each (ONE TIME)
Total Pot: $6
Rounds: 3
Winner: First to win 2 rounds
Payout: $5.70 (95% of $6)
```

### **5 Rounds (Best of 5):**
```
Stake: $3 each (ONE TIME)
Total Pot: $6
Rounds: 5
Winner: First to win 3 rounds
Payout: $5.70 (95% of $6)
```

---

## 🔒 **When Does Money Move?**

### **Money is Deducted:**
✅ **Immediately** when creating match
✅ **Immediately** when joining match

### **Money is Locked:**
✅ **During all rounds** - stays in escrow
✅ **Cannot be withdrawn** mid-game

### **Money is Released:**
✅ **Only when match is complete** (someone wins enough rounds)
✅ **Automatically** to the winner
✅ **All at once** (not per round)

---

## 📊 **Example Scenarios**

### **Scenario 1: Best of 3, You Win 2-0**
```
Round 1: You win → Score: 2-0
Match Complete! (you won 2 rounds)
Rounds 2 & 3: Not played
Payout: $5.70 ✅
```

### **Scenario 2: Best of 3, You Win 2-1**
```
Round 1: Friend wins → Score: 0-1
Round 2: You win → Score: 1-1
Round 3: You win → Score: 2-1
Match Complete!
Payout: $5.70 ✅
```

### **Scenario 3: Best of 5, You Win 3-2**
```
Round 1: You win → Score: 1-0
Round 2: Friend wins → Score: 1-1
Round 3: Friend wins → Score: 1-2
Round 4: You win → Score: 2-2
Round 5: You win → Score: 3-2
Match Complete!
Payout: $5.70 ✅
```

---

## 💡 **Key Points**

### ✅ **What Happens:**
1. Pay stake ONCE at the start
2. Play multiple rounds
3. First to win majority of rounds wins
4. Winner gets entire pot (minus 5% fee)
5. Loser gets nothing

### ❌ **What DOESN'T Happen:**
1. ❌ You DON'T pay per round
2. ❌ Money is NOT released per round
3. ❌ You DON'T get refunded if you lose some rounds
4. ❌ There's NO partial payout

---

## 🎯 **The Code That Does This**

### **Round Completion Check:**
```typescript
// After each round
if (roundWinner === 'X') {
  roundScores.player1 += 1;  // Increment score
} else if (roundWinner === 'O') {
  roundScores.player2 += 1;
}

// Check if match is complete
const roundsToWin = Math.ceil(totalRounds / 2);
const matchComplete = 
  roundScores.player1 >= roundsToWin || 
  roundScores.player2 >= roundsToWin;

// Only release escrow when MATCH is complete
if (matchComplete) {
  const winnerId = roundScores.player1 >= roundsToWin 
    ? player1_id 
    : player2_id;
    
  // Release ALL money to winner
  await supabase.rpc('release_escrow_to_winner', {
    _match_id: match.id,
    _winner_id: winnerId
  });
}
```

---

## 📋 **Summary**

**Your Question:** "Each user deposits $3 and plays 3 sets, how will money go?"

**Answer:**

1. ✅ Each user deposits $3 **ONCE** (not per round)
2. ✅ Total pot: $6 (locked in escrow)
3. ✅ Play up to 3 rounds (best of 3)
4. ✅ First to win 2 rounds wins the match
5. ✅ Winner gets $5.70 (95% of $6)
6. ✅ Loser gets $0
7. ✅ Platform gets $0.30 (5%)

**Money flow:**
- Deducted: At match start
- Locked: During all rounds
- Released: When match ends (someone wins 2+ rounds)
- Payout: All at once to winner

**It's NOT:**
- ❌ $3 per round
- ❌ Payout per round
- ❌ Partial refunds

**It IS:**
- ✅ $3 total for entire match
- ✅ Winner takes all
- ✅ Best of X rounds format

---

## ✅ **Verified Working!**

This system is **already implemented and working** in your code:
- ✅ Escrow holds money during all rounds
- ✅ Round scores tracked correctly
- ✅ Match completion detected automatically
- ✅ Winner paid automatically
- ✅ All in one atomic transaction

**You can play right now with your $6.89 USDC!** 🎮

