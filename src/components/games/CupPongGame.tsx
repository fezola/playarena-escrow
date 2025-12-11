import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Target, RotateCcw } from 'lucide-react';

// Cup Pong State
export interface CupPongState {
  player1Cups: boolean[]; // true = cup still in play, false = eliminated
  player2Cups: boolean[]; // true = cup still in play, false = eliminated
  currentPlayer: 'player1' | 'player2';
  ballPosition: { x: number; y: number } | null;
  isAiming: boolean;
  aimAngle: number;
  aimPower: number;
  lastThrowResult: 'hit' | 'miss' | null;
  winner: 'player1' | 'player2' | null;
}

interface CupPongGameProps {
  state: CupPongState;
  playerRole: 'player1' | 'player2';
  onThrow: (targetCup: number) => void;
  disabled?: boolean;
}

// Cup arrangement - triangular formation (6 cups)
const CUP_POSITIONS = [
  { row: 0, cups: [0] },        // Back row: 1 cup
  { row: 1, cups: [1, 2] },     // Middle row: 2 cups
  { row: 2, cups: [3, 4, 5] },  // Front row: 3 cups
];

export function CupPongGame({ state, playerRole, onThrow, disabled }: CupPongGameProps) {
  const [selectedCup, setSelectedCup] = useState<number | null>(null);
  const [throwAnimation, setThrowAnimation] = useState(false);
  
  const isMyTurn = state.currentPlayer === playerRole;
  const myCups = playerRole === 'player1' ? state.player1Cups : state.player2Cups;
  const opponentCups = playerRole === 'player1' ? state.player2Cups : state.player1Cups;
  const myRemainingCups = myCups.filter(c => c).length;
  const opponentRemainingCups = opponentCups.filter(c => c).length;

  const handleCupClick = (cupIndex: number) => {
    if (!isMyTurn || disabled || state.winner || !opponentCups[cupIndex]) return;
    setSelectedCup(cupIndex);
  };

  const handleThrow = () => {
    if (selectedCup === null || !isMyTurn || disabled) return;
    
    setThrowAnimation(true);
    setTimeout(() => {
      onThrow(selectedCup);
      setSelectedCup(null);
      setThrowAnimation(false);
    }, 800);
  };

  const renderCupFormation = (cups: boolean[], isOpponent: boolean, flipped: boolean) => {
    return (
      <div className={cn("flex flex-col items-center gap-2", flipped && "rotate-180")}>
        {CUP_POSITIONS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-2">
            {row.cups.map((cupIndex) => {
              const isActive = cups[cupIndex];
              const isSelectable = isOpponent && isActive && isMyTurn && !disabled && !state.winner;
              const isSelected = isOpponent && selectedCup === cupIndex;
              
              return (
                <motion.button
                  key={cupIndex}
                  onClick={() => isOpponent && handleCupClick(cupIndex)}
                  disabled={!isSelectable}
                  className={cn(
                    "relative w-12 h-14 rounded-b-xl rounded-t-sm transition-all",
                    "flex items-center justify-center",
                    isActive 
                      ? isOpponent 
                        ? "bg-gradient-to-b from-red-400 to-red-600 shadow-lg" 
                        : "bg-gradient-to-b from-blue-400 to-blue-600 shadow-lg"
                      : "bg-muted/30 border-2 border-dashed border-muted-foreground/30",
                    isSelectable && "cursor-pointer hover:scale-110 hover:ring-2 hover:ring-warning",
                    isSelected && "ring-4 ring-warning scale-110",
                    !isSelectable && isActive && "cursor-default"
                  )}
                  whileHover={isSelectable ? { scale: 1.1 } : {}}
                  whileTap={isSelectable ? { scale: 0.95 } : {}}
                  animate={isSelected ? { y: [0, -5, 0] } : {}}
                  transition={{ repeat: isSelected ? Infinity : 0, duration: 0.5 }}
                >
                  {isActive && (
                    <>
                      {/* Cup shine effect */}
                      <div className="absolute top-1 left-2 w-2 h-4 bg-white/30 rounded-full" />
                      {/* Beer/liquid inside */}
                      <div className={cn(
                        "absolute bottom-1 left-1 right-1 h-8 rounded-b-lg",
                        isOpponent ? "bg-amber-300/50" : "bg-sky-300/50"
                      )} />
                    </>
                  )}
                  {!isActive && (
                    <span className="text-muted-foreground text-xs">✗</span>
                  )}
                </motion.button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center py-4 space-y-4">
      {/* Game Status */}
      <div className="text-center mb-2">
        {state.winner ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-xl font-display font-bold"
          >
            {state.winner === playerRole ? '🎉 You Won!' : '😔 You Lost'}
          </motion.div>
        ) : (
          <div className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium",
            isMyTurn ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
          )}>
            {isMyTurn ? "Your turn - Tap a cup to aim!" : "Opponent's turn..."}
          </div>
        )}
      </div>

      {/* Last throw result */}
      <AnimatePresence>
        {state.lastThrowResult && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              "text-lg font-bold",
              state.lastThrowResult === 'hit' ? "text-success" : "text-destructive"
            )}
          >
            {state.lastThrowResult === 'hit' ? '🎯 HIT!' : '💨 Miss!'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score Display */}
      <div className="flex items-center gap-8 text-sm">
        <div className="text-center">
          <p className="text-muted-foreground text-xs">Your Cups</p>
          <p className="font-display text-2xl font-bold text-primary">{myRemainingCups}</p>
        </div>
        <div className="text-muted-foreground font-bold">VS</div>
        <div className="text-center">
          <p className="text-muted-foreground text-xs">Their Cups</p>
          <p className="font-display text-2xl font-bold text-destructive">{opponentRemainingCups}</p>
        </div>
      </div>

      {/* Game Table */}
      <div className="relative w-full max-w-xs aspect-[3/4] bg-gradient-to-b from-amber-900/80 to-amber-950 rounded-2xl p-4 shadow-xl border-4 border-amber-800">
        {/* Table felt texture */}
        <div className="absolute inset-2 bg-green-800/20 rounded-xl" />
        
        {/* Opponent's cups (top) */}
        <div className="relative z-10 mb-8">
          <p className="text-center text-xs text-muted-foreground mb-2">Opponent</p>
          {renderCupFormation(opponentCups, true, false)}
        </div>

        {/* Ball animation during throw */}
        <AnimatePresence>
          {throwAnimation && (
            <motion.div
              initial={{ y: 100, scale: 1 }}
              animate={{ y: -80, scale: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white shadow-lg z-20"
            />
          )}
        </AnimatePresence>

        {/* Center divider */}
        <div className="border-t border-dashed border-amber-600/50 my-4" />

        {/* My cups (bottom) */}
        <div className="relative z-10 mt-8">
          {renderCupFormation(myCups, false, true)}
          <p className="text-center text-xs text-muted-foreground mt-2">You</p>
        </div>
      </div>

      {/* Throw Button */}
      {isMyTurn && !state.winner && (
        <div className="flex flex-col items-center gap-2">
          <Button
            onClick={handleThrow}
            disabled={selectedCup === null || disabled || throwAnimation}
            variant="neon"
            size="lg"
            className="gap-2"
          >
            <Target className="h-5 w-5" />
            {selectedCup !== null ? 'Throw Ball!' : 'Select a cup to aim'}
          </Button>
          {selectedCup !== null && (
            <p className="text-xs text-muted-foreground">
              Aiming at cup #{selectedCup + 1}
            </p>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="text-center text-xs text-muted-foreground max-w-xs">
        <p>🏆 First to eliminate all opponent cups wins!</p>
        <p>🎯 Hit a cup = get another throw!</p>
      </div>
    </div>
  );
}

// Initial state creator
export function createInitialCupPongState(): CupPongState {
  return {
    player1Cups: [true, true, true, true, true, true], // 6 cups
    player2Cups: [true, true, true, true, true, true], // 6 cups
    currentPlayer: 'player1',
    ballPosition: null,
    isAiming: false,
    aimAngle: 0,
    aimPower: 50,
    lastThrowResult: null,
    winner: null,
  };
}

// Game logic for processing a throw
export function processCupPongThrow(
  state: CupPongState, 
  targetCup: number,
  throwingPlayer: 'player1' | 'player2'
): CupPongState {
  const newState = { ...state };
  
  // Get opponent's cups
  const opponentCups = throwingPlayer === 'player1' 
    ? [...newState.player2Cups] 
    : [...newState.player1Cups];
  
  // Calculate hit probability (70% base chance, can be adjusted)
  const hitChance = 0.65 + Math.random() * 0.1; // 65-75% chance
  const isHit = Math.random() < hitChance;
  
  if (isHit && opponentCups[targetCup]) {
    // Hit! Remove the cup
    opponentCups[targetCup] = false;
    newState.lastThrowResult = 'hit';
    
    // Update the cups
    if (throwingPlayer === 'player1') {
      newState.player2Cups = opponentCups;
    } else {
      newState.player1Cups = opponentCups;
    }
    
    // Check for winner
    const opponentRemainingCups = opponentCups.filter(c => c).length;
    if (opponentRemainingCups === 0) {
      newState.winner = throwingPlayer;
    }
    
    // Hit = same player goes again (don't switch turns)
    // currentPlayer stays the same
  } else {
    // Miss - switch turns
    newState.lastThrowResult = 'miss';
    newState.currentPlayer = throwingPlayer === 'player1' ? 'player2' : 'player1';
  }
  
  return newState;
}
