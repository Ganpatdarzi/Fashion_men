import { useState, useEffect, useRef } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAdminNotifications } from "../hooks/useAdminNotifications";

const LINKS = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/pos", label: "POS" },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/customers", label: "Customers" },
  { to: "/admin/reviews", label: "Reviews" },
  { to: "/admin/receipts", label: "Receipts" },
];

const TYPE_STYLES = {
  customer: "bg-blue-50 text-blue-600",
  order: "bg-purple-50 text-purple-600",
  review: "bg-amber-50 text-amber-600",
  receipt: "bg-green-50 text-green-600",
};

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);
  const navigate = useNavigate();
  const { items, unread, markRead, markAllRead } = useAdminNotifications();

  useEffect(() => {
    const onClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/login");
  };

  const openNotification = (n) => {
    markRead(n.id);
    setBellOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <header className="sticky top-0 z-40 bg-gray-900 border-b border-gray-700 shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link to="/admin" className="text-lg font-extrabold tracking-tight text-white shrink-0">
            Fashion<span className="text-accent">Men</span>
            <span className="ml-2 text-[10px] font-semibold uppercase tracking-widest text-accent-semi border border-accent/50 rounded px-1.5 py-0.5 align-middle">Admin</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 ml-6">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive ? "bg-white/10 text-white" : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:flex items-center ml-auto text-sm text-gray-300">
            <Link to="/" className="px-3 py-2 font-medium hover:text-white">View Store</Link>
            <Link to="/products" className="px-3 py-2 font-medium hover:text-white">Shop</Link>
          </div>

          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setBellOpen(!bellOpen)}
              className="relative p-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg"
              title="Notifications"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4c-.36-.36-.6-.86-.6-1.4V10a6 6 0 10-12 0v4.2c0 .54-.24 1.04-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" />
              </svg>
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{unread > 9 ? "9+" : unread}</span>
              )}
            </button>
            {bellOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                  <p className="text-sm font-bold text-gray-800">Notifications</p>
                  <div className="flex items-center gap-3">
                    {unread > 0 && <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-50 text-red-600">{unread} new</span>}
                    <button onClick={markAllRead} className="text-xs text-accent hover:underline">Mark all read</button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {items.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-10">No notifications yet.</p>
                  ) : (
                    items.map((n) => (
                      <button key={n.id} onClick={() => openNotification(n)} className="w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 flex items-start gap-3">
                        <span className={`mt-0.5 shrink-0 px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full capitalize ${TYPE_STYLES[n.type] || "bg-gray-100 text-gray-600"}`}>{n.type}</span>
                        <span className="flex-1">
                          <span className={`block text-sm ${n.read ? "text-gray-500" : "text-gray-800 font-medium"}`}>{n.message}</span>
                          <span className="block text-[11px] text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</span>
                        </span>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1" />}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10 rounded-lg"
            >
              <span className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
              {user?.name?.split(" ")[0]}
              <span className="text-xs text-gray-400">▾</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Dashboard</Link>
                <Link to="/admin/orders" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">All Orders</Link>
                <Link to="/admin/customers" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Customers</Link>
                <Link to="/" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">View Store</Link>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50">Logout</button>
              </div>
            )}
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-white ml-auto">☰</button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-gray-700 px-4 py-2 bg-gray-900 space-y-1">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setMenuOpen(false)} className={({ isActive }) => `block px-3 py-2 text-sm font-medium rounded-lg ${isActive ? "bg-white/10 text-white" : "text-gray-300"}`}>
                {l.label}
              </NavLink>
            ))}
            <Link to="/" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-gray-300">View Store</Link>
            <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-sm font-medium text-red-400">Logout</button>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white py-6 text-center text-sm text-gray-500">
        <span className="font-bold text-gray-700">FashionMen Admin</span> — Manage store, orders, and customers. © 2026.
      </footer>
    </div>
  );
}