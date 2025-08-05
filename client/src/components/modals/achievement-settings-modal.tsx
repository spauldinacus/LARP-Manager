import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Settings, Info } from "lucide-react";

interface AchievementSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RaritySettings {
  commonThreshold: number;
  rareThreshold: number;
  epicThreshold: number;
  legendaryThreshold: number;
  enableDynamicRarity: boolean;
}

export default function AchievementSettingsModal({
  isOpen,
  onClose,
}: AchievementSettingsModalProps) {
  const [settings, setSettings] = useState<RaritySettings>({
    commonThreshold: 50, // 50% of players
    rareThreshold: 25,   // 25% of players
    epicThreshold: 10,   // 10% of players
    legendaryThreshold: 2, // 2% of players
    enableDynamicRarity: true,
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current achievement settings
  const { data: currentSettings } = useQuery({
    queryKey: ["/api/admin?type=achievement-settings"],
    enabled: isOpen,
    refetchOnMount: true,
    onSuccess: (data) => {
      if (data) {
        setSettings(data);
      }
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: RaritySettings) => {
      const response = await apiRequest("PUT", "/api/admin", { type: "achievement-settings", ...newSettings });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin?type=achievement-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin?type=achievements"] });
      toast({
        title: "Settings updated",
        description: "Achievement rarity settings have been updated successfully.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update settings",
        description: error.message || "Unable to update achievement settings",
        variant: "destructive",
      });
    },
  });

  const recalculateRaritiesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin", { type: "recalculate-achievement-rarities" });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin?type=achievements"] });
      toast({
        title: "Rarities recalculated",
        description: "All achievement rarities have been recalculated based on current player statistics.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to recalculate",
        description: error.message || "Unable to recalculate achievement rarities",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate thresholds
    if (settings.commonThreshold <= settings.rareThreshold ||
        settings.rareThreshold <= settings.epicThreshold ||
        settings.epicThreshold <= settings.legendaryThreshold) {
      toast({
        title: "Invalid thresholds",
        description: "Thresholds must be in descending order: Common > Rare > Epic > Legendary",
        variant: "destructive",
      });
      return;
    }

    updateSettingsMutation.mutate(settings);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Achievement Rarity Settings</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base">
                <Info className="h-4 w-4" />
                <span>Dynamic Rarity System</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dynamic-rarity">Enable Dynamic Rarity</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically adjust achievement rarity based on player completion rates
                  </p>
                </div>
                <Switch
                  id="dynamic-rarity"
                  checked={settings.enableDynamicRarity}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, enableDynamicRarity: checked }))
                  }
                />
              </div>

              {settings.enableDynamicRarity && (
                <div className="space-y-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Set percentage thresholds for automatic rarity assignment:
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="common">Common (%)</Label>
                      <Input
                        id="common"
                        type="number"
                        value={settings.commonThreshold}
                        onChange={(e) => 
                          setSettings(prev => ({ ...prev, commonThreshold: parseInt(e.target.value) || 0 }))
                        }
                        min="1"
                        max="100"
                        placeholder="50"
                      />
                      <p className="text-xs text-muted-foreground">Players who achieved it</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rare">Rare (%)</Label>
                      <Input
                        id="rare"
                        type="number"
                        value={settings.rareThreshold}
                        onChange={(e) => 
                          setSettings(prev => ({ ...prev, rareThreshold: parseInt(e.target.value) || 0 }))
                        }
                        min="1"
                        max="100"
                        placeholder="25"
                      />
                      <p className="text-xs text-muted-foreground">25-50% completion</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="epic">Epic (%)</Label>
                      <Input
                        id="epic"
                        type="number"
                        value={settings.epicThreshold}
                        onChange={(e) => 
                          setSettings(prev => ({ ...prev, epicThreshold: parseInt(e.target.value) || 0 }))
                        }
                        min="1"
                        max="100"
                        placeholder="10"
                      />
                      <p className="text-xs text-muted-foreground">10-25% completion</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="legendary">Legendary (%)</Label>
                      <Input
                        id="legendary"
                        type="number"
                        value={settings.legendaryThreshold}
                        onChange={(e) => 
                          setSettings(prev => ({ ...prev, legendaryThreshold: parseInt(e.target.value) || 0 }))
                        }
                        min="1"
                        max="100"
                        placeholder="2"
                      />
                      <p className="text-xs text-muted-foreground">2-10% completion</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => recalculateRaritiesMutation.mutate()}
                      disabled={recalculateRaritiesMutation.isPending}
                      className="w-full"
                    >
                      Recalculate All Achievement Rarities Now
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateSettingsMutation.isPending}
            >
              Save Settings
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}