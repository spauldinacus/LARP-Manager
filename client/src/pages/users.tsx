import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Users, Shield, User, Menu, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import UserCharactersModal from "@/components/modals/user-characters-modal";
import { useAuth } from "@/hooks/use-auth";

export default function UsersPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: user?.isAdmin,
  });

  // Loading state or not authenticated
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

  // Not an admin user
  if (!user.isAdmin) {
    return (
      <div className="flex h-screen bg-background">
        <div className="hidden lg:block">
          <Sidebar user={user} currentPath={location} />
        </div>
        <MobileNav 
          isOpen={mobileMenuOpen} 
          onClose={() => setMobileMenuOpen(false)} 
          user={user} 
          currentPath={location} 
        />
        <main className="flex-1 overflow-auto p-6">
          <Card className="p-12 text-center">
            <Shield className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Admin Access Required</h3>
            <p className="text-muted-foreground">
              You need administrator privileges to view user management.
            </p>
          </Card>
        </main>
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
                <h1 className="text-3xl font-bold">User Management</h1>
                <p className="text-muted-foreground">Manage registered users and permissions</p>
              </div>
            </div>
          </div>

          {/* Users List */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-64" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (users as any[])?.length > 0 ? (
            <div className="space-y-4">
              {(users as any[]).map((userData: any) => (
                <Card key={userData.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <User className="h-5 w-5 text-muted-foreground" />
                          <span className="font-semibold">{userData.username}</span>
                          {userData.isAdmin && (
                            <Badge variant="destructive">
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          {userData.email}
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          Joined: {new Date(userData.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="text-right space-y-1 mr-4">
                          <div className="text-sm font-medium">
                            {userData.characterCount || 0} characters
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedUserId(userData.id)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Characters
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
              <p className="text-muted-foreground">
                Registered users will appear here.
              </p>
            </Card>
          )}
        </div>
      </main>

      {/* User Characters Modal */}
      <UserCharactersModal 
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
        userId={selectedUserId}
      />
    </div>
  );
}