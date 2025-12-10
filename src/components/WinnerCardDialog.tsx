import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { WinnerCard } from './WinnerCard';

interface WinnerCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  winnerName: string;
  winnerAvatar?: string;
  opponentName: string;
  opponentAvatar?: string;
  amountWon: number;
  gameType: string;
  finalScore: string;
}

export function WinnerCardDialog({
  open,
  onOpenChange,
  winnerName,
  winnerAvatar,
  opponentName,
  opponentAvatar,
  amountWon,
  gameType,
  finalScore,
}: WinnerCardDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center font-display text-2xl">
            🎉 Congratulations!
          </DialogTitle>
          <DialogDescription className="text-center">
            Share your victory with friends!
          </DialogDescription>
        </DialogHeader>
        
        <WinnerCard
          winnerName={winnerName}
          winnerAvatar={winnerAvatar}
          opponentName={opponentName}
          opponentAvatar={opponentAvatar}
          amountWon={amountWon}
          gameType={gameType}
          finalScore={finalScore}
        />
      </DialogContent>
    </Dialog>
  );
}

