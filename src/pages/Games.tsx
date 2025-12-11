import { useState } from 'react';
import { motion } from 'framer-motion';
import { MobileLayout } from '@/components/MobileLayout';
import { GamePreviewDialog } from '@/components/GamePreviewDialog';
import { GameType, gameTypeLabels, gameTypeIcons } from '@/types/game';
import { ChevronRight, Users, Clock, Sparkles, Lock } from 'lucide-react';

interface GameCardProps {
  gameType: GameType;
  players: string;
  duration: string;
  color: string;
  available: boolean;
}

const games: GameCardProps[] = [
  { gameType: 'tic-tac-toe', players: '2 Players', duration: '~2 min', color: 'from-blue-500 to-cyan-400', available: true },
  { gameType: 'connect-four', players: '2 Players', duration: '~5 min', color: 'from-red-500 to-yellow-400', available: true },
  { gameType: 'rock-paper-scissors', players: '2 Players', duration: '~1 min', color: 'from-green-500 to-emerald-400', available: true },
  { gameType: 'wordle', players: '2 Players', duration: '~5 min', color: 'from-emerald-500 to-teal-400', available: true },
  { gameType: 'checkers', players: '2 Players', duration: '~10 min', color: 'from-red-600 to-rose-400', available: true },
  { gameType: 'battleship', players: '2 Players', duration: '~15 min', color: 'from-slate-500 to-blue-400', available: true },
  { gameType: 'trivia', players: '2 Players', duration: '~5 min', color: 'from-violet-500 to-purple-400', available: true },
  { gameType: 'chess', players: '2 Players', duration: '~15 min', color: 'from-purple-500 to-pink-400', available: true },
  { gameType: 'scrabble', players: '2-4 Players', duration: '~20 min', color: 'from-amber-500 to-orange-400', available: true },
  { gameType: 'cup-pong', players: '2 Players', duration: '~5 min', color: 'from-amber-500 to-yellow-400', available: true },
  { gameType: 'dots-and-boxes', players: '2 Players', duration: '~10 min', color: 'from-pink-500 to-rose-400', available: false },
  { gameType: 'boggle', players: '2 Players', duration: '~5 min', color: 'from-lime-500 to-green-400', available: false },
  { gameType: 'pool', players: '2 Players', duration: '~10 min', color: 'from-green-600 to-emerald-400', available: false },
  { gameType: 'ping-pong', players: '2 Players', duration: '~5 min', color: 'from-orange-500 to-red-400', available: false },
];

function GameCard({ game, index, onClick }: { game: GameCardProps; index: number; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div
        onClick={onClick}
        className="relative overflow-hidden rounded-2xl bg-card border border-border/50 active:scale-[0.98] transition-transform cursor-pointer"
      >
        {/* Gradient Header */}
        <div className={`h-24 bg-gradient-to-br ${game.color} p-4 flex items-center justify-between`}>
          <span className="text-5xl">{gameTypeIcons[game.gameType]}</span>
          {!game.available && (
            <span className="px-2 py-1 text-xs font-medium bg-black/30 rounded-full text-white flex items-center gap-1">
              <Lock className="h-3 w-3" />
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
    </motion.div>
  );
}

export default function Games() {
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleGameClick = (gameType: GameType) => {
    setSelectedGame(gameType);
    setPreviewOpen(true);
  };

  const availableGames = games.filter(g => g.available);
  const comingSoonGames = games.filter(g => !g.available);

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
      <main className="px-4 py-6 space-y-6">
        {/* Available Games */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-warning" />
            <span className="text-sm font-medium text-muted-foreground">Available Games ({availableGames.length})</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {availableGames.map((game, index) => (
              <GameCard 
                key={game.gameType} 
                game={game} 
                index={index}
                onClick={() => handleGameClick(game.gameType)}
              />
            ))}
          </div>
        </section>

        {/* Coming Soon Games */}
        {comingSoonGames.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Coming Soon ({comingSoonGames.length})</span>
            </div>

            <div className="grid grid-cols-1 gap-4 opacity-60">
              {comingSoonGames.map((game, index) => (
                <GameCard 
                  key={game.gameType} 
                  game={game} 
                  index={index + availableGames.length}
                  onClick={() => handleGameClick(game.gameType)}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Preview Dialog */}
      <GamePreviewDialog 
        game={selectedGame}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </MobileLayout>
  );
}
