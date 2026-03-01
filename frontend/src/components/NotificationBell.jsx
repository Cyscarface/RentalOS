import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { notificationApi } from '../api';
import './NotificationBell.css';

const TYPE_ICONS = {
    payment_success: '✅',
    booking_confirmed: '🎉',
    booking_declined: '❌',
    booking_completed: '✅',
    new_message: '💬',
    viewing_approved: '🏠',
    property_approved: '✅',
    property_rejected: '⚠️',
};

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifs] = useState([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    // ── Poll unread count every 30s ────────────────────
    useEffect(() => {
        const fetchCount = async () => {
            try {
                const { data } = await notificationApi.unreadCount();
                setUnread(data?.data?.count ?? 0);
            } catch { }
        };
        fetchCount();
        const interval = setInterval(fetchCount, 30_000);
        return () => clearInterval(interval);
    }, []);

    // ── Close on outside click ─────────────────────────
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── Load notifications when bell is opened ─────────
    const handleOpen = async () => {
        const newOpen = !open;
        setOpen(newOpen);
        if (newOpen) {
            setLoading(true);
            try {
                const { data } = await notificationApi.list();
                setNotifs(data?.data?.notifications?.data ?? []);
                setUnread(data?.data?.unread_count ?? 0);
            } catch { }
            setLoading(false);
        }
    };

    // ── Mark a single notification as read ────────────
    const handleMarkRead = async (id) => {
        try {
            await notificationApi.markRead(id);
            setNotifs((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
            );
            setUnread((c) => Math.max(0, c - 1));
        } catch { }
    };

    // ── Mark all as read ──────────────────────────────
    const handleMarkAllRead = async () => {
        try {
            await notificationApi.markAllRead();
            setNotifs((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
            setUnread(0);
        } catch { }
    };

    const timeAgo = (dateStr) => {
        const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    return (
        <div className="notif-bell" ref={dropdownRef}>
            <button
                className={`notif-bell-btn ${open ? 'active' : ''}`}
                onClick={handleOpen}
                aria-label="Notifications"
                id="notification-bell-btn"
            >
                <Bell size={18} />
                {unread > 0 && (
                    <span className="notif-badge">{unread > 99 ? '99+' : unread}</span>
                )}
            </button>

            {open && (
                <div className="notif-dropdown" id="notification-dropdown">
                    <div className="notif-header">
                        <span>Notifications</span>
                        {unread > 0 && (
                            <button className="notif-mark-all" onClick={handleMarkAllRead}>
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="notif-list">
                        {loading ? (
                            <div className="notif-empty">Loading…</div>
                        ) : notifications.length === 0 ? (
                            <div className="notif-empty">
                                <Bell size={28} style={{ opacity: 0.3 }} />
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`notif-item ${!n.read_at ? 'unread' : ''}`}
                                    onClick={() => !n.read_at && handleMarkRead(n.id)}
                                >
                                    <span className="notif-icon">{TYPE_ICONS[n.type] ?? '🔔'}</span>
                                    <div className="notif-body">
                                        <p className="notif-title">{n.title}</p>
                                        <p className="notif-text">{n.body}</p>
                                        <p className="notif-time">{timeAgo(n.created_at)}</p>
                                    </div>
                                    {!n.read_at && <span className="notif-dot" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
