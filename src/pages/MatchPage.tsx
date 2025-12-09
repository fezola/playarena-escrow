import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { TicTacToeBoard } from '@/components/games/TicTacToeBoard';
import { useTicTacToe } from '@/hooks/useTicTacToe';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAccount } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { Clock, DollarSign, Trophy, RefreshCw, ArrowLeft, Copy, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const MatchPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const { state, makeMove, resetGame } = useTicTacToe();

  const [playerSymbol] = useState<'X' | 'O'>('X');
  const [opponentAddress] = useState('0xABCD...1234');
  const [matchState, setMatchState] = useState<'waiting' | 'active' | 'complete'>('active');
  const [score, setScore] = useState({ player: 0, opponent: 0 });

  // Update score when game ends
  useEffect(() => {
    if (state.winner) {
      if (state.winner === playerSymbol) {
        setScore((prev) => ({ ...prev, player: prev.player + 1 }));
        toast({
          title: '🎉 You Won!',
          description: 'Great move! Ready for the next round?',
        });
      } else if (state.winner !== 'draw') {
        setScore((prev) => ({ ...prev, opponent: prev.opponent + 1 }));
        toast({
          title: 'Round Lost',
          description: 'Your opponent won this round.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: "It's a Draw!",
          description: 'Neither player could win this round.',
        });
      }
    }
  }, [state.winner, playerSymbol, toast]);

  const handleCellClick = (index: number) => {
    if (state.currentPlayer !== playerSymbol) {
      toast({
        title: "Not Your Turn",
        description: "Wait for your opponent to move.",
      });
      return;
    }
    makeMove(index);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: 'Link Copied',
      description: 'Share this link with your opponent!',
    });
  };

  const totalPrize = 50; // $25 x 2 players

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6">
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Lobby
        </Button>

        {/* Match Header */}
        <Card variant="glass" className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Player 1 */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-primary">
                  <AvatarFallback className="bg-primary/20 text-primary font-display">
                    {playerSymbol}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-display font-bold">You</p>
                  <p className="text-xs text-muted-foreground">
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                  </p>
                </div>
                <Badge variant="outline" className="border-primary text-primary">
                  {score.player}
                </Badge>
              </div>

              {/* VS */}
              <div className="text-center">
                <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground px-4 py-1">
                  VS
                </Badge>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-display font-bold text-success">${totalPrize}</span>
                  <span>Prize</span>
                </div>
              </div>

              {/* Player 2 */}
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-accent text-accent">
                  {score.opponent}
                </Badge>
                <div className="text-right">
                  <p className="font-display font-bold">Opponent</p>
                  <p className="text-xs text-muted-foreground">{opponentAddress}</p>
                </div>
                <Avatar className="h-12 w-12 border-2 border-accent">
                  <AvatarFallback className="bg-accent/20 text-accent font-display">
                    O
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Game Board */}
          <div className="lg:col-span-2">
            <Card variant="elevated" className="p-6">
              <div className="flex justify-center">
                <TicTacToeBoard
                  state={state}
                  onCellClick={handleCellClick}
                  playerSymbol={playerSymbol}
                  disabled={matchState !== 'active'}
                />
              </div>

              {/* Game Controls */}
              {state.winner && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 text-center"
                >
                  <Button onClick={resetGame} variant="neon" size="lg">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Play Again
                  </Button>
                </motion.div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Match Info */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-warning" />
                  Match Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Game</span>
                  <span className="font-medium">Tic Tac Toe</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Format</span>
                  <span className="font-medium">Best of 3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stake</span>
                  <span className="font-bold text-primary">$25 USDC</span>
                </div>
                <div className="flex justify-between border-t border-border pt-4">
                  <span className="text-muted-foreground">Total Prize</span>
                  <span className="font-bold text-success">${totalPrize} USDC</span>
                </div>
              </CardContent>
            </Card>

            {/* Share */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Invite Opponent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Share this link to invite someone to join your match.
                </p>
                <Button onClick={handleCopyLink} variant="outline" className="w-full">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Match Link
                </Button>
              </CardContent>
            </Card>

            {/* Move History would go here */}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MatchPage;
