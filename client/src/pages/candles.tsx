import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Flame, Menu, Plus, Minus, History, Award } from "lucide-react";
import { format } from "date-fns";

type User = {
  id: string;
  username: string;
  playerName: string;
  playerNumber?: string;
  candles: number;
  title?: string;
};

type CandleTransaction = {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  createdBy: string;
  createdAt: string;
  adminName?: string;
  giverName?: string;
};

export default function CandlesPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionReason, setTransactionReason] = useState("");
  const { toast } = useToast();

  // Redirect to login if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      setLocation("/login");
    }
  }, [authLoading, user, setLocation]);

  const { data: rawPlayers = [], isLoading: playersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin?type=users"],
    enabled: !!user?.isAdmin,
  });

  // Sort players alphabetically by player name
  const players = rawPlayers.sort((a, b) => {
    const nameA = (a.playerName || a.username || "").toLowerCase();
    const nameB = (b.playerName || b.username || "").toLowerCase();
    return nameA.localeCompare(nameB);
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<CandleTransaction[]>({
    queryKey: ["/api/admin?type=candle-transactions", selectedUser?.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin?type=candle-transactions&userId=${selectedUser?.id}`);
      return response.json();
    },
    enabled: !!selectedUser?.id,
  });

  // Ensure transactions is always an array
  const safeTransactions: CandleTransaction[] = Array.isArray(transactions) ? transactions : [];

  const candleTransactionMutation = useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) => {
      return apiRequest("POST", `/api/admin/users/${userId}/candles`, { amount, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin?type=users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin?type=candle-transactions", selectedUser?.id] });
      setShowTransactionModal(false);
      setTransactionAmount("");
      setTransactionReason("");
      toast({
        title: "Candle transaction completed",
        description: "The candle balance has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Transaction failed",
        description: error.message || "Failed to update candle balance",
        variant: "destructive",
      });
    },
  });

  const handlePlayerClick = (player: User) => {
    setSelectedUser(player);
    setShowTransactionModal(false); // Ensure we show transaction history first
  };

  const handleAddCandles = () => {
    setTransactionAmount("");
    setTransactionReason("");
    setShowTransactionModal(true);
  };

  const handleSubmitTransaction = () => {
    if (selectedUser && transactionAmount && transactionReason) {
      candleTransactionMutation.mutate({
        userId: selectedUser.id,
        amount: parseInt(transactionAmount),
        reason: transactionReason,
      });
    }
  };

  if (authLoading || playersLoading) {
    return (
      <div className="flex h-screen bg-background">
        {!isMobile && user && (
          <Sidebar 
            user={user} 
            currentPath="/candles"
          />
        )}

        {isMobile && user && (
          <MobileNav
            isOpen={isMobileNavOpen}
            onClose={() => setIsMobileNavOpen(false)}
            user={user}
            currentPath="/candles"
          />
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          {isMobile && (
            <div className="border-b border-border bg-background p-4 flex items-center justify-between lg:hidden">
              <h1 className="text-xl font-semibold">Candle Management</h1>
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground"
                onClick={() => setIsMobileNavOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          )}

          <div className="flex-1 overflow-auto">
            <div className="container mx-auto py-8">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-gray-600 dark:text-gray-400">
              You need admin privileges to access candle management.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {!isMobile && user && (
        <Sidebar 
          user={user} 
          currentPath="/candles"
        />
      )}

      {isMobile && user && (
        <MobileNav
          isOpen={isMobileNavOpen}
          onClose={() => setIsMobileNavOpen(false)}
          user={user}
          currentPath="/candles"
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {isMobile && (
          <div className="border-b border-border bg-background p-4 flex items-center justify-between lg:hidden">
            <h1 className="text-xl font-semibold">Candle Management</h1>
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground"
              onClick={() => setIsMobileNavOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Candle Management</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage player candle balances and view transaction history
                </p>
              </div>
            </div>

            {players.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Flame className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No players found</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    No players are currently registered in the system.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {players.map((player) => (
                  <Card 
                    key={player.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handlePlayerClick(player)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{player.playerName}</CardTitle>
                          <CardDescription>@{player.username}</CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Flame className="h-4 w-4 text-orange-600" />
                          <span className="text-lg font-bold">{player.candles}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {player.title && (
                            <Badge variant="secondary" className="text-xs">
                              {player.title}
                            </Badge>
                          )}
                          {player.playerNumber && (
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                              #{player.playerNumber}
                            </span>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayerClick(player);
                          }}
                        >
                          <Award className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction History Modal */}
      <Dialog open={!!selectedUser && !showTransactionModal} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Flame className="h-5 w-5 text-orange-600" />
              <span>{selectedUser?.playerName} - Candle History</span>
            </DialogTitle>
            <DialogDescription>
              Current balance: {selectedUser?.candles} candles
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Transaction History</h3>
              <Button onClick={handleAddCandles}>
                <Plus className="h-4 w-4 mr-2" />
                Add/Remove Candles
              </Button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {transactionsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4 p-3 border rounded">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
                    </div>
                  ))}
                </div>
              ) : safeTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No candle transactions found for this player
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {safeTransactions.map((transaction: CandleTransaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount} candles
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            by {transaction.adminName || transaction.giverName || 'Unknown'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                          {transaction.reason}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {format(new Date(transaction.createdAt), 'MMM d, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {format(new Date(transaction.createdAt), 'h:mm a')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Remove Candles Modal */}
      <Dialog open={showTransactionModal} onOpenChange={setShowTransactionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Flame className="h-5 w-5 text-orange-600" />
              <span>Manage Candles - {selectedUser?.playerName}</span>
            </DialogTitle>
            <DialogDescription>
              Current balance: {selectedUser?.candles} candles
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="transaction-amount">Amount</Label>
              <Input
                id="transaction-amount"
                type="number"
                placeholder="Enter positive or negative amount..."
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
              />
              <div className="text-xs text-muted-foreground mt-1">
                Use positive numbers to award candles, negative to spend them.
              </div>
            </div>

            <div>
              <Label htmlFor="transaction-reason">Reason</Label>
              <Textarea
                id="transaction-reason"
                placeholder="Explain why candles are being awarded or spent..."
                value={transactionReason}
                onChange={(e) => setTransactionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowTransactionModal(false);
                setTransactionAmount("");
                setTransactionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitTransaction}
              disabled={!transactionAmount || !transactionReason || candleTransactionMutation.isPending}
            >
              {candleTransactionMutation.isPending ? "Processing..." : "Update Candles"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}