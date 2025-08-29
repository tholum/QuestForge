import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAccessToken } from './jwt';

/**
 * Server-side authentication utilities for Next.js App Router
 */
export class AuthServer {
  /**
   * Get current user from server-side cookies
   */
  static async getCurrentUser() {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('auth-token')?.value;

      if (!token) {
        return null;
      }

      const payload = verifyAccessToken(token);
      return payload;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    const user = await AuthServer.getCurrentUser();
    return user !== null;
  }

  /**
   * Require authentication - redirect to login if not authenticated
   */
  static async requireAuth(): Promise<void> {
    const isAuth = await AuthServer.isAuthenticated();
    if (!isAuth) {
      redirect('/auth/login');
    }
  }

  /**
   * Get user ID from server-side context
   */
  static async getUserId(): Promise<string | null> {
    const user = await AuthServer.getCurrentUser();
    return user?.userId || null;
  }

  /**
   * Check if user has specific role
   */
  static async hasRole(role: string): Promise<boolean> {
    const user = await AuthServer.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Require specific role - redirect if not authorized
   */
  static async requireRole(role: string): Promise<void> {
    await AuthServer.requireAuth();
    
    const hasRequiredRole = await AuthServer.hasRole(role);
    if (!hasRequiredRole) {
      redirect('/unauthorized');
    }
  }

  /**
   * Clear authentication cookies
   */
  static async clearAuth(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');
    cookieStore.delete('refresh-token');
  }

  /**
   * Set authentication cookies
   */
  static async setAuthCookies(tokens: { token: string; refreshToken: string }): Promise<void> {
    const cookieStore = await cookies();
    
    cookieStore.set('auth-token', tokens.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    cookieStore.set('refresh-token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  /**
   * Get authentication token from cookies
   */
  static async getToken(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get('auth-token')?.value || null;
  }

  /**
   * Get refresh token from cookies
   */
  static async getRefreshToken(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get('refresh-token')?.value || null;
  }

  /**
   * Verify and refresh token if needed
   */
  static async verifyAndRefreshToken(): Promise<string | null> {
    try {
      const token = await AuthServer.getToken();
      const refreshToken = await AuthServer.getRefreshToken();

      if (!token) {
        return null;
      }

      // Try to verify current token
      try {
        verifyAccessToken(token);
        return token; // Token is still valid
      } catch (error) {
        // Token expired, try to refresh
        if (refreshToken) {
          try {
            // For now, just clear auth if token expires
            // TODO: Implement refresh token functionality
            await AuthServer.clearAuth();
            return null;
          } catch (refreshError) {
            // Refresh failed, clear auth
            await AuthServer.clearAuth();
            return null;
          }
        }
        return null;
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      await AuthServer.clearAuth();
      return null;
    }
  }
}

// Export convenient functions
export const getCurrentUser = AuthServer.getCurrentUser;
export const isAuthenticated = AuthServer.isAuthenticated;
export const requireAuth = AuthServer.requireAuth;
export const getUserId = AuthServer.getUserId;
export const hasRole = AuthServer.hasRole;
export const requireRole = AuthServer.requireRole;
export const clearAuth = AuthServer.clearAuth;
export const setAuthCookies = AuthServer.setAuthCookies;
export const getToken = AuthServer.getToken;
export const getRefreshToken = AuthServer.getRefreshToken;
export const verifyAndRefreshToken = AuthServer.verifyAndRefreshToken;