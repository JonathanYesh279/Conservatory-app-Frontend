import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { AuthorizationManager, createAuthorizationContext } from '../utils/authorization';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  resource?: string;
  redirectTo?: string;
}

export function RouteGuard({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  resource,
  redirectTo = '/dashboard'
}: RouteGuardProps) {
  const { user, isAuthenticated, isInitialized, isLoading } = useAuthStore();

  // Wait for authentication to initialize
  if (!isInitialized || isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check role requirements
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => user.roles.includes(role));
    if (!hasRequiredRole) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const authContext = createAuthorizationContext(user, isAuthenticated);
    const authManager = new AuthorizationManager(authContext);
    
    const hasPermission = requiredPermissions.every(permission => {
      try {
        // Use the authorization manager to check permissions
        // You can extend this based on your specific permission system
        return authManager.hasRole(permission);
      } catch {
        return false;
      }
    });

    if (!hasPermission) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  return <>{children}</>;
}