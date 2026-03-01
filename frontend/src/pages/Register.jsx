import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Lock, ChevronRight, ChevronLeft } from 'lucide-react';
import './Auth.css';

const step1Schema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email'),
    phone: z.string().min(9, 'Enter a valid phone number'),
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

/** Returns 0-4 strength score for a password */
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
    const [step, setStep] = useState(1);
    const [step1Data, setStep1Data] = useState(null);

    const form1 = useForm({ resolver: zodResolver(step1Schema) });
    const form2 = useForm({ resolver: zodResolver(step2Schema) });
    const [selectedRole, setSelectedRole] = useState('');

    const onStep1 = (data) => {
        setStep1Data(data);
        setStep(2);
    };

    const onStep2 = async (data) => {
        try {
            const payload = { ...step1Data, ...data, role: selectedRole };
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

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ maxWidth: 480 }}>
                <div className="auth-header">
                    <div className="auth-logo">R</div>
                    <h1 className="auth-title">Create your account</h1>
                    <div className="step-indicator">
                        <div className={`step-dot ${step >= 1 ? 'done' : ''}`} />
                        <div className="step-line" />
                        <div className={`step-dot ${step >= 2 ? 'done' : ''}`} />
                    </div>
                </div>

                {step === 1 && (
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

                {step === 2 && (
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
