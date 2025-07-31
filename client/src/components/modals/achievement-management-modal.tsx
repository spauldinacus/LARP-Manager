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
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/achievements", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/achievements"] });
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
    mutationFn: async (data: any) => {
      // Handle static achievement updates differently
      if ((achievement as any)?.isStatic) {
        const response = await apiRequest("PUT", `/api/admin/static-achievements/${(achievement as any).staticIndex}`, data);
        return response.json();
      } else {
        const response = await apiRequest("PUT", `/api/admin/achievements/${achievement!.id}`, data);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/achievements"] });
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
    
    if (!title.trim() || !description.trim()) {
      toast({
        title: "Validation error",
        description: "Title and description are required",
        variant: "destructive",
      });
      return;
    }

    const data = {
      title: title.trim(),
      description: description.trim(),
      iconName: icon,
      rarity,
      conditionType,
      conditionValue: conditionValue ? parseInt(conditionValue) : null,
    };

    if (mode === "create") {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
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