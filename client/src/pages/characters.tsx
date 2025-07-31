import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Users, Eye, Menu, Search, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CharacterCreationModal from "@/components/modals/character-creation-modal";
import CharacterSheetModal from "@/components/modals/character-sheet-modal";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CharactersPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "playerName" | "heritage" | "experience" | "xpSpent" | "status">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { toast } = useToast();

  const { data: characters, isLoading } = useQuery({
    queryKey: ["/api/characters"],
  });

  // Filter and sort characters
  const filteredAndSortedCharacters = useMemo(() => {
    if (!characters) return [];

    let filtered = (characters as any[]).filter((character: any) => {
      const searchLower = searchTerm.toLowerCase();
      const name = character.name.toLowerCase();
      const playerName = (character.playerName || "").toLowerCase();
      const heritage = character.heritage.toLowerCase();
      const culture = character.culture.toLowerCase();
      const archetype = character.archetype.toLowerCase();
      
      return name.includes(searchLower) ||
             playerName.includes(searchLower) ||
             heritage.includes(searchLower) ||
             culture.includes(searchLower) ||
             archetype.includes(searchLower);
    });

    return filtered.sort((a: any, b: any) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "playerName":
          aValue = (a.playerName || "").toLowerCase();
          bValue = (b.playerName || "").toLowerCase();
          break;
        case "heritage":
          aValue = a.heritage.toLowerCase();
          bValue = b.heritage.toLowerCase();
          break;
        case "experience":
          aValue = a.experience || 0;
          bValue = b.experience || 0;
          break;
        case "xpSpent":
          aValue = a.totalXpSpent || 25;
          bValue = b.totalXpSpent || 25;
          break;
        case "status":
          aValue = a.isRetired ? 2 : (a.isActive ? 0 : 1);
          bValue = b.isRetired ? 2 : (b.isActive ? 0 : 1);
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortBy === "experience" || sortBy === "xpSpent" || sortBy === "status") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }
      
      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [characters, searchTerm, sortBy, sortOrder]);

  // Delete character mutation
  const deleteCharacterMutation = useMutation({
    mutationFn: (characterId: string) => 
      apiRequest("DELETE", `/api/characters/${characterId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
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

          {/* Search and Sort Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by character name, player name, heritage, culture, or archetype..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Character Name</SelectItem>
                      <SelectItem value="playerName">Player Name</SelectItem>
                      <SelectItem value="heritage">Heritage</SelectItem>
                      <SelectItem value="experience">Experience</SelectItem>
                      <SelectItem value="xpSpent">XP Spent</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  >
                    {sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {filteredAndSortedCharacters.length} character{filteredAndSortedCharacters.length !== 1 ? "s" : ""} found
              </div>
            </CardContent>
          </Card>

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
          ) : filteredAndSortedCharacters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedCharacters.map((character: any) => (
                <Card key={character.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{character.name}</span>
                      <div className="flex space-x-2">
                        <Badge variant={character.isRetired ? "destructive" : (character.isActive ? "default" : "secondary")}>
                          {character.isRetired ? "Retired" : (character.isActive ? "Active" : "Inactive")}
                        </Badge>
                      </div>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Played by {character.playerName}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex space-x-2">
                      <Badge variant="outline">{character.heritage.charAt(0).toUpperCase() + character.heritage.slice(1).replace(/-/g, ' ')}</Badge>
                      <Badge variant="outline">{character.culture.charAt(0).toUpperCase() + character.culture.slice(1).replace(/-/g, ' ')}</Badge>
                      <Badge variant="outline">{character.archetype.charAt(0).toUpperCase() + character.archetype.slice(1).replace(/-/g, ' ')}</Badge>
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

                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setSelectedCharacterId(character.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Sheet
                      </Button>
                      {(user?.isAdmin || character.userId === user?.id) && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${character.name}?`)) {
                              deleteCharacterMutation.mutate(character.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : searchTerm ? (
            <Card className="p-12 text-center">
              <Search className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Characters Found</h3>
              <p className="text-muted-foreground mb-4">
                No characters match your search for "{searchTerm}". Try a different search term.
              </p>
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Clear Search
              </Button>
            </Card>
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