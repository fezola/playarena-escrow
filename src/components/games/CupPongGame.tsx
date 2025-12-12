import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { cn } from '@/lib/utils';

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

// 3D Cup Component with perspective
function Cup3D({ 
  active, 
  isOpponent, 
  isSelected, 
  isSelectable, 
  onClick,
  index
}: { 
  active: boolean;
  isOpponent: boolean;
  isSelected: boolean;
  isSelectable: boolean;
  onClick: () => void;
  index: number;
}) {
  if (!active) {
    return (
      <div className="w-10 h-12 sm:w-12 sm:h-14 flex items-center justify-center opacity-30">
        <div className="w-8 h-10 sm:w-10 sm:h-12 rounded-full border-2 border-dashed border-muted-foreground/30" />
      </div>
    );
  }

  const cupColor = isOpponent ? 'red' : 'blue';
  
  return (
    <motion.button
      onClick={onClick}
      disabled={!isSelectable}
      className={cn(
        "relative cursor-pointer transition-transform",
        isSelectable && "hover:scale-110",
        isSelected && "scale-110"
      )}
      whileHover={isSelectable ? { scale: 1.1, y: -5 } : {}}
      whileTap={isSelectable ? { scale: 0.95 } : {}}
      animate={isSelected ? { 
        y: [0, -8, 0],
        rotateY: [0, 10, -10, 0]
      } : {}}
      transition={{ repeat: isSelected ? Infinity : 0, duration: 0.8 }}
      style={{ perspective: '200px' }}
    >
      {/* 3D Cup Container */}
      <div 
        className={cn(
          "relative w-10 h-12 sm:w-12 sm:h-14",
          isSelected && "drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]"
        )}
        style={{ 
          transformStyle: 'preserve-3d',
          transform: 'rotateX(15deg)'
        }}
      >
        {/* Cup body - trapezoid shape for 3D effect */}
        <div 
          className={cn(
            "absolute inset-0 rounded-b-lg rounded-t-sm overflow-hidden",
            cupColor === 'red' 
              ? "bg-gradient-to-b from-red-500 via-red-600 to-red-700" 
              : "bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700"
          )}
          style={{
            clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)',
            boxShadow: isSelected 
              ? '0 8px 25px rgba(0,0,0,0.5), inset 0 -5px 10px rgba(0,0,0,0.3)' 
              : '0 4px 15px rgba(0,0,0,0.4), inset 0 -5px 10px rgba(0,0,0,0.3)'
          }}
        >
          {/* Liquid inside */}
          <div 
            className={cn(
              "absolute bottom-0 left-[5%] right-[5%] h-[60%] rounded-b-md",
              cupColor === 'red' 
                ? "bg-gradient-to-t from-amber-400/90 to-amber-300/70" 
                : "bg-gradient-to-t from-amber-400/90 to-amber-300/70"
            )}
            style={{
              clipPath: 'polygon(5% 0%, 95% 0%, 100% 100%, 0% 100%)'
            }}
          />
          
          {/* Shine/highlight */}
          <div 
            className="absolute top-1 left-[15%] w-1.5 h-[40%] bg-white/40 rounded-full"
            style={{ filter: 'blur(1px)' }}
          />
          
          {/* Secondary highlight */}
          <div 
            className="absolute top-2 left-[25%] w-1 h-[25%] bg-white/25 rounded-full"
          />
        </div>
        
        {/* Cup rim - ellipse on top */}
        <div 
          className={cn(
            "absolute -top-1 left-[5%] right-[5%] h-2 rounded-full",
            cupColor === 'red' 
              ? "bg-gradient-to-b from-red-400 to-red-500" 
              : "bg-gradient-to-b from-blue-400 to-blue-500"
          )}
          style={{
            boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.2)'
          }}
        />
        
        {/* Inner rim shadow */}
        <div 
          className="absolute top-0 left-[15%] right-[15%] h-1.5 rounded-full bg-black/30"
        />
      </div>
      
      {/* Selection ring */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 1 }}
          className="absolute -inset-2 rounded-full border-2 border-warning"
          style={{ 
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
          }}
        />
      )}
    </motion.button>
  );
}

// Ball component
function PongBall({ 
  throwing, 
  onAnimationComplete 
}: { 
  throwing: boolean;
  onAnimationComplete: () => void;
}) {
  const controls = useAnimation();
  
  useEffect(() => {
    if (throwing) {
      controls.start({
        y: [0, -50, -180, -280],
        x: [0, Math.random() * 30 - 15, Math.random() * 20 - 10, 0],
        scale: [1, 0.9, 0.7, 0.4],
        rotateX: [0, 180, 360, 540],
        opacity: [1, 1, 1, 0],
      }).then(onAnimationComplete);
    }
  }, [throwing, controls, onAnimationComplete]);

  return (
    <motion.div
      animate={controls}
      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="absolute left-1/2 bottom-32 -translate-x-1/2 w-6 h-6 z-30"
      style={{ perspective: '100px' }}
    >
      <div 
        className="w-full h-full rounded-full bg-gradient-radial from-white via-gray-100 to-gray-300"
        style={{
          boxShadow: '0 4px 15px rgba(0,0,0,0.4), inset 2px 2px 5px rgba(255,255,255,0.8), inset -2px -2px 5px rgba(0,0,0,0.2)'
        }}
      />
    </motion.div>
  );
}

export function CupPongGame({ state, playerRole, onThrow, disabled }: CupPongGameProps) {
  const [selectedCup, setSelectedCup] = useState<number | null>(null);
  const [throwing, setThrowing] = useState(false);
  const [showBall, setShowBall] = useState(true);
  const tableRef = useRef<HTMLDivElement>(null);
  
  const isMyTurn = state.currentPlayer === playerRole;
  const myCups = playerRole === 'player1' ? state.player1Cups : state.player2Cups;
  const opponentCups = playerRole === 'player1' ? state.player2Cups : state.player1Cups;
  const myRemainingCups = myCups.filter(c => c).length;
  const opponentRemainingCups = opponentCups.filter(c => c).length;

  // Reset ball when turn changes
  useEffect(() => {
    if (isMyTurn && !state.winner) {
      setShowBall(true);
    }
  }, [isMyTurn, state.winner]);

  const handleCupClick = useCallback((cupIndex: number) => {
    if (!isMyTurn || disabled || state.winner || !opponentCups[cupIndex]) return;
    setSelectedCup(prev => prev === cupIndex ? null : cupIndex);
  }, [isMyTurn, disabled, state.winner, opponentCups]);

  const handleThrow = useCallback(() => {
    if (selectedCup === null || !isMyTurn || disabled || throwing) return;
    
    setThrowing(true);
    setShowBall(true);
  }, [selectedCup, isMyTurn, disabled, throwing]);

  const handleThrowComplete = useCallback(() => {
    if (selectedCup !== null) {
      onThrow(selectedCup);
    }
    setSelectedCup(null);
    setThrowing(false);
    setShowBall(false);
  }, [selectedCup, onThrow]);

  // Cup formation renderer with 3D perspective
  const renderCupFormation = (cups: boolean[], isOpponent: boolean) => {
    const rows = [
      { indices: [0], offsetX: 0 },           // Back: 1 cup
      { indices: [1, 2], offsetX: 0 },        // Middle: 2 cups  
      { indices: [3, 4, 5], offsetX: 0 },     // Front: 3 cups
    ];
    
    // For opponent, show pyramid pointing down (toward player)
    // For player, show pyramid pointing up (toward opponent)
    const orderedRows = isOpponent ? rows : [...rows].reverse();

    return (
      <div 
        className="flex flex-col items-center"
        style={{ 
          perspective: '500px',
          perspectiveOrigin: isOpponent ? '50% 100%' : '50% 0%'
        }}
      >
        {orderedRows.map((row, rowIndex) => (
          <div 
            key={rowIndex} 
            className="flex gap-1 sm:gap-2"
            style={{
              transform: isOpponent 
                ? `translateZ(${rowIndex * 10}px) translateY(${rowIndex * 2}px)`
                : `translateZ(${(2 - rowIndex) * 10}px) translateY(${-(2 - rowIndex) * 2}px)`,
              zIndex: isOpponent ? 10 - rowIndex : rowIndex
            }}
          >
            {row.indices.map((cupIndex) => (
              <Cup3D
                key={cupIndex}
                index={cupIndex}
                active={cups[cupIndex]}
                isOpponent={isOpponent}
                isSelected={isOpponent && selectedCup === cupIndex}
                isSelectable={isOpponent && cups[cupIndex] && isMyTurn && !disabled && !state.winner && !throwing}
                onClick={() => handleCupClick(cupIndex)}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center py-2 space-y-3">
      {/* Game Status */}
      <div className="text-center">
        {state.winner ? (
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className="text-xl font-display font-bold"
          >
            {state.winner === playerRole ? '🎉 You Won!' : '😔 You Lost'}
          </motion.div>
        ) : (
          <div className={cn(
            "px-4 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2",
            isMyTurn 
              ? "bg-success/20 text-success border border-success/30" 
              : "bg-muted/50 text-muted-foreground border border-border"
          )}>
            <span className={cn(
              "w-2 h-2 rounded-full",
              isMyTurn ? "bg-success animate-pulse" : "bg-muted-foreground"
            )} />
            {isMyTurn ? "Your turn — Tap a red cup!" : "Opponent's turn..."}
          </div>
        )}
      </div>

      {/* Last throw result */}
      <AnimatePresence mode="wait">
        {state.lastThrowResult && !throwing && (
          <motion.div
            key={state.lastThrowResult}
            initial={{ opacity: 0, scale: 0.5, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className={cn(
              "text-lg font-bold px-4 py-1 rounded-full",
              state.lastThrowResult === 'hit' 
                ? "bg-success/20 text-success" 
                : "bg-destructive/20 text-destructive"
            )}
          >
            {state.lastThrowResult === 'hit' ? '🎯 HIT! Go again!' : '💨 Miss!'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score Display */}
      <div className="flex items-center gap-6 text-sm">
        <div className="text-center">
          <p className="text-muted-foreground text-xs uppercase tracking-wide">Your Cups</p>
          <p className="font-display text-3xl font-bold text-primary">{myRemainingCups}</p>
        </div>
        <div className="text-muted-foreground font-bold text-lg">VS</div>
        <div className="text-center">
          <p className="text-muted-foreground text-xs uppercase tracking-wide">Their Cups</p>
          <p className="font-display text-3xl font-bold text-destructive">{opponentRemainingCups}</p>
        </div>
      </div>

      {/* 3D Table */}
      <div 
        ref={tableRef}
        className="relative w-full max-w-sm"
        style={{ perspective: '800px' }}
      >
        <div 
          className="relative overflow-hidden rounded-xl"
          style={{
            transform: 'rotateX(25deg)',
            transformStyle: 'preserve-3d',
            transformOrigin: 'center bottom'
          }}
        >
          {/* Table surface */}
          <div 
            className="relative py-8 px-6 bg-gradient-to-b from-emerald-700 via-emerald-800 to-emerald-900"
            style={{
              boxShadow: 'inset 0 0 60px rgba(0,0,0,0.4), 0 20px 60px -20px rgba(0,0,0,0.8)'
            }}
          >
            {/* Table texture overlay */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(0,0,0,0.3) 100%)'
              }}
            />
            
            {/* Wood trim top */}
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-amber-700 to-amber-900" 
              style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
            />
            
            {/* Wood trim bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-amber-700 to-amber-900"
              style={{ boxShadow: '0 -2px 4px rgba(0,0,0,0.5)' }}
            />
            
            {/* Wood trim sides */}
            <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-amber-800 to-amber-900" />
            <div className="absolute top-0 bottom-0 right-0 w-3 bg-gradient-to-l from-amber-800 to-amber-900" />

            {/* Center line */}
            <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-px bg-white/20" />

            {/* Opponent's cups (far end) */}
            <div className="relative z-10 mb-10">
              <p className="text-center text-xs text-white/60 mb-3 uppercase tracking-wider">Opponent</p>
              {renderCupFormation(opponentCups, true)}
            </div>

            {/* My cups (near end) */}
            <div className="relative z-10 mt-10">
              {renderCupFormation(myCups, false)}
              <p className="text-center text-xs text-white/60 mt-3 uppercase tracking-wider">You</p>
            </div>
          </div>
        </div>
        
        {/* Ball animation */}
        <AnimatePresence>
          {throwing && showBall && (
            <PongBall throwing={throwing} onAnimationComplete={handleThrowComplete} />
          )}
        </AnimatePresence>
        
        {/* Throw button and ball display */}
        {isMyTurn && !state.winner && !throwing && (
          <div className="flex flex-col items-center mt-6 gap-3">
            {/* Ball ready to throw */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, y: [0, -5, 0] }}
              transition={{ y: { repeat: Infinity, duration: 1 } }}
              className="w-8 h-8 rounded-full bg-gradient-radial from-white via-gray-100 to-gray-300"
              style={{
                boxShadow: '0 4px 15px rgba(0,0,0,0.3), inset 2px 2px 5px rgba(255,255,255,0.8)'
              }}
            />
            
            <motion.button
              onClick={handleThrow}
              disabled={selectedCup === null || disabled}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "px-8 py-3 rounded-full font-bold text-lg transition-all",
                selectedCup !== null
                  ? "bg-gradient-to-r from-success to-emerald-500 text-white shadow-lg shadow-success/30"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              {selectedCup !== null ? '🏀 Throw Ball!' : 'Tap a cup to aim'}
            </motion.button>
            
            {selectedCup !== null && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-warning font-medium"
              >
                Aiming at cup #{selectedCup + 1}
              </motion.p>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="text-center text-xs text-muted-foreground max-w-xs space-y-1 pt-2">
        <p>🏆 First to eliminate all opponent cups wins!</p>
        <p>🎯 Hit a cup = throw again!</p>
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
  
  // Calculate hit probability (70% base chance)
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
  } else {
    // Miss - switch turns
    newState.lastThrowResult = 'miss';
    newState.currentPlayer = throwingPlayer === 'player1' ? 'player2' : 'player1';
  }
  
  return newState;
}
