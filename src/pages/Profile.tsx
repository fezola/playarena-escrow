import { useState, useRef, useEffect } from 'react';
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
import { createPublicClient, http, formatUnits } from 'viem';
import { base } from 'viem/chains';
import {
  Trophy, Gamepad2, Coins, TrendingUp, History,
  Wallet, LogOut, ChevronRight, Plus, CreditCard, ArrowUpRight, Loader2, Pencil, Camera, Copy, Check, ExternalLink, RefreshCw
} from 'lucide-react';

const SUPPORTED_TOKENS = [
  { symbol: 'USDC', name: 'USD Coin', network: 'Base' },
  { symbol: 'USDT', name: 'Tether', network: 'Base' },
];

export default function Profile() {
  const { user, profile, signOut, refreshProfile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingWallet, setIsGeneratingWallet] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Edit form state
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editUsername, setEditUsername] = useState('');

  // REMOVED: Auto-generate wallet - causes 404 errors when Edge Functions aren't deployed
  // Users can manually generate wallet by clicking the "Generate Wallet" button if needed

  const generateWallet = async () => {
    if (isGeneratingWallet) return;
    
    setIsGeneratingWallet(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('No session');
      }

      const { data, error } = await supabase.functions.invoke('generate-wallet', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.success) {
        await refreshProfile();
        toast({
          title: 'Wallet created!',
          description: 'Your deposit address is ready.',
        });
      }
    } catch (error) {
      console.error('Error generating wallet:', error);
      toast({
        title: 'Failed to create wallet',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingWallet(false);
    }
  };

  const copyAddress = async () => {
    if (!profile?.wallet_address) return;

    try {
      await navigator.clipboard.writeText(profile.wallet_address);
      setCopied(true);
      toast({ title: 'Address copied!' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const refreshBalance = async () => {
    if (!profile?.wallet_address || isRefreshing) return;

    setIsRefreshing(true);
    try {
      const ERC20_ABI = [
        {
          constant: true,
          inputs: [{ name: '_owner', type: 'address' }],
          name: 'balanceOf',
          outputs: [{ name: 'balance', type: 'uint256' }],
          type: 'function',
        },
      ] as const;

      const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

      const client = createPublicClient({
        chain: base,
        transport: http('https://mainnet.base.org'),
      });

      // Check USDC balance on-chain
      const usdcBalance = await client.readContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [profile.wallet_address as `0x${string}`],
      });

      const balanceInUsdc = parseFloat(formatUnits(usdcBalance, 6));
      const currentDbBalance = profile.wallet_balance || 0;

      // If on-chain balance is different, update database
      if (Math.abs(balanceInUsdc - currentDbBalance) > 0.01) {
        const { error } = await supabase
          .from('profiles')
          .update({ wallet_balance: balanceInUsdc })
          .eq('id', profile.id);

        if (error) throw error;

        // Refresh profile to show new balance
        await refreshProfile();

        const diff = balanceInUsdc - currentDbBalance;
        if (diff > 0) {
          toast({
            title: 'Balance updated!',
            description: `+$${diff.toFixed(2)} USDC detected`,
          });
        } else {
          toast({
            title: 'Balance updated!',
            description: `Balance: $${balanceInUsdc.toFixed(2)} USDC`,
          });
        }
      } else {
        toast({
          title: 'Balance up to date',
          description: `$${balanceInUsdc.toFixed(2)} USDC`,
        });
      }
    } catch (error) {
      console.error('Error refreshing balance:', error);
      toast({
        title: 'Failed to refresh balance',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    navigate('/auth');
  };

  const handleOpenEdit = () => {
    setEditDisplayName(profile?.display_name || '');
    setEditUsername(profile?.username || '');
    setIsEditOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!profile?.id) return;

    setIsProcessing(true);
    try {
      // Check if username is taken (if changed)
      if (editUsername && editUsername !== profile.username) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', editUsername.toLowerCase())
          .neq('id', profile.id)
          .maybeSingle();

        if (existing) {
          toast({
            title: 'Username taken',
            description: 'This username is already in use',
            variant: 'destructive',
          });
          setIsProcessing(false);
          return;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editDisplayName || null,
          username: editUsername?.toLowerCase() || null,
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      toast({ title: 'Profile updated!' });
      setIsEditOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image under 2MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      // Convert to base64 for simple storage (in production, use Supabase Storage)
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: base64 })
          .eq('id', profile.id);

        if (error) throw error;

        await refreshProfile();
        toast({ title: 'Profile picture updated!' });
        setIsUploading(false);
      };
      reader.onerror = () => {
        throw new Error('Failed to read file');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Failed to upload image',
        variant: 'destructive',
      });
      setIsUploading(false);
    }
  };

  const isValidEthAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    const balance = profile?.wallet_balance || 0;

    if (!isValidEthAddress(withdrawAddress)) {
      toast({
        title: 'Invalid wallet address',
        description: 'Please enter a valid Ethereum address (0x...)',
        variant: 'destructive',
      });
      return;
    }

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
      // Get session for authorization
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('No session');
      }

      // Call the withdrawal processing edge function
      const { data, error } = await supabase.functions.invoke('process-withdrawal', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: {
          destinationAddress: withdrawAddress,
          amount: amount,
        },
      });

      if (error) throw error;

      if (data?.success) {
        await refreshProfile();

        toast({
          title: 'Withdrawal successful!',
          description: `$${amount.toFixed(2)} sent to ${withdrawAddress.slice(0, 6)}...${withdrawAddress.slice(-4)}`,
        });

        // Show transaction hash
        if (data.txHash) {
          console.log('Transaction hash:', data.txHash);
          toast({
            title: 'Transaction confirmed',
            description: `TX: ${data.txHash.slice(0, 10)}...`,
          });
        }

        setIsWithdrawOpen(false);
        setWithdrawAmount('');
        setWithdrawAddress('');
      }
    } catch (error) {
      console.error('Withdraw error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast({
        title: 'Withdrawal failed',
        description: errorMessage,
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

  const truncatedAddress = profile?.wallet_address 
    ? `${profile.wallet_address.slice(0, 6)}...${profile.wallet_address.slice(-4)}`
    : null;

  return (
    <MobileLayout>
      {/* Hidden file input for avatar upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header with gradient */}
      <div className="bg-gradient-to-b from-primary/20 via-primary/5 to-background">
        <header className="flex items-center justify-between px-4 py-4">
          <h1 className="font-display text-xl font-bold">Profile</h1>
          <Button variant="ghost" size="icon" onClick={handleOpenEdit}>
            <Pencil className="h-5 w-5" />
          </Button>
        </header>

        {/* Profile Card */}
        <div className="px-4 pb-6">
          <Card className="border-border/50 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar 
                    className="h-16 w-16 border-2 border-primary cursor-pointer"
                    onClick={handleAvatarClick}
                  >
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary font-display text-xl">
                      {profile?.display_name?.charAt(0) || profile?.username?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={handleAvatarClick}
                    disabled={isUploading}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                  >
                    {isUploading ? (
                      <Loader2 className="h-3 w-3 text-primary-foreground animate-spin" />
                    ) : (
                      <Camera className="h-3 w-3 text-primary-foreground" />
                    )}
                  </button>
                </div>
                <div className="flex-1">
                  <h2 className="font-display font-bold text-lg">
                    {profile?.display_name || profile?.username || 'Player'}
                  </h2>
                  {profile?.username && (
                    <p className="text-sm text-muted-foreground">@{profile.username}</p>
                  )}
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
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                <span className="font-display font-bold">Wallet</span>
              </div>
              {isGeneratingWallet ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Creating wallet...
                </div>
              ) : truncatedAddress ? (
                <button 
                  onClick={copyAddress}
                  className="flex items-center gap-1 text-xs font-mono bg-muted px-2 py-1 rounded hover:bg-muted/80 transition-colors"
                >
                  {truncatedAddress}
                  {copied ? (
                    <Check className="h-3 w-3 text-success" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={generateWallet}
                  disabled={isGeneratingWallet}
                >
                  Create Wallet
                </Button>
              )}
            </div>
            
            <div className="flex items-center justify-between mb-1">
              <p className="font-display text-3xl font-bold">
                ${profile?.wallet_balance?.toFixed(2) || '0.00'}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshBalance}
                disabled={isRefreshing || !profile?.wallet_address}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Available balance • Click refresh to update
            </p>

            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="neon" 
                size="sm" 
                className="gap-1"
                onClick={() => setIsDepositOpen(true)}
                disabled={!profile?.wallet_address}
              >
                <Plus className="h-4 w-4" />
                Deposit
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

      {/* Edit Profile Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Edit Profile
            </DialogTitle>
            <DialogDescription>
              Update your display name and username
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                placeholder="Your display name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                <Input
                  id="username"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  placeholder="username"
                  className="pl-7"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Used for friends to find you
              </p>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={isProcessing}
              variant="neon"
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deposit Dialog - Shows wallet address for receiving */}
      <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Deposit Funds
            </DialogTitle>
            <DialogDescription>
              Send USDC or USDT to your wallet address
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Supported tokens */}
            <div className="space-y-2">
              <Label>Supported Tokens (Base Network)</Label>
              <div className="grid grid-cols-2 gap-2">
                {SUPPORTED_TOKENS.map((token) => (
                  <Card key={token.symbol} className="border-border/50">
                    <CardContent className="p-3 text-center">
                      <p className="font-display font-bold">{token.symbol}</p>
                      <p className="text-xs text-muted-foreground">{token.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Wallet address */}
            <div className="space-y-2">
              <Label>Your Deposit Address</Label>
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-xs break-all">
                      {profile?.wallet_address}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={copyAddress}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Instructions */}
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="p-3 space-y-2">
                <p className="text-sm font-medium text-warning">Important</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Only send USDC or USDT on the <strong>Base network</strong></li>
                  <li>• Sending other tokens may result in permanent loss</li>
                  <li>• Deposits typically take 1-5 minutes to confirm</li>
                  <li>• Your balance will update automatically</li>
                </ul>
              </CardContent>
            </Card>

            {/* External wallet link */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(`https://basescan.org/address/${profile?.wallet_address}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on BaseScan
            </Button>
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
              Withdraw your earnings to an external wallet
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

            {/* Destination address */}
            <div className="space-y-2">
              <Label htmlFor="withdraw-address">Destination Wallet Address</Label>
              <Input
                id="withdraw-address"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                placeholder="0x..."
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Enter the Base network wallet address to receive funds
              </p>
            </div>

            {/* Withdraw amount */}
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Amount (USDC)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="withdraw-amount"
                  type="number"
                  min="1"
                  max={profile?.wallet_balance || 0}
                  step="0.01"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="pl-7 font-display text-lg"
                  placeholder="0.00"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWithdrawAmount(String(profile?.wallet_balance || 0))}
                >
                  Withdraw all
                </Button>
              </div>
            </div>

            {/* Warning */}
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">
                  Withdrawals are processed on the Base network. Please double-check the destination address as transactions cannot be reversed.
                </p>
              </CardContent>
            </Card>

            <Button
              onClick={handleWithdraw}
              disabled={isProcessing || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || !withdrawAddress}
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
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
