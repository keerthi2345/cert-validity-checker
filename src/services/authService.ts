import { AuthUser, UserRole } from '../types';

const TOKEN_KEY = 'veridoc_auth_token';
const USER_KEY = 'veridoc_auth_user';
const REGISTERED_USERS_KEY = 'veridoc_registered_users';

export interface LoginCredentials {
  email: string;
  password: string;
  role?: UserRole;
}

export interface StudentRegistrationData {
  name: string;
  email: string;
  password: string;
  institution: string;
  department: string;
  graduationYear: string;
  studentId?: string;
}

export interface AdminRegistrationData {
  name: string;
  email: string;
  password: string;
  organization: string;
  designation: string;
  adminCode?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

// Default pre-seeded users for quick testing
const DEFAULT_USERS: Array<AuthUser & { password?: string }> = [
  {
    id: 'usr-student-aarav',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.edu.in',
    password: 'student123',
    role: 'student',
    studentId: '2025-XII-88421',
    institution: 'Central Board of Secondary Education (CBSE)'
  },
  {
    id: 'usr-student-priya',
    name: 'Priya Patel',
    email: 'priya.patel@example.edu.in',
    password: 'student123',
    role: 'student',
    studentId: '2025-XII-99312',
    institution: 'Delhi Technological University'
  },
  {
    id: 'usr-admin-rajesh',
    name: 'Dr. Rajesh Verma',
    email: 'admin@cbse.nic.in',
    password: 'admin123',
    role: 'admin',
    institution: 'Central Board of Secondary Education - Academic Verification Cell'
  },
  {
    id: 'usr-admin-meera',
    name: 'Prof. Meera Kulkarni',
    email: 'examiner@university.edu.in',
    password: 'admin123',
    role: 'admin',
    institution: 'National Credential Verification Authority'
  }
];

export const authService = {
  getRegisteredUsers(): Array<AuthUser & { password?: string }> {
    try {
      const stored = localStorage.getItem(REGISTERED_USERS_KEY);
      if (!stored) {
        localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS;
      }
      return JSON.parse(stored);
    } catch {
      return DEFAULT_USERS;
    }
  },

  saveRegisteredUsers(users: Array<AuthUser & { password?: string }>) {
    try {
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn('Failed to persist users in localStorage', e);
    }
  },

  async registerStudent(data: StudentRegistrationData): Promise<AuthUser> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const email = data.email.trim().toLowerCase();
    const existing = this.getRegisteredUsers();

    if (existing.some((u) => u.email.toLowerCase() === email)) {
      throw new Error('An account with this email address already exists. Please log in.');
    }

    const newUser: AuthUser & { password?: string } = {
      id: `usr-student-${Date.now()}`,
      name: data.name.trim(),
      email,
      role: 'student',
      studentId: data.studentId || `STU-${Math.floor(10000 + Math.random() * 90000)}`,
      institution: data.institution.trim(),
      password: data.password
    };

    existing.push(newUser);
    this.saveRegisteredUsers(existing);

    return newUser;
  },

  async registerAdmin(data: AdminRegistrationData): Promise<AuthUser> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const email = data.email.trim().toLowerCase();
    const existing = this.getRegisteredUsers();

    if (existing.some((u) => u.email.toLowerCase() === email)) {
      throw new Error('An admin account with this official email already exists. Please log in.');
    }

    const newAdmin: AuthUser & { password?: string } = {
      id: `usr-admin-${Date.now()}`,
      name: data.name.trim(),
      email,
      role: 'admin',
      institution: `${data.organization.trim()} (${data.designation.trim()})`,
      password: data.password
    };

    existing.push(newAdmin);
    this.saveRegisteredUsers(existing);

    return newAdmin;
  },

  async login(credentials: LoginCredentials, expectedRole?: UserRole): Promise<AuthUser> {
    const email = credentials.email.trim().toLowerCase();
    const password = credentials.password;

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address.');
    }

    if (!password || password.length < 4) {
      throw new Error('Password must be at least 4 characters long.');
    }

    // 1. Try real server endpoint if available
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          role: expectedRole || credentials.role
        })
      });

      if (response.ok) {
        const data: AuthResponse = await response.json();
        // Verify role match if expected
        if (expectedRole && data.user.role !== expectedRole) {
          throw new Error(`This account does not have ${expectedRole.toUpperCase()} permissions.`);
        }
        this.setSession(data.access_token, data.user);
        return data.user;
      }
    } catch (err: any) {
      if (err.message && err.message.includes('permissions')) {
        throw err;
      }
    }

    // 2. Client-side authentication fallback against local registered users
    await new Promise((resolve) => setTimeout(resolve, 350));

    const allUsers = this.getRegisteredUsers();
    const matchedUser = allUsers.find((u) => u.email.toLowerCase() === email);

    if (matchedUser) {
      if (matchedUser.password && matchedUser.password !== password) {
        throw new Error('Invalid email or password. Please check your credentials.');
      }

      if (expectedRole && matchedUser.role !== expectedRole) {
        throw new Error(
          `Access Denied: Account is registered as "${matchedUser.role.toUpperCase()}", not "${expectedRole.toUpperCase()}". Please use the ${matchedUser.role.toUpperCase()} portal.`
        );
      }

      const { password: _, ...cleanUser } = matchedUser;
      const mockJwt = this.generateMockJwt(cleanUser);
      cleanUser.token = mockJwt;
      this.setSession(mockJwt, cleanUser);
      return cleanUser;
    }

    // Generic fallback if unknown email but valid format
    if (password === 'wrong' || password === 'error') {
      throw new Error('Invalid email or password. Please check your credentials.');
    }

    const assignedRole: UserRole = expectedRole || credentials.role || 'student';
    const mockName = email.includes('.')
      ? email
          .split('@')[0]
          .split('.')
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(' ')
      : assignedRole === 'admin'
      ? 'Verification Administrator'
      : 'Student User';

    const fallbackUser: AuthUser = {
      id: `usr-${assignedRole}-${Date.now()}`,
      name: mockName,
      email,
      role: assignedRole,
      studentId: assignedRole === 'student' ? `STU-${Math.floor(10000 + Math.random() * 90000)}` : undefined,
      institution:
        assignedRole === 'admin'
          ? 'National Credential Verification Authority'
          : 'Central Board of Secondary Education (CBSE)'
    };

    const mockJwt = this.generateMockJwt(fallbackUser);
    fallbackUser.token = mockJwt;
    this.setSession(mockJwt, fallbackUser);
    return fallbackUser;
  },

  generateMockJwt(user: AuthUser): string {
    return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(
      JSON.stringify({
        sub: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        exp: Math.floor(Date.now() / 1000) + 86400 * 7
      })
    )}.simulatedSignaturePayload`;
  },

  setSession(token: string, user: AuthUser): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('Could not store auth session in localStorage', e);
    }
  },

  getStoredToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  getStoredUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  logout(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.warn('Error clearing auth session', e);
    }
  },

  isAuthenticated(): boolean {
    const token = this.getStoredToken();
    const user = this.getStoredUser();
    return !!(token && user);
  }
};
