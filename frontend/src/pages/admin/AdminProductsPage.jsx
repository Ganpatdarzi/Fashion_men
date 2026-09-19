import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", discount: 0, barcode: "", brand: "FashionMen", material: "", fit: "Regular Fit", categoryId: "", isActive: true, variants: [{ size: "M", color: "Black", stock: 10, barcode: "" }] });
  const [toast, setToast] = useState("");
  const [quickBarcode, setQuickBarcode] = useState("");
  const quickRef = useRef(null);
  const nameRef = useRef(null);

  const loadProducts = () => api.get("/products?limit=100").then((d) => setProducts(d.products)).catch(() => {});
  const loadCategories = () => api.get("/categories").then(setCategories).catch(() => {});

  useEffect(() => { loadProducts(); loadCategories(); }, []);

  useEffect(() => { if (toast) setTimeout(() => setToast(""), 2500); }, [toast]);

  const startNew = () => { setEditing(null); setForm({ name: "", description: "", price: "", discount: 0, barcode: "", brand: "FashionMen", material: "", fit: "Regular Fit", categoryId: categories[0]?.id || "", isActive: true, variants: [{ size: "M", color: "Black", stock: 10, barcode: "" }] }); setShowForm(true); };

  const getProduct = async (id) => {
    const p = await api.get(`/products/${id}`);
    setEditing(p);
    setForm({ name: p.name, description: p.description, price: p.price, discount: p.discount || 0, barcode: p.barcode || "", brand: p.brand || "FashionMen", material: p.material || "", fit: p.fit || "Regular Fit", categoryId: p.categoryId, isActive: p.isActive, variants: p.variants.length ? p.variants : [{ size: "M", color: "Black", stock: 10, barcode: "" }] });
    setShowForm(true);
  };

  const handleQuick = (e) => {
    e.preventDefault();
    const code = quickBarcode.trim();
    if (!code) return;
    startNew();
    setForm((f) => ({ ...f, barcode: code }));
    setQuickBarcode("");
    setToast("Set name & price manually, then Save");
    setTimeout(() => nameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    setTimeout(() => nameRef.current?.focus(), 200);
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, { name: form.name, description: form.description, price: Number(form.price), discount: Number(form.discount), brand: form.brand, material: form.material, fit: form.fit, categoryId: Number(form.categoryId), isActive: form.isActive, barcode: form.barcode, variants: form.variants.map((v) => ({ id: v.id, size: v.size, color: v.color, stock: v.stock, barcode: v.barcode })) });
      } else {
        await api.post("/products", { ...form, price: Number(form.price), discount: Number(form.discount), categoryId: Number(form.categoryId), variants: form.variants.map((v) => ({ ...v, stock: Number(v.stock) })) });
      }
      setToast(editing ? "Product updated" : "Product created");
      setShowForm(false);
      loadProducts();
      if (!editing) setTimeout(() => quickRef.current?.focus(), 50);
    } catch (err) {
      alert(err.message);
    }
  };

  const removeProduct = async (id) => {
    if (!confirm("Delete this product?")) return;
    await api.delete(`/products/${id}`);
    loadProducts();
  };

  const setVariant = (i, key, value) => {
    const v = [...form.variants];
    v[i] = { ...v[i], [key]: value };
    setForm({ ...form, variants: v });
  };

  return (
    <div className="space-y-4">
      {toast && <div className="fixed bottom-5 right-5 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">{toast}</div>}

      <form
        onSubmit={handleQuick}
        className="flex items-center gap-3 bg-white border-2 border-accent-semi rounded-xl px-4 py-3 focus-within:border-accent transition-colors"
      >
        <span className="shrink-0 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white bg-accent rounded">Quick Add</span>
        <input
          ref={quickRef}
          value={quickBarcode}
          onChange={(e) => setQuickBarcode(e.target.value)}
          placeholder="Scan / type a product barcode to add it (set name & price manually)"
          autoFocus
          className="flex-1 text-sm bg-transparent focus:outline-none"
        />
        <button type="submit" className="shrink-0 text-xs font-semibold bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-accent">Add by Barcode</button>
      </form>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{products.length} product(s)</p>
        <button onClick={startNew} className="bg-accent text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-accent-dark">+ Add Product</button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <h3 className="font-bold">{editing ? "Edit" : "Add"} Product</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <input ref={nameRef} required placeholder="Product Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="col-span-2">
              <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows="2" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <input required type="number" placeholder="Price (₨)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <input type="number" placeholder="Discount %" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input placeholder="Material" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Fit" value={form.fit} onChange={(e) => setForm({ ...form, fit: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Product Barcode" value={form.barcode || ""} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              <span>Active (visible in store)</span>
            </label>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Variants</p>
            <div className="space-y-2">
              {form.variants.map((v, i) => (
                <div key={i} className="flex gap-2 flex-wrap">
                  <input placeholder="Size" value={v.size} onChange={(e) => setVariant(i, "size", e.target.value)} className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
                  <input placeholder="Color" value={v.color} onChange={(e) => setVariant(i, "color", e.target.value)} className="w-28 border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
                  <input placeholder="Stock" type="number" value={v.stock} onChange={(e) => setVariant(i, "stock", e.target.value)} className="w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
                  <input placeholder="Barcode" value={v.barcode || ""} onChange={(e) => setVariant(i, "barcode", e.target.value)} className="flex-1 min-w-32 border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
                  {!editing && (
                    <button type="button" onClick={() => setForm({ ...form, variants: form.variants.filter((_, j) => j !== i) })} className="text-red-500 text-sm">✕</button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setForm({ ...form, variants: [...form.variants, { size: "M", color: "Black", stock: 10, barcode: "" }] })} className="text-sm text-accent mt-2 hover:underline">+ Add Variant</button>
          </div>

          <div className="flex gap-3 pt-1">
            <button className="bg-accent text-white font-semibold py-2 px-5 rounded-lg text-sm">{editing ? "Save" : "Create"}</button>
            <button type="button" onClick={() => setShowForm(false)} className="border border-gray-200 text-gray-600 py-2 px-5 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream-light text-left text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p) => {
              const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
              return (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.category?.name}</td>
                  <td className="px-4 py-3 text-accent font-semibold">₨{p.price.toFixed(0)}</td>
                  <td className="px-4 py-3">{totalStock}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => getProduct(p.id)} className="text-accent text-sm hover:underline">Edit</button>
                    <button onClick={() => removeProduct(p.id)} className="text-red-500 text-sm hover:underline ml-3">Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}