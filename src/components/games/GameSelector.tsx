import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { GameType, gameTypeLabels, gameTypeIcons } from '@/types/game';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface GameSelectorProps {
  selected: GameType;
  onChange: (game: GameType) => void;
}

const gameDescriptions: Record<GameType, string> = {
  'tic-tac-toe': 'Quick 1v1 strategy game. First to 3 in a row wins!',
  'chess': 'Classic battle of minds. Checkmate to claim victory.',
  'scrabble': 'Word power showdown. Highest score takes all.',
};

const gameStats: Record<GameType, { time: string; skill: string }> = {
  'tic-tac-toe': { time: '~2 min', skill: 'Beginner' },
  'chess': { time: '~15 min', skill: 'Advanced' },
  'scrabble': { time: '~20 min', skill: 'Intermediate' },
};

export function GameSelector({ selected, onChange }: GameSelectorProps) {
  const games: GameType[] = ['tic-tac-toe', 'chess', 'scrabble'];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {games.map((game, index) => {
        const isSelected = selected === game;
        const stats = gameStats[game];

        return (
          <motion.div
            key={game}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              variant={isSelected ? 'neon' : 'elevated'}
              className={cn(
                'relative cursor-pointer transition-all duration-300 overflow-hidden',
                isSelected && 'ring-2 ring-primary'
              )}
              onClick={() => onChange(game)}
            >
              {/* Selected indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-primary-foreground" />
                </motion.div>
              )}

              <div className="p-5">
                {/* Icon */}
                <motion.div
                  className="text-5xl mb-4"
                  animate={isSelected ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {gameTypeIcons[game]}
                </motion.div>

                {/* Name */}
                <h3 className="font-display font-bold text-lg mb-2">
                  {gameTypeLabels[game]}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-4">
                  {gameDescriptions[game]}
                </p>

                {/* Stats */}
                <div className="flex gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Time: </span>
                    <span className="text-foreground font-medium">{stats.time}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Skill: </span>
                    <span className="text-foreground font-medium">{stats.skill}</span>
                  </div>
                </div>
              </div>

              {/* Bottom gradient */}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent"
                />
              )}
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
