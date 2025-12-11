import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const API_KEY = Deno.env.get('SPORTMONKS_API_KEY');

    console.log('Starting settlement check...');

    // 1. Fetch live scores and update database
    if (API_KEY) {
      const liveResponse = await fetch(
        `https://api.sportmonks.com/v3/football/livescores/inplay?include=participants;scores&api_token=${API_KEY}`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (liveResponse.ok) {
        const liveData = await liveResponse.json();
        const liveMatches = liveData.data || [];
        console.log(`Found ${liveMatches.length} live matches`);

        for (const match of liveMatches) {
          const homeTeam = match.participants?.find((p: any) => p.meta?.location === 'home');
          const awayTeam = match.participants?.find((p: any) => p.meta?.location === 'away');
          const homeScore = match.scores?.find((s: any) => s.participant_id === homeTeam?.id)?.score?.goals || 0;
          const awayScore = match.scores?.find((s: any) => s.participant_id === awayTeam?.id)?.score?.goals || 0;

          await supabase.from('sports_matches').update({
            home_score: homeScore,
            away_score: awayScore,
            is_live: true,
            status: 'live',
            updated_at: new Date().toISOString(),
          }).eq('external_id', String(match.id));
        }
      }

      // Fetch finished matches from today
      const today = new Date().toISOString().split('T')[0];
      const finishedResponse = await fetch(
        `https://api.sportmonks.com/v3/football/fixtures/date/${today}?include=participants;scores&filters=fixtureStatuses:5&api_token=${API_KEY}`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (finishedResponse.ok) {
        const finishedData = await finishedResponse.json();
        const finishedMatches = finishedData.data || [];
        console.log(`Found ${finishedMatches.length} finished matches today`);

        for (const match of finishedMatches) {
          const homeTeam = match.participants?.find((p: any) => p.meta?.location === 'home');
          const awayTeam = match.participants?.find((p: any) => p.meta?.location === 'away');
          const homeScore = match.scores?.find((s: any) => s.participant_id === homeTeam?.id && s.description === 'CURRENT')?.score?.goals ?? 0;
          const awayScore = match.scores?.find((s: any) => s.participant_id === awayTeam?.id && s.description === 'CURRENT')?.score?.goals ?? 0;

          await supabase.from('sports_matches').update({
            home_score: homeScore,
            away_score: awayScore,
            is_live: false,
            status: 'finished',
            updated_at: new Date().toISOString(),
          }).eq('external_id', String(match.id));
        }
      }
    }

    // 2. Find open pools with finished matches and settle them
    const { data: poolsToSettle } = await supabase
      .from('prediction_pools')
      .select(`
        *,
        sports_matches!inner(*)
      `)
      .eq('status', 'open')
      .eq('sports_matches.status', 'finished');

    console.log(`Found ${poolsToSettle?.length || 0} pools to settle`);

    const settledPools = [];
    for (const pool of poolsToSettle || []) {
      const match = pool.sports_matches;
      console.log(`Settling pool ${pool.id} for match ${match.home_team} vs ${match.away_team} (${match.home_score}-${match.away_score})`);

      // Call the settle function
      const { data: result, error } = await supabase.rpc('settle_prediction_pool', {
        _pool_id: pool.id,
        _home_score: match.home_score,
        _away_score: match.away_score,
      });

      if (error) {
        console.error(`Error settling pool ${pool.id}:`, error);
        continue;
      }

      // Get predictions for this pool to send notifications
      const { data: predictions } = await supabase
        .from('predictions')
        .select('*, profiles(display_name)')
        .eq('pool_id', pool.id);

      // Send notifications to all participants
      for (const prediction of predictions || []) {
        const isExactWinner = prediction.predicted_home_score === match.home_score && 
                              prediction.predicted_away_score === match.away_score;
        const payout = prediction.payout_amount || 0;
        const profit = payout - prediction.stake_amount;

        await supabase.from('notifications').insert({
          user_id: prediction.player_id,
          type: isExactWinner ? 'prediction_win' : profit > 0 ? 'prediction_payout' : 'prediction_result',
          title: isExactWinner ? '🎯 Perfect Prediction!' : profit > 0 ? '💰 You Won!' : 'Match Finished',
          message: isExactWinner 
            ? `You predicted ${match.home_team} ${match.home_score}-${match.away_score} ${match.away_team} exactly! You won $${payout.toFixed(2)}!`
            : profit > 0
            ? `Your prediction earned you $${payout.toFixed(2)} (+$${profit.toFixed(2)} profit)!`
            : `Match ended ${match.home_team} ${match.home_score}-${match.away_score} ${match.away_team}. Your payout: $${payout.toFixed(2)}`,
          data: {
            pool_id: pool.id,
            match_id: match.id,
            predicted_home: prediction.predicted_home_score,
            predicted_away: prediction.predicted_away_score,
            actual_home: match.home_score,
            actual_away: match.away_score,
            payout: payout,
          },
        });
      }

      settledPools.push(pool.id);
    }

    // 3. Send notifications for matches that are about to start
    const now = new Date();
    const in15Min = new Date(now.getTime() + 15 * 60 * 1000);
    
    const { data: upcomingMatches } = await supabase
      .from('sports_matches')
      .select('*')
      .eq('status', 'scheduled')
      .gte('match_date', now.toISOString())
      .lte('match_date', in15Min.toISOString());

    console.log(`Found ${upcomingMatches?.length || 0} matches starting soon`);

    for (const match of upcomingMatches || []) {
      // Find users who have predictions for this match
      const { data: pools } = await supabase
        .from('prediction_pools')
        .select('predictions(player_id)')
        .eq('sports_match_id', match.id);

      const playerIds = new Set<string>();
      for (const pool of pools || []) {
        for (const pred of (pool as any).predictions || []) {
          playerIds.add(pred.player_id);
        }
      }

      // Send starting soon notification
      for (const playerId of playerIds) {
        // Check if we already sent this notification
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', playerId)
          .eq('type', 'match_starting')
          .eq('data->>match_id', match.id)
          .single();

        if (!existing) {
          await supabase.from('notifications').insert({
            user_id: playerId,
            type: 'match_starting',
            title: '⚽ Match Starting Soon!',
            message: `${match.home_team} vs ${match.away_team} kicks off in 15 minutes!`,
            data: { match_id: match.id },
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        settled: settledPools.length,
        upcoming_notified: upcomingMatches?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Settlement error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
