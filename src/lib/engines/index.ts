/**
 * PlayArena Engine System — Barrel exports
 * 
 * Modular architecture for Skill-Weighted Escrow:
 * - skillEngine: ELO + volatility calculations
 * - riskEngine: Tier classification + multiplier logic
 * - escrowEngine: Stake validation + weighted payout distribution
 * - matchSettlement: Atomic settlement orchestration
 */

export {
  calculateSkillUpdates,
  expectedWinProbability,
  calculateConsistency,
  DEFAULT_SKILL,
  MIN_SKILL,
  MAX_SKILL,
} from './skillEngine';
export type { SkillProfile, SkillUpdate } from './skillEngine';

export {
  classifyRiskTier,
  getRiskProfile,
  getPayoutMultiplier,
  getDynamicStakeRequirement,
  validateMatchFairness,
  getTierDisplayInfo,
} from './riskEngine';
export type { RiskTier, RiskProfile } from './riskEngine';

export {
  validateStake,
  calculateWeightedPayouts,
  previewSettlement,
} from './escrowEngine';
export type { EscrowPlayer, PayoutBreakdown, SettlementResult } from './escrowEngine';

export {
  settleMatch,
  getPlayerSkillInfo,
} from './matchSettlement';
export type { MatchSettlementInput, SettlementReceipt } from './matchSettlement';
