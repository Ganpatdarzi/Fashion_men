import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "", password: "" });
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const data = { name: form.name, phone: form.phone };
      if (form.password) data.password = form.password;
      await api.put("/auth/me", data);
      setMsg("Profile updated successfully!");
      setForm({ ...form, password: "" });
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Profile</h1>

      <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-6 max-w-md space-y-4">
        {msg && <div className="bg-green-50 text-green-600 text-sm px-3 py-2 rounded-lg">{msg}</div>}

        <div>
          <label className="text-sm font-medium block mb-1">Full Name</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Email</label>
          <input disabled value={user?.email} className="w-full border border-gray-100 bg-cream-light rounded-lg px-3 py-2 text-sm text-gray-400" />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Phone</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">New Password (optional)</label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Leave blank to keep" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>

        <button className="bg-accent text-white font-semibold py-2.5 rounded-lg hover:bg-accent-dark">Save Changes</button>
      </form>
    </div>
  );
}