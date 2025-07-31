import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import CharacterSheetModal from "@/components/modals/character-sheet-modal";
import { Users, Menu, Edit, Plus, Trash2, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { SKILLS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface Player {
  id: string;
  username: string;
  playerName: string;
  email: string;
  playerNumber: string;
  chapterId: string;
  characters: Array<{
    id: string;
    name: string;
    heritage: string;
    culture: string;
    archetype: string;
    skills: string[];
    isActive: boolean;
    isRetired: boolean;
  }>;
}

export default function PlayersPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [newPlayerNumber, setNewPlayerNumber] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [isCharacterSheetOpen, setIsCharacterSheetOpen] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch all players with their characters
  const { data: players, isLoading } = useQuery({
    queryKey: ["/api/admin/players"],
    enabled: !!user?.isAdmin,
  });

  // Update player number mutation
  const updatePlayerNumberMutation = useMutation({
    mutationFn: async ({ playerId, playerNumber }: { playerId: string; playerNumber: string }) => {
      const response = await apiRequest("PUT", `/api/admin/players/${playerId}/player-number`, { playerNumber });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/players"] });
      setIsPlayerModalOpen(false);
      setSelectedPlayer(null);
      setNewPlayerNumber("");
      toast({
        title: "Player number updated",
        description: "The player number has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update player number",
        variant: "destructive",
      });
    },
  });

  // Add skill mutation
  const addSkillMutation = useMutation({
    mutationFn: async ({ characterId, skill }: { characterId: string; skill: string }) => {
      const response = await apiRequest("POST", `/api/admin/characters/${characterId}/add-skill`, { skill });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/players"] });
      setNewSkill("");
      toast({
        title: "Skill added",
        description: "The skill has been added to the character.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Add skill failed",
        description: error.message || "Failed to add skill",
        variant: "destructive",
      });
    },
  });

  // Remove skill mutation
  const removeSkillMutation = useMutation({
    mutationFn: async ({ characterId, skill }: { characterId: string; skill: string }) => {
      const response = await apiRequest("DELETE", `/api/admin/characters/${characterId}/remove-skill`, { skill });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/players"] });
      toast({
        title: "Skill removed",
        description: "The skill has been removed from the character.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Remove skill failed",
        description: error.message || "Failed to remove skill",
        variant: "destructive",
      });
    },
  });

  if (!user?.isAdmin) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You need admin privileges to view this page.</p>
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
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
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
                  <h1 className="text-3xl font-bold">Players</h1>
                  <p className="text-muted-foreground">Manage player accounts and their characters</p>
                </div>
              </div>
            </div>

            {/* Players Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (players as Player[])?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(players as Player[]).map((player) => (
                  <Card key={player.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div>
                          <span>{player.playerName}</span>
                          <p className="text-sm text-muted-foreground font-normal">@{player.username}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPlayer(player);
                            setNewPlayerNumber(player.playerNumber || "");
                            setIsPlayerModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{player.email}</p>
                      {player.playerNumber && (
                        <Badge variant="secondary">#{player.playerNumber}</Badge>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Characters ({player.characters.length})
                        </p>
                        {player.characters.length > 0 ? (
                          <div className="space-y-2">
                            {player.characters.map((character) => (
                              <div
                                key={character.id}
                                className="flex items-center justify-between p-2 bg-muted/50 rounded"
                              >
                                <div>
                                  <p className="text-sm font-medium">{character.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {character.heritage.charAt(0).toUpperCase() + character.heritage.slice(1).replace(/-/g, ' ')} {character.archetype.charAt(0).toUpperCase() + character.archetype.slice(1).replace(/-/g, ' ')}
                                  </p>
                                  <div className="flex space-x-1 mt-1">
                                    <Badge variant={character.isActive ? "default" : "secondary"} className="text-xs">
                                      {character.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                    {character.isRetired && (
                                      <Badge variant="destructive" className="text-xs">
                                        Retired
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedCharacter(character);
                                    setIsCharacterSheetOpen(true);
                                  }}
                                >
                                  <BookOpen className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No characters created</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Players Found</h3>
                <p className="text-muted-foreground">
                  No players have registered yet.
                </p>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Player Number Edit Modal */}
      <Dialog open={isPlayerModalOpen} onOpenChange={setIsPlayerModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Player: {selectedPlayer?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="playerNumber">Player Number</Label>
              <Input
                id="playerNumber"
                value={newPlayerNumber}
                onChange={(e) => setNewPlayerNumber(e.target.value)}
                placeholder="e.g., FL07310001"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPlayerModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedPlayer) {
                  updatePlayerNumberMutation.mutate({
                    playerId: selectedPlayer.id,
                    playerNumber: newPlayerNumber,
                  });
                }
              }}
              disabled={updatePlayerNumberMutation.isPending}
            >
              {updatePlayerNumberMutation.isPending ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Character Skills Modal */}
      <Dialog open={isSkillModalOpen} onOpenChange={setIsSkillModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Skills: {selectedCharacter?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Current Skills */}
            <div>
              <Label className="text-base font-medium">Current Skills</Label>
              <ScrollArea className="h-32 w-full border rounded-md p-4">
                {selectedCharacter?.skills?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCharacter.skills.map((skill: string, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{skill}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            removeSkillMutation.mutate({
                              characterId: selectedCharacter.id,
                              skill,
                            });
                          }}
                          disabled={removeSkillMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No skills learned</p>
                )}
              </ScrollArea>
            </div>

            {/* Add New Skill */}
            <div>
              <Label htmlFor="newSkill">Add New Skill</Label>
              <div className="flex space-x-2">
                <Select value={newSkill} onValueChange={setNewSkill}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a skill to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {SKILLS.filter(skill => !selectedCharacter?.skills?.includes(skill)).map((skill) => (
                      <SelectItem key={skill} value={skill}>
                        {skill}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => {
                    if (newSkill && selectedCharacter) {
                      addSkillMutation.mutate({
                        characterId: selectedCharacter.id,
                        skill: newSkill,
                      });
                    }
                  }}
                  disabled={!newSkill || addSkillMutation.isPending}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSkillModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Character Sheet Modal */}
      {selectedCharacter && (
        <CharacterSheetModal
          characterId={selectedCharacter.id}
          isOpen={isCharacterSheetOpen}
          onClose={() => {
            setIsCharacterSheetOpen(false);
            setSelectedCharacter(null);
          }}
        />
      )}
    </div>
  );
}