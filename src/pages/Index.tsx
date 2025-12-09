import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/MobileLayout';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GameType, gameTypeLabels, gameTypeIcons } from '@/types/game';
import { 
  Zap, ChevronRight, Trophy, Users, Coins, Flame, 
  Plus, Bell, Wallet, Swords, Clock, Share2 
} from 'lucide-react';

// Mock live matches for demo
const liveMatches = [
  { id: '1', game: 'chess' as GameType, players: ['0xAbc...', '0xDef...'], stake: 50, status: 'live' },
  { id: '2', game: 'tic-tac-toe' as GameType, players: ['0x123...'], stake: 10, status: 'waiting' },
];

// Mock friends activity
const friendsActivity = [
  { id: '1', name: 'Alex', action: 'won', game: 'Chess', amount: 100, time: '5m ago', avatar: null },
  { id: '2', name: 'Sam', action: 'started', game: 'Scrabble', amount: 25, time: '12m ago', avatar: null },
  { id: '3', name: 'Jordan', action: 'challenged you', game: 'Tic Tac Toe', amount: 15, time: '1h ago', avatar: null },
];

const quickGames: { type: GameType; color: string }[] = [
  { type: 'tic-tac-toe', color: 'from-blue-500 to-cyan-400' },
  { type: 'chess', color: 'from-purple-500 to-pink-400' },
  { type: 'scrabble', color: 'from-amber-500 to-orange-400' },
];

export default function Index() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  return (
    <MobileLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/50">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary font-display">
                {profile?.display_name?.charAt(0) || user?.email?.charAt(0) || 'P'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-display font-bold text-sm">
                {profile?.display_name || 'Player'}
              </p>
              <p className="text-xs text-muted-foreground">
                Level {profile?.level || 1}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
                </Button>
                <Link to="/profile">
                  <Button variant="outline" size="sm" className="gap-1">
                    <Wallet className="h-4 w-4" />
                    <span className="font-display">${profile?.wallet_balance || 0}</span>
                  </Button>
                </Link>
              </>
            ) : (
              <Link to="/auth">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 py-4 space-y-6">
        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link to="/create">
              <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent active:scale-[0.98] transition-transform">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                    <Plus className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-sm">Create Match</p>
                    <p className="text-xs text-muted-foreground">Start a new game</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="border-accent/30 bg-gradient-to-br from-accent/10 to-transparent active:scale-[0.98] transition-transform">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <Swords className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="font-display font-bold text-sm">Quick Match</p>
                  <p className="text-xs text-muted-foreground">Find opponent</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* Games Row */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold">Games</h2>
            <Link to="/games" className="text-xs text-primary flex items-center">
              All Games <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex gap-3">
            {quickGames.map((game, index) => (
              <motion.div
                key={game.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex-1"
              >
                <Link to={`/play/${game.type}`}>
                  <Card className="overflow-hidden border-border/50 active:scale-95 transition-transform">
                    <div className={`h-16 bg-gradient-to-br ${game.color} flex items-center justify-center`}>
                      <span className="text-3xl">{gameTypeIcons[game.type]}</span>
                    </div>
                    <CardContent className="p-2 text-center">
                      <p className="text-[10px] font-medium truncate">
                        {gameTypeLabels[game.type]}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Live Matches */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold flex items-center gap-2">
              <Flame className="h-4 w-4 text-destructive" />
              Live Now
            </h2>
            <Badge variant="outline" className="text-destructive border-destructive/30">
              {liveMatches.filter(m => m.status === 'live').length} Active
            </Badge>
          </div>

          <div className="space-y-2">
            {liveMatches.map((match, index) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-border/50 active:scale-[0.98] transition-transform">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center text-xl">
                        {gameTypeIcons[match.game]}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{gameTypeLabels[match.game]}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>{match.players.length}/2 players</span>
                          <span>•</span>
                          <span className="text-success">${match.stake}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {match.status === 'live' ? (
                        <Badge className="bg-destructive/20 text-destructive border-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-destructive mr-1 animate-pulse" />
                          Live
                        </Badge>
                      ) : (
                        <Badge variant="outline">Join</Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Friends Activity */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Activity
            </h2>
          </div>

          <div className="space-y-2">
            {friendsActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card className="border-border/50">
                  <CardContent className="p-3 flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-muted text-sm">
                        {activity.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.name}</span>{' '}
                        <span className={activity.action === 'won' ? 'text-success' : 'text-muted-foreground'}>
                          {activity.action}
                        </span>{' '}
                        {activity.action === 'won' && (
                          <span className="font-medium text-success">${activity.amount}</span>
                        )}
                        {activity.action === 'started' && (
                          <span className="text-muted-foreground">in {activity.game}</span>
                        )}
                        {activity.action === 'challenged you' && (
                          <span className="text-primary">{activity.game} - ${activity.amount}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {activity.time}
                      </p>
                    </div>

                    {activity.action === 'challenged you' && (
                      <Button size="sm" variant="neon">
                        Accept
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Stats Row */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Trophy, label: 'Wins', value: profile?.total_wins || 0, color: 'text-success' },
              { icon: Flame, label: 'Streak', value: profile?.current_streak || 0, color: 'text-warning' },
              { icon: Coins, label: 'Earned', value: `$${profile?.total_earnings || 0}`, color: 'text-primary' },
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
      </main>
    </MobileLayout>
  );
}
