/**
 * Skill Engine — ELO-based skill scoring with volatility tracking
 * 
 * Implements a modified Glicko-inspired ELO system:
 * - Base ELO K-factor adjusted by match count (new players shift faster)
 * - Volatility decays as players accumulate matches (confidence increases)
 * - Consistency index tracks performance stability
 * - Anti-manipulation: skill delta is clamped and requires match validation
 */

export interface SkillProfile {
  skill_score: number;
  win_rate: number;
  volatility_score: number;
  consistency_index: number;
  total_matches_played: number;
  total_wins: number;
  total_losses: number;
}

export interface SkillUpdate {
  player_id: string;
  skill_before: number;
  skill_after: number;
  volatility_before: number;
  volatility_after: number;
  opponent_skill: number;
  match_result: 'win' | 'loss' | 'draw';
  risk_tier_before: string;
  risk_tier_after: string;
  stake_amount: number;
  payout_amount: number;
}

// Default ELO starting score
export const DEFAULT_SKILL = 1000;
export const MIN_SKILL = 100;
export const MAX_SKILL = 3000;

// K-factor ranges (how much a single match can shift rating)
const K_FACTOR_NEW = 40; // First 10 matches
const K_FACTOR_STANDARD = 24; // 10-30 matches
const K_FACTOR_ESTABLISHED = 16; // 30+ matches

// Volatility decay rate
const VOLATILITY_DECAY = 0.95;
const MIN_VOLATILITY = 0.1;
const MAX_VOLATILITY = 1.0;

// Max skill delta per match (anti-manipulation clamp)
const MAX_SKILL_DELTA = 50;

/**
 * Get the K-factor based on match count
 * New players' ratings shift faster for faster calibration
 */
function getKFactor(matchesPlayed: number): number {
  if (matchesPlayed < 10) return K_FACTOR_NEW;
  if (matchesPlayed < 30) return K_FACTOR_STANDARD;
  return K_FACTOR_ESTABLISHED;
}

/**
 * Calculate expected win probability using ELO formula
 * E(A) = 1 / (1 + 10^((Rb - Ra) / 400))
 */
export function expectedWinProbability(playerSkill: number, opponentSkill: number): number {
  return 1 / (1 + Math.pow(10, (opponentSkill - playerSkill) / 400));
}

/**
 * Calculate new ELO rating after a match
 */
function calculateNewElo(
  currentSkill: number,
  opponentSkill: number,
  result: 'win' | 'loss' | 'draw',
  matchesPlayed: number
): number {
  const expected = expectedWinProbability(currentSkill, opponentSkill);
  const actual = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
  const k = getKFactor(matchesPlayed);

  let delta = k * (actual - expected);

  // Clamp delta to prevent manipulation
  delta = Math.max(-MAX_SKILL_DELTA, Math.min(MAX_SKILL_DELTA, delta));

  const newSkill = currentSkill + delta;
  return Math.max(MIN_SKILL, Math.min(MAX_SKILL, Math.round(newSkill * 100) / 100));
}

/**
 * Update volatility score
 * Volatility represents how unpredictable a player's results are
 * High volatility = inconsistent results = higher risk tier
 */
function calculateNewVolatility(
  currentVolatility: number,
  expectedResult: number,
  actualResult: number
): number {
  // Surprise factor: how much the actual result deviated from expected
  const surprise = Math.abs(actualResult - expectedResult);

  // Blend current volatility with surprise factor
  const newVolatility = (currentVolatility * VOLATILITY_DECAY) + (surprise * (1 - VOLATILITY_DECAY));

  return Math.max(MIN_VOLATILITY, Math.min(MAX_VOLATILITY, Math.round(newVolatility * 1000) / 1000));
}

/**
 * Calculate consistency index (0-1, higher = more consistent)
 * Based on how closely actual results match expected outcomes
 */
export function calculateConsistency(
  currentConsistency: number,
  expectedResult: number,
  actualResult: number,
  matchesPlayed: number
): number {
  const deviation = Math.abs(actualResult - expectedResult);
  const matchWeight = 1 / Math.max(matchesPlayed, 1);

  // Exponential moving average of consistency
  const newConsistency = currentConsistency * (1 - matchWeight) + (1 - deviation) * matchWeight;
  return Math.max(0, Math.min(1, Math.round(newConsistency * 1000) / 1000));
}

/**
 * Core function: Calculate skill updates for all players in a match
 * Supports 2-4 players. For multiplayer (>2), each player is compared
 * against the average skill of opponents.
 */
export function calculateSkillUpdates(
  players: Array<{
    id: string;
    profile: SkillProfile;
    result: 'win' | 'loss' | 'draw';
    stake_amount: number;
    payout_amount: number;
  }>
): SkillUpdate[] {
  // Import here to avoid circular dependency - we inline risk tier calculation
  const getRiskTier = (skill: number, volatility: number, matches: number): string => {
    if (matches < 5) return 'provisional';
    if (skill >= 1800 && volatility < 0.3) return 'elite';
    if (skill >= 1400 && volatility < 0.4) return 'trusted';
    if (skill >= 1000 && volatility < 0.5) return 'standard';
    if (volatility >= 0.7) return 'volatile';
    return 'high_risk';
  };

  return players.map((player) => {
    const { id, profile, result, stake_amount, payout_amount } = player;

    // Calculate average opponent skill (for multiplayer support)
    const opponents = players.filter((p) => p.id !== id);
    const avgOpponentSkill =
      opponents.reduce((sum, o) => sum + o.profile.skill_score, 0) / opponents.length;

    const skillBefore = profile.skill_score;
    const volatilityBefore = profile.volatility_score;
    const riskTierBefore = getRiskTier(skillBefore, volatilityBefore, profile.total_matches_played);

    // Calculate new ELO
    const skillAfter = calculateNewElo(
      skillBefore,
      avgOpponentSkill,
      result,
      profile.total_matches_played
    );

    // Calculate expected and actual for volatility
    const expected = expectedWinProbability(skillBefore, avgOpponentSkill);
    const actual = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;

    // Update volatility
    const volatilityAfter = calculateNewVolatility(volatilityBefore, expected, actual);

    const riskTierAfter = getRiskTier(
      skillAfter,
      volatilityAfter,
      profile.total_matches_played + 1
    );

    return {
      player_id: id,
      skill_before: skillBefore,
      skill_after: skillAfter,
      volatility_before: volatilityBefore,
      volatility_after: volatilityAfter,
      opponent_skill: Math.round(avgOpponentSkill * 100) / 100,
      match_result: result,
      risk_tier_before: riskTierBefore,
      risk_tier_after: riskTierAfter,
      stake_amount,
      payout_amount,
    };
  });
}
