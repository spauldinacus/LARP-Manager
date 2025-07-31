import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Users, Eye, Menu } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import CharacterCreationModal from "@/components/modals/character-creation-modal";
import CharacterSheetModal from "@/components/modals/character-sheet-modal";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { useAuth } from "@/hooks/use-auth";

export default function CharactersPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: characters, isLoading } = useQuery({
    queryKey: ["/api/characters"],
  });

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
                <h1 className="text-3xl font-bold">Characters</h1>
                <p className="text-muted-foreground">Manage all character profiles</p>
              </div>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Character
            </Button>
          </div>

          {/* Characters Grid */}
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
                      <div className="flex space-x-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (characters as any[])?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(characters as any[]).map((character: any) => (
                <Card key={character.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{character.name}</span>
                      <div className="flex space-x-2">
                        <Badge variant={character.isActive ? "default" : "secondary"}>
                          {character.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {(character as any).isRetired && (
                          <Badge variant="destructive">
                            Retired
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Played by {character.playerName}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex space-x-2">
                      <Badge variant="outline">{character.heritage}</Badge>
                      <Badge variant="outline">{character.culture}</Badge>
                      <Badge variant="outline">{character.archetype}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Experience</p>
                        <p className="font-semibold">{character.experience} XP</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">XP Spent</p>
                        <p className="font-semibold">{character.totalXpSpent || 25}</p>
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setSelectedCharacterId(character.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Character Sheet
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Characters Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first character to get started with the LARP system.
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Character
              </Button>
            </Card>
          )}
        </div>
      </main>

      {/* Modals */}
      <CharacterCreationModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
      
      {selectedCharacterId && (
        <CharacterSheetModal 
          characterId={selectedCharacterId}
          isOpen={!!selectedCharacterId}
          onClose={() => setSelectedCharacterId(null)}
        />
      )}
    </div>
  );
}