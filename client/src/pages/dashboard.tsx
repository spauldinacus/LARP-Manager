import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import CharacterCreationModal from "@/components/modals/character-creation-modal";
import { Users, UserCheck, Star, Calendar, Menu, Bell, UserPlus, Plus } from "lucide-react";
import { useState } from "react";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [authLoading, user, setLocation]);

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: !!user?.isAdmin,
  });

  // Calculate percentage changes
  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const characterPercentageChange = stats ? calculatePercentageChange(
    stats.totalCharacters, 
    stats.totalCharactersLastMonth
  ) : 0;

  const playerPercentageChange = stats ? calculatePercentageChange(
    stats.activePlayers, 
    stats.activePlayersLastWeek
  ) : 0;



  // Fetch recent characters
  const { data: characters, isLoading: charactersLoading } = useQuery({
    queryKey: ["/api/characters"],
    enabled: !!user,
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  const recentCharacters = (characters as any[])?.slice(0, 3) || [];

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar 
          user={user} 
          currentPath="/dashboard"
        />
      )}

      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNav
          isOpen={isMobileNavOpen}
          onClose={() => setIsMobileNavOpen(false)}
          user={user}
          currentPath="/dashboard"
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileNavOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-xl font-semibold">Dashboard</h1>
              {user.playerNumber && (
                <p className="text-sm text-muted-foreground">Player #{user.playerNumber}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full"></span>
            </Button>

            {isMobile && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-foreground">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Stats Cards */}
          {user.isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Characters</p>
                      {statsLoading ? (
                        <Skeleton className="h-8 w-16 mt-2" />
                      ) : (
                        <p className="text-2xl font-bold">{(stats as any)?.totalCharacters || 0}</p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    <span className={characterPercentageChange >= 0 ? "text-green-500" : "text-red-500"}>
                      {characterPercentageChange >= 0 ? '+' : ''}{characterPercentageChange}%
                    </span> from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Players</p>
                      {statsLoading ? (
                        <Skeleton className="h-8 w-16 mt-2" />
                      ) : (
                        <p className="text-2xl font-bold">{(stats as any)?.activePlayers || 0}</p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                      <UserCheck className="h-6 w-6 text-accent" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    <span className={playerPercentageChange >= 0 ? "text-green-500" : "text-red-500"}>
                      {playerPercentageChange >= 0 ? '+' : ''}{playerPercentageChange}%
                    </span> from last week
                  </p>
                </CardContent>
              </Card>



              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Upcoming Events</p>
                      {statsLoading ? (
                        <Skeleton className="h-8 w-16 mt-2" />
                      ) : (
                        <p className="text-2xl font-bold">{(stats as any)?.upcomingEvents || 0}</p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats?.nextEvent ? (
                      stats.nextEvent.daysUntil === 0 ? 
                        `${stats.nextEvent.name} is today!` :
                        stats.nextEvent.daysUntil === 1 ? 
                          `${stats.nextEvent.name} tomorrow` :
                          `${stats.nextEvent.name} in ${stats.nextEvent.daysUntil} days`
                    ) : "No upcoming events"}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Activity & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Characters */}
            <Card>
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Recent Characters</h3>
                  <Button variant="ghost" size="sm" className="text-primary">
                    View All
                  </Button>
                </div>
              </div>
              <CardContent className="p-6">
                {charactersLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : recentCharacters.length > 0 ? (
                  <div className="space-y-4">
                    {recentCharacters.map((character: any) => (
                      <div key={character.id} className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {character.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{character.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {character.heritage.charAt(0).toUpperCase() + character.heritage.slice(1).replace(/-/g, ' ')} {character.archetype.charAt(0).toUpperCase() + character.archetype.slice(1).replace(/-/g, ' ')}
                          </p>
                          {user?.isAdmin && character.playerName && (
                            <p className="text-xs text-muted-foreground">
                              Played by {character.playerName}
                            </p>
                          )}
                        </div>
                        <Badge variant={character.isRetired ? "destructive" : character.isActive ? "default" : "secondary"}>
                          {character.isRetired ? "Retired" : character.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No characters yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setIsCharacterModalOpen(true)}
                    >
                      Create your first character
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold">Quick Actions</h3>
              </div>
              <CardContent className="p-6 space-y-4">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-4 group"
                  onClick={() => setIsCharacterModalOpen(true)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UserPlus className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Create Character</p>
                      <p className="text-sm text-muted-foreground">Add a new player character</p>
                    </div>
                  </div>
                </Button>

                {user.isAdmin && (
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4 group"
                    onClick={() => setLocation("/events")}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">Create Event</p>
                        <p className="text-sm text-muted-foreground">Schedule new LARP event</p>
                      </div>
                    </div>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Modals */}
      <CharacterCreationModal
        isOpen={isCharacterModalOpen}
        onClose={() => setIsCharacterModalOpen(false)}
      />
    </div>
  );
}
