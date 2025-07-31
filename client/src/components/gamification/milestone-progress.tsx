import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface Milestone {
  threshold: number;
  title: string;
  icon: LucideIcon;
  color: string;
  description: string;
}

interface MilestoneProgressProps {
  currentXP: number;
  milestones: Milestone[];
  className?: string;
}

export default function MilestoneProgress({
  currentXP,
  milestones,
  className,
}: MilestoneProgressProps) {
  const currentMilestone = milestones.find(m => currentXP >= m.threshold) || milestones[0];
  const nextMilestone = milestones.find(m => currentXP < m.threshold);
  
  const progressToNext = nextMilestone 
    ? ((currentXP - (currentMilestone?.threshold || 0)) / (nextMilestone.threshold - (currentMilestone?.threshold || 0))) * 100
    : 100;

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <currentMilestone.icon className={`h-5 w-5 ${currentMilestone.color}`} />
            <span>Progression Milestone</span>
          </div>
          <Badge variant="outline">{currentXP} XP</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Milestone */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <currentMilestone.icon className={`h-8 w-8 ${currentMilestone.color}`} />
            <div>
              <h3 className="font-bold text-lg">{currentMilestone.title}</h3>
              <p className="text-sm text-muted-foreground">{currentMilestone.description}</p>
            </div>
          </div>
        </div>

        {/* Progress to Next */}
        {nextMilestone && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Progress to {nextMilestone.title}</span>
              <span>{currentXP}/{nextMilestone.threshold} XP</span>
            </div>
            <Progress value={progressToNext} className="h-2" />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{nextMilestone.threshold - currentXP} XP remaining</span>
              <div className="flex items-center space-x-1">
                <nextMilestone.icon className={`h-3 w-3 ${nextMilestone.color}`} />
                <span>{nextMilestone.title}</span>
              </div>
            </div>
          </div>
        )}

        {/* Milestone Timeline */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-4 border-t">
          {milestones.slice(0, 6).map((milestone, index) => {
            const isUnlocked = currentXP >= milestone.threshold;
            const isCurrent = milestone === currentMilestone;
            const isNext = milestone === nextMilestone;

            return (
              <div
                key={milestone.threshold}
                className={cn(
                  "text-center p-2 rounded-lg border transition-all",
                  isUnlocked
                    ? isCurrent
                      ? "border-primary bg-primary/10"
                      : "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20"
                    : isNext
                      ? "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20"
                      : "border-muted bg-muted/20"
                )}
              >
                <milestone.icon
                  className={cn(
                    "h-4 w-4 mx-auto mb-1",
                    isUnlocked ? milestone.color : "text-muted-foreground"
                  )}
                />
                <p className={cn(
                  "text-xs font-medium",
                  isUnlocked ? "" : "text-muted-foreground"
                )}>
                  {milestone.threshold}
                </p>
                <p className="text-xs text-muted-foreground">
                  {milestone.title.split(' ')[0]}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}