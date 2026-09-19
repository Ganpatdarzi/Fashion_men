import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { api } from "../../lib/api";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", discount: 0, barcode: "", brand: "FashionMen", material: "", fit: "Regular Fit", categoryId: "", isActive: true, images: [], variants: [{ size: "M", color: "Black", stock: 10, barcode: "" }] });
  const [toast, setToast] = useState("");
  const [quickBarcode, setQuickBarcode] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraErr, setCameraErr] = useState("");
  const [uploading, setUploading] = useState(false);
  const quickRef = useRef(null);
  const nameRef = useRef(null);
  const scannerRef = useRef(null);
  const scannerDivId = "product-camera-scanner";

  const loadProducts = () => api.get("/products?limit=100").then((d) => setProducts(d.products)).catch(() => {});
  const loadCategories = () => api.get("/categories").then(setCategories).catch(() => {});

  useEffect(() => { loadProducts(); loadCategories(); return () => stopCamera(); }, []);

  const stopCamera = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      try { scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }
  };

  const addBarcodeFromScan = (code) => {
    if (!editing) startNew();
    setForm((f) => ({ ...f, barcode: code || f.barcode }));
    setQuickBarcode("");
    setToast(`Barcode ${code} set - fill in the rest, then Save`);
    setTimeout(() => nameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    setTimeout(() => nameRef.current?.focus(), 400);
  };

  const startCamera = async () => {
    setCameraErr("");
    setCameraOpen(true);
    try {
      await new Promise((r) => setTimeout(r, 100));
      const scanner = new Html5Qrcode(scannerDivId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 220 },
        async (decodedText) => {
          await stopCamera();
          setCameraOpen(false);
          addBarcodeFromScan(decodedText);
        },
        () => {}
      );
    } catch (err) {
      setCameraErr(err?.message || "Could not start camera. Allow camera access and try again.");
      setCameraOpen(false);
      scannerRef.current = null;
    }
  };

  useEffect(() => { if (toast) setTimeout(() => setToast(""), 2500); }, [toast]);

  const startNew = () => { setEditing(null); setForm({ name: "", description: "", price: "", discount: 0, barcode: "", brand: "FashionMen", material: "", fit: "Regular Fit", categoryId: categories[0]?.id || "", isActive: true, images: [], variants: [{ size: "M", color: "Black", stock: 10, barcode: "" }] }); setShowForm(true); };

  const getProduct = async (id) => {
    const p = await api.get(`/products/${id}`);
    setEditing(p);
    setForm({ name: p.name, description: p.description, price: p.price, discount: p.discount || 0, barcode: p.barcode || "", brand: p.brand || "FashionMen", material: p.material || "", fit: p.fit || "Regular Fit", categoryId: p.categoryId, isActive: p.isActive, images: (p.images || []).map((img) => ({ url: img.url, isPrimary: img.isPrimary })), variants: p.variants.length ? p.variants : [{ size: "M", color: "Black", stock: 10, barcode: "" }] });
    setShowForm(true);
  };

  const uploadProductImage = async (file) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await api.upload("/products/upload-image", fd);
      setForm((f) => ({ ...f, images: [...(f.images || []), { url: res.url, isPrimary: (f.images || []).length === 0 }] }));
      setToast("Image uploaded");
    } catch (err) {
      setToast(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setForm((f) => {
      const imgs = (f.images || []).filter((_, i) => i !== index);
      if (f.images?.[index]?.isPrimary && imgs.length) imgs[0].isPrimary = true;
      return { ...f, images: imgs };
    });
  };

  const setPrimaryImage = (index) => {
    setForm((f) => ({ ...f, images: (f.images || []).map((img, i) => ({ ...img, isPrimary: i === index })) }));
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
        await api.put(`/products/${editing.id}`, { name: form.name, description: form.description, price: Number(form.price), discount: Number(form.discount), brand: form.brand, material: form.material, fit: form.fit, categoryId: Number(form.categoryId), isActive: form.isActive, barcode: form.barcode, images: (form.images || []).map((img) => ({ url: img.url, isPrimary: img.isPrimary })), variants: form.variants.map((v) => ({ id: v.id, size: v.size, color: v.color, stock: v.stock, barcode: v.barcode })) });
      } else {
        await api.post("/products", { ...form, price: Number(form.price), discount: Number(form.discount), categoryId: Number(form.categoryId), images: (form.images || []).map((img) => ({ url: img.url, isPrimary: img.isPrimary })), variants: form.variants.map((v) => ({ ...v, stock: Number(v.stock) })) });
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
        <button type="button" onClick={startCamera} className="shrink-0 text-xs font-semibold bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-accent">Open Camera Scanner</button>
        <button type="submit" className="shrink-0 text-xs font-semibold bg-accent text-white px-3 py-1.5 rounded-lg hover:bg-accent-dark">Add by Barcode</button>
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
            <p className="text-sm font-medium mb-2">Images</p>
            <div className="flex flex-wrap gap-3">
              {(form.images || []).map((img, i) => (
                <div key={i} className="relative">
                  <img src={img.url} alt="" className="w-24 h-24 object-cover rounded-lg border border-gray-200" />
                  {img.isPrimary && <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] font-bold text-white bg-accent rounded">PRIMARY</span>}
                  <div className="absolute bottom-1 right-1 flex gap-1">
                    {!img.isPrimary && <button type="button" onClick={() => setPrimaryImage(i)} className="text-[10px] px-1.5 py-0.5 bg-gray-900 text-white rounded">Set Primary</button>}
                    <button type="button" onClick={() => removeImage(i)} className="text-[10px] px-1.5 py-0.5 bg-red-500 text-white rounded">✕</button>
                  </div>
                </div>
              ))}
              <label className={`w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:border-accent hover:text-accent ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                <span className="text-2xl leading-none">{uploading ? "…" : "+"}</span>
                <span className="text-[10px] mt-1">{uploading ? "Uploading" : "Upload"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadProductImage(e.target.files[0])} />
              </label>
            </div>
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

      {cameraOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="font-bold">Scan Barcode</h3>
              <button onClick={() => { stopCamera(); setCameraOpen(false); }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <div className="p-4 bg-gray-900">
              <div id={scannerDivId} className="w-full overflow-hidden rounded-lg" />
            </div>
            <p className="text-xs text-gray-500 px-5 py-3">Point the camera at a product barcode. It will fill the barcode field.</p>
          </div>
        </div>
      )}

      {cameraErr && (
        <div className="fixed bottom-5 right-5 bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg shadow-lg z-50 max-w-xs">{cameraErr}</div>
      )}
    </div>
  );
}