import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Match, gameTypeLabels, gameTypeIcons } from '@/types/game';
import { Users, Clock, DollarSign, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LobbyCardProps {
  match: Match;
  index?: number;
}

export function LobbyCard({ match, index = 0 }: LobbyCardProps) {
  const playersJoined = match.players.length;
  const spotsLeft = match.playersRequired - playersJoined;
  const isLive = match.state === 'active';
  const isWaiting = match.state === 'waiting' || match.state === 'depositing';

  const statusConfig = {
    waiting: { label: 'Waiting', color: 'bg-warning/20 text-warning border-warning/30' },
    depositing: { label: 'Depositing', color: 'bg-accent/20 text-accent border-accent/30' },
    active: { label: 'Live', color: 'bg-success/20 text-success border-success/30' },
    complete: { label: 'Complete', color: 'bg-muted text-muted-foreground border-border' },
    cancelled: { label: 'Cancelled', color: 'bg-destructive/20 text-destructive border-destructive/30' },
  };

  const status = statusConfig[match.state];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <Card variant={isLive ? 'neon' : 'elevated'} className="group overflow-hidden">
        <CardContent className="p-0">
          {/* Header */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{gameTypeIcons[match.gameType]}</span>
                <div>
                  <h3 className="font-display font-bold text-lg">
                    {gameTypeLabels[match.gameType]}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Best of {match.rounds} rounds
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn('text-xs font-medium border', status.color)}
              >
                {isLive && <span className="w-1.5 h-1.5 rounded-full bg-success mr-1.5 animate-pulse" />}
                {status.label}
              </Badge>
            </div>
          </div>

          {/* Stats */}
          <div className="p-4 grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <DollarSign className="h-3.5 w-3.5" />
                <span className="text-xs uppercase tracking-wider">Stake</span>
              </div>
              <p className="font-display font-bold text-lg text-gradient">
                ${match.stakeAmount}
              </p>
              <p className="text-xs text-muted-foreground">{match.currency}</p>
            </div>
            
            <div className="text-center border-x border-border/50">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Users className="h-3.5 w-3.5" />
                <span className="text-xs uppercase tracking-wider">Players</span>
              </div>
              <p className="font-display font-bold text-lg">
                {playersJoined}/{match.playersRequired}
              </p>
              <p className="text-xs text-muted-foreground">
                {spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft > 1 ? 's' : ''} left` : 'Full'}
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs uppercase tracking-wider">Prize</span>
              </div>
              <p className="font-display font-bold text-lg text-success">
                ${match.stakeAmount * match.playersRequired}
              </p>
              <p className="text-xs text-muted-foreground">Total pot</p>
            </div>
          </div>

          {/* Action */}
          <div className="p-4 pt-0">
            <Link to={`/match/${match.id}`}>
              <Button
                className="w-full group-hover:translate-x-0 transition-transform"
                variant={isWaiting ? 'neon' : 'outline'}
                disabled={match.state === 'complete' || match.state === 'cancelled'}
              >
                {isWaiting ? 'Join Match' : isLive ? 'Watch Live' : 'View Details'}
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
