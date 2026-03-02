import { GameType } from '@/types/game';
import { TicTacToeGame } from './TicTacToeGame';
import { ChessGame } from './ChessGame';
import { ScrabbleGame } from './ScrabbleGame';
import { Lock } from 'lucide-react';

interface GameDemoPreviewProps {
  game: GameType;
}

function RPSDemo() {
  return (
    <div className="flex flex-col items-center gap-4 py-6 pointer-events-none">
      <p className="text-sm text-muted-foreground">Choose your move!</p>
      <div className="flex gap-4">
        {[
          { emoji: '🪨', label: 'Rock' },
          { emoji: '📄', label: 'Paper' },
          { emoji: '✂️', label: 'Scissors' },
        ].map(({ emoji, label }) => (
          <div
            key={label}
            className="w-20 h-20 rounded-xl border-2 border-border bg-card flex flex-col items-center justify-center gap-1"
          >
            <span className="text-3xl">{emoji}</span>
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Best of 3 rounds</p>
    </div>
  );
}

function CheckersDemo() {
  const board = Array(8).fill(null).map((_, row) =>
    Array(8).fill(null).map((_, col) => {
      const isDark = (row + col) % 2 === 1;
      if (!isDark) return null;
      if (row < 3) return 'b';
      if (row > 4) return 'r';
      return null;
    })
  );

  return (
    <div className="flex flex-col items-center py-4 pointer-events-none">
      <div className="w-48 h-48 border border-border rounded overflow-hidden">
        <div className="grid grid-cols-8 h-full w-full">
          {board.map((row, ri) =>
            row.map((cell, ci) => {
              const isDark = (ri + ci) % 2 === 1;
              return (
                <div
                  key={`${ri}-${ci}`}
                  className={`flex items-center justify-center ${isDark ? 'bg-amber-800' : 'bg-amber-200'}`}
                >
                  {cell && (
                    <div className={`w-3.5 h-3.5 rounded-full ${cell === 'r' ? 'bg-red-500' : 'bg-gray-800'}`} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">Jump & capture opponent pieces</p>
    </div>
  );
}

function ComingSoonDemo({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Lock className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{label} - Coming Soon</p>
    </div>
  );
}

function SportsPredictionDemo() {
  return (
    <div className="flex flex-col items-center py-4 pointer-events-none gap-3">
      <div className="w-full max-w-[240px] p-3 rounded-lg bg-muted/50 border border-border/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Premier League</span>
          <span className="text-[10px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded">LIVE</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-xl">⚽</p>
            <p className="text-xs font-medium">Team A</p>
          </div>
          <div className="text-center px-3">
            <p className="font-display font-bold text-lg">2 - 1</p>
            <p className="text-[10px] text-muted-foreground">65'</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-xl">⚽</p>
            <p className="text-xs font-medium">Team B</p>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Predict scores & win the pot</p>
    </div>
  );
}

export function GameDemoPreview({ game }: GameDemoPreviewProps) {
  switch (game) {
    case 'tic-tac-toe':
      return (
        <div className="pointer-events-none px-4 py-2 transform scale-[0.75] origin-top -mb-16">
          <TicTacToeGame />
        </div>
      );
    case 'chess':
      return (
        <div className="pointer-events-none px-4 py-2 transform scale-[0.65] origin-top -mb-24">
          <ChessGame />
        </div>
      );
    case 'scrabble':
      return (
        <div className="pointer-events-none px-4 py-2 transform scale-[0.7] origin-top -mb-20">
          <ScrabbleGame />
        </div>
      );
    case 'rock-paper-scissors':
      return <RPSDemo />;
    case 'checkers':
      return <CheckersDemo />;
    case 'dots-and-boxes':
      return <ComingSoonDemo label="Dots & Boxes" />;
    case 'sports-prediction':
      return <SportsPredictionDemo />;
    default:
      return null;
  }
}
