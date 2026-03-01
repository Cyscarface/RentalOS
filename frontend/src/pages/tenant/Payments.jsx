import { useQuery } from '@tanstack/react-query';
import { paymentApi } from '../../api';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Download, CreditCard } from 'lucide-react';

export default function TenantPayments() {
    const [initiating, setInitiating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ property_id: '', amount: '', phone: '' });

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['payments-history'],
        queryFn: () => paymentApi.history().then(r => r.data),
    });

    const downloadReceipt = async (id) => {
        try {
            const res = await paymentApi.receipt(id);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `receipt-${String(id).padStart(6, '0')}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch { toast.error('Receipt unavailable.'); }
    };

    const initiatePayment = async (e) => {
        e.preventDefault();
        setInitiating(true);
        try {
            await paymentApi.initiate({ property_id: Number(form.property_id), amount: Number(form.amount), phone: form.phone });
            toast.success('STK Push sent to your phone. Enter your M-Pesa PIN!');
            setShowForm(false);
            setTimeout(refetch, 5000);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to initiate.');
        } finally { setInitiating(false); }
    };

    return (
        <div className="page">
            <div className="container">
                <div className="page-header flex-between">
                    <div><h1>Payments</h1><p>Your rent payment history</p></div>
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}><CreditCard size={15} /> Pay Rent</button>
                </div>

                {/* Pay form modal */}
                {showForm && (
                    <div className="modal-overlay" onClick={() => setShowForm(false)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <h3 className="modal-title">Initiate Rent Payment</h3>
                            <form onSubmit={initiatePayment}>
                                <div className="form-group">
                                    <label className="form-label">Property ID</label>
                                    <input className="form-input" type="number" placeholder="Property ID" value={form.property_id} onChange={e => setForm(f => ({ ...f, property_id: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Amount (KSh)</label>
                                    <input className="form-input" type="number" placeholder="e.g. 25000" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">M-Pesa Phone (2547XXXXXXXX)</label>
                                    <input className="form-input" type="text" placeholder="254712345678" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
                                </div>
                                <div className="flex gap-8 mt-16">
                                    <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={initiating}>
                                        {initiating ? <span className="spinner" /> : 'Send STK Push'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="card">
                    {isLoading
                        ? <div className="loading-center"><span className="spinner" /></div>
                        : data?.data?.length === 0
                            ? <p className="text-muted">No payments yet.</p>
                            : <div className="table-wrap">
                                <table>
                                    <thead><tr><th>#</th><th>Property</th><th>Amount</th><th>M-Pesa Ref</th><th>Status</th><th>Date</th><th></th></tr></thead>
                                    <tbody>
                                        {data?.data?.map(p => (
                                            <tr key={p.id}>
                                                <td className="text-muted text-sm">{String(p.id).padStart(6, '0')}</td>
                                                <td>{p.property?.title ?? '—'}</td>
                                                <td className="fw-600">KSh {Number(p.amount).toLocaleString()}</td>
                                                <td className="text-sm text-muted">{p.mpesa_reference ?? '—'}</td>
                                                <td><span className={`badge badge-${p.status === 'completed' ? 'green' : p.status === 'failed' ? 'red' : 'yellow'}`}>{p.status}</span></td>
                                                <td className="text-sm text-muted">{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '—'}</td>
                                                <td>
                                                    {p.status === 'completed' && (
                                                        <button className="btn btn-ghost btn-sm" onClick={() => downloadReceipt(p.id)}>
                                                            <Download size={13} />
                                                        </button>
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
