import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { SkillBadge } from './SkillBadge';
import { getRiskProfile, type RiskTier } from '@/lib/engines/riskEngine';
import { TrendingUp, Shield, Zap, Target } from 'lucide-react';

interface SkillCardProps {
  skillScore: number;
  winRate: number;
  volatilityScore: number;
  consistencyIndex: number;
  riskTier: RiskTier;
  totalMatches: number;
}

export function SkillCard({
  skillScore,
  winRate,
  volatilityScore,
  consistencyIndex,
  riskTier,
  totalMatches,
}: SkillCardProps) {
  const riskProfile = getRiskProfile(riskTier);

  const stats = [
    { label: 'Win Rate', value: `${(winRate * 100).toFixed(0)}%`, icon: Target, progress: winRate * 100 },
    { label: 'Consistency', value: `${(consistencyIndex * 100).toFixed(0)}%`, icon: Zap, progress: consistencyIndex * 100 },
    { label: 'Volatility', value: `${(volatilityScore * 100).toFixed(0)}%`, icon: TrendingUp, progress: volatilityScore * 100 },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Skill Rating
          </CardTitle>
          <SkillBadge skillScore={skillScore} riskTier={riskTier} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Skill Score Bar */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{totalMatches} matches played</span>
            <span>Max stake: ${riskProfile.maxStake}</span>
          </div>
          <Progress value={Math.min((skillScore / 3000) * 100, 100)} className="h-2" />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
            <span>100</span>
            <span>1000</span>
            <span>2000</span>
            <span>3000</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon className="h-3 w-3 mx-auto mb-0.5 text-muted-foreground" />
              <p className="text-xs font-bold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tier Description */}
        <p className="text-[10px] text-muted-foreground text-center italic">
          {riskProfile.description}
        </p>
      </CardContent>
    </Card>
  );
}
