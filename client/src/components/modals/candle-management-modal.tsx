import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Flame, Plus, Minus, History } from "lucide-react";
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
};

interface CandleManagementModalProps {
  user: User | null;
  onClose: () => void;
  showAdminControls?: boolean;
}

export default function CandleManagementModal({ user, onClose, showAdminControls = true }: CandleManagementModalProps) {
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionReason, setTransactionReason] = useState("");
  const { toast } = useToast();

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<CandleTransaction[]>({
    queryKey: ["/api/admin?type=candle-transactions&userId=" + user?.id],
    queryFn: () => apiRequest("GET", `/api/admin?type=candle-transactions&userId=${user?.id}`).then(res => res.json()),
    enabled: !!user?.id,
    refetchOnMount: true,
  });

  const candleTransactionMutation = useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) => {
      return apiRequest("POST", `/api/admin`, { type: "candles", userId, amount, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin?type=users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin?type=candle-transactions&userId=" + user?.id] });
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

  const handleAddCandles = () => {
    setTransactionAmount("");
    setTransactionReason("");
    setShowTransactionModal(true);
  };

  const handleSubmitTransaction = () => {
    if (user && transactionAmount && transactionReason) {
      candleTransactionMutation.mutate({
        userId: user.id,
        amount: parseInt(transactionAmount),
        reason: transactionReason,
      });
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Transaction History Modal */}
      <Dialog open={!!user && !showTransactionModal} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Flame className="h-5 w-5 text-orange-600" />
              <span>{user.playerName} - Candle History</span>
            </DialogTitle>
            <DialogDescription>
              Current balance: {user.candles} candles
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Transaction History</h3>
              {showAdminControls && (
                <Button onClick={handleAddCandles}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add/Remove Candles
                </Button>
              )}
            </div>

            {transactionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No candle transactions found</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={transaction.amount > 0 ? "default" : "destructive"}
                          className="font-mono"
                        >
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                        </Badge>
                        <span className="font-medium">{transaction.reason}</span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {transaction.adminName && (
                          <span>By {transaction.adminName} • </span>
                        )}
                        {format(new Date(transaction.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Remove Candles Modal - Only show if admin controls are enabled */}
      {showAdminControls && (
        <Dialog open={showTransactionModal} onOpenChange={setShowTransactionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Flame className="h-5 w-5 text-orange-600" />
              <span>Add/Remove Candles</span>
            </DialogTitle>
            <DialogDescription>
              Adjust candle balance for {user.playerName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="candle-amount">Amount</Label>
              <Input
                id="candle-amount"
                type="number"
                placeholder="Enter positive or negative amount..."
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
              />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Use positive numbers to add candles, negative to remove
              </p>
            </div>

            <div>
              <Label htmlFor="candle-reason">Reason</Label>
              <Textarea
                id="candle-reason"
                placeholder="Reason for candle adjustment..."
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
      )}
    </>
  );
}