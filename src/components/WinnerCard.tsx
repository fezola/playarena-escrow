import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Share2, Twitter, MessageCircle, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface WinnerCardProps {
  winnerName: string;
  winnerAvatar?: string;
  opponentName: string;
  opponentAvatar?: string;
  amountWon: number;
  gameType: string;
  finalScore: string;
}

export function WinnerCard({
  winnerName,
  winnerAvatar,
  opponentName,
  opponentAvatar,
  amountWon,
  gameType,
  finalScore,
}: WinnerCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const shareText = `🎉 I just won $${amountWon.toFixed(2)} playing ${gameType} on PlayArena! 🏆\n\nFinal Score: ${finalScore}\n\nChallenge me: https://playarenaa.vercel.app`;

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareText);
    toast({
      title: 'Copied to clipboard!',
      description: 'Share your victory!',
    });
  };

  return (
    <div className="space-y-4">
      {/* Shareable Card */}
      <div ref={cardRef} className="relative">
        <Card className="border-2 border-success bg-gradient-to-br from-success/20 via-background to-background overflow-hidden">
          <CardContent className="p-6 relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle, #00ff88 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }} />
            </div>

            {/* Content */}
            <div className="relative z-10 space-y-6">
              {/* Trophy Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', duration: 0.8 }}
                className="flex justify-center"
              >
                <div className="relative">
                  <Trophy className="h-20 w-20 text-success drop-shadow-[0_0_20px_rgba(0,255,136,0.5)]" />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-success/20 rounded-full blur-xl"
                  />
                </div>
              </motion.div>

              {/* Winner Info */}
              <div className="text-center space-y-2">
                <h2 className="font-display text-3xl font-bold text-success">
                  VICTORY!
                </h2>
                <p className="text-4xl font-display font-bold text-white">
                  ${amountWon.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">Won on PlayArena</p>
              </div>

              {/* Players */}
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <Avatar className="h-16 w-16 border-2 border-success mx-auto mb-2">
                    <AvatarImage src={winnerAvatar} />
                    <AvatarFallback className="bg-success/20 text-success font-display text-xl">
                      {winnerName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-medium text-sm">{winnerName}</p>
                  <p className="text-xs text-success">Winner</p>
                </div>

                <div className="text-2xl font-display font-bold text-muted-foreground">
                  VS
                </div>

                <div className="text-center">
                  <Avatar className="h-16 w-16 border-2 border-border mx-auto mb-2">
                    <AvatarImage src={opponentAvatar} />
                    <AvatarFallback className="bg-muted font-display text-xl">
                      {opponentName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-medium text-sm">{opponentName}</p>
                  <p className="text-xs text-muted-foreground">Opponent</p>
                </div>
              </div>

              {/* Game Info */}
              <div className="text-center space-y-1">
                <p className="text-sm text-muted-foreground">{gameType}</p>
                <p className="font-display font-bold text-lg">{finalScore}</p>
              </div>

              {/* PlayArena Branding */}
              <div className="text-center pt-4 border-t border-border/50">
                <p className="font-display font-bold text-primary text-lg">PlayArena</p>
                <p className="text-xs text-muted-foreground">Stake. Play. Win.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Share Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <Button onClick={handleShareTwitter} variant="outline" className="gap-2">
          <Twitter className="h-4 w-4" />
          Twitter
        </Button>
        <Button onClick={handleShareWhatsApp} variant="outline" className="gap-2">
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </Button>
        <Button onClick={handleCopyLink} variant="outline" className="gap-2">
          <Copy className="h-4 w-4" />
          Copy
        </Button>
      </div>
    </div>
  );
}

