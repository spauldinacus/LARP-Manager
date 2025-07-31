import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, User, Shield, Zap } from "lucide-react";

interface CharacterSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterId: string | null;
}

export default function CharacterSheetModal({
  isOpen,
  onClose,
  characterId,
}: CharacterSheetModalProps) {
  // Fetch character details
  const { data: character, isLoading: characterLoading } = useQuery({
    queryKey: ["/api/characters", characterId],
    enabled: isOpen && !!characterId,
  });

  // Fetch character experience history
  const { data: experienceHistory, isLoading: experienceLoading } = useQuery({
    queryKey: ["/api/characters", characterId, "experience"],
    enabled: isOpen && !!characterId,
  });

  if (!characterId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {characterLoading ? (
              <Skeleton className="h-6 w-48" />
            ) : (
              character?.name || "Character Sheet"
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {characterLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : character ? (
              <>
                {/* Character Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <User className="h-5 w-5" />
                        <span>Character Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Character Name</p>
                        <p className="text-lg font-semibold">{character.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Player</p>
                        <p>{character.playerName}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Badge variant="outline">{character.heritage}</Badge>
                        <Badge variant="outline">{character.culture}</Badge>
                        <Badge variant="outline">{character.archetype}</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                        <Badge variant={character.isActive ? "default" : "secondary"}>
                          {character.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Shield className="h-5 w-5" />
                        <span>Character Statistics</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-primary/10 rounded-lg">
                          <p className="text-3xl font-bold text-primary">{character.body}</p>
                          <p className="text-sm text-muted-foreground">Body</p>
                        </div>
                        <div className="text-center p-4 bg-accent/10 rounded-lg">
                          <p className="text-3xl font-bold text-accent">{character.stamina}</p>
                          <p className="text-sm text-muted-foreground">Stamina</p>
                        </div>
                        <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
                          <p className="text-3xl font-bold text-yellow-600">{character.experience}</p>
                          <p className="text-sm text-muted-foreground">Experience</p>
                        </div>
                        <div className="text-center p-4 bg-green-500/10 rounded-lg">
                          <p className="text-3xl font-bold text-green-600">{character.level}</p>
                          <p className="text-sm text-muted-foreground">Level</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Experience History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="h-5 w-5" />
                      <span>Experience History</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {experienceLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center space-x-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-3 w-2/3" />
                            </div>
                            <Skeleton className="h-6 w-16" />
                          </div>
                        ))}
                      </div>
                    ) : experienceHistory && experienceHistory.length > 0 ? (
                      <div className="space-y-4">
                        {experienceHistory.map((entry: any) => (
                          <div
                            key={entry.id}
                            className="flex items-start space-x-4 p-4 border border-border rounded-lg"
                          >
                            <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <Zap className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">
                                  +{entry.amount} Experience Points
                                </p>
                                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    {new Date(entry.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {entry.reason}
                              </p>
                              {entry.event && (
                                <Badge variant="outline" className="mt-2">
                                  {entry.event.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Zap className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                        <p className="text-muted-foreground">No experience awarded yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Character Creation Date */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Character created</span>
                      <span>{new Date(character.createdAt).toLocaleDateString()}</span>
                    </div>
                    {character.updatedAt !== character.createdAt && (
                      <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                        <span>Last updated</span>
                        <span>{new Date(character.updatedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Character not found</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
