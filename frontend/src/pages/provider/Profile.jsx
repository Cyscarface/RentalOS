import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    User, Camera, Edit3, Save, X, Wrench,
    CheckCircle2, Star, ShieldCheck, Mail, Smartphone
} from 'lucide-react';
import { providerProfileApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function ProviderProfile() {
    const { refreshUser } = useAuth();
    const queryClient = useQueryClient();
    const fileRef = useRef();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ name: '', bio: '', availability_status: true, preferences: {} });

    const { data: profile, isLoading } = useQuery({
        queryKey: ['provider-profile'],
        queryFn: () => providerProfileApi.get().then(r => r.data),
        staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
        if (profile) {
            setForm({
                name: profile.name,
                bio: profile.bio || '',
                availability_status: profile.availability_status ?? true,
                preferences: profile.preferences || {}
            });
        }
    }, [profile]);

    const updateMutation = useMutation({
        mutationFn: (data) => providerProfileApi.update(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['provider-profile'] });
            toast.success('Profile updated!');
            setEditing(false);
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
    });

    const avatarMutation = useMutation({
        mutationFn: (formData) => providerProfileApi.uploadAvatar(formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['provider-profile'] });
            refreshUser();
            toast.success('Avatar updated!');
        },
        onError: () => toast.error('Avatar upload failed'),
    });

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('avatar', file);
        avatarMutation.mutate(fd);
    };

    const handleSave = () => updateMutation.mutate(form);

    const setPref = (key, value) => {
        setForm(f => ({ ...f, preferences: { ...f.preferences, [key]: value } }));
    };

    const avatarUrl = profile?.avatar ? `${profile.avatar}?t=${Date.now()}` : null;
    const stats = profile?.stats || { total_services: 0, active_services: 0, completed_bookings: 0 };
    const completeness = Math.round(
        ((profile?.avatar ? 1 : 0) + (profile?.bio ? 1 : 0) + (stats.total_services > 0 ? 1 : 0)) / 3 * 100
    );

    if (isLoading) {
        return <div className="page"><div className="container"><div className="loading-center"><span className="spinner spinner-lg" /></div></div></div>;
    }

    return (
        <div className="page">
            <div className="container">
                <div className="page-header flex-between">
                    <div><h1>Professional Profile</h1><p>Manage your business identity and services</p></div>
                    <Link to="/provider" className="btn btn-outline" style={{ fontSize: '0.85rem' }}>← Dashboard</Link>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

                    {/* ── LEFT PANEL: Main Profile details ─────────────────────────── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                        {/* Top Card: Identity */}
                        <div className="card" style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                {avatarUrl
                                    ? <img src={avatarUrl} alt="Avatar" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--teal)' }} />
                                    : <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--surface-2)', border: '3px solid var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={40} color="var(--teal)" /></div>
                                }
                                <button
                                    onClick={() => fileRef.current?.click()}
                                    disabled={avatarMutation.isPending}
                                    style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: 'var(--teal)', border: '2px solid var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                    title="Change avatar"
                                >
                                    {avatarMutation.isPending ? <div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> : <Camera size={13} color="var(--navy)" />}
                                </button>
                                <input ref={fileRef} type="file" accept="image/jpg,image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleAvatarChange} />
                            </div>

                            <div style={{ flex: 1 }}>
                                {editing ? (
                                    <input
                                        className="form-input"
                                        value={form.name}
                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: 8 }}
                                    />
                                ) : (
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {profile?.name}
                                        {profile?.is_verified && <ShieldCheck size={20} color="var(--teal)" title="Verified Professional" />}
                                    </h2>
                                )}
                                <p className="text-muted text-sm flex gap-8 mb-4">
                                    <span style={{ color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Star size={14} fill="currentColor" /> {profile?.rating ? Number(profile.rating).toFixed(1) : 'New'}
                                    </span>
                                    <span>·</span>
                                    <span>{stats.completed_bookings} Jobs Completed</span>
                                </p>
                                <p className="text-muted text-sm">{profile?.email}</p>
                            </div>

                            <div style={{ alignSelf: 'flex-start' }}>
                                {editing ? (
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setForm({ name: profile.name, bio: profile.bio || '', availability_status: profile.availability_status, preferences: profile.preferences || {} }); }}>
                                            <X size={13} /> Cancel
                                        </button>
                                        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={updateMutation.isPending}>
                                            <Save size={13} /> {updateMutation.isPending ? 'Saving…' : 'Save'}
                                        </button>
                                    </div>
                                ) : (
                                    <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}><Edit3 size={13} /> Edit Profile</button>
                                )}
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="card">
                            <h3 className="fw-700 mb-16">Professional Bio</h3>
                            {editing ? (
                                <textarea
                                    className="form-textarea"
                                    value={form.bio}
                                    onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                                    placeholder="Describe your experience, qualifications, and specialties..."
                                    rows={5}
                                    maxLength={1000}
                                />
                            ) : (
                                <p className="text-sm" style={{ color: form.bio ? 'var(--text)' : 'var(--text-dim)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                                    {profile?.bio || 'Add a professional bio to build trust with potential clients.'}
                                </p>
                            )}
                        </div>

                        {/* Services List Hint */}
                        <div className="card" style={{ background: 'rgba(56, 178, 172, 0.05)', border: '1px solid rgba(56, 178, 172, 0.2)' }}>
                            <div className="flex-between">
                                <div>
                                    <h3 className="fw-700 mb-4" style={{ color: 'var(--teal)' }}>Professional Services</h3>
                                    <p className="text-sm text-muted">You have {stats.total_services} listed services ({stats.active_services} active).</p>
                                </div>
                                <Link to="/provider/services" className="btn btn-primary btn-sm">Manage Services</Link>
                            </div>
                            {stats.total_services > stats.active_services && (
                                <div className="mt-16 text-sm" style={{ color: 'var(--yellow)' }}>
                                    ⚠️ Some of your services are currently pending admin review before they go live.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── RIGHT PANEL: Availability, Progress & Settings ─────────────────────────── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                        {/* Availability Toggle */}
                        <div className="card" style={{ textAlign: 'center' }}>
                            <h3 className="fw-600 mb-16">Work Availability</h3>
                            <button
                                onClick={() => {
                                    if (!editing) return;
                                    setForm(f => ({ ...f, availability_status: !f.availability_status }));
                                }}
                                style={{
                                    width: '100%', padding: '12px', borderRadius: 'var(--radius)', border: 'none',
                                    background: (editing ? form.availability_status : profile?.availability_status) ? 'rgba(72, 187, 120, 0.15)' : 'rgba(160, 174, 192, 0.15)',
                                    color: (editing ? form.availability_status : profile?.availability_status) ? 'var(--green)' : 'var(--text-muted)',
                                    fontWeight: 700, cursor: editing ? 'pointer' : 'default', transition: '0.2s',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                }}
                            >
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: (editing ? form.availability_status : profile?.availability_status) ? 'var(--green)' : 'currentColor' }} />
                                {(editing ? form.availability_status : profile?.availability_status) ? 'Accepting New Jobs' : 'Fully Booked / Unavailable'}
                            </button>
                            {editing && <p className="text-xs text-muted mt-8">Click to toggle your public availability status.</p>}
                        </div>

                        {/* Profile Completeness */}
                        <div className="card">
                            <div className="flex-between mb-8">
                                <span className="fw-600 text-sm">Profile Completeness</span>
                                <span className="fw-700 text-sm" style={{ color: 'var(--teal)' }}>{completeness}%</span>
                            </div>
                            <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${completeness}%`, background: 'var(--teal)', transition: '0.5s' }} />
                            </div>
                            <ul className="text-xs text-muted mt-12" style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <li style={{ color: profile?.avatar ? 'var(--green)' : 'inherit' }}>{profile?.avatar ? '✓' : '○'} Upload Profile Photo</li>
                                <li style={{ color: profile?.bio ? 'var(--green)' : 'inherit' }}>{profile?.bio ? '✓' : '○'} Write Professional Bio</li>
                                <li style={{ color: stats.total_services > 0 ? 'var(--green)' : 'inherit' }}>{stats.total_services > 0 ? '✓' : '○'} Add at least one Service</li>
                            </ul>
                        </div>

                        {/* Notifications */}
                        <div className="card">
                            <h3 className="fw-700 mb-16 text-sm text-muted" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Notifications</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {[
                                    { key: 'notify_email', icon: <Mail size={16} />, title: 'Email Alerts' },
                                    { key: 'notify_sms', icon: <Smartphone size={16} />, title: 'SMS Alerts' },
                                ].map(({ key, icon, title }) => (
                                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: editing ? 1 : 0.7 }}>
                                        <div className="flex gap-8 text-sm fw-600">{icon} {title}</div>
                                        <div style={{ position: 'relative', width: 36, height: 20, cursor: editing ? 'pointer' : 'default' }}>
                                            <input
                                                type="checkbox"
                                                checked={form.preferences?.[key] ?? false}
                                                onChange={e => setPref(key, e.target.checked)}
                                                disabled={!editing}
                                                style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                                            />
                                            <span style={{ position: 'absolute', inset: 0, borderRadius: 10, background: (form.preferences?.[key]) ? 'var(--teal)' : 'var(--border)', transition: '0.2s' }}>
                                                <span style={{ position: 'absolute', top: 2, left: (form.preferences?.[key]) ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: '0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {editing && (
                            <div className="text-right">
                                <button className="btn btn-primary w-full" onClick={handleSave} disabled={updateMutation.isPending}>
                                    <Save size={15} style={{ marginRight: 6 }} /> Save All Changes
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
