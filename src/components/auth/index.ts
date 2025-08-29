/**
 * Authentication components exports
 * Centralizes all auth-related UI components
 */

export { LoginForm } from './LoginForm'
export { RegisterForm } from './RegisterForm'
export { PasswordResetForm } from './PasswordResetForm'
export { ResetPasswordForm } from './ResetPasswordForm'
export { AuthLayout } from './AuthLayout'
export { ProtectedRoute } from './ProtectedRoute'

// Re-export types
export type { User, LoginData, RegisterData, PasswordResetRequestData, PasswordResetData } from '@/hooks/useAuth'