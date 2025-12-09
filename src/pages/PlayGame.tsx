import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MobileLayout } from '@/components/MobileLayout';
import { TicTacToeGame } from '@/components/games/TicTacToeGame';
import { ChessGame } from '@/components/games/ChessGame';
import { ScrabbleGame } from '@/components/games/ScrabbleGame';
import { GameType, gameTypeLabels, gameTypeIcons } from '@/types/game';
import { ArrowLeft, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PlayGame() {
  const { gameType } = useParams<{ gameType: GameType }>();
  const navigate = useNavigate();

  if (!gameType || !['tic-tac-toe', 'chess', 'scrabble'].includes(gameType)) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-screen px-4">
          <p>Game not found</p>
        </div>
      </MobileLayout>
    );
  }

  const handleBack = () => {
    navigate('/games');
  };

  const renderGame = () => {
    switch (gameType) {
      case 'tic-tac-toe':
        return <TicTacToeGame />;
      case 'chess':
        return <ChessGame />;
      case 'scrabble':
        return <ScrabbleGame />;
      default:
        return null;
    }
  };

  return (
    <MobileLayout>
      {/* Game Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-xl">{gameTypeIcons[gameType as GameType]}</span>
            <h1 className="font-display font-bold">
              {gameTypeLabels[gameType as GameType]}
            </h1>
          </div>

          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Match Info Bar */}
        <div className="flex items-center justify-center gap-6 px-4 py-2 bg-card/50 border-t border-border/30">
          <div className="flex items-center gap-1 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>vs CPU</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <DollarSign className="h-4 w-4 text-success" />
            <span className="font-medium text-success">Practice Mode</span>
          </div>
        </div>
      </header>

      {/* Game Area */}
      <main className="flex-1 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {renderGame()}
        </motion.div>
      </main>
    </MobileLayout>
  );
}
