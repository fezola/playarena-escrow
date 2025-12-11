import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Trophy, Loader2, RefreshCw, Zap, Clock, CheckCircle, Info, Plus, Users, DollarSign } from "lucide-react";
import { MobileLayout } from "@/components/MobileLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SportsMatch {
  id: string;
  external_id: string;
  sport: string;
  league: string;
  home_team: string;
  away_team: string;
  home_logo: string | null;
  away_logo: string | null;
  match_date: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  is_live: boolean;
}

interface PredictionPool {
  id: string;
  sports_match_id: string;
  total_pot: number;
  min_stake: number;
  status: string;
  sports_matches?: SportsMatch;
  predictions?: Array<{
    id: string;
    player_id: string;
    predicted_home_score: number;
    predicted_away_score: number;
    stake_amount: number;
    is_winner: boolean | null;
    payout_amount: number | null;
  }>;
}

export default function SportsPrediction() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [matches, setMatches] = useState<SportsMatch[]>([]);
  const [pools, setPools] = useState<PredictionPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<SportsMatch | null>(null);
  const [predictedHomeScore, setPredictedHomeScore] = useState("");
  const [predictedAwayScore, setPredictedAwayScore] = useState("");
  const [stakeAmount, setStakeAmount] = useState("5");
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    fetchMatches();
    fetchPools();
    
    const channel = supabase
      .channel('sports-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sports_matches'
      }, () => {
        fetchMatches();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMatches = async () => {
    const { data, error } = await supabase
      .from('sports_matches')
      .select('*')
      .order('match_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching matches:', error);
    } else {
      setMatches(data || []);
    }
    setLoading(false);
  };

  const fetchPools = async () => {
    const { data, error } = await supabase
      .from('prediction_pools')
      .select(`
        *,
        sports_matches (*),
        predictions (
          id,
          player_id,
          predicted_home_score,
          predicted_away_score,
          stake_amount,
          is_winner,
          payout_amount
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching pools:', error);
    } else {
      setPools(data || []);
    }
  };

  const refreshLiveScores = async () => {
    setRefreshing(true);
    setApiError(null);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-sports-matches', {
        body: { action: 'fetch_live' }
      });
      
      if (error) throw error;
      
      if (data?.count === 0) {
        setApiError('No live matches currently. Live matches will appear during game times.');
      }
      
      await fetchMatches();
      toast.success(`Found ${data?.count || 0} live matches`);
    } catch (error) {
      console.error('Error refreshing:', error);
      toast.error('Failed to refresh scores');
    }
    setRefreshing(false);
  };

  const fetchUpcomingMatches = async () => {
    setRefreshing(true);
    setApiError(null);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-sports-matches', {
        body: { action: 'fetch_upcoming' }
      });
      
      if (error) throw error;
      
      if (data?.count === 0) {
        setApiError('The SportMonks API returned no matches for today. This may be due to API access limits or no scheduled matches.');
      }
      
      await fetchMatches();
      toast.success(`Loaded ${data?.count || 0} matches`);
    } catch (error) {
      console.error('Error fetching upcoming:', error);
      toast.error('Failed to fetch matches');
    }
    setRefreshing(false);
  };

  const addDemoMatch = async () => {
    if (!profile) {
      toast.error('Please log in first');
      return;
    }
    
    setRefreshing(true);
    try {
      // Add a demo match for testing
      const matchTime = new Date();
      matchTime.setHours(matchTime.getHours() + 2);
      
      const demoMatches = [
        {
          external_id: `demo-${Date.now()}-1`,
          sport: 'football',
          league: 'Demo League',
          home_team: 'Manchester United',
          away_team: 'Liverpool',
          home_logo: 'https://cdn.sportmonks.com/images/soccer/teams/14/14.png',
          away_logo: 'https://cdn.sportmonks.com/images/soccer/teams/8/8.png',
          match_date: matchTime.toISOString(),
          status: 'scheduled',
          is_live: false,
        },
        {
          external_id: `demo-${Date.now()}-2`,
          sport: 'football',
          league: 'Demo League',
          home_team: 'Chelsea',
          away_team: 'Arsenal',
          home_logo: 'https://cdn.sportmonks.com/images/soccer/teams/18/18.png',
          away_logo: 'https://cdn.sportmonks.com/images/soccer/teams/1/1.png',
          match_date: new Date(matchTime.getTime() + 3600000).toISOString(),
          status: 'scheduled',
          is_live: false,
        },
      ];

      for (const match of demoMatches) {
        await supabase.from('sports_matches').insert(match);
      }
      
      await fetchMatches();
      toast.success('Demo matches added! You can now make predictions.');
    } catch (error) {
      console.error('Error adding demo:', error);
      toast.error('Failed to add demo matches');
    }
    setRefreshing(false);
  };

  const submitPrediction = async () => {
    if (!profile || !selectedMatch) {
      toast.error('Please log in to make predictions');
      return;
    }

    const homeScore = parseInt(predictedHomeScore);
    const awayScore = parseInt(predictedAwayScore);
    const stake = parseFloat(stakeAmount);

    if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
      toast.error('Please enter valid scores');
      return;
    }

    if (isNaN(stake) || stake < 5) {
      toast.error('Minimum stake is $5');
      return;
    }

    if ((profile.wallet_balance || 0) < stake) {
      toast.error('Insufficient balance');
      return;
    }

    setSubmitting(true);
    try {
      let poolId = pools.find(p => p.sports_match_id === selectedMatch.id)?.id;

      if (!poolId) {
        const { data: newPool, error: poolError } = await supabase
          .from('prediction_pools')
          .insert({
            sports_match_id: selectedMatch.id,
            creator_id: profile.id,
            min_stake: 5,
          })
          .select()
          .single();

        if (poolError) throw poolError;
        poolId = newPool.id;
      }

      const { error: walletError } = await supabase
        .from('profiles')
        .update({ wallet_balance: (profile.wallet_balance || 0) - stake })
        .eq('id', profile.id);

      if (walletError) throw walletError;

      const { error: predError } = await supabase
        .from('predictions')
        .insert({
          pool_id: poolId,
          player_id: profile.id,
          predicted_home_score: homeScore,
          predicted_away_score: awayScore,
          stake_amount: stake,
        });

      if (predError) throw predError;

      await supabase
        .from('prediction_pools')
        .update({ total_pot: (pools.find(p => p.id === poolId)?.total_pot || 0) + stake })
        .eq('id', poolId);

      toast.success('Prediction submitted!');
      setSelectedMatch(null);
      setPredictedHomeScore("");
      setPredictedAwayScore("");
      setStakeAmount("5");
      fetchPools();
    } catch (error) {
      console.error('Error submitting prediction:', error);
      toast.error('Failed to submit prediction');
    }
    setSubmitting(false);
  };

  const liveMatches = matches.filter(m => m.is_live || m.status === 'live');
  const upcomingMatches = matches.filter(m => m.status === 'scheduled');
  const finishedMatches = matches.filter(m => m.status === 'finished');

  const MatchCard = ({ match, showPredictButton = false }: { match: SportsMatch; showPredictButton?: boolean }) => (
    <Card className="p-4 bg-card/50 border-border/50">
      <div className="flex items-center justify-between mb-2">
        <Badge variant={match.is_live ? "destructive" : "secondary"} className="text-xs">
          {match.is_live ? (
            <><Zap className="w-3 h-3 mr-1" /> LIVE</>
          ) : match.status === 'finished' ? (
            <><CheckCircle className="w-3 h-3 mr-1" /> FT</>
          ) : (
            <><Clock className="w-3 h-3 mr-1" /> {new Date(match.match_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
          )}
        </Badge>
        <span className="text-xs text-muted-foreground">{match.league}</span>
      </div>
      
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 text-center">
          {match.home_logo && (
            <img src={match.home_logo} alt={match.home_team} className="w-12 h-12 mx-auto mb-1 object-contain" />
          )}
          <p className="text-sm font-medium truncate">{match.home_team}</p>
        </div>
        
        <div className="text-center px-4">
          {match.is_live || match.status === 'finished' ? (
            <div className="text-2xl font-bold">
              <span className={match.home_score! > match.away_score! ? 'text-green-500' : ''}>{match.home_score}</span>
              <span className="text-muted-foreground mx-2">-</span>
              <span className={match.away_score! > match.home_score! ? 'text-green-500' : ''}>{match.away_score}</span>
            </div>
          ) : (
            <div className="text-lg font-medium text-muted-foreground">vs</div>
          )}
        </div>
        
        <div className="flex-1 text-center">
          {match.away_logo && (
            <img src={match.away_logo} alt={match.away_team} className="w-12 h-12 mx-auto mb-1 object-contain" />
          )}
          <p className="text-sm font-medium truncate">{match.away_team}</p>
        </div>
      </div>
      
      {showPredictButton && match.status === 'scheduled' && (
        <Button 
          className="w-full mt-3" 
          size="sm"
          onClick={() => setSelectedMatch(match)}
        >
          <Trophy className="w-4 h-4 mr-2" />
          Make Prediction
        </Button>
      )}
    </Card>
  );

  return (
    <MobileLayout>
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Sports Predictions</h1>
              <p className="text-sm text-muted-foreground">Predict scores, win prizes</p>
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={refreshLiveScores}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* How It Works */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>How Sports Prediction Works</AlertTitle>
            <AlertDescription className="text-xs mt-2 space-y-1">
              <p>1. <strong>Load matches</strong> - Click "Load Matches" to fetch today's football games</p>
              <p>2. <strong>Make predictions</strong> - Predict the final score and stake USDC</p>
              <p>3. <strong>Multiple players</strong> - Anyone can predict on the same match</p>
              <p>4. <strong>Win proportionally</strong> - Closer predictions get bigger payouts!</p>
            </AlertDescription>
          </Alert>

          {/* Quick Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={fetchUpcomingMatches} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Load Matches
            </Button>
            <Button variant="outline" size="sm" onClick={refreshLiveScores} disabled={refreshing}>
              <Zap className="w-4 h-4 mr-2" />
              Live Scores
            </Button>
            <Button variant="secondary" size="sm" onClick={addDemoMatch} disabled={refreshing}>
              <Plus className="w-4 h-4 mr-2" />
              Add Demo Match
            </Button>
          </div>

          {apiError && (
            <Alert variant="destructive">
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="live" className="relative">
                  Live
                  {liveMatches.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                      {liveMatches.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming ({upcomingMatches.length})</TabsTrigger>
                <TabsTrigger value="finished">Finished</TabsTrigger>
              </TabsList>
              
              <TabsContent value="live" className="space-y-3 mt-4">
                {liveMatches.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No live matches right now</p>
                    <Button variant="link" onClick={refreshLiveScores}>Check for live matches</Button>
                  </Card>
                ) : (
                  liveMatches.map(match => <MatchCard key={match.id} match={match} />)
                )}
              </TabsContent>
              
              <TabsContent value="upcoming" className="space-y-3 mt-4">
                {upcomingMatches.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-2">No upcoming matches loaded</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Click "Load Matches" to fetch from SportMonks API, or "Add Demo Match" to test the feature.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" size="sm" onClick={fetchUpcomingMatches}>
                        Load Matches
                      </Button>
                      <Button variant="secondary" size="sm" onClick={addDemoMatch}>
                        Add Demo Match
                      </Button>
                    </div>
                  </Card>
                ) : (
                  upcomingMatches.map(match => <MatchCard key={match.id} match={match} showPredictButton />)
                )}
              </TabsContent>
              
              <TabsContent value="finished" className="space-y-3 mt-4">
                {finishedMatches.length === 0 ? (
                  <Card className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No finished matches</p>
                  </Card>
                ) : (
                  finishedMatches.map(match => <MatchCard key={match.id} match={match} />)
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Active Prediction Pools */}
          {pools.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Active Prediction Pools
              </h2>
              <div className="space-y-3">
                {pools.map(pool => (
                  <Card key={pool.id} className="p-4 bg-card/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">
                        {pool.sports_matches?.home_team} vs {pool.sports_matches?.away_team}
                      </span>
                      <Badge variant={pool.status === 'open' ? 'default' : 'secondary'}>
                        {pool.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        Total Pot: ${pool.total_pot}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {pool.predictions?.length || 0} predictions
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Prediction Modal */}
        {selectedMatch && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
            <Card className="w-full max-w-md m-4 p-6 animate-in slide-in-from-bottom-4">
              <h2 className="text-lg font-bold mb-4">Make Your Prediction</h2>
              
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex-1 text-center">
                  {selectedMatch.home_logo && (
                    <img src={selectedMatch.home_logo} alt={selectedMatch.home_team} className="w-16 h-16 mx-auto mb-2 object-contain" />
                  )}
                  <p className="font-medium text-sm">{selectedMatch.home_team}</p>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={predictedHomeScore}
                    onChange={(e) => setPredictedHomeScore(e.target.value)}
                    className="mt-2 text-center text-2xl font-bold"
                  />
                </div>
                <span className="text-xl font-bold text-muted-foreground">vs</span>
                <div className="flex-1 text-center">
                  {selectedMatch.away_logo && (
                    <img src={selectedMatch.away_logo} alt={selectedMatch.away_team} className="w-16 h-16 mx-auto mb-2 object-contain" />
                  )}
                  <p className="font-medium text-sm">{selectedMatch.away_team}</p>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={predictedAwayScore}
                    onChange={(e) => setPredictedAwayScore(e.target.value)}
                    className="mt-2 text-center text-2xl font-bold"
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">Stake Amount (USDC)</label>
                <div className="flex gap-2">
                  {[5, 10, 25, 50].map(amt => (
                    <Button
                      key={amt}
                      variant={stakeAmount === String(amt) ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStakeAmount(String(amt))}
                    >
                      ${amt}
                    </Button>
                  ))}
                </div>
                <Input
                  type="number"
                  min="5"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="mt-2"
                  placeholder="Custom amount"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Your balance: ${profile?.wallet_balance?.toFixed(2) || '0.00'}
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedMatch(null)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={submitPrediction} disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trophy className="w-4 h-4 mr-2" />}
                  Submit Prediction
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
