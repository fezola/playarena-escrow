import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/MobileLayout';
import { GameSelector } from '@/components/games/GameSelector';
import { StakeInput } from '@/components/StakeInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { GameType } from '@/types/game';
import { useAuth } from '@/hooks/useAuth';
import { useMatches } from '@/hooks/useMatches';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Loader2, Wallet, CheckCircle } from 'lucide-react';

const CreateMatch = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { createMatch } = useMatches();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [gameType, setGameType] = useState<GameType>('tic-tac-toe');
  const [stakeAmount, setStakeAmount] = useState(25);
  const [rounds, setRounds] = useState(1);
  const [currency, setCurrency] = useState<'BASE' | 'USDC' | 'USDT'>('USDC');
  const [isCreating, setIsCreating] = useState(false);

  // Redirect if not logged in
  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleCreate = async () => {
    setIsCreating(true);

    const match = await createMatch(gameType, stakeAmount, rounds, currency);

    setIsCreating(false);

    if (match) {
      navigate(`/match/${match.id}`);
    }
  };

  // Get balance based on selected currency
  const getBalanceForCurrency = () => {
    switch (currency) {
      case 'BASE': return (profile as any)?.base_balance || 0;
      case 'USDT': return (profile as any)?.usdt_balance || 0;
      case 'USDC': 
      default: return profile?.wallet_balance || 0;
    }
  };

  const currentBalance = getBalanceForCurrency();
  const hasEnoughBalance = currentBalance >= stakeAmount;

  const canProceed = () => {
    if (step === 1) return true;
    if (step === 2) return stakeAmount >= 1;
    if (step === 3) return hasEnoughBalance;
    return false;
  };

  return (
    <MobileLayout hideNav>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (step > 1 ? setStep(step - 1) : navigate('/'))}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {step > 1 ? 'Back' : 'Cancel'}
          </Button>
          <span className="font-display font-bold">Create Match</span>
          <div className="w-16" />
        </div>
      </header>

      <main className="px-4 py-6">
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
                {s < step ? <CheckCircle className="h-4 w-4" /> : s}
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
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold">Choose Your Game</h2>
              <GameSelector selected={gameType} onChange={setGameType} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-bold">Set Your Stake</h2>
              
              <div>
                <Label className="text-sm mb-3 block text-muted-foreground">Stake Amount (per player)</Label>
                <StakeInput value={stakeAmount} onChange={setStakeAmount} />
              </div>

              <div>
                <Label className="text-sm mb-3 block text-muted-foreground">Currency</Label>
                <RadioGroup
                  value={currency}
                  onValueChange={(v) => setCurrency(v as 'BASE' | 'USDC' | 'USDT')}
                  className="grid grid-cols-3 gap-3"
                >
                  {[
                    { value: 'BASE', label: 'BASE', balance: (profile as any)?.base_balance || 0 },
                    { value: 'USDC', label: 'USDC', balance: profile?.wallet_balance || 0 },
                    { value: 'USDT', label: 'USDT', balance: (profile as any)?.usdt_balance || 0 },
                  ].map((option) => (
                    <div key={option.value}>
                      <RadioGroupItem
                        value={option.value}
                        id={`currency-${option.value}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`currency-${option.value}`}
                        className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all text-sm"
                      >
                        <span className="font-display font-bold">{option.label}</span>
                        <span className="text-xs text-muted-foreground mt-1">${option.balance.toFixed(2)}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm mb-3 block text-muted-foreground">Match Format</Label>
                <RadioGroup
                  value={String(rounds)}
                  onValueChange={(v) => setRounds(Number(v))}
                  className="grid grid-cols-3 gap-3"
                >
                  {[
                    { value: '1', label: 'Single' },
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
                        className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all text-sm"
                      >
                        <span className="font-display font-bold">{option.label}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-bold">Confirm & Create</h2>
              
              {/* Summary */}
              <Card className="border-border/50">
                <CardContent className="p-4 space-y-3">
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
                    <span className="font-bold text-primary">${stakeAmount}</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between">
                    <span className="text-muted-foreground">Total Prize</span>
                    <span className="font-bold text-success">${stakeAmount * 2}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Wallet Status */}
              <Card className={`border-border/50 ${hasEnoughBalance ? 'bg-success/5 border-success/30' : 'bg-destructive/5 border-destructive/30'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className={`h-5 w-5 ${hasEnoughBalance ? 'text-success' : 'text-destructive'}`} />
                      <span className="font-medium">Your Balance</span>
                    </div>
                    <span className={`font-display font-bold ${hasEnoughBalance ? 'text-success' : 'text-destructive'}`}>
                      ${currentBalance.toFixed(2)} {currency}
                    </span>
                  </div>
                  {!hasEnoughBalance && (
                    <p className="text-xs text-destructive mt-2">
                      You need ${(stakeAmount - currentBalance).toFixed(2)} more {currency}. Add funds in your profile.
                    </p>
                  )}
                </CardContent>
              </Card>

              <p className="text-xs text-muted-foreground text-center">
                Your stake will be held until the match ends. Winner takes all!
              </p>
            </div>
          )}
        </motion.div>

        {/* Navigation */}
        <div className="mt-8">
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              variant="neon"
              size="lg"
              className="w-full"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={!canProceed() || isCreating}
              variant="neon"
              size="lg"
              className="w-full"
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
          )}
        </div>
      </main>
    </MobileLayout>
  );
};

export default CreateMatch;
