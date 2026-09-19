import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

const STATUS_COLORS = {
  "Order Placed": "bg-blue-50 text-blue-600",
  Processing: "bg-yellow-50 text-yellow-600",
  Shipped: "bg-purple-50 text-purple-600",
  "Out for Delivery": "bg-orange-50 text-orange-600",
  Delivered: "bg-green-50 text-green-600",
  Cancelled: "bg-red-50 text-red-600",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/orders").then(setOrders).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-xl">
          <p className="text-3xl mb-3">📦</p>
          <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
          <Link to="/products" className="bg-accent text-white px-6 py-2.5 rounded-lg text-sm font-semibold">Browse Products</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link to={`/orders/${order.id}`} key={order.id} className="bg-white border border-gray-200 rounded-xl p-4 block hover:border-accent-semi hover:shadow-sm transition">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-semibold text-sm">Order #{order.id}</p>
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="text-sm text-gray-500">{order.items.length} item(s)</span>
                <span className="font-bold text-accent">₨{order.totalAmount.toFixed(0)}</span>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[order.status] || "bg-gray-100"}`}>{order.status}</span>
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {order.items.slice(0, 4).map((it) => (
                  <span key={it.id} className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">{it.product?.name}</span>
                ))}
                {order.items.length > 4 && <span className="text-xs text-gray-400">+{order.items.length - 4}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}