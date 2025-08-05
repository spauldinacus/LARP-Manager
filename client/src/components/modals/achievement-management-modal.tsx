import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2 } from "lucide-react";
import type { CustomAchievement } from "@shared/schema";
import * as z from "zod";

interface AchievementManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievement?: CustomAchievement;
  mode: "create" | "edit";
}

const RARITY_OPTIONS = [
  { value: "common", label: "Common" },
  { value: "rare", label: "Rare" },
  { value: "epic", label: "Epic" },
  { value: "legendary", label: "Legendary" },
] as const;

const CONDITION_TYPE_OPTIONS = [
  { value: "manual", label: "Manual Award" },
  { value: "xp_spent", label: "XP Spent" },
  { value: "skill_count", label: "Skill Count" },
  { value: "attribute_value", label: "Attribute Value" },
] as const;

const ICON_OPTIONS = [
  { value: "trophy", label: "Trophy" },
  { value: "star", label: "Star" },
  { value: "crown", label: "Crown" },
  { value: "shield", label: "Shield" },
  { value: "sword", label: "Sword" },
  { value: "gem", label: "Gem" },
  { value: "fire", label: "Fire" },
  { value: "heart", label: "Heart" },
  { value: "lightning", label: "Lightning" },
  { value: "target", label: "Target" },
];

// Define the schema for achievement data
const achievementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  iconName: z.string(),
  rarity: z.enum(["common", "rare", "epic", "legendary"]),
  conditionType: z.enum(["manual", "xp_spent", "skill_count", "attribute_value"]),
  conditionValue: z.number().int().nullable(),
});

export default function AchievementManagementModal({
  isOpen,
  onClose,
  achievement,
  mode,
}: AchievementManagementModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("trophy");
  const [rarity, setRarity] = useState("common");
  const [conditionType, setConditionType] = useState("manual");
  const [conditionValue, setConditionValue] = useState("");

  // Reset form when achievement or modal state changes
  useEffect(() => {
    if (isOpen && achievement) {
      setTitle(achievement.title || "");
      setDescription(achievement.description || "");
      setIcon(achievement.iconName || "trophy");
      setRarity(achievement.rarity || "common");
      setConditionType(achievement.conditionType || "manual");
      setConditionValue(achievement.conditionValue?.toString() || "");
    } else if (isOpen && mode === "create") {
      resetForm();
    }
  }, [isOpen, achievement, mode]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof achievementSchema>) => 
      apiRequest("POST", "/api/admin?type=achievements", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin?type=achievements"] });
      toast({
        title: "Achievement created",
        description: "New achievement has been created successfully.",
      });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create achievement",
        description: error.message || "Unable to create achievement",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof achievementSchema> }) =>
      apiRequest("PUT", `/api/admin?type=achievements&id=${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin?type=achievements"] });
      if ((achievement as any)?.isStatic) {
        // Force a reload of the page to refresh static achievements
        window.location.reload();
      }
      toast({
        title: "Achievement updated",
        description: "Achievement has been updated successfully.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update achievement",
        description: error.message || "Unable to update achievement",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setIcon("trophy");
    setRarity("common");
    setConditionType("manual");
    setConditionValue("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validationResult = achievementSchema.safeParse({
      title: title.trim(),
      description: description.trim(),
      iconName: icon,
      rarity,
      conditionType,
      conditionValue: conditionValue ? parseInt(conditionValue) : null,
    });

    if (!validationResult.success) {
      toast({
        title: "Validation error",
        description: validationResult.error.errors.map(err => err.message).join(", "),
        variant: "destructive",
      });
      return;
    }

    const data = validationResult.data;

    if (mode === "create") {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate({ id: achievement!.id, data });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {mode === "create" ? <Plus className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
            <span>{mode === "create" ? "Create Achievement" : "Edit Achievement"}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Achievement title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Achievement description"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon">Icon</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger>
                  <SelectValue placeholder="Select icon" />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rarity">Rarity</Label>
              <Select value={rarity} onValueChange={(value: any) => setRarity(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rarity" />
                </SelectTrigger>
                <SelectContent>
                  {RARITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="conditionType">Condition Type</Label>
              <Select value={conditionType} onValueChange={(value: any) => setConditionType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition type" />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {conditionType !== "manual" && (
              <div className="space-y-2">
                <Label htmlFor="conditionValue">Condition Value</Label>
                <Input
                  id="conditionValue"
                  type="number"
                  value={conditionValue}
                  onChange={(e) => setConditionValue(e.target.value)}
                  placeholder="Value required for unlock"
                  min="0"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {mode === "create" ? "Create" : "Update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}