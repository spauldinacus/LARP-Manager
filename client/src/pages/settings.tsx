import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Settings, Menu, Save, User, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface Chapter {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
}

export default function SettingsPage() {
  const { user, refetch: refetchAuth } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [playerName, setPlayerName] = useState(user?.playerName || "");
  const [selectedChapterId, setSelectedChapterId] = useState(user?.chapterId || "");

  const queryClient = useQueryClient();

  // Fetch chapters for selection
  const { data: chapters, isLoading: chaptersLoading } = useQuery({
    queryKey: ["/api/chapters"],
  });

  // Update user settings mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: { playerName: string; chapterId?: string }) => {
      const response = await apiRequest("PUT", `/api/admin?type=users&id=${user?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      refetchAuth();
      toast({
        title: "Settings updated",
        description: "Your settings have been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!playerName.trim()) {
      toast({
        title: "Validation error",
        description: "Player name is required",
        variant: "destructive",
      });
      return;
    }

    const updateData: any = {
      playerName: playerName.trim(),
    };

    // Only include chapter assignment if user is admin
    if (user?.isAdmin) {
      updateData.chapterId = selectedChapterId;
    }

    updateUserMutation.mutate(updateData);
  };

  const hasChanges = 
    playerName !== (user?.playerName || "") || 
    (user?.isAdmin && selectedChapterId !== (user?.chapterId || ""));

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      {user && (
        <div className="hidden lg:block">
          <Sidebar user={user} currentPath={location} />
        </div>
      )}

      {/* Mobile Navigation */}
      {user && (
        <MobileNav 
          isOpen={mobileMenuOpen} 
          onClose={() => setMobileMenuOpen(false)} 
          user={user} 
          currentPath={location} 
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
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
                <p className="text-muted-foreground">Manage your account settings and preferences</p>
              </div>
            </div>

            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Profile Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Contact admin to change email
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="playerName">Player Name *</Label>
                    <Input
                      id="playerName"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Enter your real name"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Your real name as it should appear to other players
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="playerNumber">Player Number</Label>
                    <Input
                      id="playerNumber"
                      value={user?.playerNumber || "Not assigned"}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Assigned by chapter administrators
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <CardTitle className="flex items-center space-x-2 mb-4">
                    <MapPin className="h-5 w-5" />
                    <span>Chapter Assignment</span>
                  </CardTitle>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="chapter">Select Chapter</Label>
                      <Select 
                        value={selectedChapterId} 
                        onValueChange={user?.isAdmin ? setSelectedChapterId : undefined}
                        disabled={chaptersLoading || !user?.isAdmin}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your chapter" />
                        </SelectTrigger>
                        <SelectContent>
                          {(chapters as Chapter[])?.filter(chapter => chapter.isActive).map((chapter) => (
                            <SelectItem key={chapter.id} value={chapter.id}>
                              {chapter.name} ({chapter.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        {user?.isAdmin 
                          ? "Choose the LARP chapter you primarily play with" 
                          : "Chapter assignment can only be changed by administrators"}
                      </p>
                    </div>

                    {selectedChapterId && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>Note:</strong> Changing your chapter assignment may affect your player number 
                          and character access. Contact your chapter admin if you have questions.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSave}
                    disabled={!hasChanges || updateUserMutation.isPending}
                    className="min-w-[120px]"
                  >
                    {updateUserMutation.isPending ? (
                      "Saving..."
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Account Type</p>
                    <p className="font-medium">{user?.isAdmin ? "Administrator" : "Player"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Candle Balance</p>
                    <p className="font-medium">{user?.candles || 0} candles</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Member Since</p>
                    <p className="font-medium">
                      {"createdAt" in (user || {}) && user?.createdAt ? new Date((user as any).createdAt).toLocaleDateString() : "Unknown"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}