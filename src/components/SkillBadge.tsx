import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getTierDisplayInfo, type RiskTier } from '@/lib/engines/riskEngine';

interface SkillBadgeProps {
  skillScore: number;
  riskTier: RiskTier;
  compact?: boolean;
  showScore?: boolean;
}

export function SkillBadge({ skillScore, riskTier, compact = false, showScore = true }: SkillBadgeProps) {
  const display = getTierDisplayInfo(riskTier);

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${display.badge} border-transparent`}>
              {display.icon} {Math.round(skillScore)}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{display.label} — {display.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className={`${display.badge} border-transparent`}>
        {display.icon} {display.label}
      </Badge>
      {showScore && (
        <span className="text-sm font-mono text-muted-foreground">{Math.round(skillScore)} SR</span>
      )}
    </div>
  );
}
