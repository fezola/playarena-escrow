import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TicTacToeBoard as BoardType, TicTacToeState } from '@/types/game';

interface TicTacToeBoardProps {
  state: TicTacToeState;
  onCellClick?: (index: number) => void;
  disabled?: boolean;
  playerSymbol?: 'X' | 'O';
}

export function TicTacToeBoard({
  state,
  onCellClick,
  disabled = false,
  playerSymbol,
}: TicTacToeBoardProps) {
  const { board, currentPlayer, winner, winningLine } = state;
  const isMyTurn = playerSymbol === currentPlayer;
  const isGameOver = winner !== null;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Turn Indicator */}
      <div className="text-center">
        {isGameOver ? (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-display text-2xl font-bold"
          >
            {winner === 'draw' ? (
              <span className="text-warning">It's a Draw!</span>
            ) : (
              <span className={winner === 'X' ? 'text-primary' : 'text-accent'}>
                {winner} Wins!
              </span>
            )}
          </motion.div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground font-medium">Current Turn:</span>
            <span
              className={cn(
                'font-display text-2xl font-bold transition-colors',
                currentPlayer === 'X' ? 'text-primary' : 'text-accent'
              )}
            >
              {currentPlayer}
            </span>
            {playerSymbol && (
              <span className="text-sm text-muted-foreground">
                {isMyTurn ? '(Your turn)' : '(Waiting...)'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Board */}
      <div className="relative">
        <div className="grid grid-cols-3 gap-3 p-4 bg-secondary/30 rounded-2xl">
          {board.map((cell, index) => {
            const isWinningCell = winningLine?.includes(index);
            const row = Math.floor(index / 3);
            const col = index % 3;

            return (
              <motion.button
                key={index}
                onClick={() => onCellClick?.(index)}
                disabled={disabled || cell !== null || isGameOver || !isMyTurn}
                className={cn(
                  'game-cell w-20 h-20 sm:w-24 sm:h-24 rounded-xl font-display text-4xl font-bold',
                  isWinningCell && 'bg-success/20 border-success shadow-lg shadow-success/20',
                  !cell && isMyTurn && !isGameOver && 'cursor-pointer',
                  cell === 'X' && 'text-primary',
                  cell === 'O' && 'text-accent'
                )}
                whileHover={!cell && isMyTurn && !isGameOver ? { scale: 1.05 } : {}}
                whileTap={!cell && isMyTurn && !isGameOver ? { scale: 0.95 } : {}}
              >
                <AnimatePresence mode="wait">
                  {cell && (
                    <motion.span
                      key={cell}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className={cn(
                        isWinningCell && 'glow-text'
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

        {/* Winning Line Overlay */}
        {winningLine && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 pointer-events-none"
          >
            <WinningLine cells={winningLine} />
          </motion.div>
        )}
      </div>
    </div>
  );
}

function WinningLine({ cells }: { cells: number[] }) {
  // Calculate line position based on winning cells
  const getLineStyle = () => {
    const patterns = {
      '0,1,2': { top: '16.67%', left: '5%', width: '90%', height: '4px', rotate: '0deg' },
      '3,4,5': { top: '50%', left: '5%', width: '90%', height: '4px', rotate: '0deg' },
      '6,7,8': { top: '83.33%', left: '5%', width: '90%', height: '4px', rotate: '0deg' },
      '0,3,6': { top: '5%', left: '16.67%', width: '4px', height: '90%', rotate: '0deg' },
      '1,4,7': { top: '5%', left: '50%', width: '4px', height: '90%', rotate: '0deg' },
      '2,5,8': { top: '5%', left: '83.33%', width: '4px', height: '90%', rotate: '0deg' },
      '0,4,8': { top: '50%', left: '50%', width: '130%', height: '4px', rotate: '45deg', transform: 'translate(-50%, -50%) rotate(45deg)' },
      '2,4,6': { top: '50%', left: '50%', width: '130%', height: '4px', rotate: '-45deg', transform: 'translate(-50%, -50%) rotate(-45deg)' },
    };

    const key = cells.sort((a, b) => a - b).join(',');
    return patterns[key as keyof typeof patterns] || {};
  };

  const style = getLineStyle();

  return (
    <motion.div
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="absolute bg-gradient-to-r from-success via-accent to-success rounded-full"
      style={{
        ...style,
        boxShadow: '0 0 20px hsl(var(--success))',
      }}
    />
  );
}
