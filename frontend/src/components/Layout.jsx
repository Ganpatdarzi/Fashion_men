import { useState, useEffect, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartToast, setCartToast] = useState(false);
  const prevCount = useRef(cartCount);

  useEffect(() => {
    if (cartCount > prevCount.current) {
      setCartToast(true);
      const t = setTimeout(() => setCartToast(false), 2000);
      prevCount.current = cartCount;
      return () => clearTimeout(t);
    }
    prevCount.current = cartCount;
  }, [cartCount]);

  const isAdmin = user?.role === "admin";
  const onSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/products?search=${encodeURIComponent(search.trim())}`);
    setMenuOpen(false);
  };

  const navLink = (to, label, sub, badge = 0) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        onClick={() => setMenuOpen(false)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          active ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        <span className="w-4 h-4 flex items-center justify-center">{sub}</span>
        {label}
        {badge > 0 && (
          <span className="min-w-5 h-5 px-1 inline-flex items-center justify-center text-[10px] leading-none bg-accent text-white rounded-full">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {cartToast && (
        <div className="fixed bottom-5 right-5 bg-accent text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <span>Added to cart</span>
          <span className="min-w-5 h-5 px-1 inline-flex items-center justify-center text-[10px] bg-white text-accent rounded-full">{cartCount}</span>
        </div>
      )}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link to="/" className="text-xl font-extrabold tracking-tight text-gray-900 shrink-0">
            Fashion<span className="text-accent">Men</span>
          </Link>

          <form onSubmit={onSearch} className="hidden md:flex flex-1 max-w-md ml-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shirts, jeans, t-shirts..."
              className="w-full border border-gray-200 rounded-l-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button className="bg-accent text-white px-4 rounded-r-lg text-sm font-medium hover:bg-accent-dark">Search</button>
          </form>

          <nav className="hidden md:flex items-center gap-1 ml-auto">
            {navLink("/", "Home", "")}
            {navLink("/products", "Shop", "")}
            {navLink("/cart", "Cart", "", cartCount)}
            {navLink("/wishlist", "Wishlist", "")}
            {user && navLink("/orders", "Orders", "")}
            {!user ? (
              <>
                <Link to="/login" className="px-3 py-2 text-sm font-medium text-accent hover:bg-accent-semi/40 rounded-lg">Login</Link>
                <Link to="/register" className="px-3 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent-dark">Sign Up</Link>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <span className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                  {user.name?.split(" ")[0]}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                    {isAdmin && (
                      <>
                        <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Dashboard</Link>
                        <Link to="/admin/products" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Manage Products</Link>
                      </>
                    )}
                    <Link to="/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Profile</Link>
                    <Link to="/addresses" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My Addresses</Link>
                    <button onClick={() => { logout(); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50">Logout</button>
                  </div>
                )}
              </div>
            )}
          </nav>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-gray-600 ml-auto">☰</button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 px-4 py-2 bg-white space-y-1">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch(e)}
              placeholder="Search..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2"
            />
            {navLink("/", "Home", "")}
            {navLink("/products", "Shop", "")}
            {navLink("/cart", "Cart", "", cartCount)}
            {navLink("/wishlist", "Wishlist", "")}
            {user && navLink("/orders", "Orders", "")}
            {!user ? (
              <>
                {navLink("/login", "Login", "")}
                {navLink("/register", "Sign Up", "")}
              </>
            ) : (
              <>
                {isAdmin && navLink("/admin", "Admin Dashboard", "")}
                {navLink("/profile", "Profile", "")}
                <button onClick={() => { logout(); setMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50">Logout</button>
              </>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white py-6 text-center text-sm text-gray-500">
        <span className="font-bold text-gray-700">FashionMen</span> — Men's Fashion E-Commerce. All rights reserved.
      </footer>
    </div>
  );
}