import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RefreshCw, Shuffle, Send, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

const BOARD_SIZE = 15;

type CellType = 'normal' | 'double-letter' | 'triple-letter' | 'double-word' | 'triple-word' | 'center';

const getCellType = (row: number, col: number): CellType => {
  // Triple word scores
  if ((row === 0 || row === 7 || row === 14) && (col === 0 || col === 7 || col === 14)) {
    if (row === 7 && col === 7) return 'center';
    return 'triple-word';
  }
  // Double word scores
  if (row === col || row + col === 14) {
    if (row >= 1 && row <= 4) return 'double-word';
    if (row >= 10 && row <= 13) return 'double-word';
  }
  // Triple letter scores
  if ((row === 1 || row === 13) && (col === 5 || col === 9)) return 'triple-letter';
  if ((row === 5 || row === 9) && (col === 1 || col === 5 || col === 9 || col === 13)) return 'triple-letter';
  // Double letter scores
  if ((row === 0 || row === 14) && (col === 3 || col === 11)) return 'double-letter';
  if ((row === 2 || row === 12) && (col === 6 || col === 8)) return 'double-letter';
  if ((row === 3 || row === 11) && (col === 0 || col === 7 || col === 14)) return 'double-letter';
  if ((row === 6 || row === 8) && (col === 2 || col === 6 || col === 8 || col === 12)) return 'double-letter';
  if (row === 7 && (col === 3 || col === 11)) return 'double-letter';
  
  return 'normal';
};

const cellTypeStyles: Record<CellType, string> = {
  'normal': 'bg-card',
  'double-letter': 'bg-sky-500/30 border-sky-400/50',
  'triple-letter': 'bg-blue-600/40 border-blue-500/50',
  'double-word': 'bg-pink-500/30 border-pink-400/50',
  'triple-word': 'bg-red-500/40 border-red-400/50',
  'center': 'bg-primary/20 border-primary/50',
};

const letterPoints: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3,
  N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10,
};

const initialTiles = ['A', 'E', 'I', 'O', 'R', 'S', 'T'];

interface PlacedTile {
  letter: string;
  row: number;
  col: number;
  isNew?: boolean;
}

export function ScrabbleGame() {
  const [board, setBoard] = useState<(string | null)[][]>(
    Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
  );
  const [playerTiles, setPlayerTiles] = useState<string[]>(initialTiles);
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [scores, setScores] = useState({ player: 0, cpu: 0 });
  const [currentWordTiles, setCurrentWordTiles] = useState<PlacedTile[]>([]);
  const [message, setMessage] = useState<string>('Place tiles to form a word');

  const shuffleTiles = () => {
    setPlayerTiles([...playerTiles].sort(() => Math.random() - 0.5));
  };

  const handleCellClick = (row: number, col: number) => {
    if (board[row][col] !== null) return;
    if (selectedTile === null) return;

    const letter = playerTiles[selectedTile];
    const newBoard = board.map((r) => [...r]);
    newBoard[row][col] = letter;
    setBoard(newBoard);

    setCurrentWordTiles([...currentWordTiles, { letter, row, col, isNew: true }]);
    setPlayerTiles(playerTiles.filter((_, i) => i !== selectedTile));
    setSelectedTile(null);
  };

  const calculateWordScore = useCallback(() => {
    let score = 0;
    let wordMultiplier = 1;

    currentWordTiles.forEach(({ letter, row, col }) => {
      let letterScore = letterPoints[letter] || 0;
      const cellType = getCellType(row, col);

      if (cellType === 'double-letter') letterScore *= 2;
      if (cellType === 'triple-letter') letterScore *= 3;
      if (cellType === 'double-word' || cellType === 'center') wordMultiplier *= 2;
      if (cellType === 'triple-word') wordMultiplier *= 3;

      score += letterScore;
    });

    return score * wordMultiplier;
  }, [currentWordTiles]);

  const submitWord = () => {
    if (currentWordTiles.length === 0) return;

    const wordScore = calculateWordScore();
    setScores((prev) => ({ ...prev, player: prev.player + wordScore }));
    setCurrentWordTiles([]);
    setMessage(`+${wordScore} points!`);

    // Draw new tiles
    const newTiles = Array(currentWordTiles.length)
      .fill(null)
      .map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26)));
    setPlayerTiles([...playerTiles, ...newTiles]);

    // Simple CPU turn
    setTimeout(() => {
      const cpuScore = Math.floor(Math.random() * 15) + 5;
      setScores((prev) => ({ ...prev, cpu: prev.cpu + cpuScore }));
      setMessage(`CPU scored ${cpuScore} points`);
    }, 1000);
  };

  const resetGame = () => {
    setBoard(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)));
    setPlayerTiles(initialTiles);
    setSelectedTile(null);
    setCurrentWordTiles([]);
    setScores({ player: 0, cpu: 0 });
    setMessage('Place tiles to form a word');
  };

  return (
    <div className="flex flex-col items-center px-2 py-4">
      {/* Scores */}
      <div className="flex items-center justify-center gap-6 mb-4 w-full max-w-sm">
        <div className="flex-1 text-center p-2 rounded-xl bg-card border border-border">
          <p className="text-xs text-muted-foreground">You</p>
          <p className="font-display text-xl font-bold text-primary">{scores.player}</p>
        </div>
        <div className="flex-1 text-center p-2 rounded-xl bg-card border border-border">
          <p className="text-xs text-muted-foreground">CPU</p>
          <p className="font-display text-xl font-bold text-accent">{scores.cpu}</p>
        </div>
      </div>

      {/* Message */}
      <p className="text-sm text-muted-foreground mb-3">{message}</p>

      {/* Board */}
      <div className="w-full max-w-sm aspect-square border border-border rounded-lg overflow-hidden bg-amber-900/20">
        <div className="grid grid-cols-15 h-full gap-px p-px bg-border/30" style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)` }}>
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const cellType = getCellType(rowIndex, colIndex);
              const isNewTile = currentWordTiles.some(
                (t) => t.row === rowIndex && t.col === colIndex
              );

              return (
                <motion.button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  className={cn(
                    'aspect-square flex items-center justify-center text-[8px] font-bold border transition-all',
                    cellTypeStyles[cellType],
                    isNewTile && 'ring-1 ring-primary',
                    !cell && selectedTile !== null && 'hover:bg-primary/20'
                  )}
                >
                  {cell && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-full h-full flex items-center justify-center bg-amber-200 text-amber-900 rounded-sm"
                    >
                      {cell}
                    </motion.span>
                  )}
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      {/* Player Tiles */}
      <div className="flex gap-2 mt-4 mb-4">
        {playerTiles.map((tile, index) => (
          <motion.button
            key={`${tile}-${index}`}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSelectedTile(selectedTile === index ? null : index)}
            className={cn(
              'w-10 h-10 rounded-lg flex flex-col items-center justify-center font-bold text-lg',
              'bg-amber-200 text-amber-900 border-2 border-amber-400 shadow-md',
              selectedTile === index && 'ring-2 ring-primary scale-110'
            )}
          >
            <span>{tile}</span>
            <span className="text-[8px]">{letterPoints[tile]}</span>
          </motion.button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <Button variant="outline" size="sm" onClick={shuffleTiles}>
          <Shuffle className="h-4 w-4 mr-2" />
          Shuffle
        </Button>
        <Button 
          variant="neon" 
          size="sm" 
          onClick={submitWord}
          disabled={currentWordTiles.length === 0}
        >
          <Send className="h-4 w-4 mr-2" />
          Submit (+{calculateWordScore()})
        </Button>
        <Button variant="outline" size="sm" onClick={resetGame}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-2 mt-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 bg-pink-500/30 rounded" /> 2x Word
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500/40 rounded" /> 3x Word
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 bg-sky-500/30 rounded" /> 2x Letter
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-600/40 rounded" /> 3x Letter
        </span>
      </div>
    </div>
  );
}
