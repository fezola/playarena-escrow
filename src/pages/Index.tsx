import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MobileLayout } from '@/components/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GameType, gameTypeLabels, gameTypeIcons } from '@/types/game';
import { Zap, ChevronRight, Trophy, Users, Coins, Flame } from 'lucide-react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const quickPlayGames: { type: GameType; color: string }[] = [
  { type: 'tic-tac-toe', color: 'from-blue-500 to-cyan-400' },
  { type: 'chess', color: 'from-purple-500 to-pink-400' },
  { type: 'scrabble', color: 'from-amber-500 to-orange-400' },
];

const Index = () => {
  const { isConnected } = useAccount();

  return (
    <MobileLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">PlayArena</span>
          </div>
          
          {isConnected ? (
            <ConnectButton.Custom>
              {({ account, openAccountModal }) => (
                <Button variant="ghost" size="sm" onClick={openAccountModal}>
                  {account?.displayBalance}
                </Button>
              )}
            </ConnectButton.Custom>
          ) : (
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <Button size="sm" onClick={openConnectModal}>
                  Connect
                </Button>
              )}
            </ConnectButton.Custom>
          )}
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <Badge variant="outline" className="mb-4 border-primary/50 text-primary">
            <Zap className="w-3 h-3 mr-1" />
            Powered by Base
          </Badge>
          
          <h1 className="font-display text-3xl font-black mb-3 leading-tight">
            <span className="text-gradient">STAKE.</span>{' '}
            <span className="text-foreground">PLAY.</span>{' '}
            <span className="text-success">WIN.</span>
          </h1>
          
          <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
            Real-money multiplayer gaming. Challenge friends and win USDC.
          </p>
        </motion.section>

        {/* Quick Play Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg">Quick Play</h2>
            <Link to="/games" className="text-sm text-primary flex items-center">
              See all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {quickPlayGames.map((game, index) => (
              <motion.div
                key={game.type}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={`/play/${game.type}`}>
                  <Card className="w-28 overflow-hidden border-border/50 active:scale-95 transition-transform">
                    <div className={`h-16 bg-gradient-to-br ${game.color} flex items-center justify-center`}>
                      <span className="text-3xl">{gameTypeIcons[game.type]}</span>
                    </div>
                    <CardContent className="p-2 text-center">
                      <p className="text-xs font-medium truncate">
                        {gameTypeLabels[game.type]}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Users, label: 'Online', value: '42', color: 'text-primary' },
              { icon: Flame, label: 'Live', value: '8', color: 'text-destructive' },
              { icon: Coins, label: 'Pool', value: '$2.4K', color: 'text-warning' },
            ].map((stat) => (
              <Card key={stat.label} className="border-border/50">
                <CardContent className="p-3 text-center">
                  <stat.icon className={`h-4 w-4 mx-auto mb-1 ${stat.color}`} />
                  <p className="font-display text-lg font-bold">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* Featured Match */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-display font-bold text-lg mb-3">Featured</h2>
          
          <Card className="border-border/50 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/20 to-accent/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">♟️</span>
                  <div>
                    <p className="font-display font-bold">Chess Tournament</p>
                    <p className="text-xs text-muted-foreground">Best of 3 • $100 Prize</p>
                  </div>
                </div>
                <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                  <Flame className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-card border-2 border-background flex items-center justify-center text-xs font-medium"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <Link to="/play/chess">
                  <Button size="sm" variant="neon">
                    Watch
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </motion.section>

        {/* Leaderboard Preview */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-warning" />
              Top Players
            </h2>
            <Link to="/leaderboard" className="text-sm text-primary flex items-center">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <Card className="border-border/50">
            <CardContent className="p-0 divide-y divide-border/50">
              {[
                { rank: 1, name: '0xAbC...123', wins: 24, earnings: '$486' },
                { rank: 2, name: '0xDef...456', wins: 19, earnings: '$312' },
                { rank: 3, name: '0xGhi...789', wins: 15, earnings: '$189' },
              ].map((player) => (
                <div
                  key={player.rank}
                  className="flex items-center justify-between p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-display font-bold ${
                      player.rank === 1 ? 'text-warning' :
                      player.rank === 2 ? 'text-muted-foreground' :
                      'text-amber-700'
                    }`}>
                      #{player.rank}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{player.name}</p>
                      <p className="text-xs text-muted-foreground">{player.wins} wins</p>
                    </div>
                  </div>
                  <span className="font-display font-bold text-success text-sm">
                    {player.earnings}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.section>
      </main>
    </MobileLayout>
  );
};

export default Index;
