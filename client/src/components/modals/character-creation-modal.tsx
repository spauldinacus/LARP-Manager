import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { HERITAGES, CULTURES, ARCHETYPES, type Heritage } from "@/lib/constants";
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
import { cn } from "@/lib/utils";
import { Zap, User, Mountain, Leaf, Moon, Loader2 } from "lucide-react";

const characterSchema = z.object({
  name: z.string().min(1, "Character name is required"),
  playerName: z.string().min(1, "Player name is required"),
  heritage: z.string().min(1, "Heritage is required"),
  culture: z.string().min(1, "Culture is required"),
  archetype: z.string().min(1, "Archetype is required"),
});

type CharacterForm = z.infer<typeof characterSchema>;

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

  const form = useForm<CharacterForm>({
    resolver: zodResolver(characterSchema),
    defaultValues: {
      name: "",
      playerName: user?.username || "",
      heritage: "",
      culture: "",
      archetype: "",
    },
  });

  const createCharacterMutation = useMutation({
    mutationFn: async (data: CharacterForm) => {
      const heritage = HERITAGES.find(h => h.id === data.heritage);
      if (!heritage) throw new Error("Invalid heritage selected");

      const characterData = {
        ...data,
        body: heritage.body,
        stamina: heritage.stamina,
        experience: 25, // Starting experience per rulebook
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

  const watchedHeritage = form.watch("heritage");
  const watchedCulture = form.watch("culture");
  const watchedArchetype = form.watch("archetype");
  
  const selectedHeritageData = HERITAGES.find(h => h.id === watchedHeritage);
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
          {selectedHeritageData && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-3">Character Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{selectedHeritageData.body}</p>
                    <p className="text-sm text-muted-foreground">Body</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-accent">{selectedHeritageData.stamina}</p>
                    <p className="text-sm text-muted-foreground">Stamina</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-500">25</p>
                    <p className="text-sm text-muted-foreground">Experience</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-500">1</p>
                    <p className="text-sm text-muted-foreground">Level</p>
                  </div>
                </div>
              </div>

              {/* Heritage Details */}
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
                    {selectedHeritageData.secondarySkills.map((skill, index) => (
                      <span key={index} className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

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
