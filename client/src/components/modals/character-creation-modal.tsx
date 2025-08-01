import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { getSkillCost, getAttributeCost, HERITAGE_BASES, HERITAGES, CULTURES, ARCHETYPES, SKILLS, type Heritage, type Skill } from "@shared/schema";
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
  name: Skill;
  cost: number;
  category: 'primary' | 'secondary' | 'other';
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
  const [selectedHeritage, setSelectedHeritage] = useState<Heritage | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);
  const [availableExperience, setAvailableExperience] = useState(25);
  const [additionalBody, setAdditionalBody] = useState(0);
  const [additionalStamina, setAdditionalStamina] = useState(0);

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

  // Get heritage base values for attributes
  const getHeritageBaseValues = (heritage: string) => {
    return HERITAGE_BASES[heritage as keyof typeof HERITAGE_BASES] || { body: 10, stamina: 10 };
  };

  // Use the corrected skill cost calculation from shared schema
  const getSkillCostForCharacter = (skill: Skill, heritage: string, archetype: string) => {
    return getSkillCost(String(skill), heritage, archetype);
  };

  const addSkill = (skill: Skill) => {
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

    const skillData = getSkillCostForCharacter(skill, heritage, archetype);
    
    if (skillData.cost > availableExperience) {
      toast({
        title: "Insufficient Experience",
        description: `This skill costs ${skillData.cost} XP, but you only have ${availableExperience} XP remaining.`,
        variant: "destructive",
      });
      return;
    }

    if (selectedSkills.some(s => s.name === skill)) {
      toast({
        title: "Skill Already Selected",
        description: "This skill has already been added to your character.",
        variant: "destructive",
      });
      return;
    }

    const newSkill: SelectedSkill = {
      name: skill,
      cost: skillData.cost,
      category: skillData.category,
    };

    setSelectedSkills([...selectedSkills, newSkill]);
    form.setValue("selectedSkills", [...selectedSkills, newSkill].map(s => s.name));
  };

  const removeSkill = (skill: Skill) => {
    const skillToRemove = selectedSkills.find(s => s.name === skill);
    if (!skillToRemove) return;

    const updatedSkills = selectedSkills.filter(s => s.name !== skill);
    setSelectedSkills(updatedSkills);
    form.setValue("selectedSkills", updatedSkills.map(s => s.name));
  };

  // Calculate used experience including body/stamina costs
  const usedExperience = selectedSkills.reduce((total, skill) => {
    const { heritage, culture, archetype } = form.getValues();
    const { cost } = getSkillCost(skill.name, heritage, culture, archetype);
    return total + cost;
  }, 0);

  // Get base body/stamina from heritage using centralized values
  const watchedHeritage = form.watch("heritage");
  const heritageBaseValues = getHeritageBaseValues(watchedHeritage);
  const baseBody = heritageBaseValues.body;
  const baseStamina = heritageBaseValues.stamina;
  
  // Calculate attribute costs based on incremental cost from current values
  const bodyCost = additionalBody > 0 ? getAttributeCost(baseBody, additionalBody) : 0;
  const staminaCost = additionalStamina > 0 ? getAttributeCost(baseStamina, additionalStamina) : 0;
  const totalAttributeCost = bodyCost + staminaCost;

  // Update available experience when skills, attributes, or selections change
  useEffect(() => {
    setAvailableExperience(25 - usedExperience - totalAttributeCost);
  }, [usedExperience, totalAttributeCost]);

  const createCharacterMutation = useMutation({
    mutationFn: async (data: CharacterForm) => {
      const heritageValues = getHeritageBaseValues(data.heritage);

      const characterData = {
        ...data,
        body: heritageValues.body + additionalBody,
        stamina: heritageValues.stamina + additionalStamina,
        experience: availableExperience, // Remaining experience after skill purchases
        skills: selectedSkills.map(s => s.name), // Add selected skills
      };

      const response = await apiRequest("POST", "/api/characters", characterData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
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
  const availableCultures = watchedHeritage ? CULTURES[watchedHeritage as Heritage] || [] : [];
  const selectedCultureData = availableCultures.find(c => c.id === watchedCulture);
  const selectedArchetypeData = ARCHETYPES.find(a => a.id === watchedArchetype);

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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {HERITAGES.map((heritage) => {
                const Icon = heritageIcons[heritage.id];
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
                disabled={!watchedHeritage}
              >
                <SelectTrigger className={form.formState.errors.culture ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select Culture" />
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
              >
                <SelectTrigger className={form.formState.errors.archetype ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select Archetype" />
                </SelectTrigger>
                <SelectContent>
                  {ARCHETYPES.map((archetype) => (
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
                    <p className="text-2xl font-bold text-yellow-500">{availableExperience}</p>
                    <p className="text-sm text-muted-foreground">XP Remaining</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-500">25</p>
                    <p className="text-sm text-muted-foreground">XP Spent</p>
                  </div>
                </div>
              </div>

              {/* Heritage Details */}
              {(() => {
                const selectedHeritageData = HERITAGES.find(h => h.id === watchedHeritage);
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
                        {selectedHeritageData.secondarySkills.map((skill: string, index: number) => (
                          <span key={index} className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                            {skill}
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
                            {selectedCultureData.primarySkills.map((skill, index) => (
                              <span key={index} className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Secondary Skills</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedCultureData.secondarySkills.map((skill, index) => (
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
                            {selectedArchetypeData.primarySkills.map((skill, index) => (
                              <span key={index} className="text-xs bg-yellow-500/20 text-yellow-600 px-2 py-1 rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Secondary Skills</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedArchetypeData.secondarySkills.map((skill, index) => (
                              <span key={index} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                                {skill}
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
                    <p className="text-2xl font-bold text-blue-600">{availableExperience}</p>
                    <p className="text-sm text-muted-foreground">XP Remaining</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>• Primary Skills: 5 XP (Your heritage secondary skills, culture/archetype primary skills)</p>
                  <p>• Secondary Skills: 10 XP (Culture/archetype secondary skills)</p>
                  <p>• Other Skills: 20 XP (All other skills)</p>
                  <p>• Body/Stamina: Variable XP (Based on current value - see cost chart below)</p>
                </div>
                {(totalAttributeCost > 0) && (
                  <div className="mt-2 text-sm">
                    <p className="font-medium">Current Spending:</p>
                    <p className="text-muted-foreground">Skills: {usedExperience} XP</p>
                    <p className="text-muted-foreground">Body/Stamina: {totalAttributeCost} XP</p>
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
                          onClick={() => removeSkill(skill.name)}
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
                    {SKILLS.filter(skill => !selectedSkills.some(s => s.name === skill)).map((skill) => {
                      const heritage = form.watch("heritage");
                      const archetype = form.watch("archetype");
                      const skillData = getSkillCostForCharacter(skill, heritage, archetype);
                      
                      return (
                        <div
                          key={skill}
                          className="flex items-center justify-between p-2 rounded hover:bg-muted/70 transition-colors"
                        >
                          <div className="flex-1">
                            <span className="text-sm">{skill}</span>
                            <Badge
                              variant={skillData.category === 'primary' ? 'default' : skillData.category === 'secondary' ? 'secondary' : 'outline'}
                              className="ml-2 text-xs"
                            >
                              {skillData.cost} XP
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => addSkill(skill)}
                            disabled={skillData.cost > availableExperience}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
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
