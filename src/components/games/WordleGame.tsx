import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { WordleState, WordleGuess, LetterStatus } from '@/types/game';
import { Delete, CornerDownLeft } from 'lucide-react';

interface WordleGameProps {
  state: WordleState;
  onGuess: (word: string) => void;
  isMyTurn: boolean;
  disabled?: boolean;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
];

export function WordleGame({ state, onGuess, isMyTurn, disabled }: WordleGameProps) {
  const [currentGuess, setCurrentGuess] = useState('');
  const [shake, setShake] = useState(false);

  // Build keyboard letter statuses
  const getKeyboardStatuses = useCallback((): Record<string, LetterStatus> => {
    const statuses: Record<string, LetterStatus> = {};
    
    state.guesses.forEach(guess => {
      guess.word.split('').forEach((letter, index) => {
        const status = guess.statuses[index];
        const existing = statuses[letter];
        
        // Priority: correct > present > absent
        if (status === 'correct') {
          statuses[letter] = 'correct';
        } else if (status === 'present' && existing !== 'correct') {
          statuses[letter] = 'present';
        } else if (status === 'absent' && !existing) {
          statuses[letter] = 'absent';
        }
      });
    });
    
    return statuses;
  }, [state.guesses]);

  const keyboardStatuses = getKeyboardStatuses();

  const handleKeyPress = useCallback((key: string) => {
    if (disabled || !isMyTurn || state.gameOver) return;

    if (key === 'ENTER') {
      if (currentGuess.length === 5) {
        onGuess(currentGuess.toUpperCase());
        setCurrentGuess('');
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } else if (key === 'BACK') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < 5) {
      setCurrentGuess(prev => prev + key);
    }
  }, [currentGuess, disabled, isMyTurn, onGuess, state.gameOver]);

  // Handle physical keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleKeyPress('ENTER');
      } else if (e.key === 'Backspace') {
        handleKeyPress('BACK');
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKeyPress(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress]);

  const getStatusColor = (status: LetterStatus) => {
    switch (status) {
      case 'correct': return 'bg-success text-success-foreground border-success';
      case 'present': return 'bg-warning text-warning-foreground border-warning';
      case 'absent': return 'bg-muted text-muted-foreground border-muted';
      default: return 'bg-background border-border';
    }
  };

  const getKeyColor = (key: string) => {
    const status = keyboardStatuses[key];
    if (status === 'correct') return 'bg-success text-success-foreground';
    if (status === 'present') return 'bg-warning text-warning-foreground';
    if (status === 'absent') return 'bg-muted/50 text-muted-foreground';
    return 'bg-muted hover:bg-muted/80';
  };

  // Combine guesses with current input for display
  const displayRows: (WordleGuess | null)[] = [...state.guesses];
  while (displayRows.length < 6) {
    displayRows.push(null);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Status */}
      <div className="text-center">
        {state.gameOver ? (
          <p className="font-display font-bold text-lg">
            {state.winner === 'player1' ? 'Player 1 wins!' : state.winner === 'player2' ? 'Player 2 wins!' : "It's a draw!"}
          </p>
        ) : (
          <p className={`text-sm ${isMyTurn ? 'text-primary' : 'text-muted-foreground'}`}>
            {isMyTurn ? 'Your turn - guess the word!' : "Opponent's turn..."}
          </p>
        )}
      </div>

      {/* Grid */}
      <motion.div 
        className={`grid gap-1 ${shake ? 'animate-shake' : ''}`}
        animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {displayRows.map((guess, rowIndex) => {
          const isCurrentRow = rowIndex === state.guesses.length && !state.gameOver;
          const letters = guess ? guess.word.split('') : isCurrentRow ? currentGuess.padEnd(5, ' ').split('') : Array(5).fill('');
          const statuses = guess?.statuses || Array(5).fill('empty');

          return (
            <div key={rowIndex} className="flex gap-1">
              {letters.map((letter, colIndex) => (
                <motion.div
                  key={colIndex}
                  initial={guess ? { rotateX: 180 } : false}
                  animate={{ rotateX: 0 }}
                  transition={{ delay: colIndex * 0.15, duration: 0.3 }}
                  className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center text-xl font-bold border-2 rounded ${
                    guess 
                      ? getStatusColor(statuses[colIndex]) 
                      : isCurrentRow && letter.trim()
                        ? 'border-primary bg-background'
                        : 'border-border bg-background'
                  }`}
                >
                  {letter.trim()}
                </motion.div>
              ))}
            </div>
          );
        })}
      </motion.div>

      {/* Keyboard */}
      <div className="flex flex-col gap-1 mt-4">
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1 justify-center">
            {row.map((key) => (
              <Button
                key={key}
                variant="ghost"
                size="sm"
                onClick={() => handleKeyPress(key)}
                disabled={disabled || !isMyTurn || state.gameOver}
                className={`${
                  key === 'ENTER' || key === 'BACK' 
                    ? 'px-2 sm:px-3 min-w-[50px]' 
                    : 'w-8 sm:w-10'
                } h-12 font-bold ${getKeyColor(key)}`}
              >
                {key === 'ENTER' ? <CornerDownLeft className="h-4 w-4" /> : 
                 key === 'BACK' ? <Delete className="h-4 w-4" /> : key}
              </Button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Word list for Wordle (common 5-letter words)
const WORD_LIST = [
  'CRANE', 'SLATE', 'CRATE', 'TRACE', 'ADIEU', 'AUDIO', 'STARE', 'ROAST', 
  'RATIO', 'ARISE', 'RAISE', 'LEARN', 'RENAL', 'SAUCE', 'CAUSE', 'ACUTE',
  'LEAPT', 'PLANT', 'GIANT', 'SAINT', 'FAINT', 'PAINT', 'BRAIN', 'TRAIN',
  'GRAIN', 'DRAIN', 'PLAIN', 'CHAIN', 'CLAIM', 'FLAME', 'BLAME', 'SHAME',
  'FRAME', 'GRAPE', 'SHAPE', 'SHADE', 'BLADE', 'TRADE', 'GRADE', 'BRAVE',
  'GRAVE', 'SHAVE', 'SLAVE', 'STAVE', 'LEAVE', 'WEAVE', 'HEAVE', 'PEACE',
];

export function getRandomWord(): string {
  return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
}

export function checkWordleGuess(guess: string, target: string): LetterStatus[] {
  const result: LetterStatus[] = Array(5).fill('absent');
  const targetLetters = target.split('');
  const guessLetters = guess.toUpperCase().split('');
  
  // First pass: mark correct letters
  for (let i = 0; i < 5; i++) {
    if (guessLetters[i] === targetLetters[i]) {
      result[i] = 'correct';
      targetLetters[i] = '#'; // Mark as used
    }
  }
  
  // Second pass: mark present letters
  for (let i = 0; i < 5; i++) {
    if (result[i] === 'correct') continue;
    
    const targetIndex = targetLetters.indexOf(guessLetters[i]);
    if (targetIndex !== -1) {
      result[i] = 'present';
      targetLetters[targetIndex] = '#'; // Mark as used
    }
  }
  
  return result;
}

export function createWordleState(): WordleState {
  return {
    targetWord: getRandomWord(),
    guesses: [],
    currentGuess: '',
    gameOver: false,
    winner: null,
    player1Guesses: 0,
    player2Guesses: 0,
    currentPlayer: 'player1',
  };
}