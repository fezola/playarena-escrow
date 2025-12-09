import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MobileLayout } from '@/components/MobileLayout';
import { GameType, gameTypeLabels } from '@/types/game';
import { ChevronRight, Users, Clock, Sparkles } from 'lucide-react';

interface GameCardProps {
  gameType: GameType;
  emoji: string;
  players: string;
  duration: string;
  color: string;
  available: boolean;
}

const games: GameCardProps[] = [
  {
    gameType: 'tic-tac-toe',
    emoji: '⭕',
    players: '2 Players',
    duration: '~2 min',
    color: 'from-blue-500 to-cyan-400',
    available: true,
  },
  {
    gameType: 'chess',
    emoji: '♟️',
    players: '2 Players',
    duration: '~15 min',
    color: 'from-purple-500 to-pink-400',
    available: true,
  },
  {
    gameType: 'scrabble',
    emoji: '🔤',
    players: '2-4 Players',
    duration: '~20 min',
    color: 'from-amber-500 to-orange-400',
    available: true,
  },
];

function GameCard({ game, index }: { game: GameCardProps; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link to={`/play/${game.gameType}`}>
        <div className="relative overflow-hidden rounded-2xl bg-card border border-border/50 active:scale-[0.98] transition-transform">
          {/* Gradient Header */}
          <div className={`h-24 bg-gradient-to-br ${game.color} p-4 flex items-center justify-between`}>
            <span className="text-5xl">{game.emoji}</span>
            {!game.available && (
              <span className="px-2 py-1 text-xs font-medium bg-black/30 rounded-full text-white">
                Coming Soon
              </span>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-lg">
                {gameTypeLabels[game.gameType]}
              </h3>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{game.players}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{game.duration}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Games() {
  return (
    <MobileLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="px-4 py-4">
          <h1 className="font-display text-2xl font-bold">Games</h1>
          <p className="text-sm text-muted-foreground">Choose a game to play</p>
        </div>
      </header>

      {/* Games Grid */}
      <main className="px-4 py-6 space-y-4">
        {/* Featured Section */}
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-warning" />
          <span className="text-sm font-medium text-muted-foreground">All Games</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {games.map((game, index) => (
            <GameCard key={game.gameType} game={game} index={index} />
          ))}
        </div>
      </main>
    </MobileLayout>
  );
}
