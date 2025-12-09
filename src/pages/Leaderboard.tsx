import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MobileLayout } from '@/components/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, TrendingUp, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  rank: number;
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  total_wins: number;
  total_losses: number;
  total_earnings: number;
  current_streak: number;
}

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

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url, total_wins, total_losses, total_earnings, current_streak')
        .order('total_wins', { ascending: false })
        .limit(20);

      if (!error && data) {
        setLeaderboard(
          data.map((entry, index) => ({
            ...entry,
            rank: index + 1,
          }))
        );
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  const totalEarnings = leaderboard.reduce((acc, entry) => acc + (entry.total_earnings || 0), 0);
  const totalGames = leaderboard.reduce((acc, entry) => acc + (entry.total_wins || 0) + (entry.total_losses || 0), 0);

  return (
    <MobileLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="font-display text-xl font-bold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-warning" />
            Leaderboard
          </h1>
          <Badge variant="outline" className="border-warning/50 text-warning">
            Season 1
          </Badge>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total Earned', value: `$${totalEarnings.toFixed(0)}`, icon: Trophy, color: 'text-warning' },
            { label: 'Games Played', value: totalGames.toString(), icon: Gamepad2, color: 'text-primary' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-border/50">
                <CardContent className="p-3 text-center">
                  <stat.icon className={`h-4 w-4 mx-auto mb-1 ${stat.color}`} />
                  <p className="font-display text-lg font-bold">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Leaderboard List */}
        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-3">
                  <Skeleton className="h-14 w-full" />
                </CardContent>
              </Card>
            ))
          ) : leaderboard.length === 0 ? (
            <Card className="border-border/50 border-dashed">
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium mb-1">No rankings yet</p>
                <p className="text-sm text-muted-foreground">
                  Play matches to appear on the leaderboard
                </p>
              </CardContent>
            </Card>
          ) : (
            leaderboard.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className={cn('border-border/50', getRankStyle(entry.rank))}>
                  <CardContent className="p-3 flex items-center gap-3">
                    {/* Rank */}
                    <div className="w-8 h-8 flex items-center justify-center">
                      {getRankIcon(entry.rank)}
                    </div>

                    {/* Player Info */}
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarImage src={entry.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary font-display text-sm">
                        {entry.display_name?.charAt(0) || entry.username?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-sm truncate">
                        {entry.display_name || entry.username || 'Player'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="text-success">{entry.total_wins}W</span>
                        <span>-</span>
                        <span className="text-destructive">{entry.total_losses}L</span>
                        {entry.current_streak > 0 && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 border-warning/50 text-warning">
                            🔥 {entry.current_streak}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Earnings */}
                    <div className="text-right">
                      <p className="font-display font-bold text-primary">
                        ${entry.total_earnings || 0}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Earned</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </main>
    </MobileLayout>
  );
}
