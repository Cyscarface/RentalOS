import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';
import Logo from '../components/Logo';
import './Auth.css';

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [userId, setUserId] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) { toast.error('Please enter your email address.'); return; }
        setLoading(true);
        try {
            const res = await authApi.forgotPassword({ email });
            // user_id is returned only for real accounts; null for unknown emails
            setUserId(res.data?.user_id ?? null);
            setSent(true);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <Logo size={56} style={{ marginBottom: 16, filter: 'drop-shadow(0 4px 16px rgba(102,252,241,0.2))' }} />
                    <h1 className="auth-title">Forgot Password?</h1>
                    <p className="auth-subtitle">
                        {sent
                            ? 'Check your email for the reset code'
                            : "Enter your email and we'll send you a reset code"}
                    </p>
                </div>

                {sent ? (
                    /* ── Sent state ── */
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%',
                            background: 'rgba(0,212,170,0.12)', border: '2px solid var(--teal)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 20px',
                        }}>
                            <CheckCircle2 size={30} color="var(--teal)" />
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.7 }}>
                            If <strong style={{ color: 'var(--text)' }}>{email}</strong> is registered,
                            a 6-digit reset code has been sent. Check your inbox (and spam folder).
                        </p>
                        <button
                            className="btn btn-primary btn-full btn-lg"
                            onClick={() => navigate('/reset-password', { state: { userId, email } })}
                        >
                            <ArrowRight size={17} /> Enter Reset Code
                        </button>
                        <button
                            className="btn btn-ghost btn-sm btn-full"
                            style={{ marginTop: 10 }}
                            onClick={() => { setSent(false); setEmail(''); }}
                        >
                            Try a different email
                        </button>
                    </div>
                ) : (
                    /* ── Email form ── */
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="form-group">
                            <label className="form-label">Email address</label>
                            <div className="input-icon-wrap">
                                <Mail size={16} className="input-icon" />
                                <input
                                    type="email"
                                    className="form-input input-with-icon"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-full btn-lg mt-16"
                            disabled={loading}
                        >
                            {loading ? <span className="spinner" /> : <><ArrowRight size={17} /> Send Reset Code</>}
                        </button>
                    </form>
                )}

                <p className="auth-footer">
                    Remember your password? <Link to="/login">Sign in</Link>
                </p>
            </div>

            <div className="auth-orb auth-orb-1" />
            <div className="auth-orb auth-orb-2" />
        </div>
    );
}
