import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle } from 'lucide-react';

export default function AdminServices() {
    const qc = useQueryClient();
    const [status, setStatus] = useState('pending');

    const { data, isLoading } = useQuery({
        queryKey: ['admin-services', status],
        queryFn: () => adminApi.getServices({ status }).then(r => r.data),
    });

    const approve = async (id) => {
        try {
            await adminApi.approveService(id);
            toast.success('Service approved');
            qc.invalidateQueries(['admin-services']);
        } catch (e) {
            toast.error('Failed to approve service');
        }
    };

    const reject = async (id) => {
        try {
            await adminApi.rejectService(id);
            toast.success('Service rejected');
            qc.invalidateQueries(['admin-services']);
        } catch (e) {
            toast.error('Failed to reject service');
        }
    };

    return (
        <div className="page">
            <div className="container">
                <div className="page-header">
                    <h1>Service Approvals</h1>
                    <p>Review and moderate services submitted by professionals.</p>
                </div>

                <div className="card mb-16 flex gap-12" style={{ padding: 12 }}>
                    <div className="flex gap-8">
                        {['pending', 'active', 'rejected'].map(s => (
                            <button
                                key={s}
                                className={`btn btn-sm ${status === s ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => setStatus(s)}
                            >
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="card">
                    {isLoading ? (
                        <div className="loading-center"><span className="spinner" /></div>
                    ) : (
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Provider</th>
                                        <th>Service Title</th>
                                        <th>Category</th>
                                        <th>Status</th>
                                        <th>Submitted</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.data?.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="text-center text-muted" style={{ padding: 30 }}>
                                                No services found for status: {status}
                                            </td>
                                        </tr>
                                    )}
                                    {data?.data?.map(s => (
                                        <tr key={s.id}>
                                            <td className="fw-600">
                                                {s.provider?.name || 'Unknown Provider'}
                                                <div className="text-xs text-muted fw-400">{s.provider?.email}</div>
                                            </td>
                                            <td className="fw-600">{s.title}</td>
                                            <td>{s.category || 'Uncategorized'}</td>
                                            <td>
                                                <span className={`badge badge-${s.status === 'active' ? 'green' : s.status === 'rejected' ? 'red' : 'yellow'}`}>
                                                    {s.status}
                                                </span>
                                            </td>
                                            <td className="text-sm text-muted">{new Date(s.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <div className="flex gap-8">
                                                    {s.status === 'pending' && (
                                                        <>
                                                            <button className="btn btn-sm" style={{ background: '#38A169', color: 'white', border: 'none' }} onClick={() => approve(s.id)}>
                                                                <CheckCircle size={14} /> Approve
                                                            </button>
                                                            <button className="btn btn-danger btn-sm" onClick={() => reject(s.id)}>
                                                                <XCircle size={14} /> Reject
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
