import { useState, useCallback } from 'react';
import { TicTacToeState, TicTacToeBoard, TicTacToeCell } from '@/types/game';

const WINNING_COMBINATIONS = [
  [0, 1, 2], // top row
  [3, 4, 5], // middle row
  [6, 7, 8], // bottom row
  [0, 3, 6], // left column
  [1, 4, 7], // middle column
  [2, 5, 8], // right column
  [0, 4, 8], // diagonal top-left to bottom-right
  [2, 4, 6], // diagonal top-right to bottom-left
];

const initialBoard: TicTacToeBoard = Array(9).fill(null);

const initialState: TicTacToeState = {
  board: initialBoard,
  currentPlayer: 'X',
  winner: null,
  winningLine: null,
};

export function useTicTacToe() {
  const [state, setState] = useState<TicTacToeState>(initialState);

  const checkWinner = useCallback((board: TicTacToeBoard): { winner: TicTacToeCell | 'draw'; line: number[] | null } => {
    // Check for winner
    for (const combination of WINNING_COMBINATIONS) {
      const [a, b, c] = combination;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], line: combination };
      }
    }

    // Check for draw
    if (board.every((cell) => cell !== null)) {
      return { winner: 'draw', line: null };
    }

    return { winner: null, line: null };
  }, []);

  const makeMove = useCallback((index: number) => {
    setState((prev) => {
      // Can't move if game is over or cell is taken
      if (prev.winner !== null || prev.board[index] !== null) {
        return prev;
      }

      const newBoard = [...prev.board];
      newBoard[index] = prev.currentPlayer;

      const { winner, line } = checkWinner(newBoard);

      return {
        board: newBoard,
        currentPlayer: prev.currentPlayer === 'X' ? 'O' : 'X',
        winner,
        winningLine: line,
      };
    });
  }, [checkWinner]);

  const resetGame = useCallback(() => {
    setState(initialState);
  }, []);

  const applyMove = useCallback((index: number, player: 'X' | 'O') => {
    setState((prev) => {
      if (prev.board[index] !== null) return prev;

      const newBoard = [...prev.board];
      newBoard[index] = player;

      const { winner, line } = checkWinner(newBoard);

      return {
        board: newBoard,
        currentPlayer: player === 'X' ? 'O' : 'X',
        winner,
        winningLine: line,
      };
    });
  }, [checkWinner]);

  return {
    state,
    makeMove,
    resetGame,
    applyMove,
  };
}
