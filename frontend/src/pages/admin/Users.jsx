import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api';
import toast from 'react-hot-toast';
import { Search, UserX, UserCheck } from 'lucide-react';

export default function AdminUsers() {
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [role, setRole] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['admin-users', search, role],
        queryFn: () => adminApi.users({ search, role }).then(r => r.data),
    });

    const suspend = async (id) => { await adminApi.suspend(id); toast.success('User suspended.'); qc.invalidateQueries(['admin-users']); };
    const unsuspend = async (id) => { await adminApi.unsuspend(id); toast.success('User unsuspended.'); qc.invalidateQueries(['admin-users']); };

    return (
        <div className="page">
            <div className="container">
                <div className="page-header"><h1>Users</h1><p>Manage platform users</p></div>

                {/* Filters */}
                <div className="card card-sm mb-16 flex gap-12" style={{ flexWrap: 'wrap' }}>
                    <div className="input-icon-wrap" style={{ flex: 1, minWidth: 200 }}>
                        <Search size={15} className="input-icon" />
                        <input className="form-input input-with-icon" placeholder="Search by name or email..." value={search}
                            onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select className="form-select" style={{ width: 180 }} value={role} onChange={e => setRole(e.target.value)}>
                        <option value="">All Roles</option>
                        <option value="tenant">Tenant</option>
                        <option value="landlord">Landlord</option>
                        <option value="provider">Provider</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                <div className="card">
                    {isLoading
                        ? <div className="loading-center"><span className="spinner" /></div>
                        : <div className="table-wrap">
                            <table>
                                <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th><th></th></tr></thead>
                                <tbody>
                                    {data?.data?.map(u => (
                                        <tr key={u.id}>
                                            <td className="fw-600">{u.name}</td>
                                            <td className="text-muted text-sm">{u.email}</td>
                                            <td className="text-muted text-sm">{u.phone}</td>
                                            <td><span className={`badge badge-${u.role === 'admin' ? 'red' : u.role === 'landlord' ? 'teal' : u.role === 'provider' ? 'yellow' : 'blue'}`}>{u.role}</span></td>
                                            <td><span className={`badge badge-${u.is_suspended ? 'red' : 'green'}`}>{u.is_suspended ? 'Suspended' : 'Active'}</span></td>
                                            <td className="text-sm text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                                            <td>
                                                {u.role !== 'admin' && (
                                                    u.is_suspended
                                                        ? <button className="btn btn-primary btn-sm" onClick={() => unsuspend(u.id)}><UserCheck size={13} /> Restore</button>
                                                        : <button className="btn btn-danger  btn-sm" onClick={() => suspend(u.id)}><UserX size={13} /> Suspend</button>
                                                )}
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
