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
    const API_KEY = Deno.env.get('SPORTMONKS_API_KEY');
    if (!API_KEY) {
      console.error('SPORTMONKS_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Sports API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, date } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === 'fetch_live') {
      // Fetch live in-play matches from SportMonks
      console.log('Fetching live matches from SportMonks...');
      
      const response = await fetch(
        `https://api.sportmonks.com/v3/football/livescores/inplay?include=participants;scores;league.country&api_token=${API_KEY}`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('SportMonks error:', response.status, errorText);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to fetch live matches' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      const matches = data.data || [];
      console.log(`Fetched ${matches.length} live matches`);

      // Store matches in database
      for (const match of matches) {
        const homeTeam = match.participants?.find((p: any) => p.meta?.location === 'home');
        const awayTeam = match.participants?.find((p: any) => p.meta?.location === 'away');
        
        // Get scores from the scores array
        const homeScore = match.scores?.find((s: any) => s.participant_id === homeTeam?.id)?.score?.goals || 0;
        const awayScore = match.scores?.find((s: any) => s.participant_id === awayTeam?.id)?.score?.goals || 0;

        await supabase.from('sports_matches').upsert({
          external_id: String(match.id),
          sport: 'football',
          league: match.league?.name || 'Unknown League',
          home_team: homeTeam?.name || 'Unknown',
          away_team: awayTeam?.name || 'Unknown',
          home_logo: homeTeam?.image_path || null,
          away_logo: awayTeam?.image_path || null,
          match_date: match.starting_at,
          status: 'live',
          home_score: homeScore,
          away_score: awayScore,
          is_live: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'external_id' });
      }

      return new Response(
        JSON.stringify({ success: true, count: matches.length, matches }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'fetch_upcoming') {
      // Fetch upcoming/scheduled matches
      console.log('Fetching upcoming matches from SportMonks...');
      
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      const response = await fetch(
        `https://api.sportmonks.com/v3/football/fixtures/date/${targetDate}?include=participants;league.country&api_token=${API_KEY}`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('SportMonks error:', response.status, errorText);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to fetch upcoming matches' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      const matches = data.data || [];
      console.log(`Fetched ${matches.length} upcoming matches for ${targetDate}`);

      // Store matches in database
      for (const match of matches.slice(0, 100)) {
        const homeTeam = match.participants?.find((p: any) => p.meta?.location === 'home');
        const awayTeam = match.participants?.find((p: any) => p.meta?.location === 'away');

        // Determine status based on state_id
        let status = 'scheduled';
        if (match.state_id === 5) status = 'finished';
        else if ([2, 3, 4].includes(match.state_id)) status = 'live';

        await supabase.from('sports_matches').upsert({
          external_id: String(match.id),
          sport: 'football',
          league: match.league?.name || 'Unknown League',
          home_team: homeTeam?.name || 'Unknown',
          away_team: awayTeam?.name || 'Unknown',
          home_logo: homeTeam?.image_path || null,
          away_logo: awayTeam?.image_path || null,
          match_date: match.starting_at,
          status: status,
          home_score: null,
          away_score: null,
          is_live: false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'external_id' });
      }

      return new Response(
        JSON.stringify({ success: true, count: Math.min(matches.length, 100), matches: matches.slice(0, 100) }),
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
