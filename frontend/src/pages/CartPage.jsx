import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useCart } from "../context/CartContext";

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { refreshCart } = useCart();

  const load = () => {
    api.get("/cart").then(setCart).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateQty = async (item, qty) => {
    try {
      await api.put(`/cart/item/${item.id}`, { quantity: qty });
      load();
      refreshCart();
    } catch (e) {
      alert(e.message);
    }
  };

  const removeItem = async (item) => {
    await api.delete(`/cart/item/${item.id}`);
    load();
    refreshCart();
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  const items = cart?.items || [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-xl">
          <p className="text-3xl mb-3">🛒</p>
          <p className="text-gray-500 mb-4">Your cart is empty.</p>
          <Link to="/products" className="bg-accent text-white px-6 py-2.5 rounded-lg text-sm font-semibold">Start Shopping</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-5">
          <div className="md:col-span-2 space-y-3">
            {items.map((item) => {
              const price = item.product.price * (1 - (item.product.discount || 0) / 100);
              const img = item.product.images?.[0]?.url;
              return (
                <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-3 flex gap-3 items-center">
                  {img ? <img src={img} className="w-16 h-16 rounded-lg object-cover" /> : <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-lg">{item.product.name.charAt(0)}</div>}
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${item.product.id}`} className="font-semibold text-sm hover:text-accent truncate block">{item.product.name}</Link>
                    <p className="text-xs text-gray-400">{item.variant.size} • {item.variant.color}</p>
                    <p className="text-accent font-bold text-sm mt-1">₨{(price * item.quantity).toFixed(0)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item, item.quantity - 1)} className="w-7 h-7 border border-gray-200 rounded-md text-gray-500">−</button>
                    <span className="text-sm w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item, item.quantity + 1)} className="w-7 h-7 border border-gray-200 rounded-md text-gray-500">+</button>
                  </div>
                  <button onClick={() => removeItem(item)} className="text-red-500 text-sm">✕</button>
                </div>
              );
            })}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 h-fit sticky top-20">
            <h3 className="font-bold">Order Summary</h3>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Items</span><span>{items.reduce((s, i) => s + i.quantity, 0)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₨{cart.total.toFixed(0)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Shipping</span><span className="text-green-600">Free</span></div>
              <div className="border-t border-gray-100 pt-2 flex justify-between font-bold"><span>Total</span><span>₨{cart.total.toFixed(0)}</span></div>
            </div>
            <button onClick={() => navigate("/checkout")} className="w-full mt-4 bg-accent text-white font-semibold py-2.5 rounded-lg hover:bg-accent-dark">Proceed to Checkout</button>
            <Link to="/products" className="block text-center text-sm text-accent hover:underline mt-3">Continue shopping</Link>
          </div>
        </div>
      )}
    </div>
  );
}