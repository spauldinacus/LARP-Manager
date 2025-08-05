import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Calendar, User, Shield, Zap, BookOpen, Plus, Minus, UserX, AlertTriangle, Settings, MapPin, Trash2 } from "lucide-react";
import { getSkillCost, getAttributeCost, HERITAGE_BASES, SKILLS } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// Experience spending schemas
const skillPurchaseSchema = z.object({
  skill: z.string().min(1, "Skill is required"),
  cost: z.number().min(1),
});

const attributeSpendSchema = z.object({
  attribute: z.enum(["body", "stamina"]),
  amount: z.number().min(1, "Amount must be at least 1"),
});

const retireCharacterSchema = z.object({
  reason: z.string().min(1, "Retirement reason is required"),
});

type SkillPurchaseForm = z.infer<typeof skillPurchaseSchema>;
type AttributeSpendForm = z.infer<typeof attributeSpendSchema>;
type RetireCharacterForm = z.infer<typeof retireCharacterSchema>;

interface CharacterSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterId: string | null;
}

interface DynamicSkill {
  id: string;
  name: string;
  description?: string;
  prerequisiteSkillId?: string | null;
}

interface DynamicHeritage {
  id: string;
  name: string;
  body: number;
  stamina: number;
  icon: string;
  description: string;
  costumeRequirements: string;
  benefit: string;
  weakness: string;
  secondarySkills?: DynamicSkill[];
}

interface DynamicArchetype {
  id: string;
  name: string;
  description?: string;
  primarySkills?: DynamicSkill[];
  secondarySkills?: DynamicSkill[];
}

export default function CharacterSheetModal({
  isOpen,
  onClose,
  characterId,
}: CharacterSheetModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch dynamic game data for real-time XP calculations
  const { data: skills = [] } = useQuery<DynamicSkill[]>({
    queryKey: ["/api/admin?type=skills"],
    enabled: isOpen && !!characterId,
    staleTime: 0,
  });

  const { data: heritages = [] } = useQuery<DynamicHeritage[]>({
    queryKey: ["/api/admin?type=heritages"], 
    enabled: isOpen && !!characterId,
    staleTime: 0,
  });

  const { data: archetypes = [] } = useQuery<DynamicArchetype[]>({
    queryKey: ["/api/admin?type=archetypes"],
    enabled: isOpen && !!characterId,
    staleTime: 0,
  });
  const [showExperienceSpending, setShowExperienceSpending] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [additionalBody, setAdditionalBody] = useState(0);
  const [additionalStamina, setAdditionalStamina] = useState(0);
  const [retirementReason, setRetirementReason] = useState("");
  const [showAdminSkills, setShowAdminSkills] = useState(false);
  const [selectedAdminSkill, setSelectedAdminSkill] = useState("");
  const [selectedRemoveSkill, setSelectedRemoveSkill] = useState("");
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [xpAmount, setXpAmount] = useState(3);
  const [selectedSecondArchetype, setSelectedSecondArchetype] = useState("");

  // Debug logging for query parameters
  console.log("CharacterSheetModal Debug - isOpen:", isOpen, "characterId:", characterId);
  console.log("CharacterSheetModal Debug - Query enabled condition:", isOpen && !!characterId);

  // Fetch character details
  const { data: character, isLoading: characterLoading } = useQuery({
    queryKey: ["/api/characters", characterId!],
    enabled: isOpen && !!characterId,
    staleTime: 0, // Always treat data as stale to force fresh requests
  });

  // Debug logging for query results
  console.log("CharacterSheetModal Debug - character data:", character);
  console.log("CharacterSheetModal Debug - characterLoading:", characterLoading);

  // Fetch experience history for character
  const { data: experienceHistory = [], isLoading: experienceLoading } = useQuery({
    queryKey: ["/api/characters", characterId!, "experience"],
    enabled: isOpen && !!characterId,
    staleTime: 0, // Always treat data as stale to force fresh requests
  });

  // Debug logging for experience history
  console.log("CharacterSheetModal Debug - experienceHistory:", experienceHistory);
  console.log("CharacterSheetModal Debug - experienceLoading:", experienceLoading);

  // Fetch all events for admin event addition
  const { data: allEvents } = useQuery({
    queryKey: ["/api/admin?type=events"],
    enabled: user?.isAdmin && !!characterId,
  });

  // Helper function to calculate body/stamina cost
  const getAttributeCost = (currentValue: number, increaseAmount: number): number => {
    let totalCost = 0;
    let currentVal = currentValue;

    for (let i = 0; i < increaseAmount; i++) {
      if (currentVal < 20) totalCost += 1;
      else if (currentVal < 40) totalCost += 2;
      else if (currentVal < 60) totalCost += 3;
      else if (currentVal < 80) totalCost += 4;
      else if (currentVal < 100) totalCost += 5;
      else if (currentVal < 120) totalCost += 6;
      else if (currentVal < 140) totalCost += 7;
      else if (currentVal < 160) totalCost += 8;
      else if (currentVal < 180) totalCost += 9;
      else totalCost += 10;

      currentVal++;
    }

    return totalCost;
  };

  // Calculate skill cost dynamically based on character's heritage and archetype(s)
  const getSkillCostForCharacter = (skillName: string, heritageId: string, archetypeId: string, secondArchetypeId?: string) => {
    // Find the skill in dynamic data
    const skillData = skills.find((s: DynamicSkill) => s.name === skillName);
    if (!skillData) {
      // Fallback for skills not yet in dynamic data
      return { cost: 20, category: 'other' as const };
    }

    const selectedHeritage = heritages.find((h: DynamicHeritage) => h.id === heritageId);
    const selectedArchetype = archetypes.find((a: DynamicArchetype) => a.id === archetypeId);
    const selectedSecondArchetype = secondArchetypeId ? archetypes.find((a: DynamicArchetype) => a.id === secondArchetypeId) : null;

    // Check if skill is a primary skill from any archetype (5 XP)
    if (selectedArchetype?.primarySkills?.some((s: DynamicSkill) => s.id === skillData.id) ||
        selectedSecondArchetype?.primarySkills?.some((s: DynamicSkill) => s.id === skillData.id)) {
      return { cost: 5, category: 'primary' as const };
    }

    // Check if skill is a secondary skill from heritage or any archetype (10 XP)
    if (selectedHeritage?.secondarySkills?.some((s: DynamicSkill) => s.id === skillData.id) || 
        selectedArchetype?.secondarySkills?.some((s: DynamicSkill) => s.id === skillData.id) ||
        selectedSecondArchetype?.secondarySkills?.some((s: DynamicSkill) => s.id === skillData.id)) {
      return { cost: 10, category: 'secondary' as const };
    }

    // Default cost for all other skills (20 XP)
    return { cost: 20, category: 'other' as const };
  };

  // Mutations for spending experience
  const purchaseSkillMutation = useMutation({
    mutationFn: async (data: { skill: string; cost: number }) => {
      const response = await apiRequest("POST", `/api/characters/${characterId}/purchase-skill`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId!] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId!, "experience"] });
      setSelectedSkill("");
      toast({
        title: "Skill purchased!",
        description: "The skill has been added to your character.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase failed",
        description: error.message || "Failed to purchase skill",
        variant: "destructive",
      });
    },
  });

  const increaseAttributeMutation = useMutation({
    mutationFn: async (data: { attribute: string; amount: number; cost: number }) => {
      const response = await apiRequest("POST", `/api/characters/${characterId}/increase-attribute`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId!] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId!, "experience"] });
      setAdditionalBody(0);
      setAdditionalStamina(0);
      toast({
        title: "Attribute increased!",
        description: "Your character's attribute has been improved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Increase failed",
        description: error.message || "Failed to increase attribute",
        variant: "destructive",
      });
    },
  });

  const retireCharacterMutation = useMutation({
    mutationFn: async (data: { reason: string }) => {
      const response = await apiRequest("POST", `/api/characters/${characterId}/retire`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId!] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      setRetirementReason("");
      toast({
        title: "Character retired",
        description: "The character has been successfully retired.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Retirement failed",
        description: error.message || "Failed to retire character",
        variant: "destructive",
      });
    },
  });

  // Admin add event attendance mutation
  const addEventAttendanceMutation = useMutation({
    mutationFn: async (data: { eventId: string; xpAmount: number; reason: string }) => {
      const response = await apiRequest("POST", `/api/characters/${characterId}/experience`, {
        amount: data.xpAmount,
        reason: data.reason,
        eventId: data.eventId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId!] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId!, "experience"] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId!, "attendance-xp"] });
      setSelectedEvent("");
      setXpAmount(3);
      setShowAddEvent(false);
      toast({
        title: "Event attendance added",
        description: "Event attendance has been successfully recorded.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add attendance",
        description: error.message || "Failed to add event attendance",
        variant: "destructive",
      });
    },
  });

  // Fetch attendance-based XP calculation
  const { data: attendanceXP } = useQuery({
    queryKey: ["/api/characters", characterId!, "attendance-xp"],
    enabled: isOpen && !!characterId,
    staleTime: 0,
  });

  // Admin remove experience entry mutation
  const removeExperienceEntryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const response = await apiRequest("DELETE", `/api/experience/${entryId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId!] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId!, "experience"] });
      toast({
        title: "Experience entry removed",
        description: "The experience entry has been successfully removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove entry",
        description: error.message || "Failed to remove experience entry",
        variant: "destructive",
      });
    },
  });

  // Admin skill management mutations
  const adminAddSkillMutation = useMutation({
    mutationFn: async (data: { skill: string; cost: number }) => {
      const response = await apiRequest("POST", `/api/characters/${characterId}/admin/add-skill`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId!] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId!, "experience"] });
      setSelectedAdminSkill("");
      toast({
        title: "Skill added (Admin)",
        description: "The skill has been added to the character and XP totals updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Admin add skill failed",
        description: error.message || "Failed to add skill",
        variant: "destructive",
      });
    },
  });

  const adminRemoveSkillMutation = useMutation({
    mutationFn: async (data: { skill: string; cost: number }) => {
      const response = await apiRequest("POST", `/api/characters/${characterId}/admin/remove-skill`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId!] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId!, "experience"] });
      setSelectedRemoveSkill("");
      toast({
        title: "Skill removed (Admin)",
        description: "The skill has been removed from the character and XP totals updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Admin remove skill failed",
        description: error.message || "Failed to remove skill",
        variant: "destructive",
      });
    },
  });

  const purchaseSecondArchetypeMutation = useMutation({
    mutationFn: async (data: { archetype: string }) => {
      const response = await apiRequest("POST", `/api/characters/${characterId}/second-archetype`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId!] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId!, "experience"] });
      setSelectedSecondArchetype("");
      toast({
        title: "Second archetype purchased!",
        description: "Your character now has access to skills from both archetypes.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase failed",
        description: error.message || "Failed to purchase second archetype",
        variant: "destructive",
      });
    },
  });

  if (!characterId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {characterLoading ? (
              <Skeleton className="h-6 w-48" />
            ) : (
(character as any)?.name || "Character Sheet"
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {characterLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : character ? (
              <>
                {/* Character Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <User className="h-5 w-5" />
                        <span>Character Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Character Name</p>
                        <p className="text-lg font-semibold">{(character as any).name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Player</p>
                        <div className="flex items-center gap-2">
                          <span>{(character as any).playerName}</span>
                          {(character as any).playerTitle && (
                            <Badge variant="secondary" className="text-xs">
                              {(character as any).playerTitle}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{((character as any).heritage.charAt(0).toUpperCase() + (character as any).heritage.slice(1).replace(/-/g, ' '))}</Badge>
                        <Badge variant="outline">{((character as any).culture.charAt(0).toUpperCase() + (character as any).culture.slice(1).replace(/-/g, ' '))}</Badge>
                        <Badge variant="outline">{((character as any).archetype.charAt(0).toUpperCase() + (character as any).archetype.slice(1).replace(/-/g, ' '))}</Badge>
                        {(character as any).secondArchetype && (
                          <Badge variant="default" className="bg-purple-600">
                            {((character as any).secondArchetype.charAt(0).toUpperCase() + (character as any).secondArchetype.slice(1).replace(/-/g, ' '))} (2nd)
                          </Badge>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                        <div className="flex space-x-2">
                          <Badge variant={(character as any).isActive ? "default" : "secondary"}>
                            {(character as any).isActive ? "Active" : "Inactive"}
                          </Badge>
                          {(character as any).isRetired && (
                            <Badge variant="destructive">
                              Retired
                            </Badge>
                          )}
                        </div>
                      </div>
                      {(character as any).isRetired && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Retired</p>
                          <p className="text-sm">{new Date((character as any).retiredAt).toLocaleDateString()}</p>
                          {(character as any).retirementReason && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Reason: {(character as any).retirementReason}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Shield className="h-5 w-5" />
                        <span>Character Statistics</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-primary/10 rounded-lg">
                          <p className="text-3xl font-bold text-primary">{(character as any).body}</p>
                          <p className="text-sm text-muted-foreground">Body</p>
                          {(() => {
                            const heritage = heritages.find((h: DynamicHeritage) => h.id === (character as any).heritage);
                            const startingBody = heritage?.body || 10;
                            const purchasedBody = (character as any).body - startingBody;
                            return (
                              <div className="text-xs text-muted-foreground mt-2 space-y-0.5 border-t pt-2">
                                <div>Starting: {startingBody}</div>
                                {purchasedBody > 0 && <div>Purchased: +{purchasedBody}</div>}
                              </div>
                            );
                          })()}
                        </div>
                        <div className="text-center p-4 bg-accent/10 rounded-lg">
                          <p className="text-3xl font-bold text-accent">{(character as any).stamina}</p>
                          <p className="text-sm text-muted-foreground">Stamina</p>
                          {(() => {
                            const heritage = heritages.find((h: DynamicHeritage) => h.id === (character as any).heritage);
                            const startingStamina = heritage?.stamina || 10;
                            const purchasedStamina = (character as any).stamina - startingStamina;
                            return (
                              <div className="text-xs text-muted-foreground mt-2 space-y-0.5 border-t pt-2">
                                <div>Starting: {startingStamina}</div>
                                {purchasedStamina > 0 && <div>Purchased: +{purchasedStamina}</div>}
                              </div>
                            );
                          })()}
                        </div>
                        <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
                          <p className="text-3xl font-bold text-yellow-600">{(character as any).experience}</p>
                          <p className="text-sm text-muted-foreground">Experience</p>
                        </div>
                        <div className="text-center p-4 bg-green-500/10 rounded-lg">
                          <p className="text-3xl font-bold text-green-600">{(character as any).totalXpSpent || 0}</p>
                          <p className="text-sm text-muted-foreground">XP Spent</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Skills Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-5 w-5" />
                        <span>Skills</span>
                      </div>
                      {(character as any)?.skills?.length > 0 && (
                        <Badge variant="secondary">
                          {(character as any).skills.length} skill{(character as any).skills.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(character as any)?.skills?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {(character as any).skills.map((skill: string, index: number) => {
                          const skillData = getSkillCostForCharacter(skill, (character as any).heritage, (character as any).archetype, (character as any).secondArchetype);
                          return (
                            <Badge
                              key={index}
                              variant={skillData.category === 'primary' ? 'default' : skillData.category === 'secondary' ? 'secondary' : 'outline'}
                              className="text-sm"
                            >
                              {skill}
                              <span className="ml-1 text-xs opacity-70">({skillData.cost} XP)</span>
                            </Badge>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                        <p className="text-muted-foreground">No skills learned yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          All characters start with Weapon Proficiency (Unarmed) and Weapon Proficiency (Small)
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Experience Point Summary for All Users */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="h-5 w-5 text-yellow-600" />
                      <span>Experience Points</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg border">
                        <p className="text-2xl font-bold text-yellow-600">{(character as any).experience}</p>
                        <p className="text-sm text-muted-foreground">Available XP</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border">
                        <p className="text-2xl font-bold text-green-600">{(character as any).totalXpSpent || 0}</p>
                        <p className="text-sm text-muted-foreground">Total XP Spent</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border">
                        <p className="text-2xl font-bold text-blue-600">{((character as any).experience || 0) + ((character as any).totalXpSpent || 0)}</p>
                        <p className="text-sm text-muted-foreground">Total XP Earned</p>
                      </div>
                    </div>

                    <div className="mt-4 text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                      <p className="font-medium mb-2">Current Experience Point Costs:</p>
                      <p>• Primary Skills: 5 XP (Archetype primary skills)</p>
                      <p>• Secondary Skills: 10 XP (Heritage secondary skills, archetype secondary skills)</p>
                      <p>• Other Skills: 20 XP (All other skills)</p>
                      <p>• Body/Stamina: Variable XP (1-10 XP per point based on current value)</p>
                      <p>• Second Archetype: 50 XP (Unlocks skills from additional archetype)</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Experience Spending Section - Admin Only */}
                {user?.isAdmin && (character as any)?.experience > 0 && !(character as any)?.isRetired && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Zap className="h-5 w-5" />
                          <span>Spend Experience Points</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowExperienceSpending(!showExperienceSpending)}
                        >
                          {showExperienceSpending ? 'Hide' : 'Show'} Spending Options
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    {showExperienceSpending && (
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Skill Purchase */}
                          <div className="space-y-4">
                            <h4 className="font-medium">Purchase Skills</h4>
                            <div className="space-y-3">
                              <Label htmlFor="skill-select">Select Skill</Label>
                              <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a skill" />
                                </SelectTrigger>
                                <SelectContent>
                                  {skills.filter((skill: DynamicSkill) => !(character as any)?.skills?.some((s: string) => s === skill.name)).map((skill: DynamicSkill) => {
                                    const skillData = getSkillCostForCharacter(skill.name, (character as any).heritage, (character as any).archetype, (character as any).secondArchetype);
                                    return (
                                      <SelectItem key={skill.id} value={skill.name}>
                                        <div className="flex items-center justify-between w-full">
                                          <span>{skill.name}</span>
                                          <Badge
                                            variant={skillData.category === 'primary' ? 'default' : skillData.category === 'secondary' ? 'secondary' : 'outline'}
                                            className="ml-2 text-xs"
                                          >
                                            {skillData.cost} XP
                                          </Badge>
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                              {selectedSkill && (
                                <Button
                                  onClick={() => {
                                    const skillData = getSkillCostForCharacter(selectedSkill, (character as any).heritage, (character as any).archetype, (character as any).secondArchetype);
                                    if (skillData.cost <= (character as any).experience) {
                                      purchaseSkillMutation.mutate({ skill: selectedSkill, cost: skillData.cost });
                                    } else {
                                      toast({
                                        title: "Insufficient Experience",
                                        description: `This skill costs ${skillData.cost} XP, but you only have ${(character as any).experience} XP.`,
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                  disabled={!selectedSkill || purchaseSkillMutation.isPending}
                                  className="w-full"
                                >
                                  {purchaseSkillMutation.isPending ? "Purchasing..." : `Purchase Skill`}
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Attribute Increases */}
                          <div className="space-y-4">
                            <h4 className="font-medium">Increase Attributes</h4>

                            {/* Body */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label>Body (Current: {(character as any)?.body})</Label>
                                <span className="text-sm text-muted-foreground">
                                  {additionalBody > 0 ? `${getAttributeCost((character as any)?.body, additionalBody)} XP` : ''}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setAdditionalBody(Math.max(0, additionalBody - 1))}
                                  disabled={additionalBody === 0}
                                  className="h-8 w-8 p-0"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="text-lg font-mono w-12 text-center">{additionalBody}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const newCost = getAttributeCost((character as any)?.body, additionalBody + 1);
                                    if (newCost <= (character as any)?.experience) {
                                      setAdditionalBody(additionalBody + 1);
                                    }
                                  }}
                                  disabled={getAttributeCost((character as any)?.body, additionalBody + 1) > (character as any)?.experience}
                                  className="h-8 w-8 p-0"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              {additionalBody > 0 && (
                                <Button
                                  onClick={() => {
                                    const cost = getAttributeCost((character as any)?.body, additionalBody);
                                    increaseAttributeMutation.mutate({ 
                                      attribute: 'body', 
                                      amount: additionalBody, 
                                      cost 
                                    });
                                  }}
                                  disabled={increaseAttributeMutation.isPending}
                                  size="sm"
                                  className="w-full"
                                >
                                  {increaseAttributeMutation.isPending ? "Increasing..." : `Increase Body (+${additionalBody})`}
                                </Button>
                              )}
                            </div>

                            {/* Stamina */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label>Stamina (Current: {(character as any)?.stamina})</Label>
                                <span className="text-sm text-muted-foreground">
                                  {additionalStamina > 0 ? `${getAttributeCost((character as any)?.stamina, additionalStamina)} XP` : ''}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setAdditionalStamina(Math.max(0, additionalStamina - 1))}
                                  disabled={additionalStamina === 0}
                                  className="h-8 w-8 p-0"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="text-lg font-mono w-12 text-center">{additionalStamina}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const newCost = getAttributeCost((character as any)?.stamina, additionalStamina + 1);
                                    if (newCost <= (character as any)?.experience) {
                                      setAdditionalStamina(additionalStamina + 1);
                                    }
                                  }}
                                  disabled={getAttributeCost((character as any)?.stamina, additionalStamina + 1) > (character as any)?.experience}
                                  className="h-8 w-8 p-0"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              {additionalStamina > 0 && (
                                <Button
                                  onClick={() => {
                                    const cost = getAttributeCost((character as any)?.stamina, additionalStamina);
                                    increaseAttributeMutation.mutate({ 
                                      attribute: 'stamina', 
                                      amount: additionalStamina, 
                                      cost 
                                    });
                                  }}
                                  disabled={increaseAttributeMutation.isPending}
                                  size="sm"
                                  className="w-full"
                                >
                                  {increaseAttributeMutation.isPending ? "Increasing..." : `Increase Stamina (+${additionalStamina})`}
                                </Button>
                              )}
                            </div>

                            {/* Second Archetype Purchase */}
                            {!(character as any).secondArchetype && (
                              <div className="space-y-3 border-t pt-4">
                                <h4 className="font-medium">Purchase Second Archetype (50 XP)</h4>
                                <p className="text-sm text-muted-foreground">
                                  Gain access to skills from a second archetype with improved cost priority.
                                </p>
                                <div className="space-y-3">
                                  <Label htmlFor="second-archetype-select">Select Second Archetype</Label>
                                  <Select value={selectedSecondArchetype} onValueChange={setSelectedSecondArchetype}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Choose a second archetype" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {archetypes.filter((archetype: DynamicArchetype) => archetype.id !== (character as any).archetype).map((archetype: DynamicArchetype) => (
                                        <SelectItem key={archetype.id} value={archetype.id}>
                                          {archetype.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {selectedSecondArchetype && (
                                    <Button
                                      onClick={() => {
                                        if (50 <= (character as any).experience) {
                                          purchaseSecondArchetypeMutation.mutate({ archetype: selectedSecondArchetype });
                                        } else {
                                          toast({
                                            title: "Insufficient Experience",
                                            description: `A second archetype costs 50 XP, but you only have ${(character as any).experience} XP.`,
                                            variant: "destructive",
                                          });
                                        }
                                      }}
                                      disabled={!selectedSecondArchetype || purchaseSecondArchetypeMutation.isPending || 50 > (character as any).experience}
                                      className="w-full"
                                    >
                                      {purchaseSecondArchetypeMutation.isPending ? "Purchasing..." : `Purchase Second Archetype (50 XP)`}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                          <p className="font-medium mb-2">Experience Point Costs:</p>
                          <p>• Primary Skills: 5 XP (Archetype primary skills)</p>
                          <p>• Secondary Skills: 10 XP (Heritage secondary skills, archetype secondary skills)</p>
                          <p>• Other Skills: 20 XP (All other skills)</p>
                          <p>• Body/Stamina: Variable XP (1-10 XP per point based on current value)</p>
                          <p>• Second Archetype: 50 XP (Unlocks skills from additional archetype)</p>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )}



                {/* Admin Skill Management */}
                {user?.isAdmin && (
                  <Card className="border-blue-200 dark:border-blue-800">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-400">
                          <Settings className="h-5 w-5" />
                          <span>Admin: Skill Management</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAdminSkills(!showAdminSkills)}
                        >
                          {showAdminSkills ? 'Hide' : 'Show'} Admin Controls
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    {showAdminSkills && (
                      <CardContent className="space-y-6">
                        {/* XP Totals Display */}
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                          <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-3">Experience Point Summary</h4>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <p className="text-2xl font-bold text-yellow-600">{(character as any).experience}</p>
                              <p className="text-sm text-muted-foreground">Available XP</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-green-600">{(character as any).totalXpSpent || 0}</p>
                              <p className="text-sm text-muted-foreground">Total XP Spent</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-blue-600">{((character as any).experience || 0) + ((character as any).totalXpSpent || 0)}</p>
                              <p className="text-sm text-muted-foreground">Total XP Earned</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Add Skills */}
                          <div className="space-y-4">
                            <h4 className="font-medium text-blue-700 dark:text-blue-400">Add Skills (Admin)</h4>
                            <div className="space-y-3">
                              <Label htmlFor="admin-skill-select">Select Skill to Add</Label>
                              <Select value={selectedAdminSkill} onValueChange={setSelectedAdminSkill}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a skill" />
                                </SelectTrigger>
                                <SelectContent>
                                  {skills.filter((skill: DynamicSkill) => !(character as any)?.skills?.some((s: string) => s === skill.name)).map((skill: DynamicSkill) => {
                                    const skillData = getSkillCostForCharacter(skill.name, (character as any).heritage, (character as any).archetype, (character as any).secondArchetype);
                                    return (
                                      <SelectItem key={skill.id} value={skill.name}>
                                        <div className="flex items-center justify-between w-full">
                                          <span>{skill.name}</span>
                                          <Badge
                                            variant={skillData.category === 'primary' ? 'default' : skillData.category === 'secondary' ? 'secondary' : 'outline'}
                                            className="ml-2 text-xs"
                                          >
                                            {skillData.cost} XP
                                          </Badge>
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                              {selectedAdminSkill && (
                                <Button
                                  onClick={() => {
                                    const skillData = getSkillCostForCharacter(selectedAdminSkill, (character as any).heritage, (character as any).archetype, (character as any).secondArchetype);
                                    adminAddSkillMutation.mutate({ skill: selectedAdminSkill, cost: skillData.cost });
                                  }}
                                  disabled={!selectedAdminSkill || adminAddSkillMutation.isPending}
                                  className="w-full"
                                  variant="outline"
                                >
                                  {adminAddSkillMutation.isPending ? "Adding..." : `Add Skill (Admin)`}
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Remove Skills */}
                          <div className="space-y-4">
                            <h4 className="font-medium text-blue-700 dark:text-blue-400">Remove Skills (Admin)</h4>
                            <div className="space-y-3">
                              <Label htmlFor="admin-remove-skill-select">Select Skill to Remove</Label>
                              <Select value={selectedRemoveSkill} onValueChange={setSelectedRemoveSkill}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a skill to remove" />
                                </SelectTrigger>
                                <SelectContent>
                                  {((character as any)?.skills || []).map((skill: string) => {
                                    const skillData = getSkillCostForCharacter(skill, (character as any).heritage, (character as any).archetype, (character as any).secondArchetype);
                                    return (
                                      <SelectItem key={skill} value={skill}>
                                        <div className="flex items-center justify-between w-full">
                                          <span>{skill}</span>
                                          <Badge
                                            variant={skillData.category === 'primary' ? 'default' : skillData.category === 'secondary' ? 'secondary' : 'outline'}
                                            className="ml-2 text-xs"
                                          >
                                            -{skillData.cost} XP
                                          </Badge>
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                              {selectedRemoveSkill && (
                                <Button
                                  onClick={() => {
                                    const skillData = getSkillCostForCharacter(selectedRemoveSkill, (character as any).heritage, (character as any).archetype, (character as any).secondArchetype);
                                    adminRemoveSkillMutation.mutate({ skill: selectedRemoveSkill, cost: skillData.cost });
                                  }}
                                  disabled={!selectedRemoveSkill || adminRemoveSkillMutation.isPending}
                                  className="w-full"
                                  variant="destructive"
                                >
                                  {adminRemoveSkillMutation.isPending ? "Removing..." : `Remove Skill (Admin)`}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="font-medium mb-2 text-blue-800 dark:text-blue-300">Admin Notes:</p>
                          <p>• Adding skills will increase Total XP Spent and reduce Available XP</p>
                          <p>• Removing skills will decrease Total XP Spent and increase Available XP</p>
                          <p>• XP costs are calculated based on character's heritage, culture, and archetype</p>
                          <p>• All changes are tracked in the experience history</p>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )}

                {/* Events Attended */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-5 w-5" />
                        <span>Events Attended</span>
                      </div>
                      {user?.isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAddEvent(!showAddEvent)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Event
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {user?.isAdmin && showAddEvent && (
                      <div className="mb-6 p-4 border border-border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                        <h4 className="font-medium mb-3">Add Event Attendance</h4>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="event-select">Select Event</Label>
                            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose an event..." />
                              </SelectTrigger>
                              <SelectContent>
                                {(allEvents as any[])?.map((event: any) => (
                                  <SelectItem key={event.id} value={event.id}>
                                    {event.name} - {new Date(event.eventDate).toLocaleDateString()}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="xp-amount">Experience Points Awarded</Label>
                            <div className="space-y-2">
                              <Input
                                id="xp-amount"
                                type="number"
                                min="0"
                                max="20"
                                value={xpAmount}
                                onChange={(e) => setXpAmount(parseInt(e.target.value) || 0)}
                              />
                              <div className="text-sm text-muted-foreground">
                                <div>Base XP by attendance: {(attendanceXP as any)?.attendanceXP || 0} XP</div>
                                <div className="text-xs">
                                  • 1st event: 3 XP • 2nd event: 4 XP • 3rd event: 5 XP • 4+ events: 6 XP each
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => {
                                if (selectedEvent && xpAmount > 0) {
                                  const event = (allEvents as any[])?.find(e => e.id === selectedEvent);
                                  addEventAttendanceMutation.mutate({
                                    eventId: selectedEvent,
                                    xpAmount,
                                    reason: `Event attendance: ${event?.name}`,
                                  });
                                }
                              }}
                              disabled={!selectedEvent || xpAmount <= 0 || addEventAttendanceMutation.isPending}
                            >
                              {addEventAttendanceMutation.isPending ? "Adding..." : "Add Attendance"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowAddEvent(false);
                                setSelectedEvent("");
                                setXpAmount(3);
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {experienceLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center space-x-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-3 w-2/3" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : experienceHistory && (experienceHistory as any[]).filter((entry: any) => entry.event).length > 0 ? (
                      <div className="space-y-4">
                        {(experienceHistory as any[])
                          .filter((entry: any) => entry.event)
                          .map((entry: any) => (
                            <div
                              key={entry.id}
                              className="flex items-start space-x-4 p-4 border border-border rounded-lg"
                            >
                              <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <MapPin className="h-5 w-5 text-green-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium">
                                    {entry.event.name}
                                  </p>
                                  <div className="flex items-center space-x-2">
                                    <Badge variant="outline">
                                      {entry.amount > 0 ? '+' : ''}{entry.amount} XP
                                    </Badge>
                                    {user?.isAdmin && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                        onClick={() => removeExperienceEntryMutation.mutate(entry.id)}
                                        disabled={removeExperienceEntryMutation.isPending}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {entry.reason}
                                </p>
                                <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-2">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    {new Date(entry.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MapPin className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                        <p className="text-muted-foreground">No events attended yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Experience History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="h-5 w-5" />
                      <span>Experience History</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {experienceLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center space-x-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-3 w-2/3" />
                            </div>
                            <Skeleton className="h-6 w-16" />
                          </div>
                        ))}
                      </div>
                    ) : experienceHistory && (experienceHistory as any[]).length > 0 ? (
                      <div className="space-y-4">
                        {(experienceHistory as any[]).map((entry: any) => (
                          <div
                            key={entry.id}
                            className="flex items-start space-x-4 p-4 border border-border rounded-lg"
                          >
                            <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <Zap className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">
                                  {entry.amount > 0 ? '+' : ''}{entry.amount} Experience Points
                                </p>
                                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    {new Date(entry.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {entry.reason}
                              </p>
                              {entry.event && (
                                <Badge variant="outline" className="mt-2">
                                  {entry.event.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Zap className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                        <p className="text-muted-foreground">No experience awarded yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Character Creation Date */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Character created</span>
                      <span>{new Date((character as any).createdAt).toLocaleDateString()}</span>
                    </div>
                    {(character as any).updatedAt !== (character as any).createdAt && (
                      <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                        <span>Last updated</span>
                        <span>{new Date((character as any).updatedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Character Retirement Section - Moved to Bottom */}
                {user && ((character as any)?.userId === user.id || user.isAdmin) && !(character as any)?.isRetired && (
                  <Card className="border-red-200 dark:border-red-800">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-red-700 dark:text-red-400">
                        <UserX className="h-5 w-5" />
                        <span>Retire Character</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <p className="font-medium text-red-800 dark:text-red-300 mb-2">
                              Warning: This action cannot be undone
                            </p>
                            <p className="text-red-700 dark:text-red-400">
                              Retiring a character will make them permanently unusable. The character will remain in the system for record-keeping but cannot participate in events or gain experience.
                            </p>
                          </div>
                        </div>
                      </div>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="w-full">
                            <UserX className="h-4 w-4 mr-2" />
                            Retire Character
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Retire Character: {(character as any)?.name}</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently retire the character. They will no longer be able to participate in events or spend experience points. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="space-y-3">
                            <Label htmlFor="retirement-reason">Reason for retirement (required)</Label>
                            <Textarea
                              id="retirement-reason"
                              placeholder="Enter the reason for retiring this character..."
                              value={retirementReason}
                              onChange={(e) => setRetirementReason(e.target.value)}
                              className="min-h-[100px]"
                            />
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setRetirementReason("")}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                if (retirementReason.trim()) {
                                  retireCharacterMutation.mutate({ reason: retirementReason.trim() });
                                } else {
                                  toast({
                                    title: "Retirement reason required",
                                    description: "Please provide a reason for retiring this character.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              disabled={retireCharacterMutation.isPending || !retirementReason.trim()}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {retireCharacterMutation.isPending ? "Retiring..." : "Retire Character"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Character not found</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}