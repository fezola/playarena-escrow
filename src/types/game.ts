export type GameType = 
  | 'tic-tac-toe' 
  | 'chess' 
  | 'scrabble'
  | 'connect-four'
  | 'rock-paper-scissors'
  | 'wordle'
  | 'checkers'
  | 'dots-and-boxes'
  | 'boggle'
  | 'pool'
  | 'ping-pong'
  | 'battleship'
  | 'trivia'
  | 'cup-pong';

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

// Connect Four types
export type ConnectFourCell = 'R' | 'Y' | null; // Red or Yellow
export type ConnectFourBoard = ConnectFourCell[][]; // 6 rows x 7 columns

export interface ConnectFourState {
  board: ConnectFourBoard;
  currentPlayer: 'R' | 'Y';
  winner: 'R' | 'Y' | 'draw' | null;
  winningCells: [number, number][] | null;
  lastMove: { row: number; col: number } | null;
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

// Wordle types
export type LetterStatus = 'correct' | 'present' | 'absent' | 'empty';

export interface WordleGuess {
  word: string;
  statuses: LetterStatus[];
}

export interface WordleState {
  targetWord: string;
  guesses: WordleGuess[];
  currentGuess: string;
  gameOver: boolean;
  winner: 'player1' | 'player2' | 'draw' | null;
  player1Guesses: number;
  player2Guesses: number;
  currentPlayer: 'player1' | 'player2';
}

// Checkers types
export type CheckersPiece = 'r' | 'R' | 'b' | 'B' | null; // lowercase = regular, uppercase = king

export interface CheckersState {
  board: CheckersPiece[][];
  currentPlayer: 'r' | 'b';
  winner: 'r' | 'b' | 'draw' | null;
  selectedPiece: { row: number; col: number } | null;
  validMoves: { row: number; col: number }[];
  mustJump: boolean;
}

// Battleship types
export type BattleshipCell = 'empty' | 'ship' | 'hit' | 'miss';

export interface BattleshipState {
  player1Board: BattleshipCell[][];
  player2Board: BattleshipCell[][];
  player1Shots: BattleshipCell[][];
  player2Shots: BattleshipCell[][];
  currentPlayer: 'player1' | 'player2';
  phase: 'setup' | 'playing' | 'finished';
  winner: 'player1' | 'player2' | null;
}

// Trivia types
export interface TriviaQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
}

export interface TriviaState {
  questions: TriviaQuestion[];
  currentQuestionIndex: number;
  player1Score: number;
  player2Score: number;
  player1Answer: number | null;
  player2Answer: number | null;
  revealed: boolean;
  winner: 'player1' | 'player2' | 'draw' | null;
}

export const gameTypeLabels: Record<GameType, string> = {
  'tic-tac-toe': 'Tic Tac Toe',
  'chess': 'Chess',
  'scrabble': 'Scrabble',
  'connect-four': 'Connect 4',
  'rock-paper-scissors': 'Rock Paper Scissors',
  'wordle': 'Wordle',
  'checkers': 'Checkers',
  'dots-and-boxes': 'Dots & Boxes',
  'boggle': 'Boggle',
  'pool': 'Pool',
  'ping-pong': 'Ping Pong',
  'battleship': 'Battleship',
  'trivia': 'Trivia',
  'cup-pong': 'Cup Pong',
};

export const gameTypeIcons: Record<GameType, string> = {
  'tic-tac-toe': '⭕',
  'chess': '♟️',
  'scrabble': '🔤',
  'connect-four': '🔴',
  'rock-paper-scissors': '✊',
  'wordle': '📝',
  'checkers': '🏁',
  'dots-and-boxes': '⬛',
  'boggle': '🎲',
  'pool': '🎱',
  'ping-pong': '🏓',
  'battleship': '🚢',
  'trivia': '🧠',
  'cup-pong': '🍺',
};