import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    sallaData?: {
      salla_code?: string | null;
      salla_scope?: string | null;
      salla_state?: string | null;
    }
  ) => Promise<{ otpRequired?: boolean }>;
  verifyOTP: (
    name: string,
    email: string,
    password: string,
    otp: string,
    sallaData?: {
      salla_code?: string | null;
      salla_scope?: string | null;
      salla_state?: string | null;
    }
  ) => Promise<void>;
  resendOTP: (email: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      // const res = await fetch('https://api.descg.store/api/user', {
      const res = await fetch('http://127.0.0.1:8000/api/user', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        logout();
        setIsLoading(false);
        return;
      }

      const userData: User = await res.json();
      setUser(userData);
    } catch (error) {
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const payload = { email, password };

      // const response = await fetch('https://api.descg.store/api/login', {
      const response = await fetch('http://127.0.0.1:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();

      localStorage.setItem('token', data.token);
      if (data.user) {
        setUser(data.user);
      } else {
        await fetchUser();
      }
    } catch (error) {
      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    sallaData?: {
      salla_code?: string | null;
      salla_scope?: string | null;
      salla_state?: string | null;
    }
  ): Promise<{ otpRequired?: boolean }> => {
    try {
      const payload: any = { name, email, password };

      if (sallaData) {
        if (sallaData.salla_code) payload.salla_code = sallaData.salla_code;
        if (sallaData.salla_scope) payload.salla_scope = sallaData.salla_scope;
        if (sallaData.salla_state) payload.salla_state = sallaData.salla_state;
      }

      // const response = await fetch('https://api.descg.store/api/register', {
      const response = await fetch('http://127.0.0.1:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': window.location.origin,
        },
        mode: 'cors',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Check if OTP is required
      if (data.otp_required) {
        const result: any = { otpRequired: true };
        // For development, show OTP in console only
        if (data.dev_otp) {
          result.devOtp = data.dev_otp;
        }
        return result;
      }

      // If no OTP required, complete registration

      // If no OTP required, complete registration
      localStorage.setItem('token', data.token);
      if (data.user) {
        setUser(data.user);
      } else {
        await fetchUser();
      }
      
      return {};
    } catch (error) {
      throw error;
    }
  };

  const verifyOTP = async (
    name: string,
    email: string,
    password: string,
    otp: string,
    sallaData?: {
      salla_code?: string | null;
      salla_scope?: string | null;
      salla_state?: string | null;
    }
  ) => {
    setIsLoading(true);
    try {
      const payload: any = { 
        name, 
        email, 
        password, 
        otp,
        type: 'registration'
      };

      if (sallaData) {
        if (sallaData.salla_code) payload.salla_code = sallaData.salla_code;
        if (sallaData.salla_scope) payload.salla_scope = sallaData.salla_scope;
        if (sallaData.salla_state) payload.salla_state = sallaData.salla_state;
      }

      // const response = await fetch('https://api.descg.store/api/register', {
      const response = await fetch('http://127.0.0.1:8000/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }

      localStorage.setItem('token', data.token);
      if (data.user) {
        setUser(data.user);
      } else {
        await fetchUser();
      }
    } catch (error) {
      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resendOTP = async (email: string) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/otp/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ 
          email,
          type: 'registration'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, verifyOTP, resendOTP, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
