import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { propertyApi } from '../../api';
import toast from 'react-hot-toast';
import { Building2 } from 'lucide-react';

const COUNTIES = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Machakos', 'Nyeri', 'Meru', 'Kakamega'];

export default function AddProperty() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        title: '', county: '', sub_county: '', estate: '',
        bedrooms: 1, rent_amount: '', description: '',
    });
    const [submitting, setSubmitting] = useState(false);

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.county || !form.rent_amount) {
            toast.error('Fill in all required fields.');
            return;
        }
        setSubmitting(true);
        try {
            await propertyApi.create(form);
            toast.success('Property submitted for admin approval!');
            navigate('/landlord/properties');
        } catch (err) {
            const errors = err.response?.data?.errors;
            if (errors) Object.entries(errors).forEach(([, msgs]) => toast.error(msgs[0]));
            else toast.error('Failed to create property.');
        } finally { setSubmitting(false); }
    };

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: 680 }}>
                <div className="page-header flex-between">
                    <div>
                        <h1>Add New Property</h1>
                        <p>Your listing will be reviewed by an admin before going live</p>
                    </div>
                </div>

                <div className="card">
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="form-group">
                            <label className="form-label">Listing Title *</label>
                            <input className="form-input" placeholder="e.g. Modern 2BR in Westlands" value={form.title} onChange={set('title')} required />
                        </div>

                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">County *</label>
                                <select className="form-select" value={form.county} onChange={set('county')} required>
                                    <option value="">Select County</option>
                                    {COUNTIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Bedrooms *</label>
                                <select className="form-select" value={form.bedrooms} onChange={set('bedrooms')}>
                                    {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n === 0 ? 'Bedsitter' : `${n} Bedroom${n > 1 ? 's' : ''}`}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">Sub-County</label>
                                <input className="form-input" placeholder="e.g. Westlands" value={form.sub_county} onChange={set('sub_county')} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Estate / Area</label>
                                <input className="form-input" placeholder="e.g. Parklands" value={form.estate} onChange={set('estate')} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Monthly Rent (KSh) *</label>
                            <input className="form-input" type="number" placeholder="e.g. 25000" value={form.rent_amount} onChange={set('rent_amount')} required />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea className="form-textarea" rows={4} placeholder="Describe the property, available amenities, terms..." value={form.description} onChange={set('description')} />
                        </div>

                        <div className="flex gap-8 mt-24">
                            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                                {submitting ? <span className="spinner" /> : <><Building2 size={15} /> Submit for Approval</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
