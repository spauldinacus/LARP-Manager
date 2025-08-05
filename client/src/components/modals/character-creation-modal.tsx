import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
// Removed static cost logic import; will use local functions for attribute cost
// Attribute cost calculation logic (matches backend)
function getAttributeCost(currentValue: number, points: number = 1): number {
  let totalCost = 0;
  for (let i = 0; i < points; i++) {
    const valueAtThisStep = currentValue + i;
    if (valueAtThisStep < 20) totalCost += 1;
    else if (valueAtThisStep < 40) totalCost += 2;
    else if (valueAtThisStep < 60) totalCost += 3;
    else if (valueAtThisStep < 80) totalCost += 4;
    else if (valueAtThisStep < 100) totalCost += 5;
    else if (valueAtThisStep < 120) totalCost += 6;
    else if (valueAtThisStep < 140) totalCost += 7;
    else if (valueAtThisStep < 160) totalCost += 8;
    else if (valueAtThisStep < 180) totalCost += 9;
    else totalCost += 10;
  }
  return totalCost;
}

function calculateAttributePurchaseCost(baseBody: number, baseStamina: number, currentBody: number, currentStamina: number): number {
  let totalCost = 0;
  if (currentBody > baseBody) {
    for (let i = baseBody; i < currentBody; i++) {
      totalCost += getAttributeCost(i, 1);
    }
  }
  if (currentStamina > baseStamina) {
    for (let i = baseStamina; i < currentStamina; i++) {
      totalCost += getAttributeCost(i, 1);
    }
  }
  return totalCost;
}
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Zap, User, Mountain, Leaf, Moon, Loader2, Plus, Minus } from "lucide-react";

const characterSchema = z.object({
  name: z.string().min(1, "Character name is required"),
  playerName: z.string().min(1, "Player name is required"),
  heritage: z.string().min(1, "Heritage is required"),
  culture: z.string().min(1, "Culture is required"),
  archetype: z.string().min(1, "Archetype is required"),
  selectedSkills: z.array(z.string()).default([]),
});

type CharacterForm = z.infer<typeof characterSchema>;

interface SelectedSkill {
  id: string;
  name: string;
  cost: number;
  category: 'primary' | 'secondary' | 'other';
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

interface DynamicCulture {
  id: string;
  name: string;
  heritageId: string;
  heritageName: string;
  description?: string;
  secondarySkills?: DynamicSkill[];
}

interface DynamicArchetype {
  id: string;
  name: string;
  description?: string;
  primarySkills?: DynamicSkill[];
  secondarySkills?: DynamicSkill[];
}

interface CharacterCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const heritageIcons = {
  "ar-nura": Zap,
  human: User,
  stoneborn: Mountain,
  ughol: Leaf,
  rystarri: Moon,
};

export default function CharacterCreationModal({
  isOpen,
  onClose,
}: CharacterCreationModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedHeritage, setSelectedHeritage] = useState<DynamicHeritage | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);
  const [availableExperience, setAvailableExperience] = useState(25);
  const [additionalBody, setAdditionalBody] = useState(0);
  const [additionalStamina, setAdditionalStamina] = useState(0);

  // Fetch dynamic game data
  const { data: skills = [], isLoading: skillsLoading } = useQuery({
    queryKey: ["/api/admin?type=skills"],
    enabled: isOpen,
  });

  const { data: heritages = [], isLoading: heritagesLoading } = useQuery<DynamicHeritage[]>({
    queryKey: ["/api/admin?type=heritages"],
    enabled: isOpen,
    staleTime: 0,
  });

  const { data: cultures = [], isLoading: culturesLoading } = useQuery<DynamicCulture[]>({
    queryKey: ["/api/admin?type=cultures"],
    enabled: isOpen,
    staleTime: 0,
  });

  const { data: archetypes = [], isLoading: archetypesLoading } = useQuery<DynamicArchetype[]>({
    queryKey: ["/api/admin?type=archetypes"],
    enabled: isOpen,
    staleTime: 0,
  });

  const form = useForm<CharacterForm>({
    resolver: zodResolver(characterSchema),
    defaultValues: {
      name: "",
      playerName: user?.username || "",
      heritage: "",
      culture: "",
      archetype: "",
      selectedSkills: [],
    },
  });

  // Get heritage base values for attributes from dynamic heritage data only
  const getHeritageBaseValues = (heritageId: string) => {
    const heritage = heritages.find((h: DynamicHeritage) => h.id === heritageId);
    return heritage ? { body: heritage.body, stamina: heritage.stamina } : { body: 10, stamina: 10 };
  };

  // Calculate skill cost dynamically based on selected heritage and archetype
  const getSkillCostForCharacter = (skill: DynamicSkill, heritageId: string, archetypeId: string): { cost: number; category: 'primary' | 'secondary' | 'other' } => {
    const selectedHeritage = heritages.find((h: DynamicHeritage) => h.id === heritageId);
    const selectedArchetype = archetypes.find((a: DynamicArchetype) => a.id === archetypeId);

    // Check if skill is an archetype primary skill (highest priority - 5 XP)
    if (selectedArchetype?.primarySkills?.some(s => s.id === skill.id)) {
      return { cost: 5, category: 'primary' };
    }

    // Check if skill is a heritage secondary skill OR archetype secondary skill (10 XP)
    if (selectedHeritage?.secondarySkills?.some(s => s.id === skill.id) || 
        selectedArchetype?.secondarySkills?.some(s => s.id === skill.id)) {
      return { cost: 10, category: 'secondary' };
    }

    // Default cost for all other skills (20 XP)
    return { cost: 20, category: 'other' };
  };

  // Check if skill prerequisites are met
  const hasPrerequisites = (skill: DynamicSkill): boolean => {
    if (!skill.prerequisiteSkillId) return true;
    return selectedSkills.some(s => s.id === skill.prerequisiteSkillId);
  };

  const addSkill = (skill: DynamicSkill) => {
    const heritage = form.watch("heritage");
    const culture = form.watch("culture");
    const archetype = form.watch("archetype");

    if (!heritage || !archetype) {
      toast({
        title: "Selection Required",
        description: "Please select heritage and archetype before adding skills.",
        variant: "destructive",
      });
      return;
    }

    // Check prerequisites
    if (!hasPrerequisites(skill)) {
      const prerequisiteSkill = skills.find((s: DynamicSkill) => s.id === skill.prerequisiteSkillId);
      toast({
        title: "Prerequisite Required",
        description: `This skill requires "${prerequisiteSkill?.name}" to be learned first.`,
        variant: "destructive",
      });
      return;
    }

    const skillData = getSkillCostForCharacter(skill, heritage, archetype);

    if (skillData.cost > availableExperience) {
      toast({
        title: "Insufficient Experience",
        description: `This skill costs ${skillData.cost} XP, but you only have ${availableExperience} XP remaining.`,
        variant: "destructive",
      });
      return;
    }

    if (selectedSkills.some(s => s.id === skill.id)) {
      toast({
        title: "Skill Already Selected",
        description: "This skill has already been added to your character.",
        variant: "destructive",
      });
      return;
    }

    const newSkill: SelectedSkill = {
      id: skill.id,
      name: skill.name,
      cost: skillData.cost,
      category: skillData.category,
    };

    setSelectedSkills([...selectedSkills, newSkill]);
    form.setValue("selectedSkills", [...selectedSkills, newSkill].map(s => s.id));
  };

  const removeSkill = (skillId: string) => {
    const skillToRemove = selectedSkills.find(s => s.id === skillId);
    if (!skillToRemove) return;

    const updatedSkills = selectedSkills.filter(s => s.id !== skillId);
    setSelectedSkills(updatedSkills);
    form.setValue("selectedSkills", updatedSkills.map(s => s.id));
  };

  // Calculate used experience from selected skills only
  const usedExperience = selectedSkills.reduce((total, skill) => {
    return total + skill.cost; // Use the cost already calculated and stored when skill was added
  }, 0);

  // Get base body/stamina from heritage using centralized values
  const watchedHeritage = form.watch("heritage");
  const heritageBaseValues = getHeritageBaseValues(watchedHeritage);
  const baseBody = heritageBaseValues.body;
  const baseStamina = heritageBaseValues.stamina;

  // Calculate attribute costs based on incremental cost from current values
  const totalAttributeCost = calculateAttributePurchaseCost(baseBody, baseStamina, baseBody + additionalBody, baseStamina + additionalStamina);

  // Update available experience when skills, attributes, or selections change
  useEffect(() => {
    const remaining = 25 - (usedExperience || 0) - (totalAttributeCost || 0);
    setAvailableExperience(Math.max(0, remaining)); // Ensure it's never negative or NaN
  }, [usedExperience, totalAttributeCost]);

  const createCharacterMutation = useMutation({
    mutationFn: async (data: CharacterForm) => {
      const heritageValues = getHeritageBaseValues(data.heritage);

      const characterData = {
        ...data,
        body: heritageValues.body + additionalBody,
        stamina: heritageValues.stamina + additionalStamina,
        experience: 25, // Start with full 25 XP - server will calculate total spent
        skills: selectedSkills.map(s => s.id), // Add selected skill IDs
      };

      const response = await apiRequest("POST", "/api/characters", characterData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin?type=stats"] });
      toast({
        title: "Character created!",
        description: "Your character has been successfully created.",
      });
      onClose();
      form.reset();
      setSelectedSkills([]);
      setAdditionalBody(0);
      setAdditionalStamina(0);
      setAvailableExperience(25);
    },
    onError: (error: Error) => {
      toast({
        title: "Creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CharacterForm) => {
    createCharacterMutation.mutate(data);
  };

  const watchedCulture = form.watch("culture");
  const watchedArchetype = form.watch("archetype");
  const availableCultures = watchedHeritage 
    ? cultures.filter((c: DynamicCulture) => c.heritageId === watchedHeritage) 
    : [];
  const selectedCultureData = availableCultures.find((c: DynamicCulture) => c.id === watchedCulture);
  const selectedArchetypeData = archetypes.find((a: DynamicArchetype) => a.id === watchedArchetype);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Character</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">Character Name</Label>
              <Input
                id="name"
                placeholder="Enter character name"
                {...form.register("name")}
                className={form.formState.errors.name ? "border-destructive" : ""}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="playerName">Player Name</Label>
              <Input
                id="playerName"
                placeholder="Enter player name"
                {...form.register("playerName")}
                className={form.formState.errors.playerName ? "border-destructive" : ""}
              />
              {form.formState.errors.playerName && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.playerName.message}
                </p>
              )}
            </div>
          </div>

          {/* Heritage Selection */}
          <div>
            <Label className="text-base font-medium mb-3 block">Heritage</Label>
            {heritagesLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Loading heritages...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {heritages.map((heritage: DynamicHeritage) => {
                const Icon = heritageIcons[heritage.icon as keyof heritageIcons] || User;
                const isSelected = form.watch("heritage") === heritage.id;

                return (
                  <Card
                    key={heritage.id}
                    className={cn(
                      "p-4 cursor-pointer transition-all hover:border-primary",
                      isSelected && "border-primary bg-primary/10"
                    )}
                    onClick={() => {
                      form.setValue("heritage", heritage.id);
                      form.setValue("culture", ""); // Reset culture when heritage changes
                      setSelectedHeritage(heritage);
                    }}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <p className="font-medium">{heritage.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Body: {heritage.body}, Stamina: {heritage.stamina}
                      </p>
                    </div>
                  </Card>
                );
                })}
              </div>
            )}
            {form.formState.errors.heritage && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.heritage.message}
              </p>
            )}
          </div>

          {/* Culture and Archetype */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="culture">Culture</Label>
              <Select
                value={form.watch("culture")}
                onValueChange={(value) => form.setValue("culture", value)}
                disabled={!watchedHeritage || culturesLoading}
              >
                <SelectTrigger className={form.formState.errors.culture ? "border-destructive" : ""}>
                  <SelectValue placeholder={culturesLoading ? "Loading cultures..." : "Select Culture"} />
                </SelectTrigger>
                <SelectContent>
                  {availableCultures.map((culture) => (
                    <SelectItem key={culture.id} value={culture.id}>
                      {culture.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.culture && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.culture.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="archetype">Archetype</Label>
              <Select
                value={form.watch("archetype")}
                onValueChange={(value) => form.setValue("archetype", value)}
                disabled={archetypesLoading}
              >
                <SelectTrigger className={form.formState.errors.archetype ? "border-destructive" : ""}>
                  <SelectValue placeholder={archetypesLoading ? "Loading archetypes..." : "Select Archetype"} />
                </SelectTrigger>
                <SelectContent>
                  {archetypes.map((archetype: DynamicArchetype) => (
                    <SelectItem key={archetype.id} value={archetype.id}>
                      {archetype.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.archetype && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.archetype.message}
                </p>
              )}
            </div>
          </div>

          {/* Character Stats and Skills Display */}
          {watchedHeritage && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-3">Character Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{baseBody + additionalBody}</p>
                    <p className="text-sm text-muted-foreground">Body</p>
                    {additionalBody > 0 && (
                      <p className="text-xs text-green-600">+{additionalBody}</p>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-accent">{baseStamina + additionalStamina}</p>
                    <p className="text-sm text-muted-foreground">Stamina</p>
                    {additionalStamina > 0 && (
                      <p className="text-xs text-green-600">+{additionalStamina}</p>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-500">{availableExperience || 0}</p>
                    <p className="text-sm text-muted-foreground">XP Remaining</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-500">{(usedExperience || 0) + (totalAttributeCost || 0)}</p>
                    <p className="text-sm text-muted-foreground">XP Spent</p>
                  </div>
                </div>
              </div>

              {/* Heritage Details */}
              {(() => {
                const selectedHeritageData = heritages.find((h: DynamicHeritage) => h.id === watchedHeritage);
                return selectedHeritageData ? (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium mb-3">Heritage Details: {selectedHeritageData.name}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Description</p>
                          <p className="text-sm">{selectedHeritageData.description}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Costume Requirements</p>
                          <p className="text-sm">{selectedHeritageData.costumeRequirements}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-green-600">Benefit</p>
                          <p className="text-sm">{selectedHeritageData.benefit}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-600">Weakness</p>
                          <p className="text-sm">{selectedHeritageData.weakness}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-medium text-muted-foreground">Secondary Skills Available</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(selectedHeritageData.secondarySkills || []).map((skill: DynamicSkill, index: number) => (
                          <span key={index} className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Skills */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-3">Starting Skills</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Culture Skills */}
                  {selectedCultureData && (
                    <div>
                      <h5 className="text-sm font-medium text-accent mb-2">Culture: {selectedCultureData.name}</h5>
                      <div className="space-y-1">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Primary Skills</p>
                          <div className="flex flex-wrap gap-1">
                            {(selectedCultureData.primarySkills || []).map((skill: string, index: number) => (
                              <span key={index} className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Secondary Skills</p>
                          <div className="flex flex-wrap gap-1">
                            {(selectedCultureData.secondarySkills || []).map((skill: string, index: number) => (
                              <span key={index} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Archetype Skills */}
                  {selectedArchetypeData && (
                    <div>
                      <h5 className="text-sm font-medium text-yellow-600 mb-2">Archetype: {selectedArchetypeData.name}</h5>
                      <div className="space-y-1">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Primary Skills</p>
                          <div className="flex flex-wrap gap-1">
                            {(selectedArchetypeData.primarySkills || []).map((skill: DynamicSkill, index: number) => (
                              <span key={index} className="text-xs bg-yellow-500/20 text-yellow-600 px-2 py-1 rounded">
                                {skill.name}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Secondary Skills</p>
                          <div className="flex flex-wrap gap-1">
                            {(selectedArchetypeData.secondarySkills || []).map((skill: DynamicSkill, index: number) => (
                              <span key={index} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                                {skill.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Skill Selection */}
          {watchedHeritage && selectedCultureData && selectedArchetypeData && (
            <div className="space-y-4">
              {/* Experience Points Display */}
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Experience Points</h4>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{availableExperience || 0}</p>
                    <p className="text-sm text-muted-foreground">XP Remaining</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>• Primary Skills: 5 XP (Archetype primary skills)</p>
                  <p>• Secondary Skills: 10 XP (Heritage secondary skills, archetype secondary skills)</p>
                  <p>• Other Skills: 20 XP (All other skills)</p>
                  <p>• Body/Stamina: Variable XP (Based on current value - see cost chart below)</p>
                </div>
                {(totalAttributeCost > 0) && (
                  <div className="mt-2 text-sm">
                    <p className="font-medium">Current Spending:</p>
                    <p className="text-muted-foreground">Skills: {usedExperience || 0} XP</p>
                    <p className="text-muted-foreground">Body/Stamina: {totalAttributeCost || 0} XP</p>
                  </div>
                )}
              </div>

              {/* Selected Skills */}
              {selectedSkills.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-3">Selected Skills ({selectedSkills.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSkills.map((skill, index) => (
                      <Badge
                        key={index}
                        variant={skill.category === 'primary' ? 'default' : skill.category === 'secondary' ? 'secondary' : 'outline'}
                        className="flex items-center gap-1"
                      >
                        {skill.name}
                        <span className="text-xs opacity-70">({skill.cost} XP)</span>
                        <button
                          type="button"
                          onClick={() => removeSkill(skill.id)}
                          className="ml-1 text-xs hover:text-destructive"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Skill Selection Interface */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-3">Add Skills</h4>
                <div className="max-h-64 overflow-y-auto">
                  <div className="grid gap-1">
                    {skillsLoading ? (
                      <div className="text-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        Loading skills...
                      </div>
                    ) : (
                      skills.filter((skill: DynamicSkill) => !selectedSkills.some(s => s.id === skill.id)).map((skill: DynamicSkill) => {
                        const heritage = form.watch("heritage");
                        const archetype = form.watch("archetype");
                        const skillData = getSkillCostForCharacter(skill, heritage, archetype);
                        const prerequisitesMet = hasPrerequisites(skill);

                        return (
                          <div
                            key={skill.id}
                            className={`flex items-center justify-between p-2 rounded transition-colors ${
                              prerequisitesMet ? 'hover:bg-muted/70' : 'opacity-50'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{skill.name}</span>
                                <Badge
                                  variant={skillData.category === 'primary' ? 'default' : skillData.category === 'secondary' ? 'secondary' : 'outline'}
                                  className="text-xs"
                                >
                                  {skillData.cost} XP
                                </Badge>
                                {!prerequisitesMet && (
                                  <Badge variant="destructive" className="text-xs">
                                    Prerequisites Required
                                  </Badge>
                                )}
                              </div>
                              {skill.description && (
                                <p className="text-xs text-muted-foreground mt-1">{skill.description}</p>
                              )}
                              {skill.prerequisiteSkillId && (
                                <p className="text-xs text-yellow-600 mt-1">
                                  Requires: {skills.find((s: DynamicSkill) => s.id === skill.prerequisiteSkillId)?.name}
                                </p>
                              )}
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => addSkill(skill)}
                              disabled={skillData.cost > availableExperience || !prerequisitesMet}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Body and Stamina Purchasing */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-3">Increase Body & Stamina</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="body">Body ({baseBody} + {additionalBody} = {baseBody + additionalBody})</Label>
                      <span className="text-sm text-muted-foreground">{bodyCost} XP</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
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
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newValue = additionalBody + 1;
                          const currentBodyValue = baseBody + additionalBody;
                          const singlePointCost = getAttributeCost(currentBodyValue, 1);
                          if (singlePointCost <= availableExperience) {
                            setAdditionalBody(newValue);
                          }
                        }}
                        disabled={getAttributeCost(baseBody + additionalBody, 1) > availableExperience}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="stamina">Stamina ({baseStamina} + {additionalStamina} = {baseStamina + additionalStamina})</Label>
                      <span className="text-sm text-muted-foreground">{staminaCost} XP</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
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
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newValue = additionalStamina + 1;
                          const currentStaminaValue = baseStamina + additionalStamina;
                          const singlePointCost = getAttributeCost(currentStaminaValue, 1);
                          if (singlePointCost <= availableExperience) {
                            setAdditionalStamina(newValue);
                          }
                        }}
                        disabled={getAttributeCost(baseStamina + additionalStamina, 1) > availableExperience}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-sm text-muted-foreground">
                  <p>Body and Stamina cost according to current value: &lt;20 = 1 XP, 21-40 = 2 XP, 41-60 = 3 XP, etc.</p>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex space-x-4 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={createCharacterMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createCharacterMutation.isPending}
            >
              {createCharacterMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Character"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}