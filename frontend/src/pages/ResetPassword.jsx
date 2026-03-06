import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../api';
import toast from 'react-hot-toast';
import { Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';
import './Auth.css';

export default function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();
    const userId = location.state?.userId;
    const email = location.state?.email;

    const [otp, setOtp] = useState(Array(6).fill(''));
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(600); // 10 min

    // Generate refs correctly (not inside a loop)
    const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

    useEffect(() => {
        // If navigated here without state, redirect to forgot-password
        if (!userId) { navigate('/forgot-password'); return; }
        refs[0].current?.focus();
        const id = setInterval(() => setTimer(t => (t > 0 ? t - 1 : 0)), 1000);
        return () => clearInterval(id);
    }, []);

    const handleOtpChange = (index, val) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...otp];
        next[index] = val;
        setOtp(next);
        if (val && index < 5) refs[index + 1].current?.focus();
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            refs[index - 1].current?.focus();
        }
    };

    const handlePaste = (e) => {
        const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (text.length === 6) {
            setOtp(text.split(''));
            refs[5].current?.focus();
        }
        e.preventDefault();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const code = otp.join('');

        if (code.length < 6) { toast.error('Enter the full 6-digit code.'); return; }
        if (password.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
        if (password !== confirm) { toast.error('Passwords do not match.'); return; }

        setLoading(true);
        try {
            await authApi.resetPassword({
                user_id: userId,
                otp: code,
                password,
                password_confirmation: confirm,
            });
            toast.success('Password reset! Please log in with your new password.');
            navigate('/login');
        } catch (err) {
            const msg = err.response?.data?.message || 'Reset failed. Check your code and try again.';
            toast.error(msg);
            // Clear OTP so user can re-enter
            setOtp(Array(6).fill(''));
            refs[0].current?.focus();
        } finally {
            setLoading(false);
        }
    };

    const fmt = `${Math.floor(timer / 60)}:${String(timer % 60).padStart(2, '0')}`;
    const expired = timer === 0;

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <Logo size={56} style={{ marginBottom: 16, filter: 'drop-shadow(0 4px 16px rgba(102,252,241,0.2))' }} />
                    <h1 className="auth-title">Reset your password</h1>
                    <p className="auth-subtitle">
                        {email
                            ? <>Code sent to <strong style={{ color: 'var(--text)' }}>{email}</strong></>
                            : 'Enter the code from your email'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    {/* OTP boxes */}
                    <p className="form-label" style={{ textAlign: 'center', marginBottom: 12 }}>6-Digit Reset Code</p>
                    <div className="otp-grid" onPaste={handlePaste}>
                        {otp.map((digit, i) => (
                            <input
                                key={i}
                                ref={refs[i]}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                className={`otp-box ${digit ? 'filled' : ''}`}
                                value={digit}
                                onChange={e => handleOtpChange(i, e.target.value)}
                                onKeyDown={e => handleKeyDown(i, e)}
                                disabled={expired}
                            />
                        ))}
                    </div>
                    <p className="otp-timer" style={{ marginBottom: 24 }}>
                        {expired
                            ? <span style={{ color: '#fc8181' }}>Code expired. <Link to="/forgot-password">Request a new one</Link></span>
                            : <>Code expires in <strong>{fmt}</strong></>
                        }
                    </p>

                    {/* New password */}
                    <div className="form-group">
                        <label className="form-label">New Password</label>
                        <div className="input-icon-wrap">
                            <Lock size={16} className="input-icon" />
                            <input
                                type={showPw ? 'text' : 'password'}
                                className="form-input input-with-icon"
                                style={{ paddingRight: 42 }}
                                placeholder="At least 8 characters"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                disabled={expired}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw(v => !v)}
                                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 0 }}
                            >
                                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {password.length > 0 && password.length < 8 && (
                            <p className="form-error">Password must be at least 8 characters</p>
                        )}
                    </div>

                    {/* Confirm password */}
                    <div className="form-group">
                        <label className="form-label">Confirm New Password</label>
                        <div className="input-icon-wrap">
                            <Lock size={16} className="input-icon" />
                            <input
                                type={showPw ? 'text' : 'password'}
                                className="form-input input-with-icon"
                                placeholder="Repeat your password"
                                value={confirm}
                                onChange={e => setConfirm(e.target.value)}
                                disabled={expired}
                            />
                        </div>
                        {confirm.length > 0 && confirm !== password && (
                            <p className="form-error">Passwords do not match</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-full btn-lg mt-8"
                        disabled={loading || expired}
                    >
                        {loading ? <span className="spinner" /> : '🔒 Reset Password'}
                    </button>
                </form>

                <p className="auth-footer">
                    Remembered it? <Link to="/login">Back to login</Link>
                </p>
            </div>

            <div className="auth-orb auth-orb-1" />
            <div className="auth-orb auth-orb-2" />
        </div>
    );
}
