import { useState } from "react";
import { useLocation } from "wouter";
import { Settings, Menu, User, Shield, Bell, Database, Edit2, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editingPlayerName, setEditingPlayerName] = useState(false);
  const [playerName, setPlayerName] = useState(user?.playerName || "");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updatePlayerNameMutation = useMutation({
    mutationFn: async (newPlayerName: string) => {
      const response = await apiRequest("PATCH", "/api/user/profile", { playerName: newPlayerName });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setEditingPlayerName(false);
      toast({
        title: "Player name updated",
        description: "Your player name has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update player name",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSavePlayerName = () => {
    if (playerName.trim()) {
      updatePlayerNameMutation.mutate(playerName.trim());
    }
  };

  const handleCancelEdit = () => {
    setPlayerName(user?.playerName || "");
    setEditingPlayerName(false);
  };

  if (!user) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="h-8 w-48 bg-muted animate-pulse rounded mx-auto" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar user={user} currentPath={location} />
      </div>

      {/* Mobile Navigation */}
      <MobileNav 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
        user={user} 
        currentPath={location} 
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Manage your account and application preferences</p>
              </div>
            </div>
          </div>

          {/* Settings Sections */}
          <div className="space-y-6">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Profile Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username" 
                      value={user.username} 
                      disabled 
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      value={user.email} 
                      disabled 
                      className="bg-muted"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="playerName">Player Name</Label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      id="playerName" 
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      disabled={!editingPlayerName}
                      className={!editingPlayerName ? "bg-muted" : ""}
                      placeholder="Enter your real name"
                    />
                    {editingPlayerName ? (
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleSavePlayerName}
                          disabled={updatePlayerNameMutation.isPending}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          disabled={updatePlayerNameMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingPlayerName(true)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input 
                    id="role" 
                    value={user.isAdmin ? "Administrator" : "Player"} 
                    disabled 
                    className="bg-muted"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  You can edit your player name above. Contact an administrator to change other profile information.
                </p>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notifications</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="experience-notifications">Experience Awards</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when you receive experience points
                    </p>
                  </div>
                  <Switch id="experience-notifications" defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="event-notifications">Event Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about new events and updates
                    </p>
                  </div>
                  <Switch id="event-notifications" defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="system-notifications">System Announcements</Label>
                    <p className="text-sm text-muted-foreground">
                      Important system updates and maintenance notices
                    </p>
                  </div>
                  <Switch id="system-notifications" defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* Admin Settings */}
            {user.isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Administrator Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-approve">Auto-approve Characters</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically approve new character registrations
                      </p>
                    </div>
                    <Switch id="auto-approve" />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="public-registration">Public Registration</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow public user registration without admin approval
                      </p>
                    </div>
                    <Switch id="public-registration" defaultChecked />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="max-characters">Max Characters per Player</Label>
                    <Input 
                      id="max-characters" 
                      type="number" 
                      defaultValue="3" 
                      min="1" 
                      max="10"
                    />
                    <p className="text-sm text-muted-foreground">
                      Maximum number of characters each player can create
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>System Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Application Version</p>
                    <p className="text-muted-foreground">1.0.0</p>
                  </div>
                  <div>
                    <p className="font-medium">Database Status</p>
                    <p className="text-green-600">Connected</p>
                  </div>
                  <div>
                    <p className="font-medium">Last Updated</p>
                    <p className="text-muted-foreground">
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Account Type</p>
                    <p className="text-muted-foreground">
                      {user.isAdmin ? "Administrator" : "Standard Player"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <Button variant="outline">
                Reset to Defaults
              </Button>
              <Button>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}