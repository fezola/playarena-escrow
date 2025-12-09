import { motion } from 'framer-motion';
import { MobileLayout } from '@/components/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Trophy, Gamepad2, Coins, TrendingUp, Settings, History } from 'lucide-react';

export default function Profile() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Gamepad2 className="h-10 w-10 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-2">Connect Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to view your profile and stats
            </p>
            <ConnectButton />
          </motion.div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      {/* Header */}
      <header className="bg-gradient-to-b from-primary/10 to-background px-4 pt-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-xl font-bold">Profile</h1>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {/* Profile Card */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary">
            <AvatarFallback className="bg-primary/20 text-primary font-display text-xl">
              {address?.slice(2, 4).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-display font-bold text-lg">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </h2>
            <Badge variant="outline" className="mt-1">
              <Trophy className="h-3 w-3 mr-1" />
              Level 5 Player
            </Badge>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <main className="px-4 -mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Trophy, label: 'Wins', value: '12', color: 'text-success' },
            { icon: Gamepad2, label: 'Games Played', value: '24', color: 'text-primary' },
            { icon: Coins, label: 'Earnings', value: '$156', color: 'text-warning' },
            { icon: TrendingUp, label: 'Win Rate', value: '50%', color: 'text-accent' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
                  <p className="font-display text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Recent Games */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <History className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Recent Games</span>
          </div>

          <div className="space-y-2">
            {[
              { game: 'Tic Tac Toe', result: 'Won', stake: '$10', time: '2h ago' },
              { game: 'Chess', result: 'Lost', stake: '$25', time: '5h ago' },
              { game: 'Scrabble', result: 'Won', stake: '$15', time: '1d ago' },
            ].map((game, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card className="border-border/50">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{game.game}</p>
                      <p className="text-xs text-muted-foreground">{game.time}</p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={game.result === 'Won' ? 'default' : 'destructive'}
                        className="mb-1"
                      >
                        {game.result}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{game.stake}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Disconnect */}
        <div className="pt-4">
          <ConnectButton.Custom>
            {({ openAccountModal }) => (
              <Button variant="outline" className="w-full" onClick={openAccountModal}>
                Manage Wallet
              </Button>
            )}
          </ConnectButton.Custom>
        </div>
      </main>
    </MobileLayout>
  );
}
