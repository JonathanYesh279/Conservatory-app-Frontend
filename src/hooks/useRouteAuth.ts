import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { AuthorizationManager, createAuthorizationContext } from '../utils/authorization';

interface UseRouteAuthOptions {
  requiredRoles?: string[];
  requiredPermissions?: string[];
  resource?: string;
  redirectTo?: string;
}

export function useRouteAuth({
  requiredRoles = [],
  requiredPermissions = [],
  resource,
  redirectTo = '/dashboard'
}: UseRouteAuthOptions = {}) {
  const navigate = useNavigate();
  const { user, isAuthenticated, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) return;

    // Not authenticated
    if (!isAuthenticated || !user) {
      navigate('/login', { replace: true });
      return;
    }

    // Check role requirements
    if (requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(role => user.roles.includes(role));
      if (!hasRequiredRole) {
        navigate(redirectTo, { replace: true });
        return;
      }
    }

    // Check permission requirements
    if (requiredPermissions.length > 0) {
      const authContext = createAuthorizationContext(user, isAuthenticated);
      const authManager = new AuthorizationManager(authContext);
      
      const hasPermission = requiredPermissions.every(permission => {
        try {
          // Use the authorization manager to check permissions
          return authManager.hasRole(permission);
        } catch {
          return false;
        }
      });

      if (!hasPermission) {
        navigate(redirectTo, { replace: true });
        return;
      }
    }
  }, [isInitialized, isAuthenticated, user, requiredRoles, requiredPermissions, resource, redirectTo, navigate]);

  return {
    isAuthenticated,
    user,
    isAuthorized: isAuthenticated && user !== null
  };
}