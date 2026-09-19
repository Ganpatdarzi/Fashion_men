import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Link } from "react-router-dom";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/admin/dashboard").then(setStats).catch(() => {});
  }, []);

  if (!stats) return <div className="text-center py-20 text-gray-400">Loading dashboard...</div>;

  const cards = [
    { label: "Total Users", value: stats.totalUsers },
    { label: "Products", value: stats.totalProducts },
    { label: "Total Orders", value: stats.totalOrders },
    { label: "Pending Orders", value: stats.pendingOrders },
    { label: "Total Sales", value: `₨${(stats.totalSales || 0).toFixed(0)}` },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="text-xl font-bold mt-1 text-accent">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-bold mb-3">Recent Orders</h3>
        {stats.recentOrders.length === 0 ? (
          <p className="text-sm text-gray-400">No orders yet.</p>
        ) : (
          <div className="space-y-2">
            {stats.recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between flex-wrap gap-2 border-b border-gray-50 pb-2">
                <div>
                  <p className="text-sm font-medium">#{o.id} — {o.user?.name}</p>
                </div>
                <span className="text-sm text-gray-500">₨{o.totalAmount.toFixed(0)}</span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{o.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <Link to="/admin/pos" className="bg-accent text-white rounded-xl p-5 hover:bg-accent-dark">
          <p className="font-bold">POS · New Sale</p>
          <p className="text-sm text-accent-semi mt-1">Sell products in-store</p>
        </Link>
        <Link to="/admin/orders" className="bg-gray-900 text-white rounded-xl p-5 hover:bg-gray-800">
          <p className="font-bold">Manage Orders</p>
          <p className="text-sm text-gray-300 mt-1">Update order statuses</p>
        </Link>
        <Link to="/admin/products" className="bg-gray-900 text-white rounded-xl p-5 hover:bg-gray-800">
          <p className="font-bold">Manage Products</p>
          <p className="text-sm text-gray-300 mt-1">Add & edit products, stock, variants</p>
        </Link>
      </div>
    </div>
  );
}