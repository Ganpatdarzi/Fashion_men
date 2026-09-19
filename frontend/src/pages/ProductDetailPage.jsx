import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshCart } = useCart();
  const [product, setProduct] = useState(null);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [variant, setVariant] = useState(null);
  const [toast, setToast] = useState("");
  const [related, setRelated] = useState([]);

  useEffect(() => {
    api.get(`/products/${id}`).then((p) => {
      setProduct(p);
      const sizes = [...new Set(p.variants.map((v) => v.size))];
      if (sizes.length) setSize(sizes[0]);
      setRelated([]);
    }).catch(() => navigate("/products"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!product || !size) return;
    const colors = [...new Set(product.variants.filter((v) => v.size === size).map((v) => v.color))];
    setColor(colors[0] || "");
  }, [size, product]);

  useEffect(() => {
    if (product && size && color) {
      setVariant(product.variants.find((v) => v.size === size && v.color === color) || null);
    }
  }, [product, size, color]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showToast = (msg) => setToast(msg);

  const addToCart = async () => {
    if (!variant) return showToast("Select size & color first");
    try {
      if (!user) { navigate("/login"); return; }
      await api.post("/cart/add", { productId: product.id, variantId: variant.id, quantity });
      refreshCart();
      showToast("Added to cart!");
    } catch (e) {
      showToast(e.message);
    }
  };

  const toggleWishlist = async () => {
    try {
      if (!user) { navigate("/login"); return; }
      await api.post("/wishlist/add", { productId: product.id });
      showToast("Added to wishlist!");
    } catch (e) {
      showToast(e.message);
    }
  };

  if (!product) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  const img = product.images?.find((i) => i.isPrimary)?.url || product.images?.[0]?.url;
  const price = product.price;
  const discounted = price * (1 - (product.discount || 0) / 100);
  const sizes = [...new Set(product.variants.map((v) => v.size))];
  const colors = size ? [...new Set(product.variants.filter((v) => v.size === size).map((v) => v.color))] : [];

  const avgRating = product.reviews?.length ? (product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length).toFixed(1) : null;

  return (
    <div className="space-y-8">
      {toast && <div className="fixed bottom-5 right-5 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">{toast}</div>}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {img ? <img src={img} alt={product.name} className="w-full h-80 md:h-96 object-cover" /> : <div className="w-full h-80 flex items-center justify-center text-gray-300 text-6xl">{product.name.charAt(0)}</div>}
        </div>

        <div className="space-y-3">
          <div>
            {product.category && <span className="text-xs text-accent font-medium">{product.category.name} {product.subcategory ? `• ${product.subcategory.name}` : ""}</span>}
            <h1 className="text-2xl font-bold mt-1">{product.name}</h1>
            {avgRating && (
              <p className="text-sm text-gray-500 mt-1">★ {avgRating} ({product.reviews.length} {product.reviews.length === 1 ? "review" : "reviews"})</p>
            )}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-extrabold text-accent">₨{discounted.toFixed(0)}</span>
            {product.discount > 0 && <><span className="text-gray-400 line-through">₨{price.toFixed(0)}</span><span className="text-green-600 text-sm font-medium">{product.discount}% off</span></>}
          </div>

          <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>

          {product.material && <p className="text-xs text-gray-500">Material: <span className="text-gray-700">{product.material}</span>{product.fit ? ` • Fit: ${product.fit}` : ""}{product.brand ? ` • Brand: ${product.brand}` : ""}</p>}

          <div>
            <div className="flex items-center gap-2 mb-1.5"><span className="text-sm font-medium">Size</span><span className="text-xs text-gray-400 ml-auto">{variant ? `In stock: ${variant.stock}` : "Select size"}</span></div>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => <button key={s} onClick={() => setSize(s)} className={`px-4 py-1.5 text-sm rounded-lg border ${size === s ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{s}</button>)}
            </div>
          </div>

          {colors.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1.5"><span className="text-sm font-medium">Color</span></div>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => <button key={c} onClick={() => setColor(c)} className={`px-4 py-1.5 text-sm rounded-lg border ${color === c ? "bg-accent text-white border-accent" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{c}</button>)}
              </div>
            </div>
          )}

          <div>
            <span className="text-sm font-medium">Quantity</span>
            <div className="flex items-center gap-2 mt-1.5">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-8 h-8 border border-gray-200 rounded-lg text-gray-600">−</button>
              <span className="text-sm font-medium w-8 text-center">{quantity}</span>
              <button onClick={() => setQuantity((q) => q + 1)} className="w-8 h-8 border border-gray-200 rounded-lg text-gray-600">+</button>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={addToCart} className="flex-1 bg-accent text-white font-semibold py-2.5 rounded-lg hover:bg-accent-dark">Add to Cart</button>
            <button onClick={toggleWishlist} className="px-4 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">â™¥ Wishlist</button>
          </div>
        </div>
      </div>

      {product.reviews?.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-bold mb-3">Customer Reviews</h2>
          <div className="space-y-3 max-h-40 overflow-y-auto">
            {product.reviews.map((r) => (
              <div key={r.id} className="border-b border-gray-100 pb-2 last:border-0">
                <div className="flex items-center gap-2"><span className="text-yellow-500 text-sm">{"★".repeat(r.rating)}</span><span className="text-sm font-medium">{r.user?.name}</span></div>
                {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section>
          <h2 className="font-bold mb-3">You may also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{related.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </section>
      )}
    </div>
  );
}