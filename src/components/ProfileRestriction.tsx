import React from 'react';
import { useAuth } from '@/hooks/useAuth';

interface ProfileRestrictionProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireAll?: boolean;
}

const ProfileRestriction: React.FC<ProfileRestrictionProps> = ({ 
  children, 
  allowedRoles = [], 
  requireAll = false 
}) => {
  const { user } = useAuth();

  // Always show content for now (mock behavior)
  return <>{children}</>;
};

export const AdminLifyOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ProfileRestriction allowedRoles={['admin_lify']}>{children}</ProfileRestriction>;
};

export const AdminClinicOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ProfileRestriction allowedRoles={['admin_clinic']}>{children}</ProfileRestriction>;
};

export const AttendantOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ProfileRestriction allowedRoles={['attendant']}>{children}</ProfileRestriction>;
};

export const AdminOrAttendant: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ProfileRestriction allowedRoles={['admin_clinic', 'attendant']}>{children}</ProfileRestriction>;
};

export default ProfileRestriction;