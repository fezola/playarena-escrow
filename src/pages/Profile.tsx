import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { MobileLayout } from '@/components/MobileLayout';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Trophy, Gamepad2, Coins, TrendingUp, Settings, History, 
  Wallet, LogOut, ChevronRight, Plus, CreditCard, ArrowUpRight, Loader2, DollarSign
} from 'lucide-react';

const QUICK_AMOUNTS = [10, 25, 50, 100];

export default function Profile() {
  const { user, profile, signOut, refreshProfile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('25');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    navigate('/auth');
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount greater than 0',
        variant: 'destructive',
      });
      return;
    }

    if (amount > 1000) {
      toast({
        title: 'Amount too high',
        description: 'Maximum deposit is $1000',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const newBalance = (profile?.wallet_balance || 0) + amount;
      
      const { error } = await supabase
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('id', profile?.id);

      if (error) throw error;

      // Record transaction
      await supabase.from('transactions').insert({
        user_id: profile?.id,
        amount,
        tx_type: 'deposit',
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      });

      await refreshProfile();
      
      toast({
        title: 'Deposit successful!',
        description: `$${amount.toFixed(2)} has been added to your wallet.`,
      });
      
      setIsDepositOpen(false);
      setDepositAmount('25');
    } catch (error) {
      console.error('Deposit error:', error);
      toast({
        title: 'Deposit failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    const balance = profile?.wallet_balance || 0;

    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount greater than 0',
        variant: 'destructive',
      });
      return;
    }

    if (amount > balance) {
      toast({
        title: 'Insufficient balance',
        description: `You only have $${balance.toFixed(2)} available`,
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const newBalance = balance - amount;
      
      const { error } = await supabase
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('id', profile?.id);

      if (error) throw error;

      // Record transaction
      await supabase.from('transactions').insert({
        user_id: profile?.id,
        amount,
        tx_type: 'withdrawal',
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      });

      await refreshProfile();
      
      toast({
        title: 'Withdrawal successful!',
        description: `$${amount.toFixed(2)} has been withdrawn.`,
      });
      
      setIsWithdrawOpen(false);
      setWithdrawAmount('');
    } catch (error) {
      console.error('Withdraw error:', error);
      toast({
        title: 'Withdrawal failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </MobileLayout>
    );
  }

  if (!user) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Gamepad2 className="h-10 w-10 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-2">Join PlayArena</h2>
            <p className="text-muted-foreground mb-6">
              Create an account to track your stats and compete with friends
            </p>
            <Link to="/auth">
              <Button variant="neon" size="lg">
                Sign In / Sign Up
              </Button>
            </Link>
          </motion.div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      {/* Header with gradient */}
      <div className="bg-gradient-to-b from-primary/20 via-primary/5 to-background">
        <header className="flex items-center justify-between px-4 py-4">
          <h1 className="font-display text-xl font-bold">Profile</h1>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </header>

        {/* Profile Card */}
        <div className="px-4 pb-6">
          <Card className="border-border/50 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary font-display text-xl">
                    {profile?.display_name?.charAt(0) || user.email?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="font-display font-bold text-lg">
                    {profile?.display_name || user.email?.split('@')[0]}
                  </h2>
                  {profile?.username && (
                    <p className="text-sm text-muted-foreground">@{profile.username}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {user.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <main className="px-4 space-y-4 -mt-2">
        {/* Wallet Section */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="h-5 w-5 text-primary" />
              <span className="font-display font-bold">Wallet</span>
            </div>
            
            <p className="font-display text-3xl font-bold mb-1">
              ${profile?.wallet_balance?.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Available balance
            </p>

            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="neon" 
                size="sm" 
                className="gap-1"
                onClick={() => setIsDepositOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Funds
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1"
                onClick={() => setIsWithdrawOpen(true)}
                disabled={(profile?.wallet_balance || 0) <= 0}
              >
                <ArrowUpRight className="h-4 w-4" />
                Withdraw
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Trophy, label: 'Total Wins', value: profile?.total_wins || 0, color: 'text-success' },
            { icon: Gamepad2, label: 'Games Played', value: (profile?.total_wins || 0) + (profile?.total_losses || 0), color: 'text-primary' },
            { icon: Coins, label: 'Earnings', value: `$${profile?.total_earnings || 0}`, color: 'text-warning' },
            { icon: TrendingUp, label: 'Win Rate', value: `${profile?.total_wins && profile?.total_losses ? Math.round((profile.total_wins / (profile.total_wins + profile.total_losses)) * 100) : 0}%`, color: 'text-accent' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-border/50">
                <CardContent className="p-3">
                  <stat.icon className={`h-4 w-4 ${stat.color} mb-2`} />
                  <p className="font-display text-xl font-bold">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Menu Items */}
        <div className="space-y-2">
          <Card className="border-border/50">
            <CardContent className="p-0">
              {[
                { icon: History, label: 'Match History', href: '/history' },
                { icon: CreditCard, label: 'Transactions', href: '/transactions' },
                { icon: Settings, label: 'Settings', href: '/settings' },
              ].map((item, index) => (
                <Link key={item.label} to={item.href}>
                  <div className={`flex items-center justify-between p-3 ${index > 0 ? 'border-t border-border/50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Button 
            variant="outline" 
            className="w-full text-destructive hover:text-destructive border-destructive/30"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {isSigningOut ? 'Signing out...' : 'Sign Out'}
          </Button>
        </div>
      </main>

      {/* Deposit Dialog */}
      <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Add Funds
            </DialogTitle>
            <DialogDescription>
              Add funds to your PlayArena wallet to start playing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Quick amounts */}
            <div className="grid grid-cols-4 gap-2">
              {QUICK_AMOUNTS.map((amount) => (
                <Button
                  key={amount}
                  variant={depositAmount === String(amount) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDepositAmount(String(amount))}
                  className="font-display"
                >
                  ${amount}
                </Button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Custom amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="deposit-amount"
                  type="number"
                  min="1"
                  max="1000"
                  step="0.01"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="pl-9 font-display text-lg"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Summary */}
            <Card className="border-border/50 bg-muted/50">
              <CardContent className="p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current balance</span>
                  <span>${profile?.wallet_balance?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Adding</span>
                  <span className="text-success">+${parseFloat(depositAmount || '0').toFixed(2)}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-medium">
                  <span>New balance</span>
                  <span className="text-primary font-display">
                    ${((profile?.wallet_balance || 0) + parseFloat(depositAmount || '0')).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleDeposit}
              disabled={isProcessing || !depositAmount || parseFloat(depositAmount) <= 0}
              variant="neon"
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add ${parseFloat(depositAmount || '0').toFixed(2)}
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Demo mode: Funds are simulated for testing
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-primary" />
              Withdraw Funds
            </DialogTitle>
            <DialogDescription>
              Withdraw your earnings from PlayArena
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-3 text-center">
                <p className="text-sm text-muted-foreground">Available balance</p>
                <p className="font-display text-2xl font-bold text-primary">
                  ${profile?.wallet_balance?.toFixed(2) || '0.00'}
                </p>
              </CardContent>
            </Card>

            {/* Withdraw amount */}
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Withdraw amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="withdraw-amount"
                  type="number"
                  min="1"
                  max={profile?.wallet_balance || 0}
                  step="0.01"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="pl-9 font-display text-lg"
                  placeholder="0.00"
                />
              </div>
              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWithdrawAmount(String(profile?.wallet_balance || 0))}
                >
                  Withdraw all
                </Button>
              </div>
            </div>

            <Button
              onClick={handleWithdraw}
              disabled={isProcessing || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > (profile?.wallet_balance || 0)}
              variant="neon"
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Withdraw ${parseFloat(withdrawAmount || '0').toFixed(2)}
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Demo mode: Withdrawals are simulated for testing
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
