import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MobileLayout } from '@/components/MobileLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, Trophy, XCircle, Minus, Gamepad2, 
  Clock, DollarSign, ChevronRight 
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type Match = Database['public']['Tables']['matches']['Row'];

interface MatchWithDetails extends Match {
  match_players: {
    player_id: string;
    player_symbol: string;
    profiles: { display_name: string | null } | null;
  }[];
}

export default function MatchHistory() {
  const { profile } = useAuth();
  const [matches, setMatches] = useState<MatchWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const fetchMatches = async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          match_players (
            player_id,
            player_symbol,
            profiles:player_id (display_name)
          )
        `)
        .or(`creator_id.eq.${profile.id},winner_id.eq.${profile.id}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        // Filter to matches where user participated
        const userMatches = (data as unknown as MatchWithDetails[]).filter(match =>
          match.match_players?.some(p => p.player_id === profile.id)
        );
        setMatches(userMatches);
      }
      setLoading(false);
    };

    fetchMatches();
  }, [profile]);

  const getMatchResult = (match: MatchWithDetails) => {
    if (match.state !== 'complete') return 'pending';
    if (match.winner_id === profile?.id) return 'win';
    if (match.winner_id === null) return 'draw';
    return 'loss';
  };

  const getOpponentName = (match: MatchWithDetails) => {
    const opponent = match.match_players?.find(p => p.player_id !== profile?.id);
    return opponent?.profiles?.display_name || 'Unknown';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const gameTypeLabels: Record<string, string> = {
    'tic-tac-toe': 'Tic Tac Toe',
    'chess': 'Chess',
    'scrabble': 'Scrabble',
  };

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link to="/profile">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-display text-xl font-bold">Match History</h1>
        </div>
      </header>

      <main className="px-4 py-4 space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))
        ) : matches.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-8 text-center">
              <Gamepad2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-display font-bold text-lg mb-2">No matches yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start playing to build your match history
              </p>
              <Link to="/games">
                <Button variant="neon">Play Now</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          matches.map((match, index) => {
            const result = getMatchResult(match);
            const resultConfig = {
              win: { icon: Trophy, color: 'text-success', bg: 'bg-success/10', label: 'Won' },
              loss: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Lost' },
              draw: { icon: Minus, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Draw' },
              pending: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10', label: 'Pending' },
            }[result];

            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/match/${match.id}`}>
                  <Card className="border-border/50 hover:border-primary/30 transition-colors">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${resultConfig.bg} flex items-center justify-center`}>
                          <resultConfig.icon className={`h-5 w-5 ${resultConfig.color}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">
                              vs {getOpponentName(match)}
                            </span>
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              {gameTypeLabels[match.game_type] || match.game_type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(match.created_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${Number(match.stake_amount)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge className={resultConfig.bg + ' ' + resultConfig.color + ' border-0'}>
                            {resultConfig.label}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })
        )}
      </main>
    </MobileLayout>
  );
}
