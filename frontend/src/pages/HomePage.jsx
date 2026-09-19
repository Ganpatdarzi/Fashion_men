import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import ProductCard from "../components/ProductCard";

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);

  useEffect(() => {
    api.get("/categories").then(setCategories).catch(() => {});
    api.get("/products?limit=4").then((d) => setFeatured(d.products)).catch(() => {});
    api.get("/products?sort=newest&limit=4").then((d) => setNewArrivals(d.products)).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <section className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-accent-dark to-accent text-white p-8 md:p-12 min-h-[260px] flex flex-col justify-center">
        <h1 className="text-3xl md:text-4xl font-extrabold">Style Your Every Day</h1>
        <p className="mt-3 text-accent-semi max-w-md">Premium men's fashion — shirts, t-shirts, jeans, pants & trousers. Up to 50% off new arrivals.</p>
        <div className="mt-6 flex gap-3">
          <Link to="/products" className="bg-white text-accent-dark font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-accent-semi/40">Shop Now</Link>
          <Link to="/products?category=Shirts" className="border border-white text-white font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-white/10">Shirts</Link>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">Shop by Category</h2>
          <Link to="/products" className="text-sm text-accent hover:underline">View all</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {categories.map((cat) => (
            <Link key={cat.id} to={`/products?category=${encodeURIComponent(cat.name)}`} className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-shadow">
              <span className="block text-2xl font-bold text-accent">{cat.name.charAt(0)}</span>
              <span className="text-sm font-medium mt-1">{cat.name}</span>
              <span className="block text-[11px] text-gray-400 mt-1">{cat._count?.products || 0} items</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">Featured Products</h2>
          <Link to="/products" className="text-sm text-accent hover:underline">View all</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">New Arrivals</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {newArrivals.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  );
}