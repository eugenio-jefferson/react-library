import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuthSession } from "@/hooks/useAuthSession";
import { Spinner } from "../ui/spinner";

export interface RequireAuthProps {
  children: ReactNode;
}

function RequireAuth({ children }: Readonly<RequireAuthProps>) {
  const { isAuthenticated, isLoading } = useAuthSession();
  const location = useLocation();

  if (isLoading) {
    return (
      <article className="flex min-h-[calc(100svh-4.3rem)] flex-col items-center justify-center gap-4 bg-muted">
        <Spinner className="h-10 w-10" />
        <p className="text-lg text-muted-foreground">Loading...</p>
      </article>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

export default RequireAuth;
