import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface AchievementBadgeProps {
  title: string;
  description: string;
  icon: LucideIcon;
  isUnlocked: boolean;
  rarity?: "common" | "rare" | "epic" | "legendary";
  className?: string;
}

const rarityStyles = {
  common: {
    border: "border-gray-300 dark:border-gray-600",
    bg: "bg-gray-50 dark:bg-gray-950",
    text: "text-gray-600 dark:text-gray-400",
    iconColor: "text-gray-600 dark:text-gray-400",
  },
  rare: {
    border: "border-blue-300 dark:border-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950",
    text: "text-blue-600 dark:text-blue-400",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  epic: {
    border: "border-purple-300 dark:border-purple-600",
    bg: "bg-purple-50 dark:bg-purple-950",
    text: "text-purple-600 dark:text-purple-400",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  legendary: {
    border: "border-yellow-300 dark:border-yellow-600",
    bg: "bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950",
    text: "text-yellow-600 dark:text-yellow-400",
    iconColor: "text-yellow-600 dark:text-yellow-400",
  },
};

export default function AchievementBadge({
  title,
  description,
  icon: Icon,
  isUnlocked,
  rarity = "common",
  className,
}: AchievementBadgeProps) {
  const styles = rarityStyles[rarity];

  return (
    <Card
      className={cn(
        "transition-all duration-300 hover:shadow-md",
        isUnlocked
          ? `${styles.border} ${styles.bg}`
          : "border-muted bg-muted/20 opacity-60",
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div
            className={cn(
              "p-2 rounded-full",
              isUnlocked
                ? "bg-white/50 dark:bg-black/20"
                : "bg-muted"
            )}
          >
            <Icon
              className={cn(
                "h-6 w-6",
                isUnlocked
                  ? styles.iconColor
                  : "text-muted-foreground"
              )}
            />
          </div>
          <div className="flex-1">
            <h4
              className={cn(
                "font-semibold text-sm",
                isUnlocked
                  ? styles.text
                  : "text-muted-foreground"
              )}
            >
              {title}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              {description}
            </p>
            {isUnlocked && rarity !== "common" && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs mt-2",
                  styles.text,
                  styles.border
                )}
              >
                {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}