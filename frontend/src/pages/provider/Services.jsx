import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { serviceApi } from '../../api';
import toast from 'react-hot-toast';
import { Plus, Edit } from 'lucide-react';

const CATEGORIES = ['plumbing', 'electrical', 'cleaning', 'painting', 'carpentry', 'security', 'gardening'];

export default function ProviderServices() {
    const qc = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ title: '', category: '', base_price: '', description: '' });
    const [submitting, setSubmitting] = useState(false);

    const { data, isLoading } = useQuery({ queryKey: ['my-services'], queryFn: () => serviceApi.myServices().then(r => r.data) });

    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await serviceApi.create({ ...form, base_price: Number(form.base_price) });
            toast.success('Service created!');
            qc.invalidateQueries(['my-services']);
            setShowModal(false);
            setForm({ title: '', category: '', base_price: '', description: '' });
        } catch (err) {
            const errs = err.response?.data?.errors;
            if (errs) Object.values(errs).forEach(m => toast.error(m[0]));
            else toast.error('Failed to create service.');
        } finally { setSubmitting(false); }
    };

    return (
        <div className="page">
            <div className="container">
                <div className="page-header flex-between">
                    <div><h1>My Services</h1><p>Manage the services you offer</p></div>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={15} /> Add Service</button>
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <h3 className="modal-title">Add New Service</h3>
                            <form onSubmit={handleCreate}>
                                <div className="form-group">
                                    <label className="form-label">Title</label>
                                    <input className="form-input" placeholder="e.g. Pipe Repair" value={form.title} onChange={set('title')} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <select className="form-select" value={form.category} onChange={set('category')} required>
                                        <option value="">Select Category</option>
                                        {CATEGORIES.map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Base Price (KSh)</label>
                                    <input className="form-input" type="number" placeholder="e.g. 2000" value={form.base_price} onChange={set('base_price')} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea className="form-textarea" rows={3} value={form.description} onChange={set('description')} />
                                </div>
                                <div className="flex gap-8 mt-16">
                                    <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                                        {submitting ? <span className="spinner" /> : 'Create Service'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="card">
                    {isLoading
                        ? <div className="loading-center"><span className="spinner" /></div>
                        : data?.length === 0
                            ? <p className="text-muted">No services yet. Add your first service!</p>
                            : <div className="table-wrap">
                                <table>
                                    <thead><tr><th>Title</th><th>Category</th><th>Base Price</th><th>Status</th></tr></thead>
                                    <tbody>
                                        {data?.map(s => (
                                            <tr key={s.id}>
                                                <td className="fw-600">{s.title}</td>
                                                <td><span className="badge badge-teal" style={{ textTransform: 'capitalize' }}>{s.category}</span></td>
                                                <td className="fw-600" style={{ color: 'var(--teal)' }}>KSh {Number(s.base_price).toLocaleString()}</td>
                                                <td><span className={`badge badge-${s.status === 'active' ? 'green' : 'gray'}`}>{s.status}</span></td>
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
