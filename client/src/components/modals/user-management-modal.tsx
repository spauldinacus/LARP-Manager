import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Save, X, User } from "lucide-react";
import CharacterSheetModal from "./character-sheet-modal";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface UserManagementModalProps {
  userId: string | null;
  onClose: () => void;
}

export default function UserManagementModal({ userId, onClose }: UserManagementModalProps) {
  const [editedUser, setEditedUser] = useState<any>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch user details
  const { data: userDetails, isLoading, error } = useQuery({
    queryKey: ["/api/admin/users", userId],
    enabled: !!userId,
    retry: 1,
    staleTime: 0, // Force fresh data
    gcTime: 0, // Don't cache
    refetchOnMount: true,
  });

  console.log("UserManagementModal - userId:", userId, "userDetails:", userDetails, "error:", error);
  console.log("UserManagementModal - editedUser:", editedUser);

  // Fetch available roles
  const { data: roles = [] } = useQuery({
    queryKey: ["/api/roles"],
    enabled: !!userId,
  });

  // Fetch available chapters
  const { data: chapters = [] } = useQuery({
    queryKey: ["/api/chapters"],
    enabled: !!userId,
  });

  useEffect(() => {
    console.log("useEffect triggered - userDetails:", userDetails);
    if (userDetails && Object.keys(userDetails).length > 0) {
      console.log("Setting editedUser with userDetails:", userDetails);
      setEditedUser({ ...userDetails });
    } else if (userDetails && Object.keys(userDetails).length === 0) {
      console.log("Received empty userDetails object, invalidating cache");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    }
  }, [userDetails, queryClient]);

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      return apiRequest("PUT", `/api/admin/users/${userId}`, userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId] });
      toast({
        title: "User Updated",
        description: "User information has been successfully updated.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update user information",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (editedUser) {
      updateUserMutation.mutate({
        playerName: editedUser.playerName,
        username: editedUser.username,
        email: editedUser.email,
        title: editedUser.title || null,
        roleId: editedUser.roleId === "none" ? null : editedUser.roleId,
        chapterId: editedUser.chapterId === "none" ? null : editedUser.chapterId,
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditedUser((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!userId) return null;

  return (
    <>
      <Dialog open={!!userId} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Manage User Profile
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-600">
              <p>Error loading user details: {error?.message || "Unknown error"}</p>
              <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId] })}>
                Retry
              </Button>
            </div>
          ) : (
            editedUser && (
              <div className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="playerName">Player Name</Label>
                        <Input
                          id="playerName"
                          value={editedUser.playerName || ""}
                          onChange={(e) => handleInputChange("playerName", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={editedUser.username || ""}
                          onChange={(e) => handleInputChange("username", e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editedUser.email || ""}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={editedUser.title || ""}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        placeholder="Enter custom title (optional)"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="playerNumber">Player ID#</Label>
                        <Input
                          id="playerNumber"
                          value={editedUser.playerNumber || ""}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select
                          value={editedUser.roleId || ""}
                          onValueChange={(value) => handleInputChange("roleId", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Role</SelectItem>
                            {Array.isArray(roles) && roles.map((role: any) => (
                              <SelectItem key={role.id} value={role.id}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: role.color }}
                                  />
                                  {role.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="chapter">Chapter</Label>
                      <Select
                        value={editedUser.chapterId || ""}
                        onValueChange={(value) => handleInputChange("chapterId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select chapter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Chapter</SelectItem>
                          {Array.isArray(chapters) && chapters.map((chapter: any) => (
                            <SelectItem key={chapter.id} value={chapter.id}>
                              {chapter.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Characters */}
                {editedUser.characters && editedUser.characters.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Characters ({editedUser.characters.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2">
                        {editedUser.characters.map((character: any) => (
                          <div
                            key={character.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div>
                                <p className="font-medium">{character.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {character.heritage} • {character.totalXpSpent || 0} XP Spent
                                </p>
                              </div>
                              <div className="flex gap-1">
                                {character.isActive ? (
                                  <Badge variant="default">Active</Badge>
                                ) : (
                                  <Badge variant="secondary">Inactive</Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedCharacterId(character.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Sheet
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={onClose}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={updateUserMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>

      {/* Character Sheet Modal */}
      {selectedCharacterId && (
        <CharacterSheetModal
          isOpen={true}
          characterId={selectedCharacterId}
          onClose={() => setSelectedCharacterId(null)}
        />
      )}
    </>
  );
}