import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { GameSelector } from '@/components/games/GameSelector';
import { StakeInput } from '@/components/StakeInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { GameType } from '@/types/game';
import { useAccount } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Loader2, Wallet } from 'lucide-react';

const CreateMatch = () => {
  const navigate = useNavigate();
  const { isConnected, address } = useAccount();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [gameType, setGameType] = useState<GameType>('tic-tac-toe');
  const [stakeAmount, setStakeAmount] = useState(25);
  const [rounds, setRounds] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!isConnected) {
      toast({
        title: 'Wallet Required',
        description: 'Please connect your wallet to create a match.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    // Simulate match creation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    toast({
      title: 'Match Created!',
      description: 'Waiting for opponents to join...',
    });

    // Navigate to the match page
    navigate('/match/demo');
  };

  const canProceed = () => {
    if (step === 1) return true;
    if (step === 2) return stakeAmount >= 1;
    if (step === 3) return isConnected;
    return false;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 max-w-2xl">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => (step > 1 ? setStep(step - 1) : navigate('/'))}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {step > 1 ? 'Back' : 'Cancel'}
        </Button>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <motion.div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm ${
                  s <= step
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground'
                }`}
                animate={s === step ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {s}
              </motion.div>
              {s < 3 && (
                <div
                  className={`flex-1 h-0.5 rounded ${
                    s < step ? 'bg-primary' : 'bg-secondary'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {step === 1 && (
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-2xl">Choose Your Game</CardTitle>
              </CardHeader>
              <CardContent>
                <GameSelector selected={gameType} onChange={setGameType} />
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-2xl">Set Your Stake</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base mb-4 block">Stake Amount (per player)</Label>
                  <StakeInput value={stakeAmount} onChange={setStakeAmount} />
                </div>

                <div>
                  <Label className="text-base mb-4 block">Match Format</Label>
                  <RadioGroup
                    value={String(rounds)}
                    onValueChange={(v) => setRounds(Number(v))}
                    className="grid grid-cols-3 gap-4"
                  >
                    {[
                      { value: '1', label: 'Single Game' },
                      { value: '3', label: 'Best of 3' },
                      { value: '5', label: 'Best of 5' },
                    ].map((option) => (
                      <div key={option.value}>
                        <RadioGroupItem
                          value={option.value}
                          id={`rounds-${option.value}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`rounds-${option.value}`}
                          className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all"
                        >
                          <span className="font-display font-bold">{option.label}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-2xl">Confirm & Create</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Game</span>
                    <span className="font-medium capitalize">{gameType.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Format</span>
                    <span className="font-medium">
                      {rounds === 1 ? 'Single Game' : `Best of ${rounds}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Your Stake</span>
                    <span className="font-bold text-primary">${stakeAmount} USDC</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between">
                    <span className="text-muted-foreground">Prize Pool</span>
                    <span className="font-bold text-success">${stakeAmount * 2} USDC</span>
                  </div>
                </div>

                {/* Wallet Status */}
                {!isConnected ? (
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-center">
                    <Wallet className="h-8 w-8 mx-auto mb-2 text-destructive" />
                    <p className="text-sm text-destructive">
                      Connect your wallet to create the match
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-success/10 border border-success/30 text-center">
                    <p className="text-sm text-success">
                      Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                    </p>
                  </div>
                )}

                {/* Info */}
                <p className="text-sm text-muted-foreground text-center">
                  After creating, you'll need to approve and deposit your stake.
                  Match starts when your opponent joins and deposits.
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          {step < 3 ? (
            <>
              <div /> {/* Spacer */}
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                variant="neon"
                size="lg"
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          ) : (
            <>
              <div /> {/* Spacer */}
              <Button
                onClick={handleCreate}
                disabled={!canProceed() || isCreating}
                variant="neon"
                size="lg"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Match
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default CreateMatch;
