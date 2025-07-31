import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AchievementBadge from "./achievement-badge";
import MilestoneProgress from "./milestone-progress";
import AchievementManagementModal from "../modals/achievement-management-modal";
import MilestoneManagementModal from "../modals/milestone-management-modal";
import AchievementSettingsModal from "../modals/achievement-settings-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { 
  Trophy, 
  Target, 
  Star, 
  Zap, 
  Crown, 
  Award, 
  TrendingUp,
  Calendar,
  BookOpen,
  Sword,
  Shield,
  Heart,
  Users,
  Flame,
  Brain,
  Wand2,
  Edit,
  Trash2,
  Plus,
  Gem
} from "lucide-react";

// Helper function to get icon component by name
const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: any } = {
    trophy: Trophy,
    star: Star,
    crown: Crown,
    shield: Shield,
    sword: Sword,
    gem: Gem,
    fire: Flame,
    heart: Heart,
    lightning: Zap,
    target: Target,
    book: BookOpen,
  };
  return iconMap[iconName] || Trophy;
};

interface Character {
  id: string;
  name: string;
  experience: number;
  totalXpSpent: number;
  heritage: string;
  culture: string;
  archetype: string;
  skills: string[];
  body: number;
  stamina: number;
  isActive: boolean;
}

interface XPProgressionTrackerProps {
  characterId: string;
  character?: Character;
  isAdmin?: boolean;
}

// XP milestone definitions
const XP_MILESTONES = [
  { threshold: 25, title: "Novice Adventurer", icon: BookOpen, color: "text-green-600", description: "First steps into the world" },
  { threshold: 50, title: "Seasoned Explorer", icon: Target, color: "text-blue-600", description: "Growing in experience" },
  { threshold: 100, title: "Skilled Warrior", icon: Sword, color: "text-purple-600", description: "Combat prowess developing" },
  { threshold: 200, title: "Master Tactician", icon: Shield, color: "text-orange-600", description: "Strategic thinking" },
  { threshold: 350, title: "Elite Champion", icon: Crown, color: "text-yellow-600", description: "Among the finest" },
  { threshold: 500, title: "Legendary Hero", icon: Trophy, color: "text-red-600", description: "Legends are born" },
];

// Achievement definitions with rarities
const ACHIEVEMENTS = [
  {
    id: "first_skill",
    title: "First Steps",
    description: "Learn your first skill",
    icon: BookOpen,
    rarity: "common" as const,
    check: (char: Character) => char.skills?.length > 0
  },
  {
    id: "skill_collector",
    title: "Skill Collector",
    description: "Learn 5 different skills",
    icon: Star,
    rarity: "rare" as const,
    check: (char: Character) => char.skills?.length >= 5
  },
  {
    id: "skill_master",
    title: "Skill Master",
    description: "Learn 10 different skills",
    icon: Trophy,
    rarity: "epic" as const,
    check: (char: Character) => char.skills?.length >= 10
  },
  {
    id: "skill_legend",
    title: "Skill Legend",
    description: "Learn 15+ different skills",
    icon: Crown,
    rarity: "legendary" as const,
    check: (char: Character) => char.skills?.length >= 15
  },
  {
    id: "body_builder",
    title: "Body Builder",
    description: "Reach 15+ Body points",
    icon: Heart,
    rarity: "rare" as const,
    check: (char: Character) => char.body >= 15
  },
  {
    id: "stamina_runner",
    title: "Endurance Runner",
    description: "Reach 15+ Stamina points",
    icon: Zap,
    rarity: "rare" as const,
    check: (char: Character) => char.stamina >= 15
  },
  {
    id: "balanced_fighter",
    title: "Balanced Fighter",
    description: "Have both Body and Stamina at 12+",
    icon: Shield,
    rarity: "epic" as const,
    check: (char: Character) => char.body >= 12 && char.stamina >= 12
  },
  {
    id: "tank_build",
    title: "Immovable Object",
    description: "Reach 20+ Body points",
    icon: Shield,
    rarity: "epic" as const,
    check: (char: Character) => char.body >= 20
  },
  {
    id: "speed_demon",
    title: "Speed Demon",
    description: "Reach 20+ Stamina points",
    icon: Zap,
    rarity: "epic" as const,
    check: (char: Character) => char.stamina >= 20
  },
  {
    id: "xp_spender",
    title: "Resource Manager",
    description: "Spend 100+ XP on improvements",
    icon: Target,
    rarity: "common" as const,
    check: (char: Character) => (char.totalXpSpent || 0) >= 100
  },
  {
    id: "veteran_spender",
    title: "Veteran Investor",
    description: "Spend 250+ XP on improvements",
    icon: Brain,
    rarity: "rare" as const,
    check: (char: Character) => (char.totalXpSpent || 0) >= 250
  },
  {
    id: "master_spender",
    title: "Master Strategist",
    description: "Spend 500+ XP on improvements",
    icon: Wand2,
    rarity: "epic" as const,
    check: (char: Character) => (char.totalXpSpent || 0) >= 500
  },
  {
    id: "legend_spender",
    title: "Legendary Sage",
    description: "Spend 1000+ XP on improvements",
    icon: Crown,
    rarity: "legendary" as const,
    check: (char: Character) => (char.totalXpSpent || 0) >= 1000
  }
];

export default function XPProgressionTracker({ 
  characterId, 
  character, 
  isAdmin = false
}: XPProgressionTrackerProps) {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch custom achievements and milestones for all users
  const { data: customAchievements = [] } = useQuery({
    queryKey: ["/api/achievements"],
    enabled: !!characterId,
  });

  const { data: customMilestones = [] } = useQuery({
    queryKey: ["/api/milestones"],
    enabled: !!characterId,
  });

  // Fetch admin-specific data only for admins
  const { data: adminAchievements = [] } = useQuery({
    queryKey: ["/api/admin/achievements"],
    enabled: isAdmin,
  });

  const { data: adminMilestones = [] } = useQuery({
    queryKey: ["/api/admin/milestones"],
    enabled: isAdmin,
  });

  // Delete achievement mutation
  const deleteAchievementMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/achievements/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/achievements"] });
      toast({
        title: "Achievement deleted",
        description: "Achievement has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete achievement",
        description: error.message || "Unable to delete achievement",
        variant: "destructive",
      });
    },
  });

  // Delete milestone mutation
  const deleteMilestoneMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/milestones/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/milestones"] });
      toast({
        title: "Milestone deleted",
        description: "Milestone has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete milestone",
        description: error.message || "Unable to delete milestone",
        variant: "destructive",
      });
    },
  });

  const handleCreateAchievement = () => {
    setSelectedAchievement(null);
    setModalMode("create");
    setShowAchievementModal(true);
  };

  const handleEditAchievement = (achievement: any) => {
    setSelectedAchievement(achievement);
    setModalMode("edit");
    setShowAchievementModal(true);
  };

  const handleCreateMilestone = () => {
    setSelectedMilestone(null);
    setModalMode("create");
    setShowMilestoneModal(true);
  };

  const handleEditMilestone = (milestone: any) => {
    setSelectedMilestone(milestone);
    setModalMode("edit");
    setShowMilestoneModal(true);
  };

  // Manual achievement unlock mutation
  const unlockAchievementMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      const response = await apiRequest("POST", `/api/characters/${characterId}/achievements/${achievementId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/characters', characterId, 'achievements'] });
      toast({
        title: "Achievement unlocked",
        description: "Manual achievement has been unlocked for this character.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to unlock achievement",
        description: error.message || "Unable to unlock achievement",
        variant: "destructive",
      });
    },
  });

  const unlockManualAchievement = (achievementId: string) => {
    unlockAchievementMutation.mutate(achievementId);
  };

  const handleEditStaticMilestone = (milestone: any, index: number) => {
    // Convert static milestone to editable format
    const editableMilestone = {
      id: `static-${index}`,
      title: milestone.title,
      description: milestone.description,
      threshold: milestone.threshold,
      iconName: milestone.icon.name || 'trophy',
      color: milestone.color,
      isStatic: true,
      staticIndex: index
    };
    setSelectedMilestone(editableMilestone);
    setModalMode("edit");
    setShowMilestoneModal(true);
  };

  const handleEditStaticAchievement = (achievement: any, index: number) => {
    // Convert static achievement to editable format
    const editableAchievement = {
      id: `static-${index}`,
      title: achievement.title,
      description: achievement.description,
      iconName: achievement.icon.name || 'trophy',
      rarity: achievement.rarity,
      conditionType: achievement.conditionType || 'manual',
      conditionValue: achievement.conditionValue,
      isStatic: true,
      staticIndex: index
    };
    setSelectedAchievement(editableAchievement);
    setModalMode("edit");
    setShowAchievementModal(true);
  };

  // Fetch character experience history
  const { data: experienceHistory = [] } = useQuery({
    queryKey: ["/api/characters", characterId, "experience"],
    enabled: !!characterId,
  });

  // Fetch event attendance data
  const { data: attendanceData } = useQuery({
    queryKey: ["/api/characters", characterId, "attendance-xp"],
    enabled: !!characterId,
  });

  // Fetch character achievements
  const { data: characterAchievements } = useQuery({
    queryKey: ["/api/characters", characterId, "achievements"],
    enabled: !!characterId,
  });

  // Fetch all characters for achievement percentage calculation
  const { data: allCharacters = [] } = useQuery({
    queryKey: ["/api/characters"],
    enabled: !!characterId,
  });

  if (!character) return null;

  const totalXpEarned = (character.experience || 0) + (character.totalXpSpent || 0);
  const currentMilestone = XP_MILESTONES.find(m => totalXpEarned >= m.threshold) || XP_MILESTONES[0];
  const nextMilestone = XP_MILESTONES.find(m => totalXpEarned < m.threshold);
  
  const progressToNext = nextMilestone 
    ? ((totalXpEarned - (currentMilestone?.threshold || 0)) / (nextMilestone.threshold - (currentMilestone?.threshold || 0))) * 100
    : 100;

  // Calculate achievement percentages
  const calculateAchievementPercentage = (achievement: any) => {
    if (!allCharacters.length) return 0;
    
    const achieversCount = allCharacters.filter((char: any) => {
      if (achievement.id && achievement.id.startsWith('static-')) {
        // Static achievement - use the check function
        return achievement.check(char);
      } else if (achievement.conditionType) {
        // Custom achievement
        switch (achievement.conditionType) {
          case 'xp_spent':
            return (char.totalXpSpent || 0) >= (achievement.conditionValue || 0);
          case 'skill_count':
            return (char.skills?.length || 0) >= (achievement.conditionValue || 0);
          case 'attribute_value':
            return (char.body + char.stamina) >= (achievement.conditionValue || 0);
          case 'manual':
          default:
            // For manual achievements, we'd need to check character_achievements table
            // For now, return false as we don't have that data in allCharacters
            return false;
        }
      } else {
        // Static achievement without custom ID
        return achievement.check(char);
      }
    }).length;
    
    return Math.round((achieversCount / allCharacters.length) * 100);
  };

  // Combine static achievements with custom achievements
  const customAchievementsList = (customAchievements as any[]) || [];
  const allAchievements = [
    ...ACHIEVEMENTS.map(achievement => ({
      ...achievement,
      percentage: calculateAchievementPercentage(achievement)
    })),
    ...customAchievementsList.map((custom: any) => ({
      id: custom.id,
      title: custom.title,
      description: custom.description,
      icon: getIconComponent(custom.iconName || 'trophy'),
      rarity: custom.rarity,
      percentage: calculateAchievementPercentage(custom),
      check: (char: Character) => {
        // Check based on condition type
        switch (custom.conditionType) {
          case 'xp_spent':
            return (char.totalXpSpent || 0) >= (custom.conditionValue || 0);
          case 'skill_count':
            return (char.skills?.length || 0) >= (custom.conditionValue || 0);
          case 'attribute_value':
            return (char.body + char.stamina) >= (custom.conditionValue || 0);
          case 'manual':
          default:
            // For manual achievements, check if character has unlocked it
            return characterAchievements?.some((ca: any) => ca.achievementId === custom.id) || false;
        }
      }
    }))
  ];

  const unlockedAchievements = allAchievements.filter(achievement => achievement.check(character));
  const lockedAchievements = allAchievements.filter(achievement => !achievement.check(character));

  return (
    <div className="space-y-6">
      {/* Milestone Progress Card */}
      <MilestoneProgress 
        currentXP={totalXpEarned} 
        milestones={XP_MILESTONES} 
        className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5"
      />

      {/* Quick XP Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-600">{character.experience || 0}</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">Available XP</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{character.totalXpSpent || 0}</p>
            <p className="text-sm text-green-700 dark:text-green-300">XP Spent</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{totalXpEarned}</p>
            <p className="text-sm text-blue-700 dark:text-blue-300">Total Earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Character Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Character Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Body Points</span>
                  <Badge variant="outline" className="text-red-600 border-red-600">
                    <Heart className="h-3 w-3 mr-1" />
                    {character.body}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Stamina Points</span>
                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                    <Zap className="h-3 w-3 mr-1" />
                    {character.stamina}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Skills Learned</span>
                  <Badge variant="outline" className="text-purple-600 border-purple-600">
                    <BookOpen className="h-3 w-3 mr-1" />
                    {character.skills?.length || 0}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Quick Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Events Attended</span>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <Calendar className="h-3 w-3 mr-1" />
                    {(attendanceData as any)?.eventsAttended || 0}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Achievements</span>
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    <Trophy className="h-3 w-3 mr-1" />
                    {unlockedAchievements.length}/{ACHIEVEMENTS.length}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Character Status</span>
                  <Badge variant={character.isActive ? "default" : "secondary"}>
                    {character.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Achievement Management</span>
                  <div className="flex space-x-2">
                    <Button onClick={() => setShowSettingsModal(true)} variant="outline" size="sm">
                      Settings
                    </Button>
                    <Button onClick={handleCreateAchievement} size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Achievement
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  Edit any achievement including static ones. Changes to static achievements are saved to the database.
                </CardDescription>
              </CardHeader>

              {/* Static Achievements - Editable */}
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Static Achievements (Editable)</h4>
                    <div className="space-y-2">
                      {ACHIEVEMENTS.map((achievement, index) => (
                        <div key={`static-${index}`} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${achievement.rarity === 'common' ? 'bg-gray-100' : achievement.rarity === 'rare' ? 'bg-blue-100' : achievement.rarity === 'epic' ? 'bg-purple-100' : 'bg-yellow-100'}`}>
                              {React.createElement(achievement.icon, { className: "h-4 w-4" })}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{achievement.title}</p>
                              <p className="text-xs text-muted-foreground">{achievement.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {calculateAchievementPercentage(achievement)}% achieved • {achievement.conditionType === 'manual' ? 'Manual' : achievement.conditionType ? `${achievement.conditionValue} ${achievement.conditionType.replace('_', ' ')}` : 'Static Achievement'}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditStaticAchievement(achievement, index)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
              {(adminAchievements as any[])?.length > 0 && (
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Custom Achievements ({(adminAchievements as any[])?.length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {(adminAchievements as any[])?.map((achievement: any) => (
                        <div key={achievement.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{achievement.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{achievement.description}</p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditAchievement(achievement)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteAchievementMutation.mutate(achievement.id)}
                              disabled={deleteAchievementMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )}
          <div className="space-y-4">
            {/* Unlocked Achievements */}
            {unlockedAchievements.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  <span>Unlocked Achievements ({unlockedAchievements.length})</span>
                  {isAdmin && unlockedAchievements.some(a => customAchievementsList.find(c => c.id === a.id)) && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Includes Custom</span>
                  )}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {unlockedAchievements.map((achievement) => (
                    <AchievementBadge
                      key={achievement.id}
                      title={achievement.title}
                      description={achievement.description}
                      icon={achievement.icon}
                      isUnlocked={true}
                      percentage={achievement.percentage}
                      rarity={achievement.rarity}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Locked Achievements */}
            {lockedAchievements.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                  <Target className="h-5 w-5 text-muted-foreground" />
                  <span>Available Achievements ({lockedAchievements.length})</span>
                  {isAdmin && lockedAchievements.some(a => customAchievementsList.find(c => c.id === a.id)) && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Includes Custom</span>
                  )}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {lockedAchievements.map((achievement) => (
                    <div key={achievement.id} className="relative">
                      <AchievementBadge
                        title={achievement.title}
                        description={achievement.description}
                        icon={achievement.icon}
                        isUnlocked={false}
                        percentage={achievement.percentage}
                        rarity={achievement.rarity}
                      />
                      {isAdmin && customAchievementsList.find(c => c.id === achievement.id)?.conditionType === 'manual' && (
                        <Button
                          size="sm"
                          className="absolute top-2 right-2 h-6 w-6 p-0"
                          onClick={() => unlockManualAchievement(achievement.id)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Milestone Management</span>
                  <Button onClick={handleCreateMilestone} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Milestone
                  </Button>
                </CardTitle>
                <CardDescription>
                  Edit any milestone including static ones. Changes to static milestones are saved to the database.
                </CardDescription>
              </CardHeader>
              
              {/* Static Milestones - Editable */}
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Static Milestones (Editable)</h4>
                    <div className="space-y-2">
                      {XP_MILESTONES.map((milestone, index) => (
                        <div key={`static-${index}`} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center space-x-3">
                            <milestone.icon className={`h-6 w-6 ${milestone.color}`} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{milestone.title}</p>
                              <p className="text-xs text-muted-foreground">{milestone.description}</p>
                              <p className="text-xs text-muted-foreground">{milestone.threshold} XP required</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditStaticMilestone(milestone, index)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom Milestones */}
                  {(adminMilestones as any[])?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Custom Milestones ({(adminMilestones as any[])?.length})</h4>
                      <div className="space-y-2">
                        {(adminMilestones as any[])?.map((milestone: any) => (
                          <div key={milestone.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{milestone.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{milestone.description}</p>
                              <p className="text-xs text-muted-foreground">{milestone.threshold} XP</p>
                            </div>
                            <div className="flex items-center space-x-1 ml-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditMilestone(milestone)}
                                disabled={deleteMilestoneMutation.isPending}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteMilestoneMutation.mutate(milestone.id)}
                                disabled={deleteMilestoneMutation.isPending}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          <div className="space-y-4">
            {XP_MILESTONES.map((milestone, index) => {
              const isUnlocked = totalXpEarned >= milestone.threshold;
              const isCurrent = milestone === currentMilestone;
              const isNext = milestone === nextMilestone;

              return (
                <Card 
                  key={milestone.threshold} 
                  className={`${
                    isUnlocked 
                      ? isCurrent 
                        ? "border-primary bg-primary/5" 
                        : "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
                      : isNext
                        ? "border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20"
                        : "border-muted bg-muted/20"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <milestone.icon className={`h-8 w-8 ${isUnlocked ? milestone.color : "text-muted-foreground"}`} />
                        <div>
                          <h4 className={`font-semibold ${isUnlocked ? "" : "text-muted-foreground"}`}>
                            {milestone.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">{milestone.description}</p>
                          <p className="text-xs text-muted-foreground">{milestone.threshold} XP required</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isCurrent && <Badge variant="default">Current</Badge>}
                        {isNext && <Badge variant="outline">Next</Badge>}
                        {isUnlocked && !isCurrent && <Badge variant="secondary" className="text-green-600">Completed</Badge>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>



        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Experience History</span>
              </CardTitle>
              <CardDescription>Track your character's XP gains and expenditures</CardDescription>
            </CardHeader>
            <CardContent>
              {(experienceHistory as any[])?.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {(experienceHistory as any[])?.map((entry: any) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${entry.amount > 0 ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"}`}>
                          {entry.amount > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingUp className="h-4 w-4 rotate-180" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{entry.reason}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={entry.amount > 0 ? "default" : "destructive"}>
                          {entry.amount > 0 ? "+" : ""}{entry.amount} XP
                        </Badge>

                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">No experience history yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Attend events and spend XP to see your progression history
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Admin Management Modals */}
      {isAdmin && (
        <>
          <AchievementManagementModal
            isOpen={showAchievementModal}
            onClose={() => setShowAchievementModal(false)}
            achievement={selectedAchievement}
            mode={modalMode}
          />
          <MilestoneManagementModal
            isOpen={showMilestoneModal}
            onClose={() => setShowMilestoneModal(false)}
            milestone={selectedMilestone}
            mode={modalMode}
          />
          <AchievementSettingsModal
            isOpen={showSettingsModal}
            onClose={() => setShowSettingsModal(false)}
          />
        </>
      )}
    </div>
  );
}