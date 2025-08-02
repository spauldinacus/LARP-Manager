import { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi, type AuthUser } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";

export type { AuthUser };

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (playerName: string, email: string, password: string, chapterId?: string) => Promise<void>;
  logout: () => Promise<void>;
  refetch: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading, refetch } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: () => authApi.getCurrentUser(),
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (currentUser?.user) {
      setUser(currentUser.user);
    }
  }, [currentUser]);

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login({ email, password }),
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(["/api/auth/me"], data);
      toast({
        title: "Welcome back!",
        description: "Successfully logged in.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: ({ playerName, email, password, chapterId }: { playerName: string; email: string; password: string; chapterId?: string }) =>
      authApi.register({ playerName, email, password, chapterId }),
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(["/api/auth/me"], data);
      toast({
        title: "Account created!",
        description: "Welcome to Thrune LARP.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "See you next time!",
      });
    },
  });

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const register = async (playerName: string, email: string, password: string, chapterId?: string) => {
    await registerMutation.mutateAsync({ playerName, email, password, chapterId });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
