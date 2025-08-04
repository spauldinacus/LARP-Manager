import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Shield, User, Users, Crown } from "lucide-react";

interface RoleManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    username: string;
    playerName: string;
    role: string;
    isAdmin: boolean;
  };
}

const roleIcons = {
  user: <User className="h-4 w-4" />,
  moderator: <Users className="h-4 w-4" />,
  admin: <Shield className="h-4 w-4" />,
  super_admin: <Crown className="h-4 w-4" />
};

const roleColors = {
  user: "bg-gray-100 text-gray-800",
  moderator: "bg-blue-100 text-blue-800",
  admin: "bg-purple-100 text-purple-800",
  super_admin: "bg-red-100 text-red-800"
};

const roleDescriptions = {
  user: "Basic user with access to own characters and events",
  moderator: "Can manage characters, events, and view users",
  admin: "Full admin access including user and chapter management",
  super_admin: "Unrestricted access to all system functions"
};

export default function RoleManagementModal({ isOpen, onClose, user }: RoleManagementModalProps) {
  const [selectedRole, setSelectedRole] = useState(user.role);
  const { toast } = useToast();

  const { data: roles = [] } = useQuery<string[]>({
    queryKey: ["/api/roles"],
    enabled: isOpen,
    refetchOnMount: true,
  });

  const { data: permissions = {} } = useQuery<Record<string, string[]>>({
    queryKey: ["/api/permissions"],
    enabled: isOpen,
    refetchOnMount: true,
  });

  const updateRoleMutation = useMutation({
    mutationFn: (role: string) => apiRequest("PATCH", `/api/users/${user.id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/players"] });
      toast({
        title: "Role updated",
        description: `${user.playerName} is now a ${selectedRole}`,
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (selectedRole !== user.role) {
      updateRoleMutation.mutate(selectedRole);
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage User Role</DialogTitle>
          <DialogDescription>
            Update the role and permissions for {user.playerName} ({user.username})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Role */}
          <div className="space-y-2">
            <Label>Current Role</Label>
            <div className="flex items-center gap-2">
              <Badge className={roleColors[user.role as keyof typeof roleColors]}>
                {roleIcons[user.role as keyof typeof roleIcons]}
                <span className="ml-1 capitalize">{user.role.replace('_', ' ')}</span>
              </Badge>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label>New Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    <div className="flex items-center gap-2">
                      {roleIcons[role as keyof typeof roleIcons]}
                      <span className="capitalize">{role.replace('_', ' ')}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role Description */}
          {selectedRole && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  {roleIcons[selectedRole as keyof typeof roleIcons]}
                  {selectedRole.replace('_', ' ').toUpperCase()}
                </CardTitle>
                <CardDescription>
                  {roleDescriptions[selectedRole as keyof typeof roleDescriptions]}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Permissions:</h4>
                  <div className="flex flex-wrap gap-1">
                    {permissions[selectedRole]?.map((permission: string) => (
                      <Badge key={permission} variant="outline" className="text-xs">
                        {permission.replace('_', ' ')}
                      </Badge>
                    )) || (
                      selectedRole === 'super_admin' ? (
                        <Badge variant="outline" className="text-xs">All Permissions</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">No special permissions</span>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={updateRoleMutation.isPending}
          >
            {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}