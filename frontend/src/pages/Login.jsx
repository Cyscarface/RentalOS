import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, LogIn } from 'lucide-react';
import Logo from '../components/Logo';
import { useGoogleLogin } from '@react-oauth/google';
import './Auth.css';

const schema = z.object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(1, 'Password is required'),
});

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data) => {
        try {
            const res = await authApi.login(data);

            login(res.data.access_token, res.data.user);
            toast.success(`Welcome back, ${res.data.user.name}!`);
            navigate('/dashboard');
        } catch (err) {
            const errBody = err.response?.data;
            if (errBody?.errors?.requires_otp) {
                toast('Please verify your OTP to continue.', { icon: '🔐' });
                navigate('/verify-otp', { state: { userId: errBody.errors.user_id } });
                return;
            }

            const msg = errBody?.message || 'Login failed. Please try again.';
            toast.error(msg);
        }
    };

    const handleGoogleSuccess = async (tokenResponse) => {
        try {
            const res = await authApi.googleCallback({ token: tokenResponse.access_token });

            if (res.data.requires_completion) {
                navigate('/register', { state: { googleUser: res.data.google_user } });
                return;
            }

            login(res.data.access_token, res.data.user);
            toast.success(`Welcome back, ${res.data.user.name}!`);
            navigate('/dashboard');
        } catch (err) {
            toast.error('Failed to log in with Google.');
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        onError: () => toast.error('Google login failed.'),
    });

    return (
        <div className="auth-page">
            <div className="auth-card">
                {/* Header */}
                <div className="auth-header">
                    <Logo size={56} style={{ marginBottom: 16, filter: 'drop-shadow(0 4px 16px rgba(102,252,241,0.2))' }} />
                    <h1 className="auth-title">Welcome back</h1>
                    <p className="auth-subtitle">Sign in to your RentalOS account</p>
                </div>

                <div className="google-auth-wrapper" style={{ marginBottom: 24, textAlign: 'center' }}>
                    <button type="button" onClick={() => googleLogin()} className="btn btn-full" style={{ background: '#fff', color: '#1f2937', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', gap: 12 }}>
                        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>or</span>
                        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <div className="form-group">
                        <label className="form-label">Email address</label>
                        <div className="input-icon-wrap">
                            <Mail size={16} className="input-icon" />
                            <input
                                type="email"
                                className="form-input input-with-icon"
                                placeholder="you@example.com"
                                {...register('email')}
                            />
                        </div>
                        {errors.email && <p className="form-error">{errors.email.message}</p>}
                    </div>

                    <div className="form-group">
                        <div className="flex-between" style={{ marginBottom: 6 }}>
                            <label className="form-label" style={{ margin: 0 }}>Password</label>
                            <Link to="/forgot-password" style={{ fontSize: '0.78rem', color: 'var(--teal)' }}>Forgot password?</Link>
                        </div>
                        <div className="input-icon-wrap">
                            <Lock size={16} className="input-icon" />
                            <input
                                type="password"
                                className="form-input input-with-icon"
                                placeholder="••••••••"
                                {...register('password')}
                            />
                        </div>
                        {errors.password && <p className="form-error">{errors.password.message}</p>}
                    </div>

                    <button type="submit" className="btn btn-primary btn-full btn-lg mt-16" disabled={isSubmitting}>
                        {isSubmitting ? <span className="spinner" /> : <><LogIn size={17} /> Sign In</>}
                    </button>
                </form>

                <p className="auth-footer">
                    Don't have an account? <Link to="/register">Create one</Link>
                </p>
            </div>

            {/* Background orbs */}
            <div className="auth-orb auth-orb-1" />
            <div className="auth-orb auth-orb-2" />
        </div>
    );
}
