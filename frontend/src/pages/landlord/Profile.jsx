import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    User, Camera, Edit3, Save, X, Building2,
    Users, Clock, Bell, MessageSquare, CheckCircle2, ShieldCheck
} from 'lucide-react';
import { landlordProfileApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function LandlordProfile() {
    const { refreshUser } = useAuth();
    const queryClient = useQueryClient();
    const fileRef = useRef();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ name: '', bio: '', preferences: {} });

    const { data: profile, isLoading } = useQuery({
        queryKey: ['landlord-profile'],
        queryFn: () => landlordProfileApi.get().then(r => r.data),
        staleTime: 5 * 60 * 1000,
    });

    // Sync form when profile data arrives
    useEffect(() => {
        if (profile) {
            setForm({ name: profile.name, bio: profile.bio || '', preferences: profile.preferences || {} });
        }
    }, [profile]);

    const updateMutation = useMutation({
        mutationFn: (data) => landlordProfileApi.update(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['landlord-profile'] });
            toast.success('Profile updated!');
            setEditing(false);
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
    });

    const avatarMutation = useMutation({
        mutationFn: (formData) => landlordProfileApi.uploadAvatar(formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['landlord-profile'] });
            refreshUser(); // update auth context so navbar avatar refreshes
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
    const stats = profile?.stats || { total_properties: 0, active_properties: 0, pending_properties: 0, total_tenants: 0 };

    if (isLoading) {
        return <div className="page"><div className="container"><div className="loading-center"><span className="spinner spinner-lg" /></div></div></div>;
    }

    return (
        <div className="page">
            <div className="container">
                <div className="page-header flex-between">
                    <div><h1>My Profile</h1><p>Manage your landlord account and preferences</p></div>
                    <Link to="/landlord" className="btn btn-outline" style={{ fontSize: '0.85rem' }}>← Dashboard</Link>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>

                    {/* ── LEFT PANEL: Identity & Bio ─────────────────────────── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Avatar & Name */}
                        <div className="card" style={{ textAlign: 'center' }}>
                            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
                                {avatarUrl
                                    ? <img src={avatarUrl} alt="Avatar" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--teal)', display: 'block' }} />
                                    : <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--surface-2)', border: '3px solid var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={40} color="var(--teal)" /></div>
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

                            {editing ? (
                                <input
                                    className="form-input"
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}
                                />
                            ) : (
                                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 4 }}>{profile?.name}</h2>
                            )}
                            <p className="text-muted text-sm flex-center gap-8 mb-4"><ShieldCheck size={12} color="var(--teal)" /> Landlord Account</p>
                            <p className="text-muted text-sm">{profile?.email}</p>

                            <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
                                {editing ? (
                                    <>
                                        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={updateMutation.isPending}>
                                            <Save size={13} /> {updateMutation.isPending ? 'Saving…' : 'Save'}
                                        </button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setForm({ name: profile.name, bio: profile.bio || '', preferences: profile.preferences || {} }); }}>
                                            <X size={13} /> Cancel
                                        </button>
                                    </>
                                ) : (
                                    <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}><Edit3 size={13} /> Edit Profile</button>
                                )}
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="card">
                            <p className="form-label" style={{ marginBottom: 10 }}>About Me</p>
                            {editing ? (
                                <textarea
                                    className="form-textarea"
                                    value={form.bio}
                                    onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                                    placeholder="Write a short bio. Tenants will see this on your property listings…"
                                    rows={4}
                                    maxLength={1000}
                                />
                            ) : (
                                <p className="text-sm" style={{ color: form.bio ? 'var(--text)' : 'var(--text-dim)', lineHeight: 1.7 }}>
                                    {profile?.bio || 'Add a bio to tell tenants more about yourself and your properties.'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ── RIGHT PANEL: Stats & Preferences ─────────────────────────── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                        {/* Stats Overview */}
                        <div className="card">
                            <h3 className="fw-700 mb-16">Portfolio Overview</h3>
                            <div className="grid-3">
                                <div style={{ background: 'var(--surface-2)', padding: 16, borderRadius: 'var(--radius)' }}>
                                    <Building2 size={24} color="var(--teal)" style={{ marginBottom: 8 }} />
                                    <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.total_properties}</div>
                                    <div className="text-muted text-sm">Total Properties</div>
                                </div>
                                <div style={{ background: 'var(--surface-2)', padding: 16, borderRadius: 'var(--radius)' }}>
                                    <CheckCircle2 size={24} color="var(--green)" style={{ marginBottom: 8 }} />
                                    <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.active_properties}</div>
                                    <div className="text-muted text-sm">Active Listings</div>
                                </div>
                                <div style={{ background: 'var(--surface-2)', padding: 16, borderRadius: 'var(--radius)' }}>
                                    <Users size={24} color="#7b61ff" style={{ marginBottom: 8 }} />
                                    <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.total_tenants}</div>
                                    <div className="text-muted text-sm">Active Tenants</div>
                                </div>
                            </div>
                            {stats.pending_properties > 0 && (
                                <div className="mt-16 text-sm flex gap-8" style={{ color: 'var(--yellow)', alignItems: 'center', background: 'rgba(252, 163, 17, 0.1)', padding: '10px 14px', borderRadius: 6 }}>
                                    <Clock size={16} /> You have {stats.pending_properties} properties pending admin approval.
                                </div>
                            )}
                            <div className="mt-16">
                                <Link to="/landlord/properties" className="btn btn-outline btn-sm">Manage Properties</Link>
                            </div>
                        </div>

                        {/* Account Settings / Preferences */}
                        <div className="card">
                            <h3 className="fw-700 mb-16">Account Settings</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                                {[
                                    { key: 'notify_email', icon: <MessageSquare size={16} />, title: 'Email Notifications', desc: 'Receive emails for new viewing requests and payments.' },
                                    { key: 'notify_sms', icon: <Bell size={16} />, title: 'SMS Alerts', desc: 'Get text message alerts for urgent updates.' },
                                    { key: 'auto_approve_viewings', icon: <CheckCircle2 size={16} />, title: 'Auto-Approve Viewings', desc: 'Automatically approve all inbound viewing requests from verified tenants.' },
                                ].map(({ key, icon, title, desc }) => (
                                    <div key={key} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: 16, background: 'var(--surface-2)', borderRadius: 'var(--radius)', opacity: editing ? 1 : 0.7 }}>
                                        <div style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, flexShrink: 0, marginTop: 2, cursor: editing ? 'pointer' : 'default' }}>
                                            <input
                                                type="checkbox"
                                                checked={form.preferences?.[key] ?? false}
                                                onChange={e => setPref(key, e.target.checked)}
                                                disabled={!editing}
                                                style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                                            />
                                            <span style={{ position: 'absolute', inset: 0, borderRadius: 12, background: (form.preferences?.[key]) ? 'var(--teal)' : 'var(--border)', transition: '0.2s' }}>
                                                <span style={{ position: 'absolute', top: 2, left: (form.preferences?.[key]) ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: '0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                                            </span>
                                        </div>
                                        <div>
                                            <div className="fw-600 flex gap-8" style={{ alignItems: 'center', marginBottom: 4 }}>
                                                {icon} {title}
                                            </div>
                                            <div className="text-sm text-muted">{desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {editing && (
                                <div className="mt-24 text-right">
                                    <button className="btn btn-primary" onClick={handleSave} disabled={updateMutation.isPending}>
                                        <Save size={15} /> {updateMutation.isPending ? 'Saving Preferences…' : 'Save Preferences'}
                                    </button>
                                </div>
                            )}
                        </div>

                    </div >
                </div >
            </div >
        </div >
    );
}
