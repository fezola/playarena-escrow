import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Medal, TrendingUp, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  rank: number;
  address: string;
  displayName?: string;
  wins: number;
  losses: number;
  earnings: number;
  streak: number;
}

const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, address: '0x1234...abcd', displayName: 'ChessMaster', wins: 47, losses: 8, earnings: 2340, streak: 12 },
  { rank: 2, address: '0x5678...efgh', displayName: 'TicTacPro', wins: 39, losses: 12, earnings: 1890, streak: 5 },
  { rank: 3, address: '0x9abc...ijkl', displayName: 'WordWizard', wins: 35, losses: 15, earnings: 1560, streak: 3 },
  { rank: 4, address: '0xdef0...mnop', wins: 28, losses: 18, earnings: 1120, streak: 0 },
  { rank: 5, address: '0x1357...qrst', wins: 24, losses: 20, earnings: 890, streak: 2 },
  { rank: 6, address: '0x2468...uvwx', wins: 22, losses: 19, earnings: 780, streak: 1 },
  { rank: 7, address: '0x3691...yzab', wins: 20, losses: 22, earnings: 650, streak: 0 },
  { rank: 8, address: '0x4802...cdef', wins: 18, losses: 21, earnings: 540, streak: 4 },
];

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Medal className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="font-display font-bold text-muted-foreground">{rank}</span>;
  }
};

const getRankStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-500/20 to-yellow-500/5 border-yellow-500/30';
    case 2:
      return 'bg-gradient-to-r from-gray-400/20 to-gray-400/5 border-gray-400/30';
    case 3:
      return 'bg-gradient-to-r from-amber-600/20 to-amber-600/5 border-amber-600/30';
    default:
      return '';
  }
};

const Leaderboard = () => {
  const totalPrizeDistributed = mockLeaderboard.reduce((acc, entry) => acc + entry.earnings, 0);
  const totalGamesPlayed = mockLeaderboard.reduce((acc, entry) => acc + entry.wins + entry.losses, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Badge variant="outline" className="mb-4 border-warning/50 text-warning">
            <Trophy className="w-3 h-3 mr-1" />
            Season 1 Rankings
          </Badge>
          <h1 className="font-display text-4xl font-black mb-2">
            <span className="text-gradient">LEADERBOARD</span>
          </h1>
          <p className="text-muted-foreground">
            Top players ranked by total winnings
          </p>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Distributed', value: `$${(totalPrizeDistributed / 1000).toFixed(1)}K`, icon: Trophy },
            { label: 'Games Played', value: totalGamesPlayed.toString(), icon: Gamepad2 },
            { label: 'Top Winner', value: `$${mockLeaderboard[0].earnings}`, icon: TrendingUp },
            { label: 'Active Players', value: '156', icon: TrendingUp },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card variant="elevated" className="text-center">
                <CardContent className="pt-6">
                  <stat.icon className="h-5 w-5 mx-auto mb-2 text-primary" />
                  <p className="font-display text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Leaderboard Table */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Top Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockLeaderboard.map((entry, index) => (
                <motion.div
                  key={entry.address}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-xl border transition-colors hover:bg-secondary/50',
                    getRankStyle(entry.rank)
                  )}
                >
                  {/* Rank */}
                  <div className="w-10 h-10 flex items-center justify-center">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* Player Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarFallback className="bg-secondary font-display text-sm">
                        {entry.displayName?.charAt(0) || entry.address.charAt(2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-display font-bold truncate">
                        {entry.displayName || entry.address}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {entry.address}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-display font-bold text-success">{entry.wins}</p>
                      <p className="text-xs text-muted-foreground">Wins</p>
                    </div>
                    <div className="text-center">
                      <p className="font-display font-bold text-destructive">{entry.losses}</p>
                      <p className="text-xs text-muted-foreground">Losses</p>
                    </div>
                    <div className="text-center">
                      <p className="font-display font-bold">
                        {((entry.wins / (entry.wins + entry.losses)) * 100).toFixed(0)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Win Rate</p>
                    </div>
                    {entry.streak > 0 && (
                      <Badge variant="outline" className="border-warning/50 text-warning">
                        🔥 {entry.streak}
                      </Badge>
                    )}
                  </div>

                  {/* Earnings */}
                  <div className="text-right">
                    <p className="font-display font-bold text-lg text-gradient">
                      ${entry.earnings}
                    </p>
                    <p className="text-xs text-muted-foreground">Earnings</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Leaderboard;
