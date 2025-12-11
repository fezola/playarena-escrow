import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/MobileLayout';
import { TicTacToeBoard } from '@/components/games/TicTacToeBoard';
import { CupPongGame, CupPongState, createInitialCupPongState, processCupPongThrow } from '@/components/games/CupPongGame';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { RoundScoreTracker } from '@/components/RoundScoreTracker';
import { GameInstructions, ResponsibleGamingBanner } from '@/components/GameInstructions';
import { MatchChat } from '@/components/MatchChat';
import { WinnerCardDialog } from '@/components/WinnerCardDialog';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Clock, DollarSign, Trophy, RefreshCw, ArrowLeft, Copy, Share2, Loader2 } from 'lucide-react';
import { TicTacToeState, TicTacToeCell, gameTypeLabels } from '@/types/game';

type Match = Database['public']['Tables']['matches']['Row'];
type MatchPlayer = Database['public']['Tables']['match_players']['Row'];

interface MatchWithPlayers extends Match {
  match_players: (MatchPlayer & {
    profiles: { display_name: string | null } | null;
  })[];
}

interface ExtendedGameState extends TicTacToeState {
  roundScores?: { player1: number; player2: number };
  draws?: number;
  roundNumber?: number;
  lastStarter?: 'X' | 'O';
}

// Cup Pong extended state for matches
interface CupPongMatchState extends CupPongState {
  roundScores?: { player1: number; player2: number };
}

const MatchPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();

  const [match, setMatch] = useState<MatchWithPlayers | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWinnerCard, setShowWinnerCard] = useState(false);
  
  // Tic Tac Toe state
  const [gameState, setGameState] = useState<ExtendedGameState>({
    board: Array(9).fill(null) as TicTacToeCell[],
    currentPlayer: 'X',
    winner: null,
    winningLine: null,
    roundScores: { player1: 0, player2: 0 },
    draws: 0,
    roundNumber: 1,
    lastStarter: 'X',
  });

  // Cup Pong state
  const [cupPongState, setCupPongState] = useState<CupPongMatchState>({
    ...createInitialCupPongState(),
    roundScores: { player1: 0, player2: 0 },
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
    
    // Load game state based on game type
    if (data.game_state) {
      if (data.game_type === 'cup-pong') {
        const state = data.game_state as unknown as CupPongMatchState;
        setCupPongState({
          ...createInitialCupPongState(),
          ...state,
          roundScores: state.roundScores || { player1: 0, player2: 0 },
        });
      } else {
        const state = data.game_state as unknown as ExtendedGameState;
        setGameState({
          ...state,
          roundScores: state.roundScores || { player1: 0, player2: 0 },
          draws: state.draws || 0,
          roundNumber: state.roundNumber || 1,
          lastStarter: state.lastStarter || 'X',
        });
      }
    }

    // Fetch invite code
    const { data: invite } = await supabase
      .from('game_invites')
      .select('invite_code')
      .eq('match_id', id)
      .maybeSingle();
    
    if (invite) {
      setInviteCode(invite.invite_code);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchMatch();

    // Subscribe to realtime updates with optimized settings for mobile
    const channel = supabase
      .channel(`match-${id}`, {
        config: {
          broadcast: { self: true },
          presence: { key: profile?.id || 'anon' },
        },
      })
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${id}` },
        (payload) => {
          console.log('[Realtime] Match update received:', new Date().toISOString());
          const updated = payload.new as Match;
          setMatch(prev => prev ? { ...prev, ...updated } : null);
          if (updated.game_state) {
            if (updated.game_type === 'cup-pong') {
              const state = updated.game_state as unknown as CupPongMatchState;
              setCupPongState(prev => ({ ...prev, ...state }));
            } else {
              const state = updated.game_state as unknown as ExtendedGameState;
              setGameState({
                ...state,
                roundScores: state.roundScores || { player1: 0, player2: 0 },
                draws: state.draws || 0,
                roundNumber: state.roundNumber || 1,
                lastStarter: state.lastStarter || 'X',
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'match_players', filter: `match_id=eq.${id}` },
        () => {
          console.log('[Realtime] Player joined:', new Date().toISOString());
          fetchMatch();
          toast({
            title: 'Player joined!',
            description: 'An opponent has joined the match.',
          });
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const myPlayer = match?.match_players?.find(p => p.player_id === profile?.id);
  const opponent = match?.match_players?.find(p => p.player_id !== profile?.id);
  const playerSymbol = myPlayer?.player_symbol as 'X' | 'O' || 'X';
  const isMyTurn = gameState.currentPlayer === playerSymbol;
  const isPlayer1 = playerSymbol === 'X';

  const totalRounds = match?.rounds || 1;
  const roundsToWin = Math.ceil(totalRounds / 2);
  const isCupPong = match?.game_type === 'cup-pong';
  
  // Determine turn and scores based on game type
  const cupPongPlayerRole = isPlayer1 ? 'player1' : 'player2';
  const isCupPongMyTurn = isCupPong && cupPongState.currentPlayer === cupPongPlayerRole;
  const effectiveIsMyTurn = isCupPong ? isCupPongMyTurn : isMyTurn;
  
  const myScore = isPlayer1 ? (gameState.roundScores?.player1 || 0) : (gameState.roundScores?.player2 || 0);
  const opponentScore = isPlayer1 ? (gameState.roundScores?.player2 || 0) : (gameState.roundScores?.player1 || 0);
  const matchWinner = isCupPong 
    ? (cupPongState.winner === cupPongPlayerRole ? 'player' : cupPongState.winner ? 'opponent' : null)
    : (myScore >= roundsToWin ? 'player' : opponentScore >= roundsToWin ? 'opponent' : null);

  // Cup Pong throw handler
  const handleCupPongThrow = async (targetCup: number) => {
    if (!match || match.state !== 'active' || !isCupPongMyTurn || cupPongState.winner) return;

    const newState = processCupPongThrow(cupPongState, targetCup, cupPongPlayerRole);
    setCupPongState(newState);

    // Update database
    const { error } = await supabase
      .from('matches')
      .update({
        game_state: newState as any,
        state: newState.winner ? 'complete' : 'active',
        ended_at: newState.winner ? new Date().toISOString() : null,
        winner_id: newState.winner 
          ? match.match_players.find(p => p.player_symbol === (newState.winner === 'player1' ? 'X' : 'O'))?.player_id 
          : null,
      })
      .eq('id', match.id);

    if (error) console.error('Error updating cup pong:', error);

    // Handle win
    if (newState.winner) {
      const winnerId = match.match_players.find(p => p.player_symbol === (newState.winner === 'player1' ? 'X' : 'O'))?.player_id;
      if (winnerId) {
        await supabase.rpc('release_escrow_to_winner', { _match_id: match.id, _winner_id: winnerId });
        if (newState.winner === cupPongPlayerRole) {
          toast({ title: '🎉 You Won!', description: 'Congratulations!' });
          setTimeout(() => setShowWinnerCard(true), 1500);
        }
      }
    } else if (newState.lastThrowResult === 'hit') {
      toast({ title: '🎯 Hit!', description: 'You get another throw!' });
    }
  };

  const handleCellClick = async (index: number) => {
    if (!match || match.state !== 'active' || !isMyTurn || gameState.winner || gameState.board[index] || matchWinner) {
      if (!isMyTurn && !gameState.winner && !matchWinner) {
        toast({
          title: "Not Your Turn",
          description: "Wait for your opponent to move.",
        });
      }
      return;
    }

    console.log('[Game] Making move at index:', index, 'Time:', new Date().toISOString());

    // Make move (optimistic update first for instant feedback)
    const newBoard = [...gameState.board] as TicTacToeCell[];
    newBoard[index] = playerSymbol;

    // Check for winner
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];

    let roundWinner: 'X' | 'O' | 'draw' | null = null;
    let winningLine: number[] | null = null;
    for (const line of lines) {
      const [a, b, c] = line;
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
        roundWinner = newBoard[a] as 'X' | 'O';
        winningLine = line;
        break;
      }
    }

    // Check for draw
    if (!roundWinner && newBoard.every(cell => cell !== null)) {
      roundWinner = 'draw';
    }

    // Update round scores and draws if round is over
    let newRoundScores = { ...gameState.roundScores } as { player1: number; player2: number };
    let newDraws = gameState.draws || 0;
    let newRoundNumber = gameState.roundNumber || 1;
    
    if (roundWinner && roundWinner !== 'draw') {
      if (roundWinner === 'X') {
        newRoundScores.player1 += 1;
      } else {
        newRoundScores.player2 += 1;
      }
      newRoundNumber += 1;
    } else if (roundWinner === 'draw') {
      newDraws += 1;
      // Draws don't count as a round in multi-round matches
    }

    const newState: ExtendedGameState = {
      board: newBoard,
      currentPlayer: playerSymbol === 'X' ? 'O' : 'X',
      winner: roundWinner,
      winningLine,
      roundScores: newRoundScores,
      draws: newDraws,
      roundNumber: newRoundNumber,
      lastStarter: gameState.lastStarter || 'X',
    };

    // Check if match is over (someone won enough rounds)
    const p1Score = newRoundScores.player1;
    const p2Score = newRoundScores.player2;
    const matchComplete = p1Score >= roundsToWin || p2Score >= roundsToWin;
    const matchWinnerId = matchComplete 
      ? (p1Score >= roundsToWin 
          ? match.match_players.find(p => p.player_symbol === 'X')?.player_id 
          : match.match_players.find(p => p.player_symbol === 'O')?.player_id)
      : null;

    // Optimistic update - show move immediately
    setGameState(newState);

    // Update game state in database
    console.log('[Game] Sending update to database:', new Date().toISOString());
    const { error } = await supabase
      .from('matches')
      .update({
        game_state: newState as unknown as Database['public']['Tables']['matches']['Update']['game_state'],
        state: matchComplete ? 'complete' : 'active',
        ended_at: matchComplete ? new Date().toISOString() : null,
        winner_id: matchWinnerId,
        current_round: matchComplete ? match.current_round + 1 : match.current_round,
      })
      .eq('id', match.id);

    if (error) {
      console.error('[Game] Error updating match:', error);
    } else {
      console.log('[Game] Update sent successfully:', new Date().toISOString());
    }

    // Handle escrow release only when MATCH is complete (not just round)
    if (matchComplete) {
      if (matchWinnerId) {
        // Release escrow to match winner
        const { data: releaseResult } = await supabase.rpc('release_escrow_to_winner', {
          _match_id: match.id,
          _winner_id: matchWinnerId
        });
        console.log('Escrow release result:', releaseResult);
        
        if (matchWinnerId === profile?.id) {
          const result = releaseResult as { winner_payout?: number } | null;
          const payout = result?.winner_payout || (Number(match.stake_amount) * 2 * 0.95);
          toast({
            title: '🎉 You Won the Match!',
            description: `You won $${payout.toFixed(2)}! (5% platform fee applied)`,
          });

          // Show winner card dialog after a short delay
          setTimeout(() => {
            setShowWinnerCard(true);
          }, 1500);
        }
      }
    } else if (roundWinner === 'draw') {
      // Notify about draw
      toast({
        title: "It's a Draw!",
        description: `Draws: ${newDraws}. Next round, ${gameState.lastStarter === 'X' ? 'O' : 'X'} starts first.`,
      });
    } else if (roundWinner) {
      // Just a round win, not match win
      toast({
        title: roundWinner === playerSymbol ? 'Round Won!' : 'Round Lost',
        description: `Score: ${isPlayer1 ? newRoundScores.player1 : newRoundScores.player2} - ${isPlayer1 ? newRoundScores.player2 : newRoundScores.player1}`,
      });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: 'Link Copied',
      description: 'Share this link with your opponent!',
    });
  };

  const handleCopyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      toast({
        title: 'Code Copied',
        description: `Share code "${inviteCode}" with your opponent!`,
      });
    }
  };

  const handleNextRound = async () => {
    if (!match || matchWinner) return;

    // Alternate starting player: if last game was a draw, swap starter
    // If not a draw, winner of last round starts (or maintain alternating pattern)
    const lastStarter = gameState.lastStarter || 'X';
    const wasDraw = gameState.winner === 'draw';
    const newStarter: 'X' | 'O' = wasDraw 
      ? (lastStarter === 'X' ? 'O' : 'X')  // Alternate after draw
      : (gameState.winner === lastStarter ? lastStarter : (lastStarter === 'X' ? 'O' : 'X')); // Winner starts or alternate

    const newState: ExtendedGameState = {
      board: Array(9).fill(null) as TicTacToeCell[],
      currentPlayer: newStarter,
      winner: null,
      winningLine: null,
      roundScores: gameState.roundScores,
      draws: gameState.draws || 0,
      roundNumber: gameState.roundNumber || 1,
      lastStarter: newStarter,
    };

    await supabase
      .from('matches')
      .update({
        game_state: newState as unknown as Database['public']['Tables']['matches']['Update']['game_state'],
        state: 'active',
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
          <div className="flex items-center gap-2">
            <Badge className={match.state === 'active' ? 'bg-success' : match.state === 'waiting' ? 'bg-warning' : 'bg-muted'}>
              {match.state === 'waiting' ? 'Waiting' : match.state === 'active' ? 'Playing' : 'Complete'}
            </Badge>
            <GameInstructions gameType={match.game_type} />
          </div>
          <Button variant="ghost" size="sm" onClick={handleCopyLink}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4">
        {/* Responsible Gaming Banner */}
        <ResponsibleGamingBanner />

        {/* Round Score Tracker (for multi-round matches) */}
        {totalRounds > 1 && (
          <RoundScoreTracker
            totalRounds={totalRounds}
            currentRound={match.current_round}
            playerScore={myScore}
            opponentScore={opponentScore}
            playerName="You"
            opponentName={(opponent as any)?.profiles?.display_name || 'Opponent'}
          />
        )}

        {/* Prize Pool */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {/* Player 1 (You) */}
              <div className="flex items-center gap-2">
                <Avatar className={`h-10 w-10 border-2 ${isMyTurn && match.state === 'active' && !gameState.winner ? 'border-primary ring-2 ring-primary/50' : 'border-border'}`}>
                  <AvatarFallback className="bg-primary/20 text-primary font-display">
                    {playerSymbol}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">You</p>
                  <p className="text-xs text-muted-foreground">{playerSymbol}</p>
                </div>
              </div>

              {/* Prize and Round Info */}
              <div className="text-center">
                <Badge variant="outline" className="mb-1">VS</Badge>
                <p className="text-xs text-success font-bold">${totalPrize} Prize</p>
                {(gameState.draws || 0) > 0 && (
                  <p className="text-xs text-warning mt-1">Draws: {gameState.draws}</p>
                )}
              </div>

              {/* Player 2 (Opponent) */}
              {opponent ? (
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="font-medium text-sm">{(opponent as any).profiles?.display_name || 'Opponent'}</p>
                    <p className="text-xs text-muted-foreground">{opponent.player_symbol}</p>
                  </div>
                  <Avatar className={`h-10 w-10 border-2 ${!isMyTurn && match.state === 'active' && !gameState.winner ? 'border-accent ring-2 ring-accent/50' : 'border-border'}`}>
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
                Share the code or link below to invite someone
              </p>
              
              {inviteCode && (
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Invite Code</p>
                  <button 
                    onClick={handleCopyCode}
                    className="bg-muted px-6 py-3 rounded-lg font-mono text-2xl tracking-widest font-bold hover:bg-muted/80 transition-colors"
                  >
                    {inviteCode}
                  </button>
                </div>
              )}
              
              <Button onClick={handleCopyLink} variant="outline" className="w-full">
                <Copy className="h-4 w-4 mr-2" />
                Copy Match Link
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50">
            <CardContent className="p-4">
              {/* Render game based on type */}
              {isCupPong ? (
                <CupPongGame
                  state={cupPongState}
                  playerRole={cupPongPlayerRole}
                  onThrow={handleCupPongThrow}
                  disabled={!isCupPongMyTurn || !!cupPongState.winner}
                />
              ) : (
                <>
                  {/* Turn indicator */}
                  {!gameState.winner && !matchWinner && (
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
                      disabled={!isMyTurn || !!gameState.winner || !!matchWinner}
                    />
                  </div>
                </>
              )}
                />
              </div>

              {/* Round over (but match continues) */}
              {gameState.winner && !matchWinner && (
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
                    <p className="font-display font-bold text-lg">
                      {gameState.winner === playerSymbol ? 'Round Won!' : gameState.winner === 'draw' ? "Round Draw!" : 'Round Lost'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {totalRounds > 1 && `First to ${roundsToWin} wins the match`}
                    </p>
                  </div>
                  <Button onClick={handleNextRound} variant="neon" size="lg" className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Next Round
                  </Button>
                </motion.div>
              )}

              {/* Match over */}
              {matchWinner && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 text-center"
                >
                  <div className={`p-4 rounded-xl mb-4 ${
                    matchWinner === 'player' 
                      ? 'bg-success/10 border border-success/30' 
                      : 'bg-destructive/10 border border-destructive/30'
                  }`}>
                    <Trophy className={`h-8 w-8 mx-auto mb-2 ${
                      matchWinner === 'player' ? 'text-success' : 'text-destructive'
                    }`} />
                    <p className="font-display font-bold text-lg">
                      {matchWinner === 'player' ? 'You Won the Match!' : 'Match Lost'}
                    </p>
                    {matchWinner === 'player' && (
                      <p className="text-success text-sm">+${(totalPrize * 0.95).toFixed(2)} (after 5% fee)</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Final Score: {myScore} - {opponentScore}
                    </p>
                  </div>
                  <Button onClick={() => navigate('/create')} variant="neon" size="lg" className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    New Match
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Winner Card Dialog */}
      {matchWinner === 'player' && match && opponent && (
        <WinnerCardDialog
          open={showWinnerCard}
          onOpenChange={setShowWinnerCard}
          winnerName={profile?.display_name || 'You'}
          winnerAvatar={profile?.avatar_url || undefined}
          opponentName={(opponent as any).profiles?.display_name || 'Opponent'}
          opponentAvatar={(opponent as any).profiles?.avatar_url || undefined}
          amountWon={(totalPrize * 0.95)}
          gameType={gameTypeLabels[match.game_type as keyof typeof gameTypeLabels]}
          finalScore={`${myScore} - ${opponentScore}`}
        />
      )}

      {/* Match Chat */}
      {match && myPlayer && match.state !== 'waiting' && (
        <MatchChat matchId={match.id} currentPlayerId={myPlayer.player_id} />
      )}
    </MobileLayout>
  );
};

export default MatchPage;
