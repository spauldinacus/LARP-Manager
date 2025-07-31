import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lightbulb, Target, TrendingUp, Calculator } from "lucide-react";

interface XPEfficiencyTrackerProps {
  character: {
    heritage: string;
    culture: string;
    archetype: string;
    skills: string[];
    body: number;
    stamina: number;
    totalXpSpent: number;
    experience: number;
  };
}

// XP cost calculations based on Thrune rulebook
const getSkillCost = (skill: string, heritage: string, culture: string, archetype: string) => {
  // This would normally check against actual skill data
  // For now, using simplified logic
  const heritageSkills = getHeritageSkills(heritage);
  const cultureSkills = getCultureSkills(culture);
  const archetypeSkills = getArchetypeSkills(archetype);

  if (heritageSkills.includes(skill)) return 5;
  if (cultureSkills.includes(skill) || archetypeSkills.includes(skill)) return 10;
  return 20;
};

const getHeritageSkills = (heritage: string): string[] => {
  const heritageSkillMap: { [key: string]: string[] } = {
    "ar-nura": ["Athletics", "Dodge", "Melee Weapons"],
    "human": ["Athletics", "Academics", "Socialize"],
    "stoneborn": ["Athletics", "Crafting", "Melee Weapons"],
    "ughol": ["Athletics", "Survival", "Ranged Weapons"],
    "rystarri": ["Academics", "Lore", "Socialize"]
  };
  return heritageSkillMap[heritage] || [];
};

const getCultureSkills = (culture: string): string[] => {
  // Simplified - would need full culture skill mappings
  return ["Academics", "Athletics", "Survival"];
};

const getArchetypeSkills = (archetype: string): string[] => {
  const archetypeSkillMap: { [key: string]: string[] } = {
    "fighter": ["Melee Weapons", "Athletics", "Dodge"],
    "scholar": ["Academics", "Lore", "Research"],
    "scout": ["Survival", "Ranged Weapons", "Stealth"],
    "social": ["Socialize", "Empathy", "Leadership"]
  };
  return archetypeSkillMap[archetype] || [];
};

const getBodyStaminaCost = (currentValue: number, targetValue: number) => {
  let totalCost = 0;
  for (let i = currentValue; i < targetValue; i++) {
    if (i < 10) totalCost += 1;
    else if (i < 15) totalCost += 2;
    else if (i < 20) totalCost += 3;
    else totalCost += 5;
  }
  return totalCost;
};

export default function XPEfficiencyTracker({ character }: XPEfficiencyTrackerProps) {
  const availableXP = character.experience || 0;
  
  // Calculate efficiency metrics
  const totalXpEarned = availableXP + (character.totalXpSpent || 0);
  const spendingEfficiency = totalXpEarned > 0 ? ((character.totalXpSpent || 0) / totalXpEarned) * 100 : 0;
  
  // Skill recommendations based on heritage/culture/archetype
  const heritageSkills = getHeritageSkills(character.heritage);
  const cultureSkills = getCultureSkills(character.culture);
  const archetypeSkills = getArchetypeSkills(character.archetype);
  
  const allOptimalSkills = Array.from(new Set([...heritageSkills, ...cultureSkills, ...archetypeSkills]));
  const missingOptimalSkills = allOptimalSkills.filter(skill => !character.skills?.includes(skill));
  
  // Calculate next upgrade costs
  const nextBodyCost = getBodyStaminaCost(character.body, character.body + 1);
  const nextStaminaCost = getBodyStaminaCost(character.stamina, character.stamina + 1);
  
  const affordableUpgrades = [];
  
  // Check affordable skills
  missingOptimalSkills.forEach(skill => {
    const cost = getSkillCost(skill, character.heritage, character.culture, character.archetype);
    if (cost <= availableXP) {
      affordableUpgrades.push({
        type: 'skill',
        name: skill,
        cost,
        reason: cost === 5 ? 'Primary skill (heritage)' : cost === 10 ? 'Secondary skill' : 'Tertiary skill'
      });
    }
  });
  
  // Check affordable body/stamina upgrades
  if (nextBodyCost <= availableXP) {
    affordableUpgrades.push({
      type: 'body',
      name: `Body ${character.body} → ${character.body + 1}`,
      cost: nextBodyCost,
      reason: 'Increases hit points'
    });
  }
  
  if (nextStaminaCost <= availableXP) {
    affordableUpgrades.push({
      type: 'stamina', 
      name: `Stamina ${character.stamina} → ${character.stamina + 1}`,
      cost: nextStaminaCost,
      reason: 'Increases movement and action economy'
    });
  }
  
  // Sort by cost efficiency (lower cost first)
  affordableUpgrades.sort((a, b) => a.cost - b.cost);

  return (
    <div className="space-y-4">
      {/* Efficiency Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>XP Efficiency Analysis</span>
          </CardTitle>
          <CardDescription>Track your character progression efficiency</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">{spendingEfficiency.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">XP Utilization</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">{availableXP}</p>
              <p className="text-xs text-muted-foreground">Ready to Spend</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-purple-600">{character.skills?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Skills Learned</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-orange-600">{character.body + character.stamina}</p>
              <p className="text-xs text-muted-foreground">Total Stats</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progression Efficiency</span>
              <span>{spendingEfficiency.toFixed(1)}% utilized</span>
            </div>
            <Progress value={spendingEfficiency} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {spendingEfficiency < 70 ? "Consider spending XP to improve your character" : 
               spendingEfficiency < 90 ? "Good balance of saving and spending" : 
               "Highly optimized XP usage"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Upgrades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5" />
            <span>Recommended Upgrades</span>
          </CardTitle>
          <CardDescription>Cost-effective improvements for your character</CardDescription>
        </CardHeader>
        <CardContent>
          {affordableUpgrades.length > 0 ? (
            <div className="space-y-3">
              {affordableUpgrades.slice(0, 5).map((upgrade, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className={
                      upgrade.type === 'skill' ? "border-blue-500 text-blue-600" :
                      upgrade.type === 'body' ? "border-red-500 text-red-600" :
                      "border-green-500 text-green-600"
                    }>
                      {upgrade.type}
                    </Badge>
                    <div>
                      <p className="font-medium">{upgrade.name}</p>
                      <p className="text-sm text-muted-foreground">{upgrade.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{upgrade.cost}</p>
                    <p className="text-xs text-muted-foreground">XP</p>
                  </div>
                </div>
              ))}
              
              {affordableUpgrades.length > 5 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  +{affordableUpgrades.length - 5} more affordable upgrades available
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No affordable upgrades available</p>
              <p className="text-sm text-muted-foreground mt-1">
                Attend more events to earn XP for character improvements
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Optimal Skills Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Character Build Optimization</span>
          </CardTitle>
          <CardDescription>Track progress toward your optimal skill set</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Optimal Skills ({allOptimalSkills.length - missingOptimalSkills.length}/{allOptimalSkills.length})</span>
                <span>{Math.round(((allOptimalSkills.length - missingOptimalSkills.length) / allOptimalSkills.length) * 100)}%</span>
              </div>
              <Progress 
                value={((allOptimalSkills.length - missingOptimalSkills.length) / allOptimalSkills.length) * 100} 
                className="h-2" 
              />
            </div>
            
            {missingOptimalSkills.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Missing Optimal Skills:</p>
                <div className="flex flex-wrap gap-1">
                  {missingOptimalSkills.map(skill => {
                    const cost = getSkillCost(skill, character.heritage, character.culture, character.archetype);
                    return (
                      <Badge 
                        key={skill} 
                        variant="outline" 
                        className={cost <= availableXP ? "border-green-500 text-green-600" : "border-muted"}
                      >
                        {skill} ({cost} XP)
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}