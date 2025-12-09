import { motion } from 'framer-motion';
import { Trophy, Circle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoundScoreTrackerProps {
  totalRounds: number;
  currentRound: number;
  playerScore: number;
  opponentScore: number;
  playerName?: string;
  opponentName?: string;
}

export function RoundScoreTracker({
  totalRounds,
  currentRound,
  playerScore,
  opponentScore,
  playerName = 'You',
  opponentName = 'Opponent',
}: RoundScoreTrackerProps) {
  const roundsToWin = Math.ceil(totalRounds / 2);
  const playerWins = playerScore >= roundsToWin;
  const opponentWins = opponentScore >= roundsToWin;
  const matchOver = playerWins || opponentWins;

  return (
    <div className="w-full p-4 rounded-xl bg-card border border-border/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Best of {totalRounds}
        </h3>
        <span className="text-xs text-muted-foreground">
          Round {Math.min(currentRound + 1, totalRounds)} of {totalRounds}
        </span>
      </div>

      {/* Score Display */}
      <div className="flex items-center justify-between">
        {/* Player Score */}
        <div className={cn(
          'flex-1 text-center p-3 rounded-lg transition-colors',
          playerWins ? 'bg-success/20 border border-success/30' : 'bg-primary/10'
        )}>
          <p className="text-xs text-muted-foreground mb-1 truncate">{playerName}</p>
          <p className={cn(
            'font-display text-3xl font-bold',
            playerWins ? 'text-success' : 'text-primary'
          )}>
            {playerScore}
          </p>
          {playerWins && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center justify-center gap-1 mt-1"
            >
              <Trophy className="h-3 w-3 text-success" />
              <span className="text-xs text-success font-semibold">WINNER</span>
            </motion.div>
          )}
        </div>

        {/* Divider */}
        <div className="px-4 text-muted-foreground font-display font-bold">VS</div>

        {/* Opponent Score */}
        <div className={cn(
          'flex-1 text-center p-3 rounded-lg transition-colors',
          opponentWins ? 'bg-destructive/20 border border-destructive/30' : 'bg-accent/10'
        )}>
          <p className="text-xs text-muted-foreground mb-1 truncate">{opponentName}</p>
          <p className={cn(
            'font-display text-3xl font-bold',
            opponentWins ? 'text-destructive' : 'text-accent'
          )}>
            {opponentScore}
          </p>
          {opponentWins && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center justify-center gap-1 mt-1"
            >
              <Trophy className="h-3 w-3 text-destructive" />
              <span className="text-xs text-destructive font-semibold">WINNER</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Round Indicators */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {Array.from({ length: totalRounds }).map((_, i) => {
          const roundPlayed = i < currentRound;
          const isCurrentRound = i === currentRound && !matchOver;
          
          // Determine who won this round (simplified - in reality you'd track this)
          const playerWonRound = i < playerScore;
          const opponentWonRound = i >= playerScore && i < playerScore + opponentScore;
          
          return (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                isCurrentRound && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                !roundPlayed && !isCurrentRound && 'bg-muted text-muted-foreground',
                playerWonRound && 'bg-primary text-primary-foreground',
                opponentWonRound && 'bg-accent text-accent-foreground'
              )}
            >
              {roundPlayed ? (
                playerWonRound ? '✓' : '✗'
              ) : (
                i + 1
              )}
            </motion.div>
          );
        })}
      </div>

      {/* First to X wins indicator */}
      <p className="text-center text-xs text-muted-foreground mt-3">
        First to {roundsToWin} wins takes the prize
      </p>
    </div>
  );
}
