import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/MobileLayout';
import { TicTacToeBoard } from '@/components/games/TicTacToeBoard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Clock, DollarSign, Trophy, RefreshCw, ArrowLeft, Copy, Share2, Loader2 } from 'lucide-react';

type Match = Database['public']['Tables']['matches']['Row'];
type MatchPlayer = Database['public']['Tables']['match_players']['Row'];

interface MatchWithPlayers extends Match {
  match_players: (MatchPlayer & {
    profiles: { display_name: string | null } | null;
  })[];
}

type TicTacToeState = {
  board: (string | null)[];
  currentPlayer: 'X' | 'O';
  winner: string | null;
};

const MatchPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();

  const [match, setMatch] = useState<MatchWithPlayers | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState<TicTacToeState>({
    board: Array(9).fill(null),
    currentPlayer: 'X',
    winner: null,
  });

  const fetchMatch = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        match_players (
          *,
          profiles:player_id (
            display_name
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching match:', error);
      toast({
        title: 'Match not found',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }

    setMatch(data as unknown as MatchWithPlayers);
    
    // Load game state
    if (data.game_state) {
      setGameState(data.game_state as unknown as TicTacToeState);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchMatch();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`match-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${id}` },
        (payload) => {
          const updated = payload.new as Match;
          setMatch(prev => prev ? { ...prev, ...updated } : null);
          if (updated.game_state) {
            setGameState(updated.game_state as unknown as TicTacToeState);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'match_players', filter: `match_id=eq.${id}` },
        () => {
          fetchMatch();
          toast({
            title: 'Player joined!',
            description: 'An opponent has joined the match.',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const myPlayer = match?.match_players?.find(p => p.player_id === profile?.id);
  const opponent = match?.match_players?.find(p => p.player_id !== profile?.id);
  const playerSymbol = myPlayer?.player_symbol as 'X' | 'O' || 'X';
  const isMyTurn = gameState.currentPlayer === playerSymbol;

  const handleCellClick = async (index: number) => {
    if (!match || match.state !== 'active' || !isMyTurn || gameState.winner || gameState.board[index]) {
      if (!isMyTurn && !gameState.winner) {
        toast({
          title: "Not Your Turn",
          description: "Wait for your opponent to move.",
        });
      }
      return;
    }

    // Make move
    const newBoard = [...gameState.board];
    newBoard[index] = playerSymbol;

    // Check for winner
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];

    let winner: string | null = null;
    for (const [a, b, c] of lines) {
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
        winner = newBoard[a];
        break;
      }
    }

    // Check for draw
    if (!winner && newBoard.every(cell => cell !== null)) {
      winner = 'draw';
    }

    const newState: TicTacToeState = {
      board: newBoard,
      currentPlayer: playerSymbol === 'X' ? 'O' : 'X',
      winner,
    };

    // Update game state in database
    await supabase
      .from('matches')
      .update({
        game_state: newState as unknown as Database['public']['Tables']['matches']['Update']['game_state'],
        state: winner ? 'complete' : 'active',
        ended_at: winner ? new Date().toISOString() : null,
        winner_id: winner === playerSymbol ? profile?.id : winner === 'draw' ? null : opponent?.player_id,
      })
      .eq('id', match.id);

    setGameState(newState);

    if (winner) {
      if (winner === playerSymbol) {
        toast({
          title: '🎉 You Won!',
          description: `You won $${Number(match.stake_amount) * 2}!`,
        });
      } else if (winner === 'draw') {
        toast({
          title: "It's a Draw!",
          description: 'Stakes will be returned.',
        });
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: 'Link Copied',
      description: 'Share this link with your opponent!',
    });
  };

  const handlePlayAgain = async () => {
    if (!match) return;

    const newState: TicTacToeState = {
      board: Array(9).fill(null),
      currentPlayer: 'X',
      winner: null,
    };

    await supabase
      .from('matches')
      .update({
        game_state: newState as unknown as Database['public']['Tables']['matches']['Update']['game_state'],
        state: 'active',
        current_round: match.current_round + 1,
      })
      .eq('id', match.id);

    setGameState(newState);
  };

  if (loading) {
    return (
      <MobileLayout hideNav>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  if (!match) {
    return null;
  }

  const totalPrize = Number(match.stake_amount) * 2;

  return (
    <MobileLayout hideNav>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Leave
          </Button>
          <Badge className={match.state === 'active' ? 'bg-success' : match.state === 'waiting' ? 'bg-warning' : 'bg-muted'}>
            {match.state === 'waiting' ? 'Waiting for opponent' : match.state === 'active' ? 'In Progress' : 'Complete'}
          </Badge>
          <Button variant="ghost" size="sm" onClick={handleCopyLink}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4">
        {/* Players */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {/* Player 1 (You) */}
              <div className="flex items-center gap-2">
                <Avatar className={`h-10 w-10 border-2 ${isMyTurn && match.state === 'active' ? 'border-primary ring-2 ring-primary/50' : 'border-border'}`}>
                  <AvatarFallback className="bg-primary/20 text-primary font-display">
                    {playerSymbol}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">You</p>
                  <p className="text-xs text-muted-foreground">{playerSymbol}</p>
                </div>
              </div>

              {/* Prize */}
              <div className="text-center">
                <Badge variant="outline" className="mb-1">VS</Badge>
                <p className="text-xs text-success font-bold">${totalPrize} Prize</p>
              </div>

              {/* Player 2 (Opponent) */}
              {opponent ? (
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="font-medium text-sm">{(opponent as any).profiles?.display_name || 'Opponent'}</p>
                    <p className="text-xs text-muted-foreground">{opponent.player_symbol}</p>
                  </div>
                  <Avatar className={`h-10 w-10 border-2 ${!isMyTurn && match.state === 'active' ? 'border-accent ring-2 ring-accent/50' : 'border-border'}`}>
                    <AvatarFallback className="bg-accent/20 text-accent font-display">
                      {opponent.player_symbol}
                    </AvatarFallback>
                  </Avatar>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="font-medium text-sm text-muted-foreground">Waiting...</p>
                    <p className="text-xs text-muted-foreground">O</p>
                  </div>
                  <Avatar className="h-10 w-10 border-2 border-dashed border-border">
                    <AvatarFallback className="bg-muted text-muted-foreground">?</AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Game Board */}
        {match.state === 'waiting' ? (
          <Card className="border-border/50">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <h3 className="font-display font-bold text-lg mb-2">Waiting for opponent</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Share the link below to invite someone
              </p>
              <Button onClick={handleCopyLink} variant="outline" className="w-full">
                <Copy className="h-4 w-4 mr-2" />
                Copy Match Link
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50">
            <CardContent className="p-4">
              {/* Turn indicator */}
              {!gameState.winner && (
                <div className={`text-center mb-4 py-2 rounded-lg ${isMyTurn ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <p className="text-sm font-medium">
                    {isMyTurn ? "Your turn!" : "Opponent's turn..."}
                  </p>
                </div>
              )}

              <div className="flex justify-center">
                <TicTacToeBoard
                  state={gameState}
                  onCellClick={handleCellClick}
                  playerSymbol={playerSymbol}
                  disabled={!isMyTurn || !!gameState.winner}
                />
              </div>

              {/* Game over */}
              {gameState.winner && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 text-center"
                >
                  <div className={`p-4 rounded-xl mb-4 ${
                    gameState.winner === playerSymbol 
                      ? 'bg-success/10 border border-success/30' 
                      : gameState.winner === 'draw'
                      ? 'bg-muted'
                      : 'bg-destructive/10 border border-destructive/30'
                  }`}>
                    <Trophy className={`h-8 w-8 mx-auto mb-2 ${
                      gameState.winner === playerSymbol ? 'text-success' : 'text-muted-foreground'
                    }`} />
                    <p className="font-display font-bold text-lg">
                      {gameState.winner === playerSymbol ? 'You Won!' : gameState.winner === 'draw' ? "It's a Draw!" : 'You Lost'}
                    </p>
                    {gameState.winner === playerSymbol && (
                      <p className="text-success text-sm">+${totalPrize}</p>
                    )}
                  </div>
                  <Button onClick={handlePlayAgain} variant="neon" size="lg" className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Play Again
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </MobileLayout>
  );
};

export default MatchPage;
