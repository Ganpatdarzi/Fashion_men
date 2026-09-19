import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await api.post("/auth/login", form);
      login(data.user, data.token);
      navigate(data.user.role === "admin" ? "/admin" : "/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cream">
      <form onSubmit={submit} className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-sm shadow-sm space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold">Fashion<span className="text-accent">Men</span></h1>
          <p className="text-sm text-gray-500 mt-1">Login to your account</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}

        <div>
          <label className="text-sm font-medium block mb-1">Email</label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Password</label>
          <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>

        <button className="w-full bg-accent text-white font-semibold py-2.5 rounded-lg hover:bg-accent-dark">Login</button>

        <p className="text-sm text-center text-gray-500">
          Don't have an account? <Link to="/register" className="text-accent hover:underline">Sign up</Link>
        </p>

        <div className="text-xs bg-cream-light rounded-lg p-3 text-gray-500">
          <strong>Demo:</strong> customer@fashion.com / customer123<br />admin@fashion.com / admin123
        </div>
      </form>
    </div>
  );
}