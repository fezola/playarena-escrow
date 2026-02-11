/**
 * Escrow Engine — Skill-weighted stake & payout distribution
 * 
 * Handles:
 * 1. Dynamic stake validation based on risk tier
 * 2. Weighted payout calculation based on skill differential
 * 3. Platform fee deduction
 * 4. Multi-player pot distribution
 */

import { type RiskTier, getRiskProfile, getPayoutMultiplier, getDynamicStakeRequirement } from './riskEngine';

export interface EscrowPlayer {
  id: string;
  skill_score: number;
  risk_tier: RiskTier;
  stake_amount: number;
  result: 'win' | 'loss' | 'draw';
}

export interface PayoutBreakdown {
  player_id: string;
  stake_amount: number;
  payout: number;
  profit: number;
  payout_multiplier: number;
  skill_bonus: string; // Description of skill adjustment
}

export interface SettlementResult {
  total_pot: number;
  platform_fee: number;
  distributable: number;
  payouts: PayoutBreakdown[];
  settlement_type: 'winner_takes_all' | 'weighted_split' | 'full_refund';
}

const DEFAULT_PLATFORM_FEE_PERCENT = 5;

/**
 * Validate if a player can stake the requested amount
 */
export function validateStake(
  requestedStake: number,
  playerBalance: number,
  playerTier: RiskTier
): { valid: boolean; reason?: string; adjustedStake?: number } {
  const profile = getRiskProfile(playerTier);
  const stakeReq = getDynamicStakeRequirement(requestedStake, playerTier);

  if (requestedStake <= 0) {
    return { valid: false, reason: 'Stake must be positive' };
  }

  if (requestedStake > playerBalance) {
    return { valid: false, reason: `Insufficient balance. You have $${playerBalance.toFixed(2)}` };
  }

  if (requestedStake > profile.maxStake) {
    return {
      valid: false,
      reason: `Your tier (${playerTier}) limits stakes to $${profile.maxStake}`,
      adjustedStake: profile.maxStake,
    };
  }

  if (requestedStake < profile.minStake) {
    return {
      valid: false,
      reason: `Minimum stake is $${profile.minStake}`,
      adjustedStake: profile.minStake,
    };
  }

  return { valid: true, adjustedStake: stakeReq.adjustedStake };
}

/**
 * Calculate skill-weighted payouts for a completed match
 * 
 * Winner-takes-all with skill multiplier adjustments:
 * - Underdog wins: gets boosted payout (up to 1.5x)
 * - Favorite wins: gets standard payout (down to 0.7x)
 * - Draw: proportional refund minus fee
 */
export function calculateWeightedPayouts(
  players: EscrowPlayer[],
  platformFeePercent: number = DEFAULT_PLATFORM_FEE_PERCENT
): SettlementResult {
  const totalPot = players.reduce((sum, p) => sum + p.stake_amount, 0);

  // Check for draw — refund everyone
  if (players.every((p) => p.result === 'draw')) {
    return {
      total_pot: totalPot,
      platform_fee: 0,
      distributable: totalPot,
      payouts: players.map((p) => ({
        player_id: p.id,
        stake_amount: p.stake_amount,
        payout: p.stake_amount,
        profit: 0,
        payout_multiplier: 1.0,
        skill_bonus: 'Draw — full refund',
      })),
      settlement_type: 'full_refund',
    };
  }

  const platformFee = totalPot * (platformFeePercent / 100);
  const distributable = totalPot - platformFee;

  const winners = players.filter((p) => p.result === 'win');
  const losers = players.filter((p) => p.result === 'loss');

  // Single winner — winner takes all with skill multiplier
  if (winners.length === 1) {
    const winner = winners[0];
    const avgOpponentSkill =
      losers.reduce((sum, l) => sum + l.skill_score, 0) / losers.length;

    const multiplier = getPayoutMultiplier(winner.skill_score, avgOpponentSkill);

    // Apply multiplier to distributable (clamped to actual distributable)
    const adjustedPayout = Math.min(
      Math.round(distributable * multiplier * 100) / 100,
      distributable
    );

    // If multiplier reduces payout below distributable, remainder goes to platform
    const payouts: PayoutBreakdown[] = [
      {
        player_id: winner.id,
        stake_amount: winner.stake_amount,
        payout: adjustedPayout,
        profit: adjustedPayout - winner.stake_amount,
        payout_multiplier: multiplier,
        skill_bonus:
          multiplier > 1
            ? `Underdog bonus: ${((multiplier - 1) * 100).toFixed(0)}% boost`
            : multiplier < 1
            ? `Favorite penalty: ${((1 - multiplier) * 100).toFixed(0)}% reduction`
            : 'Even match — standard payout',
      },
      ...losers.map((loser) => ({
        player_id: loser.id,
        stake_amount: loser.stake_amount,
        payout: 0,
        profit: -loser.stake_amount,
        payout_multiplier: 0,
        skill_bonus: 'Loss — no payout',
      })),
    ];

    return {
      total_pot: totalPot,
      platform_fee: platformFee + (distributable - adjustedPayout),
      distributable: adjustedPayout,
      payouts,
      settlement_type: 'winner_takes_all',
    };
  }

  // Multiple winners (e.g., team games or co-op) — weighted split
  const totalWinnerMultiplier = winners.reduce((sum, w) => {
    const avgOppSkill =
      losers.reduce((s, l) => s + l.skill_score, 0) / Math.max(losers.length, 1);
    return sum + getPayoutMultiplier(w.skill_score, avgOppSkill);
  }, 0);

  const payouts: PayoutBreakdown[] = [
    ...winners.map((winner) => {
      const avgOppSkill =
        losers.reduce((s, l) => s + l.skill_score, 0) / Math.max(losers.length, 1);
      const multiplier = getPayoutMultiplier(winner.skill_score, avgOppSkill);
      const share = (multiplier / totalWinnerMultiplier) * distributable;
      const payout = Math.round(share * 100) / 100;

      return {
        player_id: winner.id,
        stake_amount: winner.stake_amount,
        payout,
        profit: payout - winner.stake_amount,
        payout_multiplier: multiplier,
        skill_bonus: `Weighted share: ${((multiplier / totalWinnerMultiplier) * 100).toFixed(0)}%`,
      };
    }),
    ...losers.map((loser) => ({
      player_id: loser.id,
      stake_amount: loser.stake_amount,
      payout: 0,
      profit: -loser.stake_amount,
      payout_multiplier: 0,
      skill_bonus: 'Loss — no payout',
    })),
  ];

  return {
    total_pot: totalPot,
    platform_fee: platformFee,
    distributable,
    payouts,
    settlement_type: 'weighted_split',
  };
}

/**
 * Preview what a match settlement would look like (no side effects)
 */
export function previewSettlement(
  players: EscrowPlayer[],
  platformFeePercent: number = DEFAULT_PLATFORM_FEE_PERCENT
): SettlementResult {
  return calculateWeightedPayouts(players, platformFeePercent);
}
