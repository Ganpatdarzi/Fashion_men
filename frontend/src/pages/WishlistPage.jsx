import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useCart } from "../context/CartContext";

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { refreshCart } = useCart();

  const load = () => api.get("/wishlist").then(setItems).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const remove = async (productId) => {
    await api.delete(`/wishlist/${productId}`);
    load();
  };

  const moveToCart = async (productId) => {
    const item = items.find((i) => i.product.id === productId);
    const variant = item?.product?.variants?.find((v) => v.stock > 0) || item?.product?.variants?.[0];
    if (!variant) return navigate(`/products/${productId}`);
    try {
      await api.post("/cart/add", { productId, variantId: variant.id, quantity: 1 });
      refreshCart();
      navigate("/cart");
    } catch (e) {
      navigate(`/products/${productId}`);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Wishlist</h1>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-xl">
          <p className="text-3xl mb-3">â™¥</p>
          <p className="text-gray-500 mb-4">Your wishlist is empty.</p>
          <Link to="/products" className="bg-accent text-white px-6 py-2.5 rounded-lg text-sm font-semibold">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((item) => {
            const img = item.product.images?.[0]?.url;
            const price = item.product.price * (1 - (item.product.discount || 0) / 100);
            return (
              <div key={item.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                  {img ? <img src={img} className="w-full h-full object-cover" /> : <span className="text-gray-300 text-3xl">{item.product.name.charAt(0)}</span>}
                </div>
                <div className="p-3">
                  <Link to={`/products/${item.product.id}`} className="font-semibold text-sm hover:text-accent truncate block">{item.product.name}</Link>
                  <p className="text-accent font-bold text-sm mt-1">₨{price.toFixed(0)}</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => moveToCart(item.product.id)} className="flex-1 bg-accent text-white text-xs font-semibold py-1.5 rounded-lg">Add to Cart</button>
                    <button onClick={() => remove(item.product.id)} className="text-red-500 text-xs px-2 border border-gray-200 rounded-lg">✕</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}