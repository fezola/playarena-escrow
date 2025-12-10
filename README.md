# PlayArena - Real-Money Multiplayer Gaming Platform

A mobile-first PWA for playing classic games (Chess, Tic Tac Toe, Scrabble) with real USDC stakes on the Base blockchain.

## 🎮 Features

- **Real-Money Gaming**: Stake USDC, winner takes all (minus 5% platform fee)
- **In-App Wallets**: Custodial wallets with automatic deposit detection
- **Instant Withdrawals**: Withdraw winnings to any Ethereum address
- **Multiplayer Matches**: Create/join games, real-time sync, secure escrow
- **Social Features**: Friends, leaderboards, match history
- **Mobile PWA**: Install on any device, works offline

## 🏗️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Blockchain**: Base Mainnet (Ethereum L2)
- **Currency**: USDC (stablecoin)
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **Wallet**: viem for Ethereum interactions

## 🚀 Quick Start

### ⚠️ CRITICAL: Required Setup

**Before anything works, you MUST set these Supabase Edge Function secrets:**

1. **WALLET_ENCRYPTION_KEY** - Generate with `openssl rand -base64 32`
2. **NETWORK** - Set to `base` (or `baseSepolia` for testing)
3. **BASE_RPC_URL** - Set to `https://mainnet.base.org`

**Set them in:** Supabase Dashboard → Edge Functions → Manage Secrets

📚 **Detailed Guide:** See [`REQUIRED_SETUP_CHECKLIST.md`](REQUIRED_SETUP_CHECKLIST.md)

### Quick Setup Commands:

```bash
# 1. Generate and set encryption key
ENCRYPTION_KEY=$(openssl rand -base64 32)
echo "⚠️ BACKUP THIS KEY: $ENCRYPTION_KEY"
supabase secrets set WALLET_ENCRYPTION_KEY="$ENCRYPTION_KEY"

# 2. Set network and RPC
supabase secrets set NETWORK=base
supabase secrets set BASE_RPC_URL=https://mainnet.base.org

# 3. Verify secrets are set
supabase secrets list

# 4. Deploy Edge Functions
supabase functions deploy generate-wallet
supabase functions deploy monitor-deposits
supabase functions deploy process-withdrawal

# 5. Set up deposit monitoring cron job
# (Run SQL in Supabase Dashboard - see QUICK_START.md)

# 6. Configure frontend .env
cp .env.example .env
# Edit with your Supabase credentials

# 7. Run!
npm install
npm run dev
```

## 📚 Documentation

### 🚨 Start Here (Required)
- **[Required Setup Checklist](REQUIRED_SETUP_CHECKLIST.md)** - ⚠️ Must complete first!
- **[Setup Edge Function Secrets](SETUP_EDGE_FUNCTION_SECRETS.md)** - Critical environment variables
- **[RPC Providers Guide](RPC_PROVIDERS_GUIDE.md)** - Can't use Alchemy? See alternatives!

### Getting Started
- **[Quick Start Guide](QUICK_START.md)** - Get running in 5 minutes
- **[Complete System Overview](COMPLETE_SYSTEM_OVERVIEW.md)** - Understand the entire system

### Setup & Deployment
- **[Wallet Setup Guide](WALLET_SETUP.md)** - Complete wallet system setup
- **[Mainnet Setup Guide](MAINNET_SETUP.md)** - Deploy to Base mainnet
- **[Deployment Checklist](DEPLOYMENT_CHECKLIST.md)** - Production deployment guide

### Technical Details
- **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** - Technical implementation details
- **[Multiplayer Flow Audit](MULTIPLAYER_FLOW_AUDIT.md)** - Game flow and escrow system

## 💰 How It Works

### For Players:
1. **Sign up** → Get a free Ethereum wallet
2. **Deposit USDC** → Send to your wallet address
3. **Create/Join match** → Stake USDC (min $1)
4. **Play game** → Best of 1, 3, or 5 rounds
5. **Win** → Get 95% of pot (5% platform fee)
6. **Withdraw** → Send to any Ethereum address

### Money Flow:
```
Deposit → Wallet Balance → Stake in Match → Escrow → Winner → Withdraw
```

### Security:
- ✅ Real Ethereum wallets (secp256k1)
- ✅ AES-256-GCM encryption for private keys
- ✅ Secure escrow system
- ✅ Real blockchain transactions
- ✅ Automatic deposit detection

## 🎯 Current Status

### ✅ Fully Implemented:
- Real Ethereum wallet generation
- Automatic USDC deposit detection
- Secure withdrawal processing
- Match creation & joining
- Escrow system with platform fee
- Round/set scoring system
- Real-time multiplayer sync
- Tic Tac Toe game logic
- Transaction history
- Friends system
- Leaderboards

### ⏳ In Progress:
- Chess game logic
- Scrabble game logic
- Gas fee optimization

## 🔧 Configuration

### Base Mainnet (Production):
```
VITE_NETWORK=base
USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
RPC: https://mainnet.base.org
```

### Base Sepolia (Testing):
```
VITE_NETWORK=baseSepolia
USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
RPC: https://sepolia.base.org
```

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
