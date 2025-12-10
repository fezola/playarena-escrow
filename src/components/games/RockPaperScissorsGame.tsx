import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RPSState, RPSChoice } from '@/types/game';

interface RPSGameProps {
  state: RPSState;
  onChoice: (choice: RPSChoice) => void;
  isPlayer1: boolean;
  disabled?: boolean;
}

const choices: { choice: RPSChoice; emoji: string; label: string; beats: RPSChoice }[] = [
  { choice: 'rock', emoji: '🪨', label: 'Rock', beats: 'scissors' },
  { choice: 'paper', emoji: '📄', label: 'Paper', beats: 'rock' },
  { choice: 'scissors', emoji: '✂️', label: 'Scissors', beats: 'paper' },
];

export function RockPaperScissorsGame({ state, onChoice, isPlayer1, disabled }: RPSGameProps) {
  const [selectedChoice, setSelectedChoice] = useState<RPSChoice>(null);
  
  const myChoice = isPlayer1 ? state.player1Choice : state.player2Choice;
  const opponentChoice = isPlayer1 ? state.player2Choice : state.player1Choice;
  const hasChosen = myChoice !== null;
  const opponentHasChosen = opponentChoice !== null;

  const handleChoice = (choice: RPSChoice) => {
    if (hasChosen || disabled) return;
    setSelectedChoice(choice);
    onChoice(choice);
  };

  const getResultText = () => {
    if (!state.revealed) return null;
    if (state.winner === 'draw') return "It's a draw!";
    if ((state.winner === 'player1' && isPlayer1) || (state.winner === 'player2' && !isPlayer1)) {
      return '🎉 You won this round!';
    }
    return 'You lost this round';
  };

  const getChoiceEmoji = (choice: RPSChoice) => {
    return choices.find(c => c.choice === choice)?.emoji || '❓';
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Status */}
      <div className="text-center">
        <h3 className="font-display font-bold text-lg mb-2">
          {state.revealed 
            ? getResultText()
            : hasChosen 
              ? 'Waiting for opponent...' 
              : 'Make your choice!'}
        </h3>
        <p className="text-sm text-muted-foreground">
          Round {state.roundHistory.length + 1}
        </p>
      </div>

      {/* Choices display when revealed */}
      {state.revealed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-8"
        >
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">You</p>
            <motion.div
              initial={{ rotateY: 180 }}
              animate={{ rotateY: 0 }}
              transition={{ duration: 0.5 }}
              className="text-6xl"
            >
              {getChoiceEmoji(myChoice)}
            </motion.div>
          </div>
          <div className="text-2xl font-bold text-muted-foreground">VS</div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Opponent</p>
            <motion.div
              initial={{ rotateY: 180 }}
              animate={{ rotateY: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-6xl"
            >
              {getChoiceEmoji(opponentChoice)}
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Choice buttons */}
      {!state.revealed && (
        <div className="flex gap-4">
          {choices.map(({ choice, emoji, label }) => {
            const isSelected = selectedChoice === choice || myChoice === choice;
            
            return (
              <motion.div
                key={choice}
                whileHover={!hasChosen && !disabled ? { scale: 1.1 } : {}}
                whileTap={!hasChosen && !disabled ? { scale: 0.95 } : {}}
              >
                <Button
                  variant={isSelected ? 'neon' : 'outline'}
                  size="lg"
                  onClick={() => handleChoice(choice)}
                  disabled={hasChosen || disabled}
                  className={`w-24 h-24 flex flex-col gap-2 ${isSelected ? 'ring-2 ring-primary' : ''}`}
                >
                  <span className="text-4xl">{emoji}</span>
                  <span className="text-xs">{label}</span>
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Waiting indicator */}
      {hasChosen && !state.revealed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xl">{getChoiceEmoji(myChoice)}</span>
          </div>
          <span className="text-muted-foreground">Locked in</span>
          {opponentHasChosen && (
            <span className="text-success">✓ Opponent ready</span>
          )}
        </motion.div>
      )}

      {/* Score tracker */}
      {state.roundHistory.length > 0 && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium text-center mb-2">Round History</p>
          <div className="flex gap-2 justify-center flex-wrap">
            {state.roundHistory.map((round, index) => {
              const won = (round.winner === 'player1' && isPlayer1) || (round.winner === 'player2' && !isPlayer1);
              const lost = (round.winner === 'player1' && !isPlayer1) || (round.winner === 'player2' && isPlayer1);
              
              return (
                <div
                  key={index}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    won ? 'bg-success text-success-foreground' : 
                    lost ? 'bg-destructive text-destructive-foreground' : 
                    'bg-muted-foreground/30'
                  }`}
                >
                  {won ? 'W' : lost ? 'L' : 'D'}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to create initial state
export function createRPSState(): RPSState {
  return {
    player1Choice: null,
    player2Choice: null,
    revealed: false,
    winner: null,
    roundHistory: [],
  };
}

// Determine winner of a round
export function determineRPSWinner(player1: RPSChoice, player2: RPSChoice): 'player1' | 'player2' | 'draw' | null {
  if (!player1 || !player2) return null;
  if (player1 === player2) return 'draw';
  
  const p1Wins = 
    (player1 === 'rock' && player2 === 'scissors') ||
    (player1 === 'paper' && player2 === 'rock') ||
    (player1 === 'scissors' && player2 === 'paper');
  
  return p1Wins ? 'player1' : 'player2';
}