import { useQuery } from "@tanstack/react-query";

interface ReplitAuthUser {
  claims?: {
    name?: string;
    email?: string;
    sub?: string;
    [key: string]: any;
  };
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<ReplitAuthUser>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}