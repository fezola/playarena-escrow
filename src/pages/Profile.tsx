import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { MobileLayout } from '@/components/MobileLayout';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Trophy, Gamepad2, Coins, TrendingUp, Settings, History, 
  Wallet, LogOut, ChevronRight, Plus, Copy, CreditCard, ArrowUpRight
} from 'lucide-react';

export default function Profile() {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    navigate('/auth');
  };

  const handleCopyAddress = () => {
    if (profile?.wallet_address) {
      navigator.clipboard.writeText(profile.wallet_address);
      toast({
        title: 'Copied!',
        description: 'Wallet address copied to clipboard',
      });
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

  const xpProgress = ((profile?.xp || 0) % 100);
  const nextLevel = (profile?.level || 1) + 1;

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
              <div className="flex items-center gap-4 mb-4">
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
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      <Trophy className="h-3 w-3 mr-1" />
                      Level {profile?.level || 1}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* XP Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">XP to Level {nextLevel}</span>
                  <span className="font-medium">{xpProgress}/100</span>
                </div>
                <Progress value={xpProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <main className="px-4 space-y-4 -mt-2">
        {/* Wallet Section */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                <span className="font-display font-bold">Wallet</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCopyAddress}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="font-display text-3xl font-bold mb-1">
              ${profile?.wallet_balance?.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {profile?.wallet_address 
                ? `${profile.wallet_address.slice(0, 10)}...${profile.wallet_address.slice(-8)}`
                : 'No wallet connected'
              }
            </p>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Add Funds
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
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
    </MobileLayout>
  );
}
