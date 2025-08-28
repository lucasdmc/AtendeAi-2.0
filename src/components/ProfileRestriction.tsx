import useAuth from "@/hooks/useAuth";

interface ProfileRestrictionProps {
  roles: string[];
  children: React.ReactNode;
}

export default function ProfileRestriction({ roles, children }: ProfileRestrictionProps) {
  const { hasAnyRole } = useAuth();
  if (!hasAnyRole(roles)) return null;
  return <>{children}</>;
}