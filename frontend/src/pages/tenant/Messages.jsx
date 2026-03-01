import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { messageApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Send } from 'lucide-react';

export default function TenantMessages() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const [selectedUser, setSelectedUser] = useState(null);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);

    const { data: convos } = useQuery({
        queryKey: ['conversations'],
        queryFn: () => messageApi.conversations().then(r => r.data),
        refetchInterval: 10000,
    });

    const { data: thread } = useQuery({
        queryKey: ['thread', selectedUser?.id],
        queryFn: () => messageApi.thread(selectedUser.id).then(r => r.data),
        enabled: !!selectedUser,
        refetchInterval: 8000,
    });

    const send = async () => {
        if (!text.trim() || !selectedUser) return;
        setSending(true);
        try {
            await messageApi.send({ receiver_id: selectedUser.id, body: text.trim() });
            setText('');
            qc.invalidateQueries(['thread', selectedUser.id]);
        } catch { } finally { setSending(false); }
    };

    return (
        <div className="page">
            <div className="container">
                <div className="page-header"><h1>Messages</h1><p>Chat with your landlord or service providers</p></div>

                <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, height: 560 }}>
                    {/* Sidebar */}
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-2)', fontWeight: 700 }}>Conversations</div>
                        <div style={{ overflowY: 'auto' }}>
                            {convos?.length === 0 && <p className="text-muted text-sm" style={{ padding: 16 }}>No conversations yet.</p>}
                            {convos?.map(c => (
                                <button key={c.contact.id} onClick={() => setSelectedUser(c.contact)}
                                    style={{
                                        width: '100%', textAlign: 'left', padding: '14px 16px', border: 'none',
                                        background: selectedUser?.id === c.contact.id ? 'var(--teal-glow)' : 'transparent',
                                        borderBottom: '1px solid var(--border-2)', cursor: 'pointer',
                                        borderLeft: selectedUser?.id === c.contact.id ? '3px solid var(--teal)' : '3px solid transparent',
                                    }}>
                                    <div className="flex-between mb-4">
                                        <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)' }}>{c.contact.name}</span>
                                        {c.unread_count > 0 && <span className="badge badge-teal">{c.unread_count}</span>}
                                    </div>
                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {c.last_message?.body ?? '—'}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chat area */}
                    <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        {!selectedUser
                            ? <div className="flex-center" style={{ flex: 1, color: 'var(--text-muted)' }}>Select a conversation to start chatting</div>
                            : <>
                                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-2)', fontWeight: 700 }}>{selectedUser.name}</div>
                                <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {thread?.map(m => {
                                        const mine = m.sender_id === user.id;
                                        return (
                                            <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                                                <div style={{
                                                    background: mine ? 'var(--teal)' : 'var(--surface-2)',
                                                    color: mine ? 'var(--navy)' : 'var(--text)',
                                                    padding: '8px 14px', borderRadius: 12, maxWidth: '70%',
                                                    fontSize: '0.88rem', fontWeight: mine ? 600 : 400,
                                                }}>
                                                    {m.body}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-2)', display: 'flex', gap: 10 }}>
                                    <input className="form-input" style={{ flex: 1 }} placeholder="Type a message..."
                                        value={text} onChange={e => setText(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && send()} />
                                    <button className="btn btn-primary" onClick={send} disabled={sending || !text.trim()}>
                                        {sending ? <span className="spinner" /> : <Send size={16} />}
                                    </button>
                                </div>
                            </>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}
