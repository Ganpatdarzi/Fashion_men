import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function AddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: "", street: "", city: "", state: "", zip: "", country: "Pakistan", isDefault: false });

  const load = () => api.get("/addresses").then(setAddresses).catch(() => {});
  useEffect(() => { load(); }, []);

  const startNew = () => { setEditing(null); setForm({ label: "", street: "", city: "", state: "", zip: "", country: "Pakistan", isDefault: false }); setShowForm(true); };
  const startEdit = (a) => { setEditing(a); setForm(a); setShowForm(true); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/addresses/${editing.id}`, form);
      else await api.post("/addresses", form);
      setShowForm(false);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const remove = async (id) => {
    await api.delete(`/addresses/${id}`);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Addresses</h1>
        <button onClick={startNew} className="bg-accent text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-accent-dark">+ Add Address</button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-5 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <h2 className="font-bold mb-2">{editing ? "Edit" : "Add"} Address</h2>
          </div>
          {["label", "street", "city", "state", "zip", "country"].map((f) => (
            <input key={f} placeholder={f === "label" ? "Label (Home/Office)" : f.charAt(0).toUpperCase() + f.slice(1)} required={f !== "label"} value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent focus:outline-none" />
          ))}
          <div className="col-span-2 flex gap-3">
            <button className="bg-accent text-white font-semibold py-2 px-5 rounded-lg text-sm">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="border border-gray-200 text-gray-600 py-2 px-5 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      {addresses.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-xl">
          <p className="text-gray-500">No addresses saved.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">{a.label}</span>
                {a.isDefault && <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">Default</span>}
              </div>
              <p className="text-sm text-gray-600 mt-2">{a.street}</p>
              <p className="text-sm text-gray-600">{a.city}, {a.state} {a.zip}</p>
              <p className="text-sm text-gray-600">{a.country}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => startEdit(a)} className="text-accent text-sm hover:underline">Edit</button>
                <button onClick={() => remove(a.id)} className="text-red-500 text-sm hover:underline ml-2">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}