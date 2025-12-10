import { motion } from 'framer-motion';
import { CheckersState, CheckersPiece } from '@/types/game';

interface CheckersGameProps {
  state: CheckersState;
  onCellClick: (row: number, col: number) => void;
  playerColor: 'r' | 'b';
  disabled?: boolean;
}

export function CheckersGame({ state, onCellClick, playerColor, disabled }: CheckersGameProps) {
  const isMyTurn = state.currentPlayer === playerColor;

  const isValidMoveTarget = (row: number, col: number) => {
    return state.validMoves.some(move => move.row === row && move.col === col);
  };

  const isSelected = (row: number, col: number) => {
    return state.selectedPiece?.row === row && state.selectedPiece?.col === col;
  };

  const getPieceDisplay = (piece: CheckersPiece) => {
    if (!piece) return null;
    
    const isKing = piece === 'R' || piece === 'B';
    const isRed = piece.toLowerCase() === 'r';
    
    return (
      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-lg ${
        isRed ? 'bg-red-500' : 'bg-gray-800'
      }`}>
        {isKing && (
          <span className="text-yellow-400 text-lg">♔</span>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Turn indicator */}
      <div className={`text-center py-2 px-4 rounded-lg ${
        isMyTurn && !state.winner ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
      }`}>
        <p className="text-sm font-medium">
          {state.winner 
            ? state.winner === 'draw' 
              ? "It's a draw!" 
              : state.winner === playerColor 
                ? '🎉 You won!' 
                : 'You lost'
            : state.mustJump 
              ? 'You must jump!'
              : isMyTurn 
                ? 'Your turn - select a piece' 
                : "Opponent's turn..."}
        </p>
      </div>

      {/* Board */}
      <div className="bg-amber-900 p-2 rounded-lg shadow-xl">
        <div className="grid grid-cols-8 gap-0">
          {state.board.map((row, rowIndex) => (
            row.map((cell, colIndex) => {
              const isDark = (rowIndex + colIndex) % 2 === 1;
              const isValidTarget = isValidMoveTarget(rowIndex, colIndex);
              const isSelectedCell = isSelected(rowIndex, colIndex);
              
              return (
                <motion.div
                  key={`${rowIndex}-${colIndex}`}
                  whileHover={!disabled && isMyTurn ? { scale: 1.02 } : {}}
                  onClick={() => !disabled && onCellClick(rowIndex, colIndex)}
                  className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center cursor-pointer transition-all ${
                    isDark ? 'bg-amber-800' : 'bg-amber-200'
                  } ${
                    isSelectedCell ? 'ring-2 ring-primary ring-inset' : ''
                  } ${
                    isValidTarget ? 'bg-green-500/50' : ''
                  }`}
                >
                  {cell && (
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      whileHover={!disabled && isMyTurn && cell.toLowerCase() === playerColor ? { scale: 1.1 } : {}}
                    >
                      {getPieceDisplay(cell)}
                    </motion.div>
                  )}
                </motion.div>
              );
            })
          ))}
        </div>
      </div>

      {/* Player legend */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-full ${playerColor === 'r' ? 'bg-red-500' : 'bg-gray-800'}`} />
          <span>You</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-full ${playerColor === 'r' ? 'bg-gray-800' : 'bg-red-500'}`} />
          <span>Opponent</span>
        </div>
      </div>
    </div>
  );
}

// Create initial checkers board
export function createCheckersState(): CheckersState {
  const board: CheckersPiece[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Place black pieces (top)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = 'b';
      }
    }
  }
  
  // Place red pieces (bottom)
  for (let row = 5; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = 'r';
      }
    }
  }
  
  return {
    board,
    currentPlayer: 'r', // Red goes first
    winner: null,
    selectedPiece: null,
    validMoves: [],
    mustJump: false,
  };
}

// Get valid moves for a piece
export function getValidMoves(
  state: CheckersState, 
  row: number, 
  col: number
): { row: number; col: number; isJump: boolean }[] {
  const piece = state.board[row][col];
  if (!piece) return [];
  
  const isKing = piece === 'R' || piece === 'B';
  const isRed = piece.toLowerCase() === 'r';
  const moves: { row: number; col: number; isJump: boolean }[] = [];
  
  // Direction multipliers (red moves up, black moves down, kings move both)
  const directions: number[] = [];
  if (isRed || isKing) directions.push(-1); // Up
  if (!isRed || isKing) directions.push(1);  // Down
  
  // Check each diagonal direction
  for (const rowDir of directions) {
    for (const colDir of [-1, 1]) {
      const newRow = row + rowDir;
      const newCol = col + colDir;
      
      if (newRow < 0 || newRow > 7 || newCol < 0 || newCol > 7) continue;
      
      const targetCell = state.board[newRow][newCol];
      
      if (targetCell === null) {
        // Regular move
        moves.push({ row: newRow, col: newCol, isJump: false });
      } else if (targetCell.toLowerCase() !== piece.toLowerCase()) {
        // Potential jump
        const jumpRow = newRow + rowDir;
        const jumpCol = newCol + colDir;
        
        if (jumpRow >= 0 && jumpRow <= 7 && jumpCol >= 0 && jumpCol <= 7) {
          if (state.board[jumpRow][jumpCol] === null) {
            moves.push({ row: jumpRow, col: jumpCol, isJump: true });
          }
        }
      }
    }
  }
  
  return moves;
}

// Check for winner
export function checkCheckersWinner(board: CheckersPiece[][]): 'r' | 'b' | 'draw' | null {
  let redCount = 0;
  let blackCount = 0;
  
  for (const row of board) {
    for (const cell of row) {
      if (cell?.toLowerCase() === 'r') redCount++;
      if (cell?.toLowerCase() === 'b') blackCount++;
    }
  }
  
  if (redCount === 0) return 'b';
  if (blackCount === 0) return 'r';
  
  return null;
}