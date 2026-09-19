import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);

  const load = () => api.get("/admin/reviews").then(setReviews).catch(() => {});
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!confirm("Delete this review?")) return;
    await api.delete(`/admin/reviews/${id}`);
    load();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{reviews.length} review(s)</p>
      {reviews.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl text-gray-400">No reviews yet.</div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{r.user?.name}</span>
                  <span className="text-yellow-500 text-sm">{"★".repeat(r.rating)}</span>
                  <span className="text-xs text-gray-400">on {r.product?.name}</span>
                </div>
                {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
                <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
              <button onClick={() => remove(r.id)} className="text-red-500 text-sm hover:underline">Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}