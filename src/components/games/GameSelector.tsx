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
  'connect-four': 'Drop discs to connect 4 in a row!',
  'rock-paper-scissors': 'Classic hand game. Best of 3 wins!',
  'wordle': 'Guess the 5-letter word in fewer tries.',
  'checkers': 'Jump and capture all opponent pieces.',
  'dots-and-boxes': 'Complete boxes to claim territory.',
  'boggle': 'Find words in the letter grid.',
  'pool': 'Sink all your balls first!',
  'ping-pong': 'Fast-paced table tennis action.',
  'battleship': 'Sink the enemy fleet!',
  'trivia': 'Test your knowledge against opponents.',
};

const gameStats: Record<GameType, { time: string; skill: string }> = {
  'tic-tac-toe': { time: '~2 min', skill: 'Beginner' },
  'chess': { time: '~15 min', skill: 'Advanced' },
  'scrabble': { time: '~20 min', skill: 'Intermediate' },
  'connect-four': { time: '~5 min', skill: 'Beginner' },
  'rock-paper-scissors': { time: '~1 min', skill: 'Beginner' },
  'wordle': { time: '~5 min', skill: 'Intermediate' },
  'checkers': { time: '~10 min', skill: 'Intermediate' },
  'dots-and-boxes': { time: '~10 min', skill: 'Beginner' },
  'boggle': { time: '~5 min', skill: 'Intermediate' },
  'pool': { time: '~10 min', skill: 'Intermediate' },
  'ping-pong': { time: '~5 min', skill: 'Intermediate' },
  'battleship': { time: '~15 min', skill: 'Intermediate' },
  'trivia': { time: '~5 min', skill: 'Beginner' },
};

export function GameSelector({ selected, onChange }: GameSelectorProps) {
  const games: GameType[] = [
    'tic-tac-toe', 'connect-four', 'rock-paper-scissors', 
    'wordle', 'checkers', 'battleship', 'trivia',
    'chess', 'scrabble', 'dots-and-boxes', 'boggle', 
    'pool', 'ping-pong'
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {games.map((game, index) => {
        const isSelected = selected === game;
        const stats = gameStats[game];

        return (
          <motion.div
            key={game}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              variant={isSelected ? 'neon' : 'elevated'}
              className={cn(
                'relative cursor-pointer transition-all duration-300 overflow-hidden',
                isSelected && 'ring-2 ring-primary'
              )}
              onClick={() => onChange(game)}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-primary-foreground" />
                </motion.div>
              )}

              <div className="p-3">
                <motion.div
                  className="text-3xl mb-2"
                  animate={isSelected ? { scale: [1, 1.2, 1] } : {}}
                >
                  {gameTypeIcons[game]}
                </motion.div>
                <h3 className="font-display font-bold text-sm mb-1">
                  {gameTypeLabels[game]}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {gameDescriptions[game]}
                </p>
                <div className="flex gap-2 text-[10px]">
                  <span className="text-muted-foreground">{stats.time}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{stats.skill}</span>
                </div>
              </div>

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