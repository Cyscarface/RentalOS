import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ShieldCheck, Mail } from 'lucide-react';
import Logo from '../components/Logo';
import './Auth.css';

export default function VerifyOtp() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const userId = location.state?.userId;

    const [otp, setOtp] = useState(Array(6).fill(''));
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(600); // 10 min in seconds
    const refs = Array.from({ length: 6 }, () => useRef(null));

    // Countdown timer
    useEffect(() => {
        if (!userId) { navigate('/register'); return; }
        const id = setInterval(() => setTimer(t => (t > 0 ? t - 1 : 0)), 1000);
        return () => clearInterval(id);
    }, [userId]);

    const handleChange = (index, val) => {
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
        setLoading(true);
        try {
            const res = await authApi.verifyOtp({ user_id: userId, otp: code });
            login(res.data.access_token, res.data.user);
            toast.success('Verified! Welcome to RentalOS 🎉');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.errors?.otp?.[0] || 'Invalid or expired OTP.');
            setOtp(Array(6).fill(''));
            refs[0].current?.focus();
        } finally {
            setLoading(false);
        }
    };

    const fmt = `${Math.floor(timer / 60)}:${String(timer % 60).padStart(2, '0')}`;

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <Logo size={56} style={{ marginBottom: 16, filter: 'drop-shadow(0 4px 16px rgba(102,252,241,0.2))' }} />
                    <h1 className="auth-title">Verify your email</h1>
                    <p className="auth-subtitle">Enter the 6-digit code sent to your email</p>
                </div>

                <form onSubmit={handleSubmit}>
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
                                onChange={e => handleChange(i, e.target.value)}
                                onKeyDown={e => handleKeyDown(i, e)}
                            />
                        ))}
                    </div>

                    <p className="otp-timer">
                        {timer > 0
                            ? <>Code expires in <strong>{fmt}</strong></>
                            : <span style={{ color: '#fc8181' }}>Code expired. Please register again.</span>}
                    </p>

                    <button
                        type="submit"
                        className="btn btn-primary btn-full btn-lg mt-16"
                        disabled={loading || timer === 0}
                    >
                        {loading ? <span className="spinner" /> : 'Verify Code'}
                    </button>
                </form>
            </div>
            <div className="auth-orb auth-orb-1" />
            <div className="auth-orb auth-orb-2" />
        </div>
    );
}
