import { motion } from 'framer-motion';
import { ConnectFourState, ConnectFourCell } from '@/types/game';

interface ConnectFourGameProps {
  state: ConnectFourState;
  onColumnClick: (col: number) => void;
  playerColor: 'R' | 'Y';
  disabled?: boolean;
}

export function ConnectFourGame({ state, onColumnClick, playerColor, disabled }: ConnectFourGameProps) {
  const isMyTurn = state.currentPlayer === playerColor;

  const getCellColor = (cell: ConnectFourCell, row: number, col: number) => {
    const isWinningCell = state.winningCells?.some(([r, c]) => r === row && c === col);
    
    if (cell === 'R') {
      return isWinningCell 
        ? 'bg-red-500 ring-4 ring-red-300 animate-pulse' 
        : 'bg-red-500';
    }
    if (cell === 'Y') {
      return isWinningCell 
        ? 'bg-yellow-400 ring-4 ring-yellow-200 animate-pulse' 
        : 'bg-yellow-400';
    }
    return 'bg-muted/50';
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Turn indicator */}
      <div className={`text-center py-2 px-4 rounded-lg ${isMyTurn && !state.winner ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
        <p className="text-sm font-medium">
          {state.winner 
            ? state.winner === 'draw' 
              ? "It's a draw!" 
              : state.winner === playerColor 
                ? '🎉 You won!' 
                : 'You lost'
            : isMyTurn 
              ? "Your turn - click a column!" 
              : "Opponent's turn..."}
        </p>
      </div>

      {/* Board */}
      <div className="bg-primary/90 p-3 rounded-xl shadow-lg">
        {/* Column click areas */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {[0, 1, 2, 3, 4, 5, 6].map((col) => (
            <button
              key={`header-${col}`}
              onClick={() => !disabled && isMyTurn && !state.winner && onColumnClick(col)}
              disabled={disabled || !isMyTurn || !!state.winner}
              className={`h-8 rounded-t-lg transition-all ${
                isMyTurn && !disabled && !state.winner
                  ? 'hover:bg-white/20 cursor-pointer'
                  : 'cursor-not-allowed'
              }`}
            >
              {isMyTurn && !state.winner && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  className={`w-8 h-8 mx-auto rounded-full ${playerColor === 'R' ? 'bg-red-500' : 'bg-yellow-400'}`}
                />
              )}
            </button>
          ))}
        </div>

        {/* Board cells */}
        <div className="grid grid-cols-7 gap-1">
          {state.board.map((row, rowIndex) => (
            row.map((cell, colIndex) => (
              <motion.div
                key={`${rowIndex}-${colIndex}`}
                initial={state.lastMove?.row === rowIndex && state.lastMove?.col === colIndex ? { y: -200 } : false}
                animate={{ y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${getCellColor(cell, rowIndex, colIndex)} transition-all shadow-inner`}
              />
            ))
          ))}
        </div>
      </div>

      {/* Player colors legend */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-full ${playerColor === 'R' ? 'bg-red-500' : 'bg-yellow-400'}`} />
          <span>You</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-full ${playerColor === 'R' ? 'bg-yellow-400' : 'bg-red-500'}`} />
          <span>Opponent</span>
        </div>
      </div>
    </div>
  );
}

// Helper to create initial state
export function createConnectFourState(): ConnectFourState {
  return {
    board: Array(6).fill(null).map(() => Array(7).fill(null)),
    currentPlayer: 'R',
    winner: null,
    winningCells: null,
    lastMove: null,
  };
}

// Check for winner
export function checkConnectFourWinner(board: ConnectFourCell[][]): { winner: 'R' | 'Y' | 'draw' | null; winningCells: [number, number][] | null } {
  const rows = 6;
  const cols = 7;

  // Check horizontal
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c <= cols - 4; c++) {
      const cell = board[r][c];
      if (cell && cell === board[r][c+1] && cell === board[r][c+2] && cell === board[r][c+3]) {
        return { winner: cell, winningCells: [[r,c], [r,c+1], [r,c+2], [r,c+3]] };
      }
    }
  }

  // Check vertical
  for (let r = 0; r <= rows - 4; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r][c];
      if (cell && cell === board[r+1][c] && cell === board[r+2][c] && cell === board[r+3][c]) {
        return { winner: cell, winningCells: [[r,c], [r+1,c], [r+2,c], [r+3,c]] };
      }
    }
  }

  // Check diagonal (down-right)
  for (let r = 0; r <= rows - 4; r++) {
    for (let c = 0; c <= cols - 4; c++) {
      const cell = board[r][c];
      if (cell && cell === board[r+1][c+1] && cell === board[r+2][c+2] && cell === board[r+3][c+3]) {
        return { winner: cell, winningCells: [[r,c], [r+1,c+1], [r+2,c+2], [r+3,c+3]] };
      }
    }
  }

  // Check diagonal (up-right)
  for (let r = 3; r < rows; r++) {
    for (let c = 0; c <= cols - 4; c++) {
      const cell = board[r][c];
      if (cell && cell === board[r-1][c+1] && cell === board[r-2][c+2] && cell === board[r-3][c+3]) {
        return { winner: cell, winningCells: [[r,c], [r-1,c+1], [r-2,c+2], [r-3,c+3]] };
      }
    }
  }

  // Check for draw
  const isFull = board[0].every(cell => cell !== null);
  if (isFull) {
    return { winner: 'draw', winningCells: null };
  }

  return { winner: null, winningCells: null };
}

// Make a move
export function makeConnectFourMove(state: ConnectFourState, col: number): ConnectFourState | null {
  // Find the lowest empty row in the column
  let targetRow = -1;
  for (let r = 5; r >= 0; r--) {
    if (state.board[r][col] === null) {
      targetRow = r;
      break;
    }
  }

  if (targetRow === -1) return null; // Column is full

  const newBoard = state.board.map(row => [...row]);
  newBoard[targetRow][col] = state.currentPlayer;

  const { winner, winningCells } = checkConnectFourWinner(newBoard);

  return {
    board: newBoard,
    currentPlayer: state.currentPlayer === 'R' ? 'Y' : 'R',
    winner,
    winningCells,
    lastMove: { row: targetRow, col },
  };
}