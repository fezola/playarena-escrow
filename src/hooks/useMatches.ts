import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type Match = Database['public']['Tables']['matches']['Row'];
type MatchPlayer = Database['public']['Tables']['match_players']['Row'];

export interface MatchWithPlayers extends Match {
  match_players: (MatchPlayer & {
    profiles: {
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  })[];
  creator?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function useMatches() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState<MatchWithPlayers[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        match_players (
          *,
          profiles:player_id (
            display_name,
            avatar_url
          )
        ),
        creator:creator_id (
          display_name,
          avatar_url
        )
      `)
      .in('state', ['waiting', 'active'])
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching matches:', error);
    } else {
      setMatches(data as unknown as MatchWithPlayers[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMatches();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('matches-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => fetchMatches()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'match_players' },
        () => fetchMatches()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const createMatch = async (
    gameType: Database['public']['Enums']['game_type'],
    stakeAmount: number,
    rounds: number
  ) => {
    if (!profile) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to create a match.',
        variant: 'destructive',
      });
      return null;
    }

    if ((profile.wallet_balance || 0) < stakeAmount) {
      toast({
        title: 'Insufficient balance',
        description: `You need $${stakeAmount} to create this match. Add funds first.`,
        variant: 'destructive',
      });
      return null;
    }

    // Create match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        game_type: gameType,
        stake_amount: stakeAmount,
        rounds,
        creator_id: profile.id,
        state: 'waiting',
      })
      .select()
      .single();

    if (matchError) {
      toast({
        title: 'Error creating match',
        description: matchError.message,
        variant: 'destructive',
      });
      return null;
    }

    // Add creator as player
    const { error: playerError } = await supabase
      .from('match_players')
      .insert({
        match_id: match.id,
        player_id: profile.id,
        player_symbol: 'X',
        has_deposited: true,
      });

    if (playerError) {
      console.error('Error adding player:', playerError);
    }

    // Deduct stake from wallet
    await supabase
      .from('profiles')
      .update({ wallet_balance: (profile.wallet_balance || 0) - stakeAmount })
      .eq('id', profile.id);

    toast({
      title: 'Match created!',
      description: 'Waiting for an opponent to join...',
    });

    return match;
  };

  const joinMatch = async (matchId: string) => {
    if (!profile) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to join a match.',
        variant: 'destructive',
      });
      return false;
    }

    // Get match details
    const { data: match } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (!match) {
      toast({
        title: 'Match not found',
        variant: 'destructive',
      });
      return false;
    }

    if (match.creator_id === profile.id) {
      toast({
        title: 'Cannot join',
        description: 'You created this match!',
        variant: 'destructive',
      });
      return false;
    }

    if ((profile.wallet_balance || 0) < match.stake_amount) {
      toast({
        title: 'Insufficient balance',
        description: `You need $${match.stake_amount} to join. Add funds first.`,
        variant: 'destructive',
      });
      return false;
    }

    // Add player
    const { error: playerError } = await supabase
      .from('match_players')
      .insert({
        match_id: matchId,
        player_id: profile.id,
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
        toast({
          title: 'Error joining',
          description: playerError.message,
          variant: 'destructive',
        });
      }
      return false;
    }

    // Update match to active
    await supabase
      .from('matches')
      .update({ state: 'active', started_at: new Date().toISOString() })
      .eq('id', matchId);

    // Deduct stake
    await supabase
      .from('profiles')
      .update({ wallet_balance: (profile.wallet_balance || 0) - match.stake_amount })
      .eq('id', profile.id);

    toast({
      title: 'Joined match!',
      description: 'Game is starting...',
    });

    return true;
  };

  return {
    matches,
    loading,
    createMatch,
    joinMatch,
    refetch: fetchMatches,
  };
}
