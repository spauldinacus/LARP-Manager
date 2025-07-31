import { useAuth, type AuthUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import {
  LayoutDashboard,
  Users,
  Star,
  Calendar,
  UserCog,
  Settings,
  LogOut,
  X,
  Building2,
  Shield,
  TrendingUp,
} from "lucide-react";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser;
  currentPath: string;
}

const navigationItems = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    adminOnly: false,
  },
  {
    href: "/characters",
    icon: Users,
    label: "Characters",
    adminOnly: false,
  },
  {
    href: "/progression",
    icon: TrendingUp,
    label: "XP Progression",
    adminOnly: false,
  },
  {
    href: "/events",
    icon: Calendar,
    label: "Events",
    adminOnly: false,
  },
  {
    href: "/chapters",
    icon: Building2,
    label: "Chapters",
    adminOnly: true,
  },
  {
    href: "/players",
    icon: Users,
    label: "Players",
    adminOnly: true,
  },
  {
    href: "/users",
    icon: UserCog,
    label: "User Management",
    adminOnly: true,
  },
  {
    href: "/roles",
    icon: Shield,
    label: "Role Management",
    adminOnly: true,
  },
  {
    href: "/settings",
    icon: Settings,
    label: "Settings",
    adminOnly: true,
  },
];

export default function MobileNav({ isOpen, onClose, user, currentPath }: MobileNavProps) {
  const { logout } = useAuth();

  const visibleItems = navigationItems.filter(
    (item) => !item.adminOnly || user.isAdmin
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 w-64 bg-sidebar">
        {/* Header */}
        <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-sidebar-primary">Thrune LARP</h1>
            <p className="text-sm text-sidebar-foreground/70">Character Management</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary-foreground">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.username}
              </p>
              <p className="text-xs text-sidebar-foreground/70">
                {user.isAdmin ? "Administrator" : "Player"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => {
              logout();
              onClose();
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
