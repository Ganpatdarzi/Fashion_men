import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import ProductCard from "../components/ProductCard";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
];

const SIZES = ["S", "M", "L", "XL", "XXL", "30", "32", "34", "36"];
const COLORS = ["Black", "White", "Blue", "Light Blue", "Navy", "Dark Blue", "Grey", "Red", "Green", "Brown"];
const BRANDS = ["FashionMen"];

export default function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState({ products: [], total: 0, pages: 1 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const search = params.get("search") || "";
  const category = params.get("category") || "";
  const sort = params.get("sort") || "newest";
  const page = Number(params.get("page")) || 1;

  useEffect(() => {
    api.get("/categories").then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const query = new URLSearchParams();
    if (search) query.set("search", search);
    if (category) query.set("category", category);
    if (sort !== "newest") query.set("sort", sort);
    query.set("limit", "12");
    loading && setLoading(true);
    api.get(`/products?${query.toString()}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, sort, page]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{category || search ? (category || `"${search}"`) : "All Products"}</h1>
          <p className="text-sm text-gray-500 mt-1">{data.total} product(s)</p>
        </div>
        <select
          value={sort}
          onChange={(e) => setParam("sort", e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
        >
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div className="flex flex-col md:flex-row gap-5">
        <aside className="md:w-56 shrink-0 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-2">Category</h3>
            <div className="space-y-1">
              <button onClick={() => setParam("category", "")} className={`block w-full text-left text-sm px-2 py-1 rounded ${!category ? "bg-accent-semi/40 text-accent" : "text-gray-600 hover:bg-gray-50"}`}>All</button>
              {categories.map((c) => (
                <button key={c.id} onClick={() => setParam("category", c.name)} className={`block w-full text-left text-sm px-2 py-1 rounded ${category === c.name ? "bg-accent-semi/40 text-accent" : "text-gray-600 hover:bg-gray-50"}`}>{c.name}</button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-2">Size</h3>
            <div className="flex flex-wrap gap-1.5">
              {SIZES.map((s) => {
                const active = params.get("size") === s;
                return (
                  <button key={s} onClick={() => setParam("size", active ? "" : s)} className={`px-2.5 py-1 text-xs rounded-md border ${active ? "bg-accent text-white border-accent" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{s}</button>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-2">Color</h3>
            <div className="flex flex-wrap gap-1.5">
              {COLORS.map((c) => {
                const active = params.get("color") === c;
                return (
                  <button key={c} onClick={() => setParam("color", active ? "" : c)} className={`px-2.5 py-1 text-xs rounded-md border ${active ? "bg-accent text-white border-accent" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{c}</button>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-2">Brand</h3>
            <div className="space-y-1">
              {BRANDS.map((b) => {
                const active = params.get("brand") === b;
                return (
                  <button key={b} onClick={() => setParam("brand", active ? "" : b)} className={`block w-full text-left text-sm px-2 py-1 rounded ${active ? "bg-accent-semi/40 text-accent" : "text-gray-600 hover:bg-gray-50"}`}>{b}</button>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="flex-1">
          {loading ? (
            <div className="text-center py-20 text-gray-400">Loading products...</div>
          ) : data.products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500">No products found.</p>
              <button onClick={() => setParams(new URLSearchParams())} className="mt-3 text-accent text-sm hover:underline">Clear filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {data.products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

          {data.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setParam("page", String(p))} className={`w-8 h-8 rounded-md text-sm ${p === page ? "bg-accent text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{p}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}