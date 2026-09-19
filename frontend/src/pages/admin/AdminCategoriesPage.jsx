import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState({ name: "", description: "" });
  const [newSub, setNewSub] = useState({ name: "", categoryId: "" });
  const [toast, setToast] = useState("");

  const load = () => api.get("/categories").then(setCategories).catch(() => {});
  useEffect(() => { load(); }, []);
  useEffect(() => { if (toast) setTimeout(() => setToast(""), 2500); }, [toast]);

  const addCat = async (e) => {
    e.preventDefault();
    if (!newCat.name) return;
    await api.post("/categories", newCat);
    setNewCat({ name: "", description: "" });
    load();
  };

  const removeCat = async (id) => {
    if (!confirm("Delete this category and its subcategories?")) return;
    await api.delete(`/categories/${id}`);
    load();
  };

  const addSub = async (e) => {
    e.preventDefault();
    if (!newSub.name || !newSub.categoryId) return;
    await api.post(`/categories/${newSub.categoryId}/subcategories`, { name: newSub.name });
    setNewSub({ name: "", categoryId: "" });
    setToast("Subcategory added");
    load();
  };

  const removeSub = async (catId, subId) => {
    await api.delete(`/categories/${catId}/subcategories/${subId}`);
    load();
  };

  return (
    <div className="space-y-5">
      {toast && <div className="fixed bottom-5 right-5 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">{toast}</div>}

      <div className="grid md:grid-cols-2 gap-4">
        <form onSubmit={addCat} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <h3 className="font-bold">Add Category</h3>
          <input required placeholder="Category name (e.g. Jackets)" value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Description (optional)" value={newCat.description} onChange={(e) => setNewCat({ ...newCat, description: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <button className="bg-accent text-white font-semibold py-2 px-5 rounded-lg text-sm">Add Category</button>
        </form>

        <form onSubmit={addSub} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <h3 className="font-bold">Add Subcategory</h3>
          <select required value={newSub.categoryId} onChange={(e) => setNewSub({ ...newSub, categoryId: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="">Select category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input required placeholder="Subcategory name (e.g. Denim Jackets)" value={newSub.name} onChange={(e) => setNewSub({ ...newSub, name: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <button className="bg-gray-900 text-white font-semibold py-2 px-5 rounded-lg text-sm">Add Subcategory</button>
        </form>
      </div>

      <div className="space-y-3">
        {categories.map((c) => (
          <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">{c.name}</p>
                <p className="text-xs text-gray-400">{c.subcategories.length} subcategories • {c._count?.products || 0} products</p>
              </div>
              <button onClick={() => removeCat(c.id)} className="text-red-500 text-sm hover:underline">Delete</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {c.subcategories.map((s) => (
                <span key={s.id} className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">
                  {s.name}
                  <button onClick={() => removeSub(c.id, s.id)} className="text-red-400 hover:text-red-600">✕</button>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}