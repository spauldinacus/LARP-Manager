import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import CharacterSheetModal from "./character-sheet-modal";
import { 
  User, 
  Users, 
  Edit, 
  Plus,
  Trash2,
  Shield,
} from "lucide-react";

interface UserCharactersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}



export default function UserCharactersModal({
  isOpen,
  onClose,
  userId,
}: UserCharactersModalProps) {
  const [editingCharacter, setEditingCharacter] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch user details
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/admin/users", userId],
    enabled: isOpen && !!userId,
  });

  // Fetch user's characters
  const { data: characters, isLoading: charactersLoading } = useQuery({
    queryKey: ["/api/admin/users", userId, "characters"],
    enabled: isOpen && !!userId,
  });





  // Delete character mutation
  const deleteCharacterMutation = useMutation({
    mutationFn: (characterId: string) => 
      apiRequest(`/api/characters/${characterId}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId, "characters"] });
      toast({
        title: "Character deleted",
        description: "Character has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete character",
        description: error.message,
        variant: "destructive",
      });
    },
  });



  if (!userId) return null;

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>
              {userLoading ? "Loading..." : `${(user as any)?.username || "User"}'s Characters`}
            </span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* User Info */}
            {userLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : user ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-lg font-medium text-primary-foreground">
                          {(user as any).username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{(user as any).username}</h3>
                        <p className="text-muted-foreground">{(user as any).email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={(user as any).isAdmin ? "default" : "secondary"}>
                        {(user as any).isAdmin ? (
                          <>
                            <Shield className="h-3 w-3 mr-1" />
                            Administrator
                          </>
                        ) : (
                          <>
                            <User className="h-3 w-3 mr-1" />
                            Player
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Characters */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Characters ({(characters as any[])?.length || 0})</span>
                </h4>
              </div>

              {charactersLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(2)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (characters as any[])?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(characters as any[]).map((character: any) => (
                    <Card key={character.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{character.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {character.heritage.charAt(0).toUpperCase() + character.heritage.slice(1).replace(/-/g, ' ')} • {character.culture.charAt(0).toUpperCase() + character.culture.slice(1).replace(/-/g, ' ')} • {character.archetype.charAt(0).toUpperCase() + character.archetype.slice(1).replace(/-/g, ' ')}
                            </p>
                          </div>
                          <Badge variant={character.isActive ? "default" : "secondary"}>
                            {character.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Character Stats */}
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-primary">{character.body}</p>
                            <p className="text-xs text-muted-foreground">Body</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-accent">{character.stamina}</p>
                            <p className="text-xs text-muted-foreground">Stamina</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-yellow-500">{character.experience}</p>
                            <p className="text-xs text-muted-foreground">Experience</p>
                          </div>
                        </div>

                        <Separator />

                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingCharacter(character.id)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${character.name}?`)) {
                                deleteCharacterMutation.mutate(character.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Characters</h3>
                    <p className="text-muted-foreground">
                      This user hasn't created any characters yet.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>

    {/* Character Sheet Modal for editing */}
    <CharacterSheetModal
      isOpen={!!editingCharacter}
      onClose={() => setEditingCharacter(null)}
      characterId={editingCharacter}
    />
  </>
  );
}