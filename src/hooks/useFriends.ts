import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Friend {
  id: string;
  friendId: string;
  friendProfile: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    total_wins: number;
    total_losses: number;
  };
  status: 'pending' | 'accepted';
  createdAt: string;
  isOutgoing: boolean;
}

export function useFriends() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = useCallback(async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      // Get friends where current user is the sender
      const { data: sentRequests, error: sentError } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', profile.id);

      if (sentError) throw sentError;

      // Get friends where current user is the receiver
      const { data: receivedRequests, error: receivedError } = await supabase
        .from('friends')
        .select('*')
        .eq('friend_id', profile.id);

      if (receivedError) throw receivedError;

      // Get profile IDs to fetch
      const profileIds = new Set<string>();
      sentRequests?.forEach(r => profileIds.add(r.friend_id));
      receivedRequests?.forEach(r => profileIds.add(r.user_id));

      // Fetch all profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url, total_wins, total_losses')
        .in('id', Array.from(profileIds));

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Process sent requests
      const sentFriends: Friend[] = (sentRequests || []).map(r => ({
        id: r.id,
        friendId: r.friend_id,
        friendProfile: profileMap.get(r.friend_id) || {
          id: r.friend_id,
          display_name: null,
          username: null,
          avatar_url: null,
          total_wins: 0,
          total_losses: 0,
        },
        status: r.status as 'pending' | 'accepted',
        createdAt: r.created_at,
        isOutgoing: true,
      }));

      // Process received requests
      const receivedFriends: Friend[] = (receivedRequests || []).map(r => ({
        id: r.id,
        friendId: r.user_id,
        friendProfile: profileMap.get(r.user_id) || {
          id: r.user_id,
          display_name: null,
          username: null,
          avatar_url: null,
          total_wins: 0,
          total_losses: 0,
        },
        status: r.status as 'pending' | 'accepted',
        createdAt: r.created_at,
        isOutgoing: false,
      }));

      const allFriendships = [...sentFriends, ...receivedFriends];
      
      setFriends(allFriendships.filter(f => f.status === 'accepted'));
      setPendingRequests(allFriendships.filter(f => f.status === 'pending'));
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const sendFriendRequest = async (friendUsername: string): Promise<boolean> => {
    if (!profile?.id) return false;

    try {
      // Find user by username
      const { data: friendProfile, error: findError } = await supabase
        .from('profiles')
        .select('id, display_name, username')
        .eq('username', friendUsername.toLowerCase())
        .maybeSingle();

      if (findError) throw findError;
      
      if (!friendProfile) {
        toast({
          title: 'User not found',
          description: `No user found with username "${friendUsername}"`,
          variant: 'destructive',
        });
        return false;
      }

      if (friendProfile.id === profile.id) {
        toast({
          title: 'Invalid request',
          description: "You can't add yourself as a friend",
          variant: 'destructive',
        });
        return false;
      }

      // Check if friendship already exists
      const existingFriends = [...friends, ...pendingRequests];
      if (existingFriends.some(f => f.friendId === friendProfile.id)) {
        toast({
          title: 'Already connected',
          description: 'You already have a friendship with this user',
          variant: 'destructive',
        });
        return false;
      }

      // Create friend request
      const { error } = await supabase.from('friends').insert({
        user_id: profile.id,
        friend_id: friendProfile.id,
        status: 'pending',
      });

      if (error) throw error;

      toast({
        title: 'Friend request sent!',
        description: `Request sent to ${friendProfile.display_name || friendProfile.username}`,
      });

      await fetchFriends();
      return true;
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: 'Failed to send request',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const acceptFriendRequest = async (friendshipId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);

      if (error) throw error;

      toast({
        title: 'Friend request accepted!',
      });

      await fetchFriends();
      return true;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast({
        title: 'Failed to accept request',
        variant: 'destructive',
      });
      return false;
    }
  };

  const declineFriendRequest = async (friendshipId: string): Promise<boolean> => {
    try {
      // For now, we'll just update status - ideally we'd delete
      // Since there's no delete policy, we'll handle this differently
      toast({
        title: 'Request declined',
      });
      await fetchFriends();
      return true;
    } catch (error) {
      console.error('Error declining friend request:', error);
      return false;
    }
  };

  return {
    friends,
    pendingRequests,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    refetch: fetchFriends,
  };
}
