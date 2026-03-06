import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    User, Camera, Edit3, Save, X, Home, Clock, MapPin,
    BedDouble, Wallet, Bell, MessageSquare, CheckCircle,
    LogOut, ChevronDown
} from 'lucide-react';
import { tenantProfileApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

// ── Badge helper ────────────────────────────────────────────
const TYPE_CONFIG = {
    viewed: { label: 'Viewed', cls: 'badge-gray', icon: <Clock size={11} /> },
    applied: { label: 'Viewing Request', cls: 'badge-yellow', icon: <Home size={11} /> },
    active: { label: 'Active Tenant', cls: 'badge-green', icon: <CheckCircle size={11} /> },
    ended: { label: 'Ended', cls: 'badge-blue', icon: <LogOut size={11} /> },
};

function HistoryBadge({ type }) {
    const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.viewed;
    return <span className={`badge ${cfg.cls}`}>{cfg.icon} {cfg.label}</span>;
}

// ── Property card (for Recently Viewed grid) ─────────────────
function PropertyCard({ item }) {
    const p = item.property;
    if (!p) return null;
    return (
        <Link to={`/properties/${p.id}`} className="card card-sm" style={{ display: 'flex', gap: 12, alignItems: 'center', textDecoration: 'none' }}>
            {p.image_url
                ? <img src={p.image_url} alt={p.title} style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                : <div style={{ width: 56, height: 56, borderRadius: 8, background: 'var(--surface-2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Home size={20} color="var(--text-muted)" /></div>
            }
            <div style={{ minWidth: 0 }}>
                <p className="fw-600 truncate" style={{ fontSize: '0.9rem' }}>{p.title}</p>
                <p className="text-muted text-sm truncate"><MapPin size={11} style={{ display: 'inline', marginRight: 3 }} />{p.county}</p>
                <p className="text-sm" style={{ color: 'var(--teal)', fontWeight: 700 }}>KSh {Number(p.rent_amount).toLocaleString()}</p>
            </div>
        </Link>
    );
}

// ── Timeline entry ───────────────────────────────────────────
function TimelineEntry({ entry }) {
    const p = entry.property;
    return (
        <div style={{ display: 'flex', gap: 16, paddingBottom: 20 }}>
            {/* Dot + line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 32 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--teal)', border: '2px solid var(--navy)', marginTop: 4, flexShrink: 0, boxShadow: '0 0 6px rgba(0,212,170,0.5)' }} />
                <div style={{ flex: 1, width: 1, background: 'var(--border)', minHeight: 16 }} />
            </div>
            {/* Content */}
            <div className="card card-sm" style={{ flex: 1, marginBottom: 0 }}>
                <div className="flex-between mb-8">
                    <HistoryBadge type={entry.type} />
                    <span className="text-muted text-sm">{new Date(entry.occurred_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                {p ? (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        {p.image_url
                            ? <img src={p.image_url} alt={p.title} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                            : <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Home size={18} color="var(--text-muted)" /></div>
                        }
                        <div style={{ minWidth: 0 }}>
                            <Link to={`/properties/${p.id}`} className="fw-600 truncate" style={{ display: 'block', fontSize: '0.9rem' }}>{p.title}</Link>
                            <p className="text-muted text-sm"><MapPin size={11} style={{ display: 'inline', marginRight: 3 }} />{p.county}{p.estate ? `, ${p.estate}` : ''}</p>
                            <p className="text-sm" style={{ color: 'var(--teal)', fontWeight: 600 }}>KSh {Number(p.rent_amount).toLocaleString()}/mo · {p.bedrooms} <BedDouble size={11} style={{ display: 'inline' }} /></p>
                        </div>
                    </div>
                ) : <p className="text-muted text-sm">Property no longer available</p>}
                {entry.meta?.move_in_date && (
                    <p className="text-muted text-sm mt-8">Moved in: {new Date(entry.meta.move_in_date).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}</p>
                )}
                {entry.meta?.move_out_date && (
                    <p className="text-muted text-sm">Moved out: {new Date(entry.meta.move_out_date).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}</p>
                )}
            </div>
        </div>
    );
}

// ── Main component ───────────────────────────────────────────
export default function TenantProfile() {
    const { user: authUser, refreshUser } = useAuth();
    const queryClient = useQueryClient();
    const fileRef = useRef();
    const [editing, setEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('history');
    const [form, setForm] = useState({ name: '', bio: '', preferences: {} });

    const { data: profile, isLoading } = useQuery({
        queryKey: ['tenant-profile'],
        queryFn: () => tenantProfileApi.get().then(r => r.data),
        staleTime: 5 * 60 * 1000,
    });

    // Sync form when profile data arrives
    useEffect(() => {
        if (profile) {
            setForm({ name: profile.name, bio: profile.bio || '', preferences: profile.preferences || {} });
        }
    }, [profile]);

    const { data: recentViews } = useQuery({
        queryKey: ['recent-views'],
        queryFn: () => tenantProfileApi.recentViews().then(r => r.data),
        staleTime: 2 * 60 * 1000,
    });

    const { data: historyPages, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
        queryKey: ['property-history'],
        queryFn: ({ pageParam = 1 }) => tenantProfileApi.history(pageParam).then(r => r.data),
        getNextPageParam: (last) => last.current_page < last.last_page ? last.current_page + 1 : undefined,
        staleTime: 2 * 60 * 1000,
    });

    const historyItems = historyPages?.pages?.flatMap(p => p.data) ?? [];

    const updateMutation = useMutation({
        mutationFn: (data) => tenantProfileApi.update(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenant-profile'] });
            toast.success('Profile updated!');
            setEditing(false);
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
    });

    const avatarMutation = useMutation({
        mutationFn: (formData) => tenantProfileApi.uploadAvatar(formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenant-profile'] });
            refreshUser(); // refresh the auth context so navbar picks up any changes
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

    const handleSave = () => {
        updateMutation.mutate(form);
    };

    const setPref = (key, value) => {
        setForm(f => ({ ...f, preferences: { ...f.preferences, [key]: value } }));
    };

    const avatarUrl = profile?.avatar
        ? `${profile.avatar}?t=${Date.now()}`
        : null;

    if (isLoading) {
        return (
            <div className="page"><div className="container"><div className="loading-center"><div className="spinner spinner-lg" /></div></div></div>
        );
    }

    return (
        <div className="page">
            <div className="container">
                <div className="page-header flex-between">
                    <div><h1>My Profile</h1><p>Manage your account and view your property journey</p></div>
                    <Link to="/tenant" className="btn btn-outline" style={{ fontSize: '0.85rem' }}>← Dashboard</Link>
                </div>

                {/* Two-column layout */}
                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>

                    {/* ── LEFT PANEL ─────────────────────────── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Avatar + name card */}
                        <div className="card" style={{ textAlign: 'center' }}>
                            {/* Avatar */}
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
                            <p className="text-muted text-sm">{profile?.email}</p>
                            <p className="text-muted text-sm">{profile?.phone}</p>

                            <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
                                {editing ? (
                                    <>
                                        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={updateMutation.isPending}>
                                            <Save size={13} />{updateMutation.isPending ? 'Saving…' : 'Save'}
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

                        {/* Bio card */}
                        <div className="card">
                            <p className="form-label" style={{ marginBottom: 10 }}>About Me</p>
                            {editing ? (
                                <textarea
                                    className="form-textarea"
                                    value={form.bio}
                                    onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                                    placeholder="Write a short bio…"
                                    rows={4}
                                    maxLength={1000}
                                />
                            ) : (
                                <p className="text-sm" style={{ color: form.bio ? 'var(--text)' : 'var(--text-dim)', lineHeight: 1.7 }}>
                                    {profile?.bio || 'No bio added yet.'}
                                </p>
                            )}
                        </div>

                        {/* Preferences card */}
                        <div className="card">
                            <p className="form-label" style={{ marginBottom: 14 }}>Preferences</p>

                            <div className="form-group" style={{ marginBottom: 14 }}>
                                <label className="form-label" style={{ fontSize: '0.78rem' }}>Preferred Bedrooms</label>
                                <select
                                    className="form-select"
                                    value={form.preferences?.preferred_bedrooms ?? ''}
                                    onChange={e => setPref('preferred_bedrooms', e.target.value ? parseInt(e.target.value) : null)}
                                    disabled={!editing}
                                >
                                    <option value="">Any</option>
                                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} bedroom{n > 1 ? 's' : ''}</option>)}
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: 14 }}>
                                <label className="form-label" style={{ fontSize: '0.78rem' }}>Max Budget (KSh/month)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={form.preferences?.max_budget ?? ''}
                                    onChange={e => setPref('max_budget', e.target.value ? Number(e.target.value) : null)}
                                    placeholder="e.g. 25000"
                                    disabled={!editing}
                                    min={0}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {[
                                    { key: 'notify_email', icon: <MessageSquare size={13} />, label: 'Email notifications' },
                                    { key: 'notify_sms', icon: <Bell size={13} />, label: 'SMS notifications' },
                                ].map(({ key, icon, label }) => (
                                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: editing ? 'pointer' : 'default', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                                        <div style={{ position: 'relative', display: 'inline-block', width: 36, height: 20 }}>
                                            <input
                                                type="checkbox"
                                                checked={form.preferences?.[key] ?? false}
                                                onChange={e => setPref(key, e.target.checked)}
                                                disabled={!editing}
                                                style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                                            />
                                            <span style={{
                                                position: 'absolute', inset: 0, borderRadius: 10,
                                                background: (form.preferences?.[key]) ? 'var(--teal)' : 'var(--surface-2)',
                                                transition: '0.2s', border: '1px solid var(--border)',
                                            }}>
                                                <span style={{
                                                    position: 'absolute', top: 2, left: (form.preferences?.[key]) ? 18 : 2,
                                                    width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: '0.2s',
                                                }} />
                                            </span>
                                        </div>
                                        {icon} {label}
                                    </label>
                                ))}
                            </div>

                            {editing && (
                                <button className="btn btn-primary btn-sm btn-full mt-16" onClick={handleSave} disabled={updateMutation.isPending}>
                                    <Save size={13} />{updateMutation.isPending ? 'Saving…' : 'Save Preferences'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── RIGHT PANEL ─────────────────────────── */}
                    <div>
                        <div className="tabs">
                            <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                                🏠 History
                            </button>
                            <button className={`tab ${activeTab === 'recent' ? 'active' : ''}`} onClick={() => setActiveTab('recent')}>
                                👁 Recently Viewed
                            </button>
                        </div>

                        {/* History tab */}
                        {activeTab === 'history' && (
                            <div>
                                {historyItems.length === 0
                                    ? (
                                        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                                            <Home size={40} color="var(--text-dim)" style={{ margin: '0 auto 16px' }} />
                                            <p className="fw-600" style={{ marginBottom: 6 }}>No activity yet</p>
                                            <p className="text-muted text-sm">Browse properties to start your journey</p>
                                            <Link to="/" className="btn btn-primary btn-sm mt-16">Browse Properties</Link>
                                        </div>
                                    ) : (
                                        <div>
                                            {historyItems.map((entry, i) => (
                                                <TimelineEntry key={`${entry.type}-${entry.property?.id}-${i}`} entry={entry} />
                                            ))}
                                            {hasNextPage && (
                                                <div style={{ textAlign: 'center', marginTop: 8 }}>
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={() => fetchNextPage()}
                                                        disabled={isFetchingNextPage}
                                                    >
                                                        {isFetchingNextPage ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Loading…</> : <><ChevronDown size={14} /> Load More</>}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )
                                }
                            </div>
                        )}

                        {/* Recently Viewed tab */}
                        {activeTab === 'recent' && (
                            <div>
                                {!recentViews || recentViews.length === 0
                                    ? (
                                        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                                            <Clock size={40} color="var(--text-dim)" style={{ margin: '0 auto 16px' }} />
                                            <p className="fw-600" style={{ marginBottom: 6 }}>Nothing viewed yet</p>
                                            <p className="text-muted text-sm">Properties you browse will appear here</p>
                                            <Link to="/" className="btn btn-primary btn-sm mt-16">Browse Properties</Link>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                                            {recentViews.map((item, i) => (
                                                <PropertyCard key={`${item.property?.id}-${i}`} item={item} />
                                            ))}
                                        </div>
                                    )
                                }
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
