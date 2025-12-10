import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Ticket, Loader2 } from 'lucide-react';

interface JoinByCodeDialogProps {
  children: React.ReactNode;
}

export function JoinByCodeDialog({ children }: JoinByCodeDialogProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const trimmedCode = code.trim().toUpperCase();
    
    if (!trimmedCode || trimmedCode.length < 4) {
      toast({
        title: 'Invalid code',
        description: 'Please enter a valid invite code',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Find the invite code
      const { data: invite, error: inviteError } = await supabase
        .from('game_invites')
        .select('*, matches(*)')
        .eq('invite_code', trimmedCode)
        .maybeSingle();

      if (inviteError) throw inviteError;

      if (!invite) {
        toast({
          title: 'Code not found',
          description: 'This invite code does not exist',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Check if already used
      if (invite.used_by) {
        toast({
          title: 'Code already used',
          description: 'This invite code has already been redeemed',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Check if expired
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        toast({
          title: 'Code expired',
          description: 'This invite code has expired',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const match = invite.matches as any;

      // Check if user created this match
      if (match.creator_id === profile?.id) {
        toast({
          title: 'Cannot join',
          description: 'You created this match!',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Check balance for the match currency
      const matchCurrency = match.currency || 'USDC';
      let userBalance = 0;

      if (matchCurrency === 'USDC') {
        userBalance = profile?.wallet_balance || 0;
      } else if (matchCurrency === 'BASE') {
        userBalance = (profile as any)?.base_balance || 0;
      } else if (matchCurrency === 'USDT') {
        userBalance = (profile as any)?.usdt_balance || 0;
      }

      if (userBalance < match.stake_amount) {
        toast({
          title: 'Insufficient balance',
          description: `You need $${match.stake_amount} ${matchCurrency}. You have $${userBalance.toFixed(2)} ${matchCurrency}.`,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Join the match
      const { error: playerError } = await supabase
        .from('match_players')
        .insert({
          match_id: match.id,
          player_id: profile?.id,
          player_symbol: 'O',
          has_deposited: true,
        });

      if (playerError) {
        if (playerError.code === '23505') {
          toast({
            title: 'Already joined',
            description: 'You are already in this match.',
            variant: 'destructive',
          });
        } else {
          throw playerError;
        }
        setLoading(false);
        return;
      }

      // Update match to active
      await supabase
        .from('matches')
        .update({ state: 'active', started_at: new Date().toISOString() })
        .eq('id', match.id);

      // Mark invite as used
      await supabase
        .from('game_invites')
        .update({ 
          used_by: profile?.id, 
          used_at: new Date().toISOString() 
        })
        .eq('id', invite.id);

      // Deduct stake from correct currency balance
      const updateData: any = {};
      if (matchCurrency === 'USDC') {
        updateData.wallet_balance = userBalance - match.stake_amount;
      } else if (matchCurrency === 'BASE') {
        updateData.base_balance = userBalance - match.stake_amount;
      } else if (matchCurrency === 'USDT') {
        updateData.usdt_balance = userBalance - match.stake_amount;
      }

      await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile?.id);

      // Add to escrow with currency
      await supabase
        .from('escrow')
        .insert({
          match_id: match.id,
          player_id: profile?.id,
          amount: match.stake_amount,
          currency: matchCurrency,
          status: 'held',
        });

      // Record stake transaction with currency
      await supabase
        .from('transactions')
        .insert({
          user_id: profile?.id,
          amount: match.stake_amount,
          tx_type: 'stake',
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          match_id: match.id,
          currency: matchCurrency,
        });

      toast({
        title: 'Joined match!',
        description: 'Game is starting...',
      });

      setOpen(false);
      setCode('');
      navigate(`/match/${match.id}`);

    } catch (error) {
      console.error('Error joining with code:', error);
      toast({
        title: 'Failed to join',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            Join with Code
          </DialogTitle>
          <DialogDescription>
            Enter the invite code shared by your opponent
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="code">Invite Code</Label>
            <Input
              id="code"
              placeholder="e.g. ABC123"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="text-center font-mono text-lg tracking-widest uppercase"
              maxLength={8}
              autoComplete="off"
            />
          </div>

          <Button 
            onClick={handleJoin} 
            className="w-full" 
            disabled={loading || !code.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              'Join Match'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
