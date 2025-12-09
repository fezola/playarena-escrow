import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { LobbyCard } from '@/components/LobbyCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Match, GameType } from '@/types/game';
import { Plus, Filter, Zap, Shield, Users, Coins } from 'lucide-react';
import { useAccount } from 'wagmi';

// Mock data for demo
const mockMatches: Match[] = [
  {
    id: '1',
    gameType: 'tic-tac-toe',
    stakeAmount: 25,
    currency: 'USDC',
    playersRequired: 2,
    players: [{ id: '1', address: '0x123...', hasDeposited: true }],
    rounds: 3,
    currentRound: 0,
    state: 'waiting',
    createdAt: new Date(),
    creatorAddress: '0x123...',
  },
  {
    id: '2',
    gameType: 'chess',
    stakeAmount: 100,
    currency: 'USDC',
    playersRequired: 2,
    players: [
      { id: '1', address: '0xabc...', hasDeposited: true },
      { id: '2', address: '0xdef...', hasDeposited: true },
    ],
    rounds: 1,
    currentRound: 1,
    state: 'active',
    createdAt: new Date(),
    creatorAddress: '0xabc...',
  },
  {
    id: '3',
    gameType: 'tic-tac-toe',
    stakeAmount: 10,
    currency: 'USDC',
    playersRequired: 2,
    players: [{ id: '1', address: '0x789...', hasDeposited: true }],
    rounds: 5,
    currentRound: 0,
    state: 'depositing',
    createdAt: new Date(),
    creatorAddress: '0x789...',
  },
  {
    id: '4',
    gameType: 'scrabble',
    stakeAmount: 50,
    currency: 'USDC',
    playersRequired: 2,
    players: [],
    rounds: 1,
    currentRound: 0,
    state: 'waiting',
    createdAt: new Date(),
    creatorAddress: '0x456...',
  },
];

const gameFilters: { label: string; value: GameType | 'all' }[] = [
  { label: 'All Games', value: 'all' },
  { label: '⭕ Tic Tac Toe', value: 'tic-tac-toe' },
  { label: '♟️ Chess', value: 'chess' },
  { label: '🔤 Scrabble', value: 'scrabble' },
];

const Index = () => {
  const { isConnected } = useAccount();
  const [filter, setFilter] = useState<GameType | 'all'>('all');

  const filteredMatches = mockMatches.filter(
    (match) => filter === 'all' || match.gameType === filter
  );

  const liveCount = mockMatches.filter((m) => m.state === 'active').length;
  const waitingCount = mockMatches.filter(
    (m) => m.state === 'waiting' || m.state === 'depositing'
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

        <div className="container relative py-12 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <Badge variant="outline" className="mb-4 border-primary/50 text-primary">
              <Zap className="w-3 h-3 mr-1" />
              Powered by Base
            </Badge>

            <h1 className="font-display text-4xl sm:text-6xl font-black mb-4 leading-tight">
              <span className="text-gradient">STAKE.</span>{' '}
              <span className="text-foreground">PLAY.</span>{' '}
              <span className="text-success">WIN.</span>
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Real-money multiplayer gaming on Base. Challenge friends to Chess, 
              Tic Tac Toe, or Scrabble with USDC stakes. Winner takes all.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/create">
                <Button variant="neon" size="xl" className="w-full sm:w-auto">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Match
                </Button>
              </Link>
              {!isConnected && (
                <Button variant="outline" size="xl" className="w-full sm:w-auto">
                  Connect to Join
                </Button>
              )}
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 max-w-2xl mx-auto"
          >
            {[
              { icon: Users, label: 'Players Online', value: '42' },
              { icon: Zap, label: 'Live Matches', value: String(liveCount) },
              { icon: Filter, label: 'Open Lobbies', value: String(waitingCount) },
              { icon: Coins, label: 'Prize Pool', value: '$2.4K' },
            ].map((stat, index) => (
              <div
                key={stat.label}
                className="text-center p-4 rounded-xl bg-card/50 border border-border/50"
              >
                <stat.icon className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="font-display text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Matches Section */}
      <section className="container py-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="font-display text-2xl font-bold">Open Matches</h2>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {gameFilters.map((gameFilter) => (
              <Button
                key={gameFilter.value}
                variant={filter === gameFilter.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter(gameFilter.value)}
              >
                {gameFilter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Match Grid */}
        {filteredMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMatches.map((match, index) => (
              <LobbyCard key={match.id} match={match} index={index} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-muted-foreground mb-4">No matches found</p>
            <Link to="/create">
              <Button variant="neon">
                <Plus className="h-4 w-4 mr-2" />
                Create the first one
              </Button>
            </Link>
          </motion.div>
        )}
      </section>

      {/* Features Section */}
      <section className="container py-12 border-t border-border/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Shield,
              title: 'Secure Escrow',
              description:
                'Stakes held in audited smart contracts. Funds released only to verified winners.',
            },
            {
              icon: Zap,
              title: 'Instant Settlement',
              description:
                'Win a match, claim your prize. No waiting, no middlemen. Direct to wallet.',
            },
            {
              icon: Users,
              title: 'Fair Play Verified',
              description:
                'Server-validated moves, timestamped actions. Cheating is impossible.',
            },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-6"
            >
              <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>
            PlayArena © 2024 • Built on{' '}
            <a
              href="https://base.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Base
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
