import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Lock, ChevronRight, ChevronLeft } from 'lucide-react';
import Logo from '../components/Logo';
import { useGoogleLogin } from '@react-oauth/google';
import './Auth.css';

const step1Schema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email'),
    phone: z.string().regex(/^(\+?254|0)[17]\d{8}$/, 'Must be a valid Kenyan number (e.g. 0712345678)'),
});

const step2Schema = z.object({
    role: z.enum(['tenant', 'landlord', 'provider'], { message: 'Select a role' }),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    password_confirmation: z.string(),
}).refine(d => d.password === d.password_confirmation, {
    message: "Passwords don't match",
    path: ['password_confirmation'],
});

const googleSchema = z.object({
    role: z.enum(['tenant', 'landlord', 'provider'], { message: 'Select a role' }),
    phone: z.string().regex(/^(\+?254|0)[17]\d{8}$/, 'Must be a valid Kenyan number (e.g. 0712345678)'),
});

const passwordStrength = (pw = '') => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    return score;
};
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];

const ROLES = [
    { value: 'tenant', label: 'Tenant', desc: 'Find & rent properties', emoji: '🏠' },
    { value: 'landlord', label: 'Landlord', desc: 'List & manage properties', emoji: '🏢' },
    { value: 'provider', label: 'Provider', desc: 'Offer home services', emoji: '🔧' },
];

export default function Register() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const [step, setStep] = useState(1);
    const [step1Data, setStep1Data] = useState(null);
    const [googleUser, setGoogleUser] = useState(location.state?.googleUser || null);
    const [selectedRole, setSelectedRole] = useState('');

    const form1 = useForm({ resolver: zodResolver(step1Schema) });
    const form2 = useForm({ resolver: zodResolver(step2Schema) });
    const formGoogle = useForm({ resolver: zodResolver(googleSchema) });

    const onStep1 = (data) => {
        setStep1Data(data);
        setStep(2);
    };

    const onStep2 = async (data) => {
        try {
            const payload = {
                ...step1Data,
                role: selectedRole,
                password: data.password,
                password_confirmation: data.password_confirmation
            };
            const res = await authApi.register(payload);
            toast.success('Account created! Check your email for the OTP.');
            navigate('/verify-otp', { state: { userId: res.data.user_id } });
        } catch (err) {
            const errors = err.response?.data?.errors;
            if (errors) {
                Object.entries(errors).forEach(([, msgs]) => toast.error(msgs[0]));
            } else {
                toast.error(err.response?.data?.message || 'Registration failed.');
            }
        }
    };

    const handleGoogleSuccess = async (tokenResponse) => {
        try {
            const res = await authApi.googleCallback({ token: tokenResponse.access_token });
            if (res.data.requires_completion) {
                setGoogleUser(res.data.google_user);
            } else {
                login(res.data.access_token, res.data.user);
                toast.success(`Welcome back, ${res.data.user.name}!`);
                navigate('/dashboard');
            }
        } catch (err) {
            toast.error('Failed to authenticate with Google.');
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        onError: () => toast.error('Google login failed.'),
    });

    const onGoogleCompletion = async (data) => {
        try {
            const payload = { ...googleUser, role: data.role, phone: data.phone };
            const res = await authApi.googleCompleteSignup(payload);
            login(res.data.access_token, res.data.user);
            toast.success(`Welcome to RentalOS, ${res.data.user.name}!`);
            navigate('/dashboard');
        } catch (err) {
            const errors = err.response?.data?.errors;
            if (errors) {
                Object.entries(errors).forEach(([, msgs]) => toast.error(msgs[0]));
            } else {
                toast.error(err.response?.data?.message || 'Failed to complete registration.');
            }
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ maxWidth: 480 }}>
                <div className="auth-header">
                    <Logo size={56} style={{ marginBottom: 16, filter: 'drop-shadow(0 4px 16px rgba(102,252,241,0.2))' }} />
                    <h1 className="auth-title">Create your account</h1>

                    {!googleUser && (
                        <div className="step-indicator">
                            <div className={`step-dot ${step >= 1 ? 'done' : ''}`} />
                            <div className="step-line" />
                            <div className={`step-dot ${step >= 2 ? 'done' : ''}`} />
                        </div>
                    )}
                </div>

                {!googleUser && (
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
                )}

                {googleUser && (
                    <form onSubmit={formGoogle.handleSubmit(onGoogleCompletion)} noValidate>
                        <p style={{ textAlign: 'center', marginBottom: 24, color: 'var(--text-muted)' }}>
                            Almost there, <strong>{googleUser.name}</strong>! We just need two more details to create your account.
                        </p>

                        <div className="form-group">
                            <label className="form-label">I am a...</label>
                            <div className="role-grid">
                                {ROLES.map(r => (
                                    <button
                                        key={r.value}
                                        type="button"
                                        className={`role-card ${selectedRole === r.value ? 'selected' : ''}`}
                                        onClick={() => { setSelectedRole(r.value); formGoogle.setValue('role', r.value); }}
                                    >
                                        <span className="role-emoji">{r.emoji}</span>
                                        <span className="role-label">{r.label}</span>
                                    </button>
                                ))}
                            </div>
                            {formGoogle.formState.errors.role && <p className="form-error">{formGoogle.formState.errors.role.message}</p>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <div className="input-icon-wrap">
                                <Phone size={16} className="input-icon" />
                                <input className="form-input input-with-icon" placeholder="0712 345 678" {...formGoogle.register('phone')} />
                            </div>
                            {formGoogle.formState.errors.phone && <p className="form-error">{formGoogle.formState.errors.phone.message}</p>}
                        </div>

                        <button type="submit" className="btn btn-primary btn-full btn-lg mt-8" disabled={formGoogle.formState.isSubmitting}>
                            {formGoogle.formState.isSubmitting ? <span className="spinner" /> : 'Complete Registration'}
                        </button>
                    </form>
                )}

                {!googleUser && step === 1 && (
                    <form onSubmit={form1.handleSubmit(onStep1)} noValidate>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <div className="input-icon-wrap">
                                <User size={16} className="input-icon" />
                                <input className="form-input input-with-icon" placeholder="John Kamau" {...form1.register('name')} />
                            </div>
                            {form1.formState.errors.name && <p className="form-error">{form1.formState.errors.name.message}</p>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <div className="input-icon-wrap">
                                <Mail size={16} className="input-icon" />
                                <input className="form-input input-with-icon" type="email" placeholder="you@example.com" {...form1.register('email')} />
                            </div>
                            {form1.formState.errors.email && <p className="form-error">{form1.formState.errors.email.message}</p>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <div className="input-icon-wrap">
                                <Phone size={16} className="input-icon" />
                                <input className="form-input input-with-icon" placeholder="0712 345 678" {...form1.register('phone')} />
                            </div>
                            {form1.formState.errors.phone && <p className="form-error">{form1.formState.errors.phone.message}</p>}
                        </div>

                        <button type="submit" className="btn btn-primary btn-full btn-lg mt-16">
                            Continue <ChevronRight size={17} />
                        </button>
                    </form>
                )}

                {!googleUser && step === 2 && (
                    <form onSubmit={form2.handleSubmit(onStep2)} noValidate>
                        <div className="form-group">
                            <label className="form-label">I am a...</label>
                            <div className="role-grid">
                                {ROLES.map(r => (
                                    <button
                                        key={r.value}
                                        type="button"
                                        className={`role-card ${selectedRole === r.value ? 'selected' : ''}`}
                                        onClick={() => { setSelectedRole(r.value); form2.setValue('role', r.value); }}
                                    >
                                        <span className="role-emoji">{r.emoji}</span>
                                        <span className="role-label">{r.label}</span>
                                        <span className="role-desc">{r.desc}</span>
                                    </button>
                                ))}
                            </div>
                            {form2.formState.errors.role && <p className="form-error">{form2.formState.errors.role.message}</p>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div className="input-icon-wrap">
                                <Lock size={16} className="input-icon" />
                                <input
                                    className="form-input input-with-icon"
                                    type="password"
                                    placeholder="Min 8 chars, upper, lower, number"
                                    {...form2.register('password')}
                                />
                            </div>

                            {/* Password strength bar */}
                            {(() => {
                                const pw = form2.watch('password') || '';
                                const score = passwordStrength(pw);
                                if (!pw) return null;
                                return (
                                    <div style={{ marginTop: 8 }}>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} style={{
                                                    flex: 1, height: 4, borderRadius: 2,
                                                    background: i <= score ? STRENGTH_COLORS[score] : 'var(--border)',
                                                    transition: 'background 0.3s ease',
                                                }} />
                                            ))}
                                        </div>
                                        {score > 0 && (
                                            <p style={{ fontSize: '0.72rem', color: STRENGTH_COLORS[score], marginTop: 4, fontWeight: 600 }}>
                                                {STRENGTH_LABELS[score]}
                                            </p>
                                        )}
                                    </div>
                                );
                            })()}

                            {form2.formState.errors.password && <p className="form-error">{form2.formState.errors.password.message}</p>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Confirm Password</label>
                            <div className="input-icon-wrap">
                                <Lock size={16} className="input-icon" />
                                <input className="form-input input-with-icon" type="password" placeholder="Repeat password" {...form2.register('password_confirmation')} />
                            </div>
                            {form2.formState.errors.password_confirmation && <p className="form-error">{form2.formState.errors.password_confirmation.message}</p>}
                        </div>

                        <div className="flex gap-8 mt-16">
                            <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
                                <ChevronLeft size={16} /> Back
                            </button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={form2.formState.isSubmitting}>
                                {form2.formState.isSubmitting ? <span className="spinner" /> : 'Create Account'}
                            </button>
                        </div>
                    </form>
                )}

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
            <div className="auth-orb auth-orb-1" />
            <div className="auth-orb auth-orb-2" />
        </div>
    );
}
