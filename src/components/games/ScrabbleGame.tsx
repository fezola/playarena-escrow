import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RefreshCw, Shuffle, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

const BOARD_SIZE = 15;

type CellType = 'normal' | 'double-letter' | 'triple-letter' | 'double-word' | 'triple-word' | 'center';

const getCellType = (row: number, col: number): CellType => {
  if ((row === 0 || row === 7 || row === 14) && (col === 0 || col === 7 || col === 14)) {
    if (row === 7 && col === 7) return 'center';
    return 'triple-word';
  }
  if (row === col || row + col === 14) {
    if (row >= 1 && row <= 4) return 'double-word';
    if (row >= 10 && row <= 13) return 'double-word';
  }
  if ((row === 1 || row === 13) && (col === 5 || col === 9)) return 'triple-letter';
  if ((row === 5 || row === 9) && (col === 1 || col === 5 || col === 9 || col === 13)) return 'triple-letter';
  if ((row === 0 || row === 14) && (col === 3 || col === 11)) return 'double-letter';
  if ((row === 2 || row === 12) && (col === 6 || col === 8)) return 'double-letter';
  if ((row === 3 || row === 11) && (col === 0 || col === 7 || col === 14)) return 'double-letter';
  if ((row === 6 || row === 8) && (col === 2 || col === 6 || col === 8 || col === 12)) return 'double-letter';
  if (row === 7 && (col === 3 || col === 11)) return 'double-letter';
  
  return 'normal';
};

const cellTypeStyles: Record<CellType, string> = {
  'normal': 'bg-card',
  'double-letter': 'bg-sky-500/30',
  'triple-letter': 'bg-blue-600/40',
  'double-word': 'bg-pink-500/30',
  'triple-word': 'bg-red-500/40',
  'center': 'bg-primary/20',
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
}

export function ScrabbleGame() {
  const [board, setBoard] = useState<(string | null)[][]>(
    Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
  );
  const [playerTiles, setPlayerTiles] = useState<string[]>(initialTiles);
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [scores, setScores] = useState({ player: 0, cpu: 0 });
  const [currentWordTiles, setCurrentWordTiles] = useState<PlacedTile[]>([]);
  const [message, setMessage] = useState<string>('Tap a tile, then tap the board');

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

    setCurrentWordTiles([...currentWordTiles, { letter, row, col }]);
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

    const newTiles = Array(currentWordTiles.length)
      .fill(null)
      .map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26)));
    setPlayerTiles([...playerTiles, ...newTiles]);

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
    setMessage('Tap a tile, then tap the board');
  };

  return (
    <div className="flex flex-col items-center py-3 space-y-3">
      {/* Scores */}
      <div className="flex items-center justify-center gap-3 w-full">
        <div className="flex-1 text-center py-2 px-3 rounded-lg bg-card border border-border">
          <p className="text-[10px] text-muted-foreground">You</p>
          <p className="font-display text-lg font-bold text-primary">{scores.player}</p>
        </div>
        <div className="flex-1 text-center py-2 px-3 rounded-lg bg-card border border-border">
          <p className="text-[10px] text-muted-foreground">CPU</p>
          <p className="font-display text-lg font-bold text-accent">{scores.cpu}</p>
        </div>
      </div>

      {/* Message */}
      <p className="text-xs text-muted-foreground">{message}</p>

      {/* Board - Smaller to fit everything */}
      <div 
        className="w-full border border-border rounded-lg overflow-hidden bg-amber-900/20"
        style={{ maxWidth: 'min(100%, 320px)', aspectRatio: '1/1' }}
      >
        <div 
          className="grid h-full w-full gap-[1px] p-[1px] bg-border/30"
          style={{ 
            gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`
          }}
        >
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const cellType = getCellType(rowIndex, colIndex);
              const isNewTile = currentWordTiles.some(
                (t) => t.row === rowIndex && t.col === colIndex
              );

              return (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  className={cn(
                    'flex items-center justify-center transition-all',
                    cellTypeStyles[cellType],
                    isNewTile && 'ring-1 ring-primary',
                    !cell && selectedTile !== null && 'hover:bg-primary/20'
                  )}
                >
                  {cell && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-full h-full flex items-center justify-center bg-amber-200 text-amber-900 text-[8px] font-bold rounded-[1px]"
                    >
                      {cell}
                    </motion.span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Player Tiles */}
      <div className="flex gap-1.5 flex-wrap justify-center">
        {playerTiles.map((tile, index) => (
          <motion.button
            key={`${tile}-${index}`}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSelectedTile(selectedTile === index ? null : index)}
            className={cn(
              'w-8 h-8 rounded-md flex flex-col items-center justify-center font-bold',
              'bg-amber-200 text-amber-900 border-2 border-amber-400 shadow',
              selectedTile === index && 'ring-2 ring-primary scale-105'
            )}
          >
            <span className="text-sm leading-none">{tile}</span>
            <span className="text-[7px] leading-none">{letterPoints[tile]}</span>
          </motion.button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-2 flex-wrap justify-center">
        <Button variant="outline" size="sm" onClick={shuffleTiles} className="h-8 text-xs">
          <Shuffle className="h-3 w-3 mr-1" />
          Shuffle
        </Button>
        <Button 
          variant="neon" 
          size="sm" 
          onClick={submitWord}
          disabled={currentWordTiles.length === 0}
          className="h-8 text-xs"
        >
          <Send className="h-3 w-3 mr-1" />
          Submit (+{calculateWordScore()})
        </Button>
        <Button variant="outline" size="sm" onClick={resetGame} className="h-8 text-xs">
          <RefreshCw className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 text-[8px] text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <div className="w-2 h-2 bg-pink-500/30 rounded-sm" /> 2xW
        </span>
        <span className="flex items-center gap-0.5">
          <div className="w-2 h-2 bg-red-500/40 rounded-sm" /> 3xW
        </span>
        <span className="flex items-center gap-0.5">
          <div className="w-2 h-2 bg-sky-500/30 rounded-sm" /> 2xL
        </span>
        <span className="flex items-center gap-0.5">
          <div className="w-2 h-2 bg-blue-600/40 rounded-sm" /> 3xL
        </span>
      </div>
    </div>
  );
}
