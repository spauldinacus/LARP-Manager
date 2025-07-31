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
  Building2,
} from "lucide-react";

interface SidebarProps {
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
    href: "/experience",
    icon: Star,
    label: "Experience",
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
    href: "/users",
    icon: UserCog,
    label: "User Management",
    adminOnly: true,
  },
  {
    href: "/settings",
    icon: Settings,
    label: "Settings",
    adminOnly: true,
  },
];

export default function Sidebar({ user, currentPath }: SidebarProps) {
  const { logout } = useAuth();

  const visibleItems = navigationItems.filter(
    (item) => !item.adminOnly || user.isAdmin
  );

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex-shrink-0 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-primary">Thrune LARP</h1>
        <p className="text-sm text-sidebar-foreground/70">Character Management</p>
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
          onClick={logout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
