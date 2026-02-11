/**
 * Match Settlement — Atomic update of result + skill + payouts
 * 
 * Orchestrates the full settlement flow:
 * 1. Validate match result
 * 2. Calculate skill updates (skillEngine)
 * 3. Calculate weighted payouts (escrowEngine via riskEngine)
 * 4. Call atomic database function (settle_match_with_skill)
 * 5. Return settlement receipt
 * 
 * Anti-manipulation:
 * - Match must be in 'active' state
 * - Winner must be a match participant
 * - Settlement is atomic (all-or-nothing)
 * - Settlement log prevents double-settlement
 * - Skill deltas are clamped
 */

import { supabase } from '@/integrations/supabase/client';
import { calculateSkillUpdates, type SkillProfile } from './skillEngine';
import { calculateWeightedPayouts, type EscrowPlayer } from './escrowEngine';
import { classifyRiskTier, type RiskTier } from './riskEngine';

export interface MatchSettlementInput {
  matchId: string;
  winnerId: string | null; // null = draw
  playerResults: Array<{
    playerId: string;
    result: 'win' | 'loss' | 'draw';
  }>;
}

export interface SettlementReceipt {
  success: boolean;
  matchId: string;
  totalPot: number;
  platformFee: number;
  payouts: Array<{
    playerId: string;
    payout: number;
    skillBefore: number;
    skillAfter: number;
    tierBefore: string;
    tierAfter: string;
  }>;
  error?: string;
}

/**
 * Settle a match atomically
 * This is the main entry point called when a game ends
 */
export async function settleMatch(
  input: MatchSettlementInput
): Promise<SettlementReceipt> {
  const { matchId, winnerId, playerResults } = input;

  try {
    // 1. Fetch match data
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return { success: false, matchId, totalPot: 0, platformFee: 0, payouts: [], error: 'Match not found' };
    }

    if (match.state !== 'active') {
      return { success: false, matchId, totalPot: 0, platformFee: 0, payouts: [], error: 'Match not active' };
    }

    // 2. Fetch player profiles
    const playerIds = playerResults.map((p) => p.playerId);
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', playerIds);

    if (profileError || !profiles || profiles.length !== playerIds.length) {
      return { success: false, matchId, totalPot: 0, platformFee: 0, payouts: [], error: 'Could not fetch all player profiles' };
    }

    // 3. Fetch escrow amounts
    const { data: escrows, error: escrowError } = await supabase
      .from('escrow')
      .select('*')
      .eq('match_id', matchId)
      .eq('status', 'held');

    if (escrowError || !escrows || escrows.length === 0) {
      return { success: false, matchId, totalPot: 0, platformFee: 0, payouts: [], error: 'No escrow funds found' };
    }

    // 4. Build player data for engines
    const escrowPlayers: EscrowPlayer[] = playerResults.map((pr) => {
      const profile = profiles.find((p) => p.id === pr.playerId)!;
      const escrow = escrows.find((e) => e.player_id === pr.playerId);

      return {
        id: pr.playerId,
        skill_score: profile.skill_score ?? 1000,
        risk_tier: (profile.risk_tier ?? 'standard') as RiskTier,
        stake_amount: escrow?.amount ?? 0,
        result: pr.result,
      };
    });

    // 5. Calculate weighted payouts
    const settlement = calculateWeightedPayouts(escrowPlayers);

    // 6. Calculate skill updates
    const skillPlayers = playerResults.map((pr) => {
      const profile = profiles.find((p) => p.id === pr.playerId)!;
      const payout = settlement.payouts.find((pay) => pay.player_id === pr.playerId);

      const skillProfile: SkillProfile = {
        skill_score: profile.skill_score ?? 1000,
        win_rate: profile.win_rate ?? 0,
        volatility_score: profile.volatility_score ?? 0.5,
        consistency_index: profile.consistency_index ?? 0.5,
        total_matches_played: profile.total_matches_played ?? 0,
        total_wins: profile.total_wins ?? 0,
        total_losses: profile.total_losses ?? 0,
      };

      return {
        id: pr.playerId,
        profile: skillProfile,
        result: pr.result,
        stake_amount: payout?.stake_amount ?? 0,
        payout_amount: payout?.payout ?? 0,
      };
    });

    const skillUpdates = calculateSkillUpdates(skillPlayers);

    // 7. Build settlement and skill data for the atomic DB function
    const settlementData = settlement.payouts.map((p) => ({
      player_id: p.player_id,
      payout: p.payout,
      payout_multiplier: p.payout_multiplier,
      skill_bonus: p.skill_bonus,
    }));

    const skillUpdateData = skillUpdates.map((su) => ({
      player_id: su.player_id,
      skill_before: su.skill_before,
      skill_after: su.skill_after,
      volatility_before: su.volatility_before,
      volatility_after: su.volatility_after,
      opponent_skill: su.opponent_skill,
      match_result: su.match_result,
      risk_tier_before: su.risk_tier_before,
      risk_tier_after: su.risk_tier_after,
      stake_amount: su.stake_amount,
      payout_amount: su.payout_amount,
    }));

    // 8. Call atomic settlement function
    const { data: result, error: rpcError } = await supabase.rpc(
      'settle_match_with_skill',
      {
        _match_id: matchId,
        _winner_id: winnerId || playerResults[0].playerId, // fallback for draw
        _settlement_data: settlementData,
        _skill_updates: skillUpdateData,
      }
    );

    if (rpcError) {
      console.error('Settlement RPC error:', rpcError);
      return { success: false, matchId, totalPot: 0, platformFee: 0, payouts: [], error: rpcError.message };
    }

    const rpcResult = result as any;
    if (!rpcResult?.success) {
      return { success: false, matchId, totalPot: 0, platformFee: 0, payouts: [], error: rpcResult?.error || 'Settlement failed' };
    }

    // 9. Build receipt
    return {
      success: true,
      matchId,
      totalPot: settlement.total_pot,
      platformFee: settlement.platform_fee,
      payouts: skillUpdates.map((su) => {
        const payout = settlement.payouts.find((p) => p.player_id === su.player_id);
        return {
          playerId: su.player_id,
          payout: payout?.payout ?? 0,
          skillBefore: su.skill_before,
          skillAfter: su.skill_after,
          tierBefore: su.risk_tier_before,
          tierAfter: su.risk_tier_after,
        };
      }),
    };
  } catch (err) {
    console.error('Settlement error:', err);
    return {
      success: false,
      matchId,
      totalPot: 0,
      platformFee: 0,
      payouts: [],
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Get a player's current skill tier info for display
 */
export async function getPlayerSkillInfo(playerId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('skill_score, win_rate, volatility_score, consistency_index, risk_tier, total_matches_played, total_wins, total_losses')
    .eq('id', playerId)
    .single();

  if (!profile) return null;

  const tier = classifyRiskTier(
    profile.skill_score ?? 1000,
    profile.volatility_score ?? 0.5,
    profile.total_matches_played ?? 0,
    profile.win_rate ?? 0
  );

  return {
    ...profile,
    computed_tier: tier,
  };
}
