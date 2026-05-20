import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { Star, Plus, Pencil, Trash2, Save, X, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchAllReviews,
  createReview,
  updateReview,
  deleteReview,
  type Review,
} from '@/lib/reviewService';

export const Route = createFileRoute('/admin/reviews')({
  component: ReviewsPage,
});

const EMPTY_FORM = { name: '', city: '', rating: 5, quote: '', visible: true };

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="focus:outline-none"
        >
          <Star
            size={20}
            className={n <= value ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: typeof EMPTY_FORM;
  onSave: (data: typeof EMPTY_FORM) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof typeof EMPTY_FORM, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Customer Name</label>
          <input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. Rohan Sharma"
            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">City</label>
          <input
            value={form.city}
            onChange={e => set('city', e.target.value)}
            placeholder="e.g. New Delhi"
            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Rating</label>
        <StarPicker value={form.rating} onChange={v => set('rating', v)} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Review Text</label>
        <textarea
          value={form.quote}
          onChange={e => set('quote', e.target.value)}
          rows={3}
          placeholder="What did the customer say?"
          className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => set('visible', !form.visible)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            form.visible
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : 'bg-slate-700 text-slate-400 border-slate-600'
          }`}
        >
          {form.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          {form.visible ? 'Visible on site' : 'Hidden'}
        </button>
      </div>
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded-xl text-sm transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving || !form.name.trim() || !form.quote.trim()}
          onClick={() => onSave(form)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Review
        </button>
      </div>
    </div>
  );
}

function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await fetchAllReviews();
    if (error) toast.error('Failed to load reviews');
    else setReviews(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (form: typeof EMPTY_FORM) => {
    setSaving(true);
    const { error } = await createReview(form);
    setSaving(false);
    if (error) { toast.error('Failed to add review'); return; }
    toast.success('Review added');
    setShowAdd(false);
    load();
  };

  const handleEdit = async (id: string, form: typeof EMPTY_FORM) => {
    setSaving(true);
    const { error } = await updateReview(id, form);
    setSaving(false);
    if (error) { toast.error('Failed to update review'); return; }
    toast.success('Review updated');
    setEditingId(null);
    load();
  };

  const handleToggleVisible = async (r: Review) => {
    const { error } = await updateReview(r.id, { visible: !r.visible });
    if (error) { toast.error('Failed to update'); return; }
    setReviews(prev => prev.map(x => x.id === r.id ? { ...x, visible: !x.visible } : x));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review? This cannot be undone.')) return;
    const { error } = await deleteReview(id);
    if (error) { toast.error('Failed to delete review'); return; }
    toast.success('Review deleted');
    setReviews(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Reviews</h1>
          <p className="text-slate-400 mt-1">Manage customer reviews shown on the landing page</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setEditingId(null); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Review
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <ReviewForm
          initial={EMPTY_FORM}
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
          saving={saving}
        />
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Star className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No reviews yet. Add your first one.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              {editingId === r.id ? (
                <div className="p-4">
                  <ReviewForm
                    initial={{ name: r.name, city: r.city, rating: r.rating, quote: r.quote, visible: r.visible }}
                    onSave={form => handleEdit(r.id, form)}
                    onCancel={() => setEditingId(null)}
                    saving={saving}
                  />
                </div>
              ) : (
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-bold text-white">{r.name}</span>
                        <span className="text-xs text-slate-500">{r.city}</span>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                          r.visible
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-700 text-slate-500 border border-slate-600'
                        }`}>
                          {r.visible ? 'Visible' : 'Hidden'}
                        </span>
                      </div>
                      <div className="flex gap-0.5 mb-2">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} size={13} className="text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">"{r.quote}"</p>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleToggleVisible(r)}
                        title={r.visible ? 'Hide' : 'Show'}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        {r.visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => { setEditingId(r.id); setShowAdd(false); }}
                        title="Edit"
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        title="Delete"
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
