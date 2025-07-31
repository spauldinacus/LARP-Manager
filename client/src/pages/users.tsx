import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Users, Shield, User, Menu, Eye, Edit, Save, X, Flame, Search, ArrowUpDown, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import UserCharactersModal from "@/components/modals/user-characters-modal";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

export default function UsersPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editingPlayerNumber, setEditingPlayerNumber] = useState<string | null>(null);
  const [newPlayerNumber, setNewPlayerNumber] = useState("");
  const [showCandleModal, setShowCandleModal] = useState(false);
  const [selectedUserForCandles, setSelectedUserForCandles] = useState<string | null>(null);
  const [candleAmount, setCandleAmount] = useState("");
  const [candleReason, setCandleReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"playerName" | "username" | "playerNumber" | "characterCount">("playerName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: user?.isAdmin,
  });

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    if (!users) return [];

    let filtered = users.filter((userData: any) => {
      const searchLower = searchTerm.toLowerCase();
      const playerName = (userData.playerName || "").toLowerCase();
      const username = userData.username.toLowerCase();
      const playerNumber = (userData.playerNumber || "").toLowerCase();
      
      // Search in character names too
      const characterNames = userData.characters?.map((char: any) => char.name.toLowerCase()).join(" ") || "";
      
      return playerName.includes(searchLower) ||
             username.includes(searchLower) ||
             playerNumber.includes(searchLower) ||
             characterNames.includes(searchLower);
    });

    return filtered.sort((a: any, b: any) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "playerName":
          aValue = (a.playerName || a.username || "").toLowerCase();
          bValue = (b.playerName || b.username || "").toLowerCase();
          break;
        case "username":
          aValue = a.username.toLowerCase();
          bValue = b.username.toLowerCase();
          break;
        case "playerNumber":
          aValue = a.playerNumber || "";
          bValue = b.playerNumber || "";
          break;
        case "characterCount":
          aValue = a.characterCount || 0;
          bValue = b.characterCount || 0;
          break;
        default:
          aValue = (a.playerName || a.username || "").toLowerCase();
          bValue = (b.playerName || b.username || "").toLowerCase();
      }

      if (sortBy === "characterCount") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }
      
      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [users, searchTerm, sortBy, sortOrder]);

  // Player number update mutation
  const updatePlayerNumberMutation = useMutation({
    mutationFn: async ({ userId, playerNumber }: { userId: string; playerNumber: string }) => {
      const response = await apiRequest("PUT", `/api/admin/players/${userId}/player-number`, { playerNumber });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditingPlayerNumber(null);
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

  // Candle transaction mutation
  const candleTransactionMutation = useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) => {
      const response = await apiRequest("POST", `/api/users/${userId}/candles`, { amount, reason });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setShowCandleModal(false);
      setSelectedUserForCandles(null);
      setCandleAmount("");
      setCandleReason("");
      toast({
        title: "Candle transaction completed",
        description: "The candle balance has been updated successfully.",
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

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User deleted",
        description: "User and all their characters have been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
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

          {/* Search and Sort Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by player name, username, player number, or character name..."
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
                      <SelectItem value="playerName">Player Name</SelectItem>
                      <SelectItem value="username">Username</SelectItem>
                      <SelectItem value="playerNumber">Player Number</SelectItem>
                      <SelectItem value="characterCount">Character Count</SelectItem>
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
                {filteredAndSortedUsers.length} user{filteredAndSortedUsers.length !== 1 ? "s" : ""} found
              </div>
            </CardContent>
          </Card>

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
          ) : filteredAndSortedUsers.length > 0 ? (
            <div className="space-y-4">
              {filteredAndSortedUsers.map((userData: any) => (
                <Card key={userData.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <User className="h-5 w-5 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="font-semibold">{userData.playerName || userData.username}</span>
                            <span className="text-sm text-muted-foreground">@{userData.username}</span>
                          </div>
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
                        
                        <div className="text-xs text-muted-foreground mt-1">
                          Player Number: {editingPlayerNumber === userData.id ? (
                            <div className="flex items-center space-x-2 mt-1">
                              <Input
                                value={newPlayerNumber}
                                onChange={(e) => setNewPlayerNumber(e.target.value)}
                                placeholder="FL07310001"
                                className="h-6 text-xs max-w-[120px]"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  if (newPlayerNumber.trim()) {
                                    updatePlayerNumberMutation.mutate({ 
                                      userId: userData.id, 
                                      playerNumber: newPlayerNumber.trim() 
                                    });
                                  }
                                }}
                                disabled={updatePlayerNumberMutation.isPending || !newPlayerNumber.trim()}
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  setEditingPlayerNumber(null);
                                  setNewPlayerNumber("");
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="flex items-center space-x-1">
                              <span>{userData.playerNumber || "Not assigned"}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0 ml-1"
                                onClick={() => {
                                  setEditingPlayerNumber(userData.id);
                                  setNewPlayerNumber(userData.playerNumber || "");
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Candles: </span>
                            <Badge variant="outline" className="text-orange-600 border-orange-600">
                              <Flame className="h-3 w-3 mr-1" />
                              {userData.candles || 0}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="text-right space-y-1 mr-4">
                          <div className="text-sm font-medium">
                            {userData.characterCount || 0} characters
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedUserId(userData.id)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Characters
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUserForCandles(userData.id);
                              setShowCandleModal(true);
                            }}
                          >
                            <Flame className="h-4 w-4 mr-2" />
                            Manage Candles
                          </Button>
                          
                          {userData.id !== user.id && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                const username = userData.playerName || userData.username;
                                if (confirm(`Are you sure you want to delete user "${username}" and all their characters? This action cannot be undone.`)) {
                                  deleteUserMutation.mutate(userData.id);
                                }
                              }}
                              disabled={deleteUserMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : searchTerm ? (
            <Card className="p-12 text-center">
              <Search className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
              <p className="text-muted-foreground mb-4">
                No users match your search for "{searchTerm}". Try a different search term.
              </p>
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Clear Search
              </Button>
            </Card>
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

      {/* Candle Management Modal */}
      <Dialog open={showCandleModal} onOpenChange={setShowCandleModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Flame className="h-5 w-5 text-orange-600" />
              <span>Manage Candles</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="candle-amount">Amount</Label>
              <Input
                id="candle-amount"
                type="number"
                placeholder="Enter positive or negative amount..."
                value={candleAmount}
                onChange={(e) => setCandleAmount(e.target.value)}
              />
              <div className="text-xs text-muted-foreground mt-1">
                Use positive numbers to award candles, negative to spend them.
              </div>
            </div>

            <div>
              <Label htmlFor="candle-reason">Reason</Label>
              <Textarea
                id="candle-reason"
                placeholder="Explain why candles are being awarded or spent..."
                value={candleReason}
                onChange={(e) => setCandleReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={() => {
                  if (candleAmount && candleReason && selectedUserForCandles) {
                    candleTransactionMutation.mutate({
                      userId: selectedUserForCandles,
                      amount: parseInt(candleAmount),
                      reason: candleReason,
                    });
                  }
                }}
                disabled={!candleAmount || !candleReason || candleTransactionMutation.isPending}
                className="flex-1"
              >
                {candleTransactionMutation.isPending ? "Processing..." : "Update Candles"}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setShowCandleModal(false);
                  setSelectedUserForCandles(null);
                  setCandleAmount("");
                  setCandleReason("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}