import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GameType, gameTypeLabels, gameTypeIcons } from '@/types/game';
import { Users, Clock, Trophy, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { GameDemoPreview } from '@/components/games/GameDemoPreview';

interface GamePreviewDialogProps {
  game: GameType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const gameDetails: Record<GameType, {
  players: string;
  duration: string;
  skill: 'Beginner' | 'Intermediate' | 'Advanced';
  color: string;
}> = {
  'tic-tac-toe': {
    players: '2 Players',
    duration: '~2 min',
    skill: 'Beginner',
    color: 'from-blue-500 to-cyan-400',
  },
  'rock-paper-scissors': {
    players: '2 Players',
    duration: '~1 min',
    skill: 'Beginner',
    color: 'from-green-500 to-emerald-400',
  },
  'checkers': {
    players: '2 Players',
    duration: '~10 min',
    skill: 'Intermediate',
    color: 'from-red-600 to-rose-400',
  },
  'chess': {
    players: '2 Players',
    duration: '~15 min',
    skill: 'Advanced',
    color: 'from-purple-500 to-pink-400',
  },
  'scrabble': {
    players: '2-4 Players',
    duration: '~20 min',
    skill: 'Intermediate',
    color: 'from-amber-500 to-orange-400',
  },
  'dots-and-boxes': {
    players: '2 Players',
    duration: '~10 min',
    skill: 'Beginner',
    color: 'from-pink-500 to-rose-400',
  },
  'sports-prediction': {
    players: 'Unlimited',
    duration: '~1-2 hrs',
    skill: 'Intermediate',
    color: 'from-green-500 to-emerald-400',
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
      if (game === 'sports-prediction') {
        navigate('/sports-prediction');
      } else {
        navigate(`/create?game=${game}`);
      }
    } else {
      navigate('/auth');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className={`-mx-6 -mt-6 h-20 bg-gradient-to-br ${details.color} flex items-center justify-center rounded-t-lg`}>
            <motion.span 
              className="text-5xl"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              {gameTypeIcons[game]}
            </motion.span>
          </div>
          <DialogTitle className="text-xl font-display pt-3">
            {gameTypeLabels[game]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
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

          {/* Game Demo Preview */}
          <div className="rounded-lg overflow-hidden border border-border/50 bg-card">
            <div className="max-h-[280px] overflow-hidden">
              <GameDemoPreview game={game} />
            </div>
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
