import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/MobileLayout';
import { useAuth } from '@/hooks/useAuth';
import { useFriends, Friend } from '@/hooks/useFriends';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GameType, gameTypeLabels, gameTypeIcons } from '@/types/game';
import {
  Users,
  UserPlus,
  Search,
  Swords,
  Check,
  X,
  Loader2,
  Clock,
  Trophy,
} from 'lucide-react';

const STAKE_OPTIONS = [1, 5, 10, 25, 50];

export default function Friends() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { friends, pendingRequests, loading, sendFriendRequest, acceptFriendRequest } = useFriends();
  
  const [searchUsername, setSearchUsername] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isChallengeOpen, setIsChallengeOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [challengeGame, setChallengeGame] = useState<GameType>('tic-tac-toe');
  const [challengeStake, setChallengeStake] = useState('5');
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleAddFriend = async () => {
    if (!searchUsername.trim()) return;
    
    setIsSearching(true);
    await sendFriendRequest(searchUsername.trim());
    setSearchUsername('');
    setIsSearching(false);
  };

  const handleChallenge = (friend: Friend) => {
    setSelectedFriend(friend);
    setIsChallengeOpen(true);
  };

  const createChallenge = async () => {
    if (!selectedFriend || !profile) return;

    const stakeAmount = parseFloat(challengeStake);
    if (stakeAmount > (profile.wallet_balance || 0)) {
      toast({
        title: 'Insufficient balance',
        description: 'You need more funds to create this match',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingChallenge(true);

    try {
      // Create match
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert({
          game_type: challengeGame,
          stake_amount: stakeAmount,
          creator_id: profile.id,
          state: 'waiting',
          players_required: 2,
        })
        .select()
        .single();

      if (matchError) throw matchError;

      // Add creator as player
      await supabase.from('match_players').insert({
        match_id: match.id,
        player_id: profile.id,
        player_symbol: 'X',
      });

      // Create invite for friend
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await supabase.from('game_invites').insert({
        match_id: match.id,
        created_by: profile.id,
        invite_code: inviteCode,
      });

      toast({
        title: 'Challenge sent!',
        description: `Invited ${selectedFriend.friendProfile.display_name || 'friend'} to play ${gameTypeLabels[challengeGame]}`,
      });

      setIsChallengeOpen(false);
      navigate(`/match/${match.id}`);
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast({
        title: 'Failed to create challenge',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingChallenge(false);
    }
  };

  const incomingRequests = pendingRequests.filter(r => !r.isOutgoing);
  const outgoingRequests = pendingRequests.filter(r => r.isOutgoing);

  return (
    <MobileLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="font-display text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Friends
          </h1>
          {pendingRequests.length > 0 && (
            <Badge className="bg-primary/20 text-primary">
              {incomingRequests.length} pending
            </Badge>
          )}
        </div>
      </header>

      <main className="px-4 py-4 space-y-4">
        {/* Add Friend */}
        <Card className="border-primary/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <UserPlus className="h-4 w-4 text-primary" />
              <span className="font-display font-bold text-sm">Add Friend</span>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter username..."
                  value={searchUsername}
                  onChange={(e) => setSearchUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
                  className="pl-9"
                />
              </div>
              <Button
                onClick={handleAddFriend}
                disabled={!searchUsername.trim() || isSearching}
                size="icon"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Add friends by their username to challenge them to matches
            </p>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="friends" className="gap-1">
              <Users className="h-4 w-4" />
              Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-1">
              <Clock className="h-4 w-4" />
              Pending ({pendingRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="mt-4 space-y-2">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-border/50">
                    <CardContent className="p-3">
                      <Skeleton className="h-14 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : friends.length === 0 ? (
              <Card className="border-border/50 border-dashed">
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium mb-1">No friends yet</p>
                  <p className="text-sm text-muted-foreground">
                    Add friends by their username to start playing together
                  </p>
                </CardContent>
              </Card>
            ) : (
              friends.map((friend, index) => (
                <FriendCard
                  key={friend.id}
                  friend={friend}
                  index={index}
                  onChallenge={() => handleChallenge(friend)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="pending" className="mt-4 space-y-4">
            {incomingRequests.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Incoming Requests
                </h3>
                {incomingRequests.map((request, index) => (
                  <PendingRequestCard
                    key={request.id}
                    request={request}
                    index={index}
                    onAccept={() => acceptFriendRequest(request.id)}
                    type="incoming"
                  />
                ))}
              </div>
            )}

            {outgoingRequests.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Sent Requests
                </h3>
                {outgoingRequests.map((request, index) => (
                  <PendingRequestCard
                    key={request.id}
                    request={request}
                    index={index}
                    type="outgoing"
                  />
                ))}
              </div>
            )}

            {pendingRequests.length === 0 && (
              <Card className="border-border/50 border-dashed">
                <CardContent className="p-8 text-center">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium mb-1">No pending requests</p>
                  <p className="text-sm text-muted-foreground">
                    Friend requests will appear here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Challenge Dialog */}
      <Dialog open={isChallengeOpen} onOpenChange={setIsChallengeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Swords className="h-5 w-5 text-primary" />
              Challenge Friend
            </DialogTitle>
            <DialogDescription>
              Challenge {selectedFriend?.friendProfile.display_name || 'your friend'} to a match
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Friend info */}
            <Card className="border-border/50 bg-muted/50">
              <CardContent className="p-3 flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedFriend?.friendProfile.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {selectedFriend?.friendProfile.display_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {selectedFriend?.friendProfile.display_name || 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    {selectedFriend?.friendProfile.total_wins || 0} wins
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Game selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Game</label>
              <div className="grid grid-cols-3 gap-2">
                {(['tic-tac-toe', 'chess', 'scrabble'] as GameType[]).map((game) => (
                  <Button
                    key={game}
                    variant={challengeGame === game ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChallengeGame(game)}
                    className="flex-col h-auto py-3 gap-1"
                  >
                    <span className="text-xl">{gameTypeIcons[game]}</span>
                    <span className="text-[10px]">{gameTypeLabels[game]}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Stake selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Stake Amount</label>
              <Select value={challengeStake} onValueChange={setChallengeStake}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAKE_OPTIONS.map((amount) => (
                    <SelectItem key={amount} value={String(amount)}>
                      ${amount}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Your balance: ${profile?.wallet_balance?.toFixed(2) || '0.00'}
              </p>
            </div>

            <Button
              onClick={createChallenge}
              disabled={isCreatingChallenge || parseFloat(challengeStake) > (profile?.wallet_balance || 0)}
              variant="neon"
              className="w-full"
              size="lg"
            >
              {isCreatingChallenge ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Swords className="h-4 w-4 mr-2" />
                  Send Challenge
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}

function FriendCard({
  friend,
  index,
  onChallenge,
}: {
  friend: Friend;
  index: number;
  onChallenge: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="border-border/50">
        <CardContent className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={friend.friendProfile.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {friend.friendProfile.display_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">
                {friend.friendProfile.display_name || 'Unknown'}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                {friend.friendProfile.total_wins} wins
              </p>
            </div>
          </div>
          <Button size="sm" variant="neon" onClick={onChallenge}>
            <Swords className="h-4 w-4 mr-1" />
            Challenge
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PendingRequestCard({
  request,
  index,
  onAccept,
  type,
}: {
  request: Friend;
  index: number;
  onAccept?: () => void;
  type: 'incoming' | 'outgoing';
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAccept = async () => {
    if (!onAccept) return;
    setIsLoading(true);
    await onAccept();
    setIsLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="border-border/50">
        <CardContent className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={request.friendProfile.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {request.friendProfile.display_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">
                {request.friendProfile.display_name || 'Unknown'}
              </p>
              <p className="text-xs text-muted-foreground">
                {type === 'incoming' ? 'Wants to be friends' : 'Request sent'}
              </p>
            </div>
          </div>
          {type === 'incoming' ? (
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="default"
                onClick={handleAccept}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
              <Button size="icon" variant="outline">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Badge variant="outline">Pending</Badge>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
