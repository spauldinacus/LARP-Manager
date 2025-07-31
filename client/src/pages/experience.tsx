import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Star, Calendar, User, Menu } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ExperienceModal from "@/components/modals/experience-modal";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { useAuth } from "@/hooks/use-auth";

export default function ExperiencePage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: experienceEntries, isLoading } = useQuery({
    queryKey: ["/api/experience"],
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
                <h1 className="text-3xl font-bold">Experience</h1>
                <p className="text-muted-foreground">Track and award experience points</p>
              </div>
            </div>
            {user.isAdmin && (
              <Button onClick={() => setShowExperienceModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Award Experience
              </Button>
            )}
          </div>

          {/* Experience Entries */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (experienceEntries as any[])?.length > 0 ? (
            <div className="space-y-4">
              {(experienceEntries as any[]).map((entry: any) => (
                <Card key={entry.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <Star className="h-5 w-5 text-yellow-500" />
                          <span className="font-semibold">{entry.character?.name}</span>
                          <Badge variant="outline">{entry.points} XP</Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {entry.character?.playerName}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </div>
                          {entry.event && (
                            <Badge variant="secondary">{entry.event.name}</Badge>
                          )}
                        </div>
                        
                        {entry.reason && (
                          <p className="text-sm text-muted-foreground">
                            <strong>Reason:</strong> {entry.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Star className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Experience Awarded Yet</h3>
              <p className="text-muted-foreground mb-6">
                {user.isAdmin 
                  ? "Start awarding experience points to characters for their achievements."
                  : "Experience points will appear here when awarded by game masters."
                }
              </p>
              {user.isAdmin && (
                <Button onClick={() => setShowExperienceModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Award First Experience
                </Button>
              )}
            </Card>
          )}
        </div>
      </main>

      {/* Experience Modal */}
      <ExperienceModal 
        isOpen={showExperienceModal} 
        onClose={() => setShowExperienceModal(false)} 
      />
    </div>
  );
}