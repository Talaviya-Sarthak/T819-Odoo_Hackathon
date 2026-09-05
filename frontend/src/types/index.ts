export type Role = 'SALES_REP' | 'MANAGER_ADMIN' | 'OPS_FINANCE' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: Role;
  customer_id?: string;
  status?: string;
  avatar_url?: string;
  email_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface NavItem {
  label: string;
  path: string;
  icon: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  login: (accessToken: string, refreshToken: string, userData: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
  handleRefreshToken: () => Promise<string | null>;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  message?: string;
}

export interface RegisterResponse {
  message: string;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
}

export interface VerifyEmailResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ApiError {
  error: string;
}

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export interface InputProps {
  label?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
}

export interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export interface OAuthButtonProps {
  provider: 'google' | 'github';
  onClick: () => void;
}

export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}
