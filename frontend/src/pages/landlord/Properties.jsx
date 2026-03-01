import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { propertyApi } from '../../api';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit, Eye } from 'lucide-react';

const STATUS_BADGE = { active: 'badge-green', pending: 'badge-yellow', rejected: 'badge-red', inactive: 'badge-gray' };

export default function LandlordProperties() {
    const qc = useQueryClient();
    const [deleting, setDeleting] = useState(null);

    const { data, isLoading } = useQuery({
        queryKey: ['my-properties'],
        queryFn: () => propertyApi.myListings().then(r => r.data),
    });

    const handleDelete = async (id) => {
        if (!confirm('Delete this property?')) return;
        setDeleting(id);
        try {
            await propertyApi.destroy(id);
            toast.success('Property deleted.');
            qc.invalidateQueries(['my-properties']);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete failed.');
        } finally { setDeleting(null); }
    };

    return (
        <div className="page">
            <div className="container">
                <div className="page-header flex-between">
                    <div><h1>My Properties</h1><p>Manage your rental listings</p></div>
                    <Link to="/landlord/properties/new" className="btn btn-primary"><Plus size={15} /> Add Listing</Link>
                </div>

                <div className="card">
                    {isLoading
                        ? <div className="loading-center"><span className="spinner" /></div>
                        : data?.data?.length === 0
                            ? <div className="empty-state">
                                <p>No properties yet.</p>
                                <Link to="/landlord/properties/new" className="btn btn-primary mt-16"><Plus size={15} /> Add Your First Listing</Link>
                            </div>
                            : <div className="table-wrap">
                                <table>
                                    <thead><tr><th>Title</th><th>County</th><th>Bedrooms</th><th>Rent</th><th>Status</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        {data?.data?.map(p => (
                                            <tr key={p.id}>
                                                <td className="fw-600">{p.title}</td>
                                                <td className="text-muted">{p.county}</td>
                                                <td>{p.bedrooms}</td>
                                                <td className="fw-600" style={{ color: 'var(--teal)' }}>KSh {Number(p.rent_amount).toLocaleString()}</td>
                                                <td><span className={`badge ${STATUS_BADGE[p.status] ?? 'badge-gray'}`}>{p.status}</span></td>
                                                <td>
                                                    <div className="flex gap-8">
                                                        <Link to={`/properties/${p.id}`} className="btn btn-ghost btn-sm"><Eye size={13} /></Link>
                                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)} disabled={deleting === p.id}>
                                                            {deleting === p.id ? <span className="spinner" /> : <Trash2 size={13} />}
                                                        </button>
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
