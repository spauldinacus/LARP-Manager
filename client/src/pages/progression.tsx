import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import XPProgressionTracker from "@/components/gamification/xp-progression-tracker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Menu, TrendingUp, Trophy, Target, Star, Users } from "lucide-react";
import type { Character } from "@shared/schema";

export default function ProgressionPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [authLoading, user, setLocation]);

  const { data: characters = [], isLoading: charactersLoading } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
    enabled: !!user,
  });

  // Auto-select first active character
  useEffect(() => {
    if (characters.length > 0 && !selectedCharacterId) {
      const activeCharacter = characters.find(char => char.isActive) || characters[0];
      setSelectedCharacterId(activeCharacter.id);
    }
  }, [characters, selectedCharacterId]);

  const selectedCharacter = characters.find(char => char.id === selectedCharacterId);

  if (authLoading || charactersLoading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="hidden lg:block">
          <Sidebar user={user} currentPath="/progression" />
        </div>
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-96" />
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar user={user} currentPath="/progression" />
      </div>

      {/* Mobile Navigation */}
      <MobileNav 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
        user={user} 
        currentPath="/progression" 
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
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
                <h1 className="text-3xl font-bold flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-primary" />
                  <span>XP Progression Tracker</span>
                </h1>
                <p className="text-muted-foreground">Track your character's growth and achievements</p>
              </div>
            </div>
          </div>

          {/* Character Selection */}
          {characters.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Character Selection</span>
                </CardTitle>
                <CardDescription>Choose a character to view their progression details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Select value={selectedCharacterId} onValueChange={setSelectedCharacterId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a character" />
                      </SelectTrigger>
                      <SelectContent>
                        {characters.map((character) => (
                          <SelectItem key={character.id} value={character.id}>
                            <div className="flex items-center space-x-2">
                              <span>{character.name}</span>
                              <Badge variant={character.isActive ? "default" : "secondary"} className="text-xs">
                                {character.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedCharacter && (
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="capitalize">
                        {selectedCharacter.heritage.replace(/-/g, ' ')} {selectedCharacter.archetype.replace(/-/g, ' ')}
                      </span>
                      <Badge variant="outline">
                        {((selectedCharacter.experience || 0) + (selectedCharacter.totalXpSpent || 0))} Total XP
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Characters State */}
          {characters.length === 0 && (
            <Card className="p-12 text-center">
              <Trophy className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Characters Found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first character to start tracking your progression.
              </p>
              <Button onClick={() => setLocation("/characters")}>
                Create Character
              </Button>
            </Card>
          )}

          {/* XP Progression Tracker */}
          {selectedCharacter && (
            <XPProgressionTracker 
              characterId={selectedCharacter.id} 
              character={selectedCharacter}
            />
          )}

          {/* Quick Stats Overview */}
          {selectedCharacter && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800">
                <CardContent className="p-4 text-center">
                  <Trophy className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-600">
                    {selectedCharacter.experience || 0}
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">Available XP</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                <CardContent className="p-4 text-center">
                  <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">
                    {selectedCharacter.totalXpSpent || 0}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">XP Spent</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4 text-center">
                  <Star className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedCharacter.skills?.length || 0}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Skills Learned</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">
                    {((selectedCharacter.experience || 0) + (selectedCharacter.totalXpSpent || 0))}
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">Total XP Earned</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}