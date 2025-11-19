import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { KeyRound, Lock } from 'lucide-react';

interface LoginScreenProps {
  onAuthenticated: () => void;
}

export function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  const [isSetup, setIsSetup] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkSetup();
  }, []);

  async function checkSetup() {
    try {
      const setupComplete = await window.api.auth.isSetup();
      setIsSetup(setupComplete);
    } catch (error) {
      toast.error('Failed to check authentication status');
      console.error('Setup check error:', error);
    } finally {
      setLoading(false);
    }
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (!isSetup && password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters';
    }

    if (!isSetup && password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      if (!isSetup) {
        // Setup mode - create initial password
        const result = await window.api.auth.setup(password);
        if (result.success) {
          toast.success('Password created successfully!');
          onAuthenticated();
        } else {
          toast.error(result.error || 'Failed to create password');
        }
      } else {
        // Login mode - verify password
        const result = await window.api.auth.verify(password);
        if (result.success) {
          onAuthenticated();
        } else {
          setErrors({ password: 'Incorrect password' });
          setPassword('');
          toast.error('Incorrect password');
        }
      }
    } catch (error) {
      toast.error('Authentication failed');
      console.error('Auth error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <Card className="w-[420px]">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            {isSetup ? (
              <Lock className="h-12 w-12 text-gray-700" />
            ) : (
              <KeyRound className="h-12 w-12 text-gray-700" />
            )}
          </div>
          <CardTitle className="text-2xl text-center">
            {isSetup ? 'Unlock EnvVault' : 'Welcome to EnvVault'}
          </CardTitle>
          <CardDescription className="text-center">
            {isSetup
              ? 'Enter your password to access your tokens'
              : 'Create a master password to secure your tokens'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">
                {isSetup ? 'Password' : 'Master Password'} *
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder={isSetup ? 'Enter your password' : 'Create a strong password'}
                className={errors.password ? 'border-red-500' : ''}
                autoFocus
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field (Setup only) */}
            {!isSetup && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  placeholder="Re-enter your password"
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* Info message for setup */}
            {!isSetup && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  Remember this password! You&apos;ll need it to access your tokens.
                  Make sure it&apos;s strong and secure.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting
                ? 'Please wait...'
                : isSetup
                  ? 'Unlock'
                  : 'Create Password & Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
