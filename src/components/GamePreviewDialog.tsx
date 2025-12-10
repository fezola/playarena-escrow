import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GameType, gameTypeLabels, gameTypeIcons } from '@/types/game';
import { Users, Clock, Trophy, Play, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface GamePreviewDialogProps {
  game: GameType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const gameDetails: Record<GameType, {
  description: string;
  rules: string[];
  players: string;
  duration: string;
  skill: 'Beginner' | 'Intermediate' | 'Advanced';
  color: string;
}> = {
  'tic-tac-toe': {
    description: 'Classic 3x3 grid game. Get three in a row to win!',
    rules: ['Take turns placing X or O', 'First to get 3 in a row wins', 'Rows, columns, or diagonals count'],
    players: '2 Players',
    duration: '~2 min',
    skill: 'Beginner',
    color: 'from-blue-500 to-cyan-400',
  },
  'connect-four': {
    description: 'Drop discs and connect four in a row before your opponent!',
    rules: ['Take turns dropping colored discs', 'Connect 4 horizontally, vertically, or diagonally', 'Plan ahead to block your opponent'],
    players: '2 Players',
    duration: '~5 min',
    skill: 'Beginner',
    color: 'from-red-500 to-yellow-400',
  },
  'rock-paper-scissors': {
    description: 'Classic hand game of chance and psychology!',
    rules: ['Rock beats Scissors', 'Scissors beats Paper', 'Paper beats Rock', 'Best of 3 rounds wins'],
    players: '2 Players',
    duration: '~1 min',
    skill: 'Beginner',
    color: 'from-green-500 to-emerald-400',
  },
  'wordle': {
    description: 'Guess the secret 5-letter word in fewer tries than your opponent!',
    rules: ['Both players guess the same word', 'Green = correct letter and position', 'Yellow = correct letter, wrong position', 'Fewer guesses wins'],
    players: '2 Players',
    duration: '~5 min',
    skill: 'Intermediate',
    color: 'from-emerald-500 to-teal-400',
  },
  'checkers': {
    description: 'Jump and capture all opponent pieces to win!',
    rules: ['Move diagonally forward', 'Jump over opponents to capture', 'Kings can move backwards', 'Capture all pieces or block opponent'],
    players: '2 Players',
    duration: '~10 min',
    skill: 'Intermediate',
    color: 'from-red-600 to-rose-400',
  },
  'battleship': {
    description: 'Sink the enemy fleet before they sink yours!',
    rules: ['Place your ships on the grid', 'Take turns firing at coordinates', 'Hit all cells of a ship to sink it', 'First to sink all ships wins'],
    players: '2 Players',
    duration: '~15 min',
    skill: 'Intermediate',
    color: 'from-slate-500 to-blue-400',
  },
  'trivia': {
    description: 'Test your knowledge against your opponent!',
    rules: ['Answer multiple choice questions', 'Earn points for correct answers', 'Speed matters for bonus points', 'Highest score wins'],
    players: '2 Players',
    duration: '~5 min',
    skill: 'Beginner',
    color: 'from-violet-500 to-purple-400',
  },
  'chess': {
    description: 'The ultimate battle of minds. Checkmate your opponent!',
    rules: ['Each piece moves uniquely', 'Capture the opponent\'s King', 'Use strategy and foresight', 'Checkmate ends the game'],
    players: '2 Players',
    duration: '~15 min',
    skill: 'Advanced',
    color: 'from-purple-500 to-pink-400',
  },
  'scrabble': {
    description: 'Build words and score points with your letters!',
    rules: ['Form words on the board', 'Use letter multipliers wisely', 'Build off existing words', 'Highest score wins'],
    players: '2-4 Players',
    duration: '~20 min',
    skill: 'Intermediate',
    color: 'from-amber-500 to-orange-400',
  },
  'dots-and-boxes': {
    description: 'Connect dots to claim boxes and territory!',
    rules: ['Draw lines between adjacent dots', 'Complete a box to claim it', 'Completing a box gives another turn', 'Most boxes wins'],
    players: '2 Players',
    duration: '~10 min',
    skill: 'Beginner',
    color: 'from-pink-500 to-rose-400',
  },
  'boggle': {
    description: 'Find as many words as possible in the letter grid!',
    rules: ['Form words from adjacent letters', 'Longer words score more', 'Each letter used once per word', 'Most points wins'],
    players: '2 Players',
    duration: '~5 min',
    skill: 'Intermediate',
    color: 'from-lime-500 to-green-400',
  },
  'pool': {
    description: 'Classic 8-ball pool. Sink your balls first!',
    rules: ['Break to start', 'Sink your group (solids/stripes)', 'Call and sink the 8-ball last', 'Scratch = foul'],
    players: '2 Players',
    duration: '~10 min',
    skill: 'Intermediate',
    color: 'from-green-600 to-emerald-400',
  },
  'ping-pong': {
    description: 'Fast-paced table tennis action!',
    rules: ['Serve alternates every 2 points', 'Win by 2 points after 10-10', 'First to 11 wins the set', 'Best of 3 or 5 sets'],
    players: '2 Players',
    duration: '~5 min',
    skill: 'Intermediate',
    color: 'from-orange-500 to-red-400',
  },
};

const skillColors = {
  'Beginner': 'bg-success/20 text-success',
  'Intermediate': 'bg-warning/20 text-warning',
  'Advanced': 'bg-destructive/20 text-destructive',
};

export function GamePreviewDialog({ game, open, onOpenChange }: GamePreviewDialogProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!game) return null;

  const details = gameDetails[game];

  const handlePlay = () => {
    onOpenChange(false);
    if (user) {
      navigate(`/create?game=${game}`);
    } else {
      navigate('/auth');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <div className={`-mx-6 -mt-6 h-32 bg-gradient-to-br ${details.color} flex items-center justify-center rounded-t-lg`}>
            <motion.span 
              className="text-6xl"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              {gameTypeIcons[game]}
            </motion.span>
          </div>
          <DialogTitle className="text-xl font-display pt-4">
            {gameTypeLabels[game]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stats */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" />
              {details.players}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {details.duration}
            </Badge>
            <Badge className={skillColors[details.skill]}>
              <Trophy className="h-3 w-3 mr-1" />
              {details.skill}
            </Badge>
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-sm">
            {details.description}
          </p>

          {/* Rules */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Info className="h-4 w-4 text-primary" />
              How to Play
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              {details.rules.map((rule, i) => (
                <motion.li 
                  key={i}
                  className="flex items-start gap-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <span className="text-primary">•</span>
                  {rule}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Play Button */}
          <Button 
            onClick={handlePlay}
            className="w-full gap-2"
            size="lg"
          >
            <Play className="h-5 w-5" />
            Play Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
