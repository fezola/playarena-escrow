import { motion } from 'framer-motion';
import { AlertTriangle, Info, HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface GameInstructionsProps {
  gameType: 'tic-tac-toe' | 'chess' | 'scrabble';
}

const instructions = {
  'tic-tac-toe': {
    title: 'Tic Tac Toe',
    rules: [
      'Players take turns placing their symbol (X or O) on a 3x3 grid',
      'First player to get 3 symbols in a row (horizontal, vertical, or diagonal) wins',
      'If all 9 squares are filled with no winner, the game is a draw',
      'The player who created the match plays as X and goes first',
    ],
    tips: [
      'Control the center square for the best chances',
      'Block your opponent when they have two in a row',
      'Create "forks" - positions where you can win two ways',
    ],
  },
  chess: {
    title: 'Chess',
    rules: [
      'Each player controls 16 pieces with unique movement patterns',
      'The goal is to checkmate your opponent\'s King',
      'Checkmate means the King is under attack and cannot escape',
      'If a player cannot make any legal move, it\'s stalemate (draw)',
    ],
    tips: [
      'Control the center of the board early',
      'Develop your pieces (knights and bishops) before attacking',
      'Castle early to protect your King',
      'Don\'t move the same piece multiple times in the opening',
    ],
  },
  scrabble: {
    title: 'Scrabble',
    rules: [
      'Form words on the board using letter tiles',
      'Words must read left-to-right or top-to-bottom',
      'New words must connect to existing words on the board',
      'Player with the highest total score wins',
    ],
    tips: [
      'Use high-value letter tiles on bonus squares',
      'Learn two-letter words for tight spots',
      'Save blank tiles for high-scoring plays',
      'Block premium squares from your opponent',
    ],
  },
};

export function GameInstructions({ gameType }: GameInstructionsProps) {
  const game = instructions[gameType];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <HelpCircle className="h-4 w-4" />
          How to Play
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Info className="h-5 w-5 text-primary" />
            {game.title} Rules
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rules */}
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">RULES</h4>
            <ul className="space-y-2">
              {game.rules.map((rule, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-2 text-sm"
                >
                  <span className="text-primary font-bold">{i + 1}.</span>
                  <span>{rule}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Tips */}
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">PRO TIPS</h4>
            <ul className="space-y-2">
              {game.tips.map((tip, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="flex items-start gap-2 text-sm"
                >
                  <span className="text-success">✓</span>
                  <span>{tip}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Responsible Gaming Warning */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-4 rounded-xl bg-warning/10 border border-warning/30"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-warning text-sm mb-1">Play Responsibly</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Only bet what you can afford to lose</li>
                  <li>• Set a budget before you start playing</li>
                  <li>• Take breaks if you're on a losing streak</li>
                  <li>• Remember: this is for entertainment</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ResponsibleGamingBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-4 p-3 rounded-xl bg-warning/5 border border-warning/20"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-warning">Play Responsibly:</span>{' '}
          Only stake what you can afford to lose. Set limits and take breaks.
        </p>
      </div>
    </motion.div>
  );
}
