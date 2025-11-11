import { useQuery } from "@tanstack/react-query";

export interface AuthUser {
  id?: string;
  firstName?: string | null;
  username?: string | null;
  claims?: {
    name?: string | null;
    email?: string | null;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
  };
}