export type GameType = 
  | 'tic-tac-toe' 
  | 'chess' 
  | 'scrabble'
  | 'rock-paper-scissors'
  | 'checkers'
  | 'dots-and-boxes'
  | 'sports-prediction';

export interface Player {
  id: string;
  address: string;
  displayName?: string;
  avatar?: string;
  hasDeposited: boolean;
}

export interface Match {
  id: string;
  gameType: GameType;
  stakeAmount: number;
  currency: string;
  playersRequired: number;
  players: Player[];
  rounds: number;
  currentRound: number;
  state: 'waiting' | 'depositing' | 'active' | 'complete' | 'cancelled';
  winner?: Player;
  createdAt: Date;
  creatorAddress: string;
}

export interface Move {
  matchId: string;
  roundNumber: number;
  playerId: string;
  data: unknown;
  timestamp: Date;
}

// Tic Tac Toe specific types
export type TicTacToeCell = 'X' | 'O' | null;
export type TicTacToeBoard = TicTacToeCell[];

export interface TicTacToeState {
  board: TicTacToeBoard;
  currentPlayer: 'X' | 'O';
  winner: 'X' | 'O' | 'draw' | null;
  winningLine: number[] | null;
}

// Chess specific types
export interface ChessState {
  fen: string;
  turn: 'w' | 'b';
  gameOver: boolean;
  winner: 'w' | 'b' | 'draw' | null;
  lastMove?: { from: string; to: string };
}

// Rock Paper Scissors types
export type RPSChoice = 'rock' | 'paper' | 'scissors' | null;

export interface RPSState {
  player1Choice: RPSChoice;
  player2Choice: RPSChoice;
  revealed: boolean;
  winner: 'player1' | 'player2' | 'draw' | null;
  roundHistory: { player1: RPSChoice; player2: RPSChoice; winner: string }[];
}

// Checkers types
export type CheckersPiece = 'r' | 'R' | 'b' | 'B' | null;

export interface CheckersState {
  board: CheckersPiece[][];
  currentPlayer: 'r' | 'b';
  winner: 'r' | 'b' | 'draw' | null;
  selectedPiece: { row: number; col: number } | null;
  validMoves: { row: number; col: number }[];
  mustJump: boolean;
}

export const gameTypeLabels: Record<GameType, string> = {
  'tic-tac-toe': 'Tic Tac Toe',
  'chess': 'Chess',
  'scrabble': 'Scrabble',
  'rock-paper-scissors': 'Rock Paper Scissors',
  'checkers': 'Checkers',
  'dots-and-boxes': 'Dots & Boxes',
  'sports-prediction': 'Sports Prediction',
};

export const gameTypeIcons: Record<GameType, string> = {
  'tic-tac-toe': '⭕',
  'chess': '♟️',
  'scrabble': '🔤',
  'rock-paper-scissors': '✊',
  'checkers': '🏁',
  'dots-and-boxes': '⬛',
  'sports-prediction': '⚽',
};
