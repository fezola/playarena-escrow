import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BattleshipState, BattleshipCell } from '@/types/game';
import { Target, Ship, Waves } from 'lucide-react';

interface BattleshipGameProps {
  state: BattleshipState;
  onCellClick: (row: number, col: number) => void;
  onPlaceShip?: (ships: { row: number; col: number }[]) => void;
  isPlayer1: boolean;
  disabled?: boolean;
}

export function BattleshipGame({ state, onCellClick, onPlaceShip, isPlayer1, disabled }: BattleshipGameProps) {
  const [selectedCells, setSelectedCells] = useState<{ row: number; col: number }[]>([]);
  
  const myBoard = isPlayer1 ? state.player1Board : state.player2Board;
  const opponentShots = isPlayer1 ? state.player2Shots : state.player1Shots;
  const myShots = isPlayer1 ? state.player1Shots : state.player2Shots;
  const isMyTurn = state.currentPlayer === (isPlayer1 ? 'player1' : 'player2');

  const getCellDisplay = (cell: BattleshipCell, isOpponentBoard: boolean) => {
    switch (cell) {
      case 'hit':
        return <div className="w-full h-full bg-red-500 flex items-center justify-center text-white">💥</div>;
      case 'miss':
        return <div className="w-full h-full bg-blue-300 flex items-center justify-center">🌊</div>;
      case 'ship':
        return isOpponentBoard ? null : <div className="w-full h-full bg-gray-600 flex items-center justify-center">🚢</div>;
      default:
        return null;
    }
  };

  const handleCellClick = (row: number, col: number, isOpponentBoard: boolean) => {
    if (disabled) return;
    
    if (state.phase === 'setup' && !isOpponentBoard) {
      // During setup, select cells for ship placement
      const isSelected = selectedCells.some(c => c.row === row && c.col === col);
      if (isSelected) {
        setSelectedCells(prev => prev.filter(c => !(c.row === row && c.col === col)));
      } else if (selectedCells.length < 5) { // 5 ship cells total
        setSelectedCells(prev => [...prev, { row, col }]);
      }
    } else if (state.phase === 'playing' && isOpponentBoard && isMyTurn) {
      // During play, fire at opponent's board
      if (myShots[row][col] === 'empty') {
        onCellClick(row, col);
      }
    }
  };

  const handleConfirmPlacement = () => {
    if (selectedCells.length === 5 && onPlaceShip) {
      onPlaceShip(selectedCells);
      setSelectedCells([]);
    }
  };

  const renderBoard = (
    board: BattleshipCell[][], 
    shots: BattleshipCell[][] | null, 
    isOpponentBoard: boolean,
    title: string
  ) => (
    <div className="flex flex-col items-center">
      <p className="text-sm font-medium mb-2">{title}</p>
      <div className="grid grid-cols-10 gap-0.5 bg-blue-900 p-1 rounded-lg">
        {board.map((row, rowIndex) => (
          row.map((cell, colIndex) => {
            const shotCell = shots?.[rowIndex]?.[colIndex];
            const displayCell = shotCell && shotCell !== 'empty' ? shotCell : cell;
            const isSelected = selectedCells.some(c => c.row === rowIndex && c.col === colIndex);
            
            return (
              <motion.div
                key={`${rowIndex}-${colIndex}`}
                whileHover={{ scale: 1.1 }}
                onClick={() => handleCellClick(rowIndex, colIndex, isOpponentBoard)}
                className={`w-6 h-6 sm:w-7 sm:h-7 cursor-pointer rounded-sm transition-all ${
                  displayCell === 'empty' || !displayCell
                    ? 'bg-blue-400 hover:bg-blue-300' 
                    : ''
                } ${
                  isSelected ? 'ring-2 ring-yellow-400 bg-yellow-400/50' : ''
                }`}
              >
                {getCellDisplay(displayCell, isOpponentBoard)}
              </motion.div>
            );
          })
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Status */}
      <div className="text-center">
        <h3 className="font-display font-bold text-lg mb-1">
          {state.phase === 'setup' 
            ? 'Place your ships!' 
            : state.winner 
              ? state.winner === (isPlayer1 ? 'player1' : 'player2')
                ? '🎉 You won!'
                : 'You lost'
              : isMyTurn 
                ? 'Your turn - fire at enemy!' 
                : "Opponent's turn..."}
        </h3>
        {state.phase === 'setup' && (
          <p className="text-sm text-muted-foreground">
            Select {5 - selectedCells.length} more cells for your ships
          </p>
        )}
      </div>

      {/* Boards */}
      <div className="flex flex-col sm:flex-row gap-6">
        {/* My board */}
        {renderBoard(myBoard, opponentShots, false, 'Your Fleet')}
        
        {/* Opponent's board (only during play) */}
        {state.phase === 'playing' && (
          renderBoard(
            Array(10).fill(null).map(() => Array(10).fill('empty')),
            myShots,
            true,
            'Enemy Waters'
          )
        )}
      </div>

      {/* Setup confirmation */}
      {state.phase === 'setup' && selectedCells.length === 5 && (
        <Button onClick={handleConfirmPlacement} variant="neon">
          <Ship className="h-4 w-4 mr-2" />
          Confirm Ship Placement
        </Button>
      )}

      {/* Legend */}
      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-gray-600 rounded-sm" />
          <span>Ship</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-500 rounded-sm" />
          <span>Hit</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-300 rounded-sm" />
          <span>Miss</span>
        </div>
      </div>
    </div>
  );
}

// Create initial state
export function createBattleshipState(): BattleshipState {
  const emptyBoard = (): BattleshipCell[][] => 
    Array(10).fill(null).map(() => Array(10).fill('empty'));
  
  return {
    player1Board: emptyBoard(),
    player2Board: emptyBoard(),
    player1Shots: emptyBoard(),
    player2Shots: emptyBoard(),
    currentPlayer: 'player1',
    phase: 'setup',
    winner: null,
  };
}

// Check if all ships are sunk
export function checkBattleshipWinner(state: BattleshipState): 'player1' | 'player2' | null {
  const countShips = (board: BattleshipCell[][]): number => {
    let count = 0;
    for (const row of board) {
      for (const cell of row) {
        if (cell === 'ship') count++;
      }
    }
    return count;
  };
  
  if (countShips(state.player1Board) === 0) return 'player2';
  if (countShips(state.player2Board) === 0) return 'player1';
  return null;
}