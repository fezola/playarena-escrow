import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chess, Square, PieceSymbol, Color } from 'chess.js';
import { Button } from '@/components/ui/button';
import { RefreshCw, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const pieceUnicode: Record<Color, Record<PieceSymbol, string>> = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
};

export function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<Square[]>([]);
  const [scores, setScores] = useState({ player: 0, cpu: 0 });
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);

  const board = useMemo(() => game.board(), [game]);
  const isGameOver = game.isGameOver();
  const playerColor: Color = 'w';

  const getSquareName = (row: number, col: number): Square => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    return `${files[col]}${ranks[row]}` as Square;
  };

  const makeCPUMove = useCallback(() => {
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return;

    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    
    setTimeout(() => {
      const newGame = new Chess(game.fen());
      newGame.move(randomMove);
      setGame(newGame);
      setLastMove({ from: randomMove.from, to: randomMove.to });
    }, 500);
  }, [game]);

  const handleSquareClick = (row: number, col: number) => {
    if (isGameOver || game.turn() !== playerColor) return;

    const square = getSquareName(row, col);
    const piece = game.get(square);

    if (selectedSquare) {
      if (validMoves.includes(square)) {
        const newGame = new Chess(game.fen());
        try {
          newGame.move({ from: selectedSquare, to: square, promotion: 'q' });
          setGame(newGame);
          setLastMove({ from: selectedSquare, to: square });
          setSelectedSquare(null);
          setValidMoves([]);

          if (!newGame.isGameOver()) {
            makeCPUMove();
          }
        } catch {
          // Invalid move
        }
      } else if (piece && piece.color === playerColor) {
        setSelectedSquare(square);
        const moves = game.moves({ square, verbose: true });
        setValidMoves(moves.map((m) => m.to as Square));
      } else {
        setSelectedSquare(null);
        setValidMoves([]);
      }
    } else if (piece && piece.color === playerColor) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      setValidMoves(moves.map((m) => m.to as Square));
    }
  };

  const resetGameHandler = () => {
    if (isGameOver) {
      if (game.isCheckmate()) {
        if (game.turn() !== playerColor) {
          setScores((prev) => ({ ...prev, player: prev.player + 1 }));
        } else {
          setScores((prev) => ({ ...prev, cpu: prev.cpu + 1 }));
        }
      }
    }
    setGame(new Chess());
    setSelectedSquare(null);
    setValidMoves([]);
    setLastMove(null);
  };

  const undoMove = () => {
    const newGame = new Chess(game.fen());
    newGame.undo();
    newGame.undo();
    setGame(newGame);
    setSelectedSquare(null);
    setValidMoves([]);
  };

  const getGameStatus = () => {
    if (game.isCheckmate()) {
      return game.turn() !== playerColor ? 'Checkmate! You Won!' : 'Checkmate! CPU Wins!';
    }
    if (game.isDraw()) return "It's a Draw!";
    if (game.isCheck()) return 'Check!';
    return game.turn() === playerColor ? 'Your Turn (White)' : 'CPU Thinking...';
  };

  return (
    <div className="flex flex-col items-center py-4">
      {/* Score Display */}
      <div className="flex items-center justify-center gap-4 mb-3 w-full">
        <div className="flex-1 text-center p-2 rounded-xl bg-card border border-border">
          <p className="text-xs text-muted-foreground">You (White)</p>
          <p className="font-display text-xl font-bold">{scores.player}</p>
        </div>
        <div className="flex-1 text-center p-2 rounded-xl bg-card border border-border">
          <p className="text-xs text-muted-foreground">CPU (Black)</p>
          <p className="font-display text-xl font-bold">{scores.cpu}</p>
        </div>
      </div>

      {/* Status */}
      <div className="mb-3 text-center">
        <p className={cn(
          'text-sm font-medium',
          game.isCheck() && 'text-destructive',
          isGameOver && 'text-success'
        )}>
          {getGameStatus()}
        </p>
      </div>

      {/* Chess Board - Full width */}
      <div className="w-full aspect-square border-2 border-border rounded-lg overflow-hidden shadow-xl">
        <div className="grid grid-cols-8 h-full w-full">
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const square = getSquareName(rowIndex, colIndex);
              const isLight = (rowIndex + colIndex) % 2 === 0;
              const isSelected = selectedSquare === square;
              const isValidMove = validMoves.includes(square);
              const isLastMove = lastMove?.from === square || lastMove?.to === square;

              return (
                <button
                  key={square}
                  onClick={() => handleSquareClick(rowIndex, colIndex)}
                  className={cn(
                    'aspect-square flex items-center justify-center relative transition-colors',
                    isLight ? 'bg-amber-100' : 'bg-amber-800',
                    isSelected && 'ring-2 ring-primary ring-inset',
                    isLastMove && 'bg-primary/30'
                  )}
                >
                  {isValidMove && (
                    <div className={cn(
                      'absolute rounded-full z-10',
                      cell ? 'ring-2 ring-primary/50 w-full h-full bg-transparent' : 'w-3 h-3 bg-primary/40'
                    )} />
                  )}
                  <AnimatePresence>
                    {cell && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={cn(
                          'z-20 select-none text-2xl sm:text-3xl',
                          cell.color === 'w' ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' : 'text-gray-900'
                        )}
                      >
                        {pieceUnicode[cell.color][cell.type]}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 mt-4">
        {!isGameOver && game.history().length > 0 && (
          <Button variant="outline" size="sm" onClick={undoMove}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Undo
          </Button>
        )}
        
        <Button 
          variant={isGameOver ? 'neon' : 'outline'} 
          size="sm" 
          onClick={resetGameHandler}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {isGameOver ? 'Play Again' : 'New Game'}
        </Button>
      </div>
    </div>
  );
}
