import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTicTacToe } from '@/hooks/useTicTacToe';
import { Button } from '@/components/ui/button';
import { RefreshCw, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TicTacToeGame() {
  const { state, makeMove, resetGame } = useTicTacToe();
  const [playerSymbol] = useState<'X' | 'O'>('X');
  const [scores, setScores] = useState({ player: 0, cpu: 0 });

  const handleCellClick = (index: number) => {
    if (state.board[index] || state.winner || state.currentPlayer !== playerSymbol) {
      return;
    }
    makeMove(index);

    // Simple CPU move after player
    setTimeout(() => {
      const emptyCells = state.board
        .map((cell, i) => (cell === null ? i : null))
        .filter((i): i is number => i !== null && i !== index);

      if (emptyCells.length > 0) {
        const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        makeMove(randomIndex);
      }
    }, 500);
  };

  const handlePlayAgain = () => {
    if (state.winner === playerSymbol) {
      setScores((prev) => ({ ...prev, player: prev.player + 1 }));
    } else if (state.winner && state.winner !== 'draw') {
      setScores((prev) => ({ ...prev, cpu: prev.cpu + 1 }));
    }
    resetGame();
  };

  return (
    <div className="flex flex-col items-center px-4 py-6">
      {/* Score Display */}
      <div className="flex items-center justify-center gap-8 mb-8 w-full max-w-xs">
        <div className="flex-1 text-center p-3 rounded-xl bg-primary/10 border border-primary/20">
          <p className="text-xs text-muted-foreground mb-1">You (X)</p>
          <p className="font-display text-2xl font-bold text-primary">{scores.player}</p>
        </div>
        <div className="text-muted-foreground font-display font-bold">VS</div>
        <div className="flex-1 text-center p-3 rounded-xl bg-accent/10 border border-accent/20">
          <p className="text-xs text-muted-foreground mb-1">CPU (O)</p>
          <p className="font-display text-2xl font-bold text-accent">{scores.cpu}</p>
        </div>
      </div>

      {/* Turn Indicator */}
      <AnimatePresence mode="wait">
        {!state.winner && (
          <motion.div
            key={state.currentPlayer}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-6 text-center"
          >
            <p className="text-sm text-muted-foreground">
              {state.currentPlayer === playerSymbol ? "Your turn" : "CPU thinking..."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Board */}
      <div className="grid grid-cols-3 gap-2 w-full max-w-xs aspect-square">
        {state.board.map((cell, index) => {
          const isWinningCell = state.winningLine?.includes(index);
          const isClickable = !cell && !state.winner && state.currentPlayer === playerSymbol;

          return (
            <motion.button
              key={index}
              whileTap={isClickable ? { scale: 0.95 } : undefined}
              onClick={() => handleCellClick(index)}
              className={cn(
                'aspect-square rounded-xl flex items-center justify-center text-4xl font-display font-bold transition-all',
                'bg-card border-2',
                isWinningCell && 'border-success bg-success/10',
                !isWinningCell && 'border-border',
                isClickable && 'hover:border-primary/50 hover:bg-primary/5 active:bg-primary/10',
                !isClickable && cell && 'cursor-default'
              )}
              disabled={!isClickable}
            >
              <AnimatePresence mode="wait">
                {cell && (
                  <motion.span
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className={cn(
                      cell === 'X' ? 'text-primary' : 'text-accent'
                    )}
                  >
                    {cell}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Winner Display */}
      <AnimatePresence>
        {state.winner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-8 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Trophy className={cn(
                'h-6 w-6',
                state.winner === playerSymbol ? 'text-success' : 
                state.winner === 'draw' ? 'text-warning' : 'text-destructive'
              )} />
              <p className="font-display text-xl font-bold">
                {state.winner === 'draw'
                  ? "It's a Draw!"
                  : state.winner === playerSymbol
                  ? 'You Won!'
                  : 'CPU Wins!'}
              </p>
            </div>

            <Button onClick={handlePlayAgain} variant="neon" size="lg">
              <RefreshCw className="h-4 w-4 mr-2" />
              Play Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
