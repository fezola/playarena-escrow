/**
 * Risk Engine — Tier classification & dynamic stake/multiplier logic
 * 
 * Risk tiers determine:
 * 1. Maximum stake a player can place
 * 2. Reward multipliers (underdogs get boosted payouts)
 * 3. Matchmaking fairness constraints
 * 
 * Tiers:
 * - provisional: New player (<5 matches), limited stakes
 * - elite: High skill, low volatility — full access
 * - trusted: Good performance history
 * - standard: Default tier
 * - volatile: Inconsistent results — restricted
 * - high_risk: Poor performance or suspicious patterns
 */

export type RiskTier = 'provisional' | 'elite' | 'trusted' | 'standard' | 'volatile' | 'high_risk';

export interface RiskProfile {
  tier: RiskTier;
  maxStake: number;
  minStake: number;
  stakeMultiplier: number; // Multiplier applied to base stake requirement
  payoutMultiplier: number; // Reward multiplier based on skill differential
  canCreateMatch: boolean;
  matchmakingPriority: number; // Higher = matched first
  description: string;
}

interface TierConfig {
  maxStake: number;
  minStake: number;
  stakeMultiplier: number;
  canCreateMatch: boolean;
  matchmakingPriority: number;
  description: string;
}

const TIER_CONFIG: Record<RiskTier, TierConfig> = {
  provisional: {
    maxStake: 10,
    minStake: 1,
    stakeMultiplier: 1.0,
    canCreateMatch: true,
    matchmakingPriority: 1,
    description: 'New player — limited stakes while calibrating skill',
  },
  elite: {
    maxStake: 1000,
    minStake: 1,
    stakeMultiplier: 0.8, // Elites pay less relative stake (they're proven)
    canCreateMatch: true,
    matchmakingPriority: 5,
    description: 'Top-tier player — full access, premium matchmaking',
  },
  trusted: {
    maxStake: 500,
    minStake: 1,
    stakeMultiplier: 0.9,
    canCreateMatch: true,
    matchmakingPriority: 4,
    description: 'Consistent performer — elevated stake limits',
  },
  standard: {
    maxStake: 100,
    minStake: 1,
    stakeMultiplier: 1.0,
    canCreateMatch: true,
    matchmakingPriority: 3,
    description: 'Regular player — standard access',
  },
  volatile: {
    maxStake: 25,
    minStake: 1,
    stakeMultiplier: 1.3, // Pay more per stake to offset risk
    canCreateMatch: true,
    matchmakingPriority: 2,
    description: 'Inconsistent results — reduced stake limits',
  },
  high_risk: {
    maxStake: 10,
    minStake: 1,
    stakeMultiplier: 1.5,
    canCreateMatch: false, // Can only join, not create
    matchmakingPriority: 1,
    description: 'Restricted — improve consistency to unlock features',
  },
};

/**
 * Classify a player into a risk tier based on their metrics
 */
export function classifyRiskTier(
  skillScore: number,
  volatilityScore: number,
  totalMatches: number,
  winRate: number
): RiskTier {
  // New players are provisional until 5 matches
  if (totalMatches < 5) return 'provisional';

  // Check for high_risk: very low skill + high volatility or suspicious patterns
  if (skillScore < 600 || (volatilityScore >= 0.8 && winRate < 0.2)) return 'high_risk';

  // Volatile: high volatility regardless of skill
  if (volatilityScore >= 0.7) return 'volatile';

  // Elite: high skill + low volatility + proven track record
  if (skillScore >= 1800 && volatilityScore < 0.3 && totalMatches >= 20) return 'elite';

  // Trusted: good skill + reasonable volatility
  if (skillScore >= 1400 && volatilityScore < 0.4 && totalMatches >= 10) return 'trusted';

  // Default
  return 'standard';
}

/**
 * Get the full risk profile for a player
 */
export function getRiskProfile(tier: RiskTier): RiskProfile {
  const config = TIER_CONFIG[tier];
  return {
    tier,
    ...config,
    payoutMultiplier: 1.0, // Base — adjusted per-match by getPayoutMultiplier
  };
}

/**
 * Calculate payout multiplier based on skill differential
 * Underdogs (lower skill) get a boosted multiplier
 * Favorites (higher skill) get a reduced multiplier
 * 
 * This creates a risk-adjusted market where beating a stronger opponent
 * is more rewarding than beating a weaker one.
 */
export function getPayoutMultiplier(
  playerSkill: number,
  opponentAvgSkill: number
): number {
  const skillDiff = opponentAvgSkill - playerSkill;

  // Sigmoid-based multiplier: ranges from 0.7x to 1.5x
  // Positive diff = underdog = higher multiplier
  // Negative diff = favorite = lower multiplier
  const multiplier = 0.7 + (0.8 / (1 + Math.exp(-skillDiff / 200)));

  return Math.round(multiplier * 1000) / 1000;
}

/**
 * Calculate dynamic stake requirement for a player
 * Higher risk = higher stake requirement (skin in the game)
 */
export function getDynamicStakeRequirement(
  baseStake: number,
  playerTier: RiskTier
): { minStake: number; maxStake: number; adjustedStake: number } {
  const config = TIER_CONFIG[playerTier];
  const adjustedStake = Math.round(baseStake * config.stakeMultiplier * 100) / 100;

  return {
    minStake: config.minStake,
    maxStake: config.maxStake,
    adjustedStake: Math.min(adjustedStake, config.maxStake),
  };
}

/**
 * Validate if a match between players is fair based on skill differential
 * Returns warnings if the match is heavily skewed
 */
export function validateMatchFairness(
  players: Array<{ skill_score: number; risk_tier: RiskTier }>
): { fair: boolean; warnings: string[]; skillSpread: number } {
  const skills = players.map((p) => p.skill_score);
  const maxSkill = Math.max(...skills);
  const minSkill = Math.min(...skills);
  const skillSpread = maxSkill - minSkill;

  const warnings: string[] = [];

  if (skillSpread > 800) {
    warnings.push('Extreme skill gap — payout multipliers will be heavily adjusted');
  } else if (skillSpread > 500) {
    warnings.push('Large skill gap — underdog will receive boosted payouts');
  }

  // Check if high_risk player is in the match
  if (players.some((p) => p.risk_tier === 'high_risk')) {
    warnings.push('High-risk player in match — stakes may be restricted');
  }

  return {
    fair: skillSpread <= 800,
    warnings,
    skillSpread,
  };
}

/**
 * Get tier display info for UI
 */
export function getTierDisplayInfo(tier: RiskTier): {
  label: string;
  color: string;
  icon: string;
  badge: string;
  description: string;
} {
  const display: Record<RiskTier, { label: string; color: string; icon: string; badge: string; description: string }> = {
    provisional: { label: 'Provisional', color: 'text-muted-foreground', icon: '🆕', badge: 'bg-muted', description: 'New player — calibrating skill' },
    elite: { label: 'Elite', color: 'text-yellow-500', icon: '👑', badge: 'bg-yellow-500/20', description: 'Top-tier competitor' },
    trusted: { label: 'Trusted', color: 'text-green-500', icon: '✅', badge: 'bg-green-500/20', description: 'Consistent performer' },
    standard: { label: 'Standard', color: 'text-blue-500', icon: '⚡', badge: 'bg-blue-500/20', description: 'Regular player' },
    volatile: { label: 'Volatile', color: 'text-orange-500', icon: '⚠️', badge: 'bg-orange-500/20', description: 'Inconsistent results' },
    high_risk: { label: 'High Risk', color: 'text-red-500', icon: '🚫', badge: 'bg-red-500/20', description: 'Restricted access' },
  };
  return display[tier];
}
