import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle } from 'lucide-react';

export default function AdminProperties() {
    const qc = useQueryClient();
    const [rejectModal, setRejectModal] = useState(null);
    const [reason, setReason] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['admin-properties'],
        queryFn: () => adminApi.properties({ status: 'pending' }).then(r => r.data),
    });

    const approve = async (id) => {
        try {
            await adminApi.approve?.(id) || await fetch(`/api/properties/${id}/approve`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            toast.success('Property approved!'); qc.invalidateQueries(['admin-properties']);
        }
        catch { toast.error('Failed.'); }
    };

    const reject = async () => {
        try {
            await adminApi.reject?.(rejectModal, reason);
            toast.success('Property rejected.'); setRejectModal(null); setReason(''); qc.invalidateQueries(['admin-properties']);
        }
        catch { toast.error('Failed.'); }
    };

    // Add missing methods to adminApi inline
    const doApprove = async (id) => {
        const token = localStorage.getItem('token');
        await fetch(`http://localhost:8000/api/properties/${id}/approve`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
        toast.success('Property approved!'); qc.invalidateQueries(['admin-properties']);
    };
    const doReject = async () => {
        const token = localStorage.getItem('token');
        await fetch(`http://localhost:8000/api/properties/${rejectModal}/reject`, {
            method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ reason }),
        });
        toast.success('Property rejected.'); setRejectModal(null); setReason(''); qc.invalidateQueries(['admin-properties']);
    };

    return (
        <div className="page">
            <div className="container">
                <div className="page-header">
                    <h1>Property Approvals</h1>
                    <p>Review and approve or reject landlord listing submissions</p>
                </div>

                {rejectModal && (
                    <div className="modal-overlay" onClick={() => setRejectModal(null)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <h3 className="modal-title">Reject Property</h3>
                            <div className="form-group">
                                <label className="form-label">Reason</label>
                                <textarea className="form-textarea" rows={4} placeholder="Explain why this listing is being rejected..." value={reason} onChange={e => setReason(e.target.value)} />
                            </div>
                            <div className="flex gap-8 mt-16">
                                <button className="btn btn-ghost" onClick={() => setRejectModal(null)}>Cancel</button>
                                <button className="btn btn-danger" style={{ flex: 1 }} onClick={doReject}>Confirm Rejection</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="card">
                    {isLoading
                        ? <div className="loading-center"><span className="spinner" /></div>
                        : data?.data?.length === 0
                            ? <div className="empty-state"><p>✅ No pending property approvals.</p></div>
                            : <div className="table-wrap">
                                <table>
                                    <thead><tr><th>Title</th><th>Landlord</th><th>County</th><th>Beds</th><th>Rent</th><th>Submitted</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        {data?.data?.map(p => (
                                            <tr key={p.id}>
                                                <td className="fw-600">{p.title}</td>
                                                <td className="text-muted">{p.landlord?.name}</td>
                                                <td>{p.county}</td>
                                                <td>{p.bedrooms}</td>
                                                <td className="fw-600" style={{ color: 'var(--teal)' }}>KSh {Number(p.rent_amount).toLocaleString()}</td>
                                                <td className="text-sm text-muted">{new Date(p.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    <div className="flex gap-8">
                                                        <button className="btn btn-primary btn-sm" onClick={() => doApprove(p.id)}><CheckCircle size={13} /> Approve</button>
                                                        <button className="btn btn-danger btn-sm" onClick={() => setRejectModal(p.id)}><XCircle size={13} /> Reject</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                    }
                </div>
            </div>
        </div>
    );
}
