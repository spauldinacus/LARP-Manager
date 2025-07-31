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
import { Calendar, User, Shield, Zap, BookOpen, Plus, Minus, UserX, AlertTriangle, Settings } from "lucide-react";
import { SKILLS, HERITAGES, CULTURES, ARCHETYPES, type Heritage, type Skill } from "@/lib/constants";
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

export default function CharacterSheetModal({
  isOpen,
  onClose,
  characterId,
}: CharacterSheetModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showExperienceSpending, setShowExperienceSpending] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [additionalBody, setAdditionalBody] = useState(0);
  const [additionalStamina, setAdditionalStamina] = useState(0);
  const [retirementReason, setRetirementReason] = useState("");
  const [showAdminSkills, setShowAdminSkills] = useState(false);
  const [selectedAdminSkill, setSelectedAdminSkill] = useState("");
  const [selectedRemoveSkill, setSelectedRemoveSkill] = useState("");

  // Fetch character details
  const { data: character, isLoading: characterLoading } = useQuery({
    queryKey: ["/api/characters", characterId],
    enabled: isOpen && !!characterId,
  });

  // Fetch character experience history
  const { data: experienceHistory, isLoading: experienceLoading } = useQuery({
    queryKey: ["/api/characters", characterId, "experience"],
    enabled: isOpen && !!characterId,
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

  // Helper function to get skill cost
  const getSkillCost = (skill: Skill, heritage: string, culture: string, archetype: string): { cost: number; category: 'primary' | 'secondary' | 'other' } => {
    const heritageData = HERITAGES.find(h => h.id === heritage);
    const cultureData = culture ? CULTURES[heritage as Heritage]?.find(c => c.id === culture) : null;
    const archetypeData = ARCHETYPES.find(a => a.id === archetype);

    const skillString = String(skill);

    // Check if skill is primary for any of the selected options  
    const heritageSecondarySkills = heritageData?.secondarySkills || [];
    const culturePrimarySkills = cultureData?.primarySkills || [];
    const archetypePrimarySkills = archetypeData?.primarySkills || [];
    
    if (
      heritageSecondarySkills.some(s => s === skillString) ||
      culturePrimarySkills.some(s => s === skillString) ||
      archetypePrimarySkills.some(s => s === skillString)
    ) {
      return { cost: 5, category: 'primary' };
    }

    // Check if skill is secondary for any of the selected options
    const cultureSecondarySkills = cultureData?.secondarySkills || [];
    const archetypeSecondarySkills = archetypeData?.secondarySkills || [];
    
    if (
      cultureSecondarySkills.some(s => s === skillString) ||
      archetypeSecondarySkills.some(s => s === skillString)
    ) {
      return { cost: 10, category: 'secondary' };
    }

    // Otherwise it's a general skill
    return { cost: 20, category: 'other' };
  };

  // Mutations for spending experience
  const purchaseSkillMutation = useMutation({
    mutationFn: async (data: { skill: string; cost: number }) => {
      const response = await apiRequest("POST", `/api/characters/${characterId}/purchase-skill`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId, "experience"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId, "experience"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId] });
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

  // Admin skill management mutations
  const adminAddSkillMutation = useMutation({
    mutationFn: async (data: { skill: string; cost: number }) => {
      const response = await apiRequest("POST", `/api/admin/characters/${characterId}/add-skill`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId, "experience"] });
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
      const response = await apiRequest("POST", `/api/admin/characters/${characterId}/remove-skill`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId, "experience"] });
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
                        <p>{(character as any).playerName}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Badge variant="outline">{((character as any).heritage.charAt(0).toUpperCase() + (character as any).heritage.slice(1).replace(/-/g, ' '))}</Badge>
                        <Badge variant="outline">{((character as any).culture.charAt(0).toUpperCase() + (character as any).culture.slice(1).replace(/-/g, ' '))}</Badge>
                        <Badge variant="outline">{((character as any).archetype.charAt(0).toUpperCase() + (character as any).archetype.slice(1).replace(/-/g, ' '))}</Badge>
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
                            const heritage = HERITAGES.find(h => h.id === (character as any).heritage);
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
                            const heritage = HERITAGES.find(h => h.id === (character as any).heritage);
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
                          const skillData = getSkillCost(skill as Skill, (character as any).heritage, (character as any).culture, (character as any).archetype);
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

                {/* Experience Spending Section */}
                {user && ((character as any)?.userId === user.id || user.isAdmin) && (character as any)?.experience > 0 && !(character as any)?.isRetired && (
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
                                  {SKILLS.filter(skill => !(character as any)?.skills?.includes(skill)).map((skill) => {
                                    const skillData = getSkillCost(skill, (character as any).heritage, (character as any).culture, (character as any).archetype);
                                    return (
                                      <SelectItem key={skill} value={skill}>
                                        <div className="flex items-center justify-between w-full">
                                          <span>{skill}</span>
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
                                    const skillData = getSkillCost(selectedSkill as Skill, (character as any).heritage, (character as any).culture, (character as any).archetype);
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
                          </div>
                        </div>

                        <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                          <p className="font-medium mb-2">Experience Point Costs:</p>
                          <p>• Primary Skills: 5 XP (Heritage secondary, Culture/Archetype primary)</p>
                          <p>• Secondary Skills: 10 XP (Culture/Archetype secondary)</p>
                          <p>• Other Skills: 20 XP (All other skills)</p>
                          <p>• Body/Stamina: Variable XP (1-10 XP per point based on current value)</p>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )}

                {/* Character Retirement Section */}
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
                                  {SKILLS.filter(skill => !(character as any)?.skills?.includes(skill)).map((skill) => {
                                    const skillData = getSkillCost(skill, (character as any).heritage, (character as any).culture, (character as any).archetype);
                                    return (
                                      <SelectItem key={skill} value={skill}>
                                        <div className="flex items-center justify-between w-full">
                                          <span>{skill}</span>
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
                                    const skillData = getSkillCost(selectedAdminSkill as Skill, (character as any).heritage, (character as any).culture, (character as any).archetype);
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
                                    const skillData = getSkillCost(skill as Skill, (character as any).heritage, (character as any).culture, (character as any).archetype);
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
                                    const skillData = getSkillCost(selectedRemoveSkill as Skill, (character as any).heritage, (character as any).culture, (character as any).archetype);
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
                                  +{entry.amount} Experience Points
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
