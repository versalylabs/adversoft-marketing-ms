"use client";

import { useAuth } from '@/lib/auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/components/loading';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, ArrowLeft, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { UserRole, Permission, ROLE_DEFINITIONS } from '@/lib/rbac';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: Permission;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  requiredPermission,
}: ProtectedRouteProps) {
  const { user, isLoading, hasPermission, switchRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loading label="Authenticating session..." size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-3">
        <Loading label="Redirecting to login..." size="md" />
      </div>
    );
  }

  // Role verification
  const isRoleDenied = allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role);

  // Permission verification
  const isPermissionDenied = requiredPermission && !hasPermission(requiredPermission);

  if (isRoleDenied || isPermissionDenied) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <Card className="max-w-md w-full border-amber-200 shadow-xl text-center">
          <CardHeader className="space-y-2 pb-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">
              Access Restricted (RBAC Gate)
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              This module requires higher permissions than assigned to your current role.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-amber-50/80 p-3.5 border border-amber-200/60 text-left space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Your Current Role:</span>
                <Badge variant="outline" className="font-semibold text-amber-900 bg-white">
                  {user.role}
                </Badge>
              </div>
              {allowedRoles && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Required Roles:</span>
                  <span className="font-semibold text-gray-800">
                    {allowedRoles.join(', ')}
                  </span>
                </div>
              )}
              {requiredPermission && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Missing Permission:</span>
                  <span className="font-mono text-[11px] text-amber-800 bg-amber-100/60 px-1 rounded">
                    {requiredPermission}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Demo Role Switcher to Bypass Restriction */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Switch Role for Demonstration
              </p>
              <div className="flex justify-center gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => switchRole('Admin')}
                  className="gap-1.5 text-xs"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Switch to Admin</span>
                </Button>
                <Link href="/">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back to Dashboard</span>
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}