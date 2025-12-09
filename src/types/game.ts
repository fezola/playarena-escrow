export type GameType = 'tic-tac-toe' | 'chess' | 'scrabble';

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

export const gameTypeLabels: Record<GameType, string> = {
  'tic-tac-toe': 'Tic Tac Toe',
  'chess': 'Chess',
  'scrabble': 'Scrabble',
};

export const gameTypeIcons: Record<GameType, string> = {
  'tic-tac-toe': '⭕',
  'chess': '♟️',
  'scrabble': '🔤',
};
