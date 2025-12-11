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
    const API_KEY = Deno.env.get('API_FOOTBALL_KEY');
    if (!API_KEY) {
      console.error('API_FOOTBALL_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Sports API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, sport = 'football', league, date } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === 'fetch_matches') {
      // Fetch upcoming matches from API-Football
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      const response = await fetch(
        `https://v3.football.api-sports.io/fixtures?date=${targetDate}&status=NS-1H-HT-2H-ET-P-FT`,
        {
          headers: {
            'x-apisports-key': API_KEY,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API-Football error:', response.status, errorText);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to fetch matches' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      const matches = data.response || [];

      // Store matches in database
      for (const match of matches.slice(0, 50)) { // Limit to 50 matches
        const fixture = match.fixture;
        const teams = match.teams;
        const goals = match.goals;
        const league = match.league;

        const isLive = ['1H', 'HT', '2H', 'ET', 'P'].includes(fixture.status.short);
        const isFinished = fixture.status.short === 'FT';

        await supabase.from('sports_matches').upsert({
          external_id: String(fixture.id),
          sport: 'football',
          league: league.name,
          home_team: teams.home.name,
          away_team: teams.away.name,
          home_logo: teams.home.logo,
          away_logo: teams.away.logo,
          match_date: fixture.date,
          status: isFinished ? 'finished' : (isLive ? 'live' : 'scheduled'),
          home_score: goals.home,
          away_score: goals.away,
          is_live: isLive,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'external_id' });
      }

      console.log(`Stored ${Math.min(matches.length, 50)} matches`);

      return new Response(
        JSON.stringify({ success: true, count: Math.min(matches.length, 50) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'settle_pool') {
      const { pool_id } = await req.json();

      // Get the pool and associated match
      const { data: pool } = await supabase
        .from('prediction_pools')
        .select('*, sports_matches(*)')
        .eq('id', pool_id)
        .single();

      if (!pool || !pool.sports_matches) {
        return new Response(
          JSON.stringify({ success: false, error: 'Pool not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (pool.sports_matches.status !== 'finished') {
        return new Response(
          JSON.stringify({ success: false, error: 'Match not finished yet' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Call the settle function
      const { data: result, error } = await supabase.rpc('settle_prediction_pool', {
        _pool_id: pool_id,
        _home_score: pool.sports_matches.home_score,
        _away_score: pool.sports_matches.away_score,
      });

      if (error) {
        console.error('Settlement error:', error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
