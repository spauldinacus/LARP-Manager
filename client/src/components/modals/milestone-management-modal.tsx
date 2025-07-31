import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit } from "lucide-react";
import type { CustomMilestone } from "@shared/schema";

interface MilestoneManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestone?: CustomMilestone;
  mode: "create" | "edit";
}

const ICON_OPTIONS = [
  { value: "star", label: "Star" },
  { value: "trophy", label: "Trophy" },
  { value: "crown", label: "Crown" },
  { value: "shield", label: "Shield" },
  { value: "sword", label: "Sword" },
  { value: "gem", label: "Gem" },
  { value: "fire", label: "Fire" },
  { value: "heart", label: "Heart" },
  { value: "lightning", label: "Lightning" },
  { value: "target", label: "Target" },
];

const COLOR_OPTIONS = [
  { value: "text-blue-600", label: "Blue" },
  { value: "text-green-600", label: "Green" },
  { value: "text-purple-600", label: "Purple" },
  { value: "text-orange-600", label: "Orange" },
  { value: "text-red-600", label: "Red" },
  { value: "text-yellow-600", label: "Yellow" },
  { value: "text-pink-600", label: "Pink" },
  { value: "text-indigo-600", label: "Indigo" },
];

export default function MilestoneManagementModal({
  isOpen,
  onClose,
  milestone,
  mode,
}: MilestoneManagementModalProps) {
  const [title, setTitle] = useState(milestone?.title || "");
  const [description, setDescription] = useState(milestone?.description || "");
  const [threshold, setThreshold] = useState(milestone?.threshold?.toString() || "");
  const [icon, setIcon] = useState(milestone?.iconName || "star");
  const [color, setColor] = useState(milestone?.color || "text-blue-600");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/milestones", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/milestones"] });
      toast({
        title: "Milestone created",
        description: "New milestone has been created successfully.",
      });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create milestone",
        description: error.message || "Unable to create milestone",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/admin/milestones/${milestone!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/milestones"] });
      toast({
        title: "Milestone updated",
        description: "Milestone has been updated successfully.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update milestone",
        description: error.message || "Unable to update milestone",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setThreshold("");
    setIcon("star");
    setColor("text-blue-600");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim() || !threshold) {
      toast({
        title: "Validation error",
        description: "Title, description, and threshold are required",
        variant: "destructive",
      });
      return;
    }

    const thresholdNum = parseInt(threshold);
    if (isNaN(thresholdNum) || thresholdNum < 0) {
      toast({
        title: "Invalid threshold",
        description: "Threshold must be a positive number",
        variant: "destructive",
      });
      return;
    }

    const data = {
      title: title.trim(),
      description: description.trim(),
      threshold: thresholdNum,
      iconName: icon,
      iconColor: color,
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
            <span>{mode === "create" ? "Create Milestone" : "Edit Milestone"}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Milestone title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Milestone description"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="threshold">XP Threshold</Label>
            <Input
              id="threshold"
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="XP required to unlock"
              min="0"
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
              <Label htmlFor="color">Color</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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