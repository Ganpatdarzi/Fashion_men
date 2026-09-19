import { useEffect, useState } from "react";
import { api } from "../../lib/api";

const STATUS_STYLES = {
  pending: "bg-yellow-50 text-yellow-600",
  confirmed: "bg-green-50 text-green-600",
  rejected: "bg-red-50 text-red-600",
};

export default function AdminReceiptsPage() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [filter, setFilter] = useState("all");

  const load = () => {
    setLoading(true);
    api.get("/receipts/pending").then(setReceipts).catch(() => setReceipts([])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/receipts/${id}/confirm`, { status });
      setToast(`Receipt ${status}`);
      load();
    } catch (e) {
      setToast(e.message);
    }
  };

  const downloadReceipt = (id) => {
    const token = localStorage.getItem("token");
    window.open(`/api/receipts/download/${id}?token=${token}`, "_blank");
  };

  const filtered = filter === "all" ? receipts : receipts.filter(r => r.status === filter);
  const counts = {
    all: receipts.length,
    pending: receipts.filter(r => r.status === "pending").length,
    confirmed: receipts.filter(r => r.status === "confirmed").length,
    rejected: receipts.filter(r => r.status === "rejected").length,
  };

  return (
    <div className="space-y-4">
      {toast && <div className="fixed bottom-5 right-5 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">{toast}</div>}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Payment Receipts</h1>
          <p className="text-sm text-gray-500">{receipts.length} total, {counts.pending} pending</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "confirmed", "rejected"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 text-sm rounded-lg capitalize ${filter === f ? "bg-accent text-white" : "bg-white border border-gray-200 text-gray-600"}`}>
            {f} <span className="text-xs opacity-75">({counts[f]})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
          <p className="text-gray-500">No {filter !== "all" ? filter : ""} receipts found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1 min-w-48">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="font-semibold text-sm">Order #{r.orderId}</h4>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${STATUS_STYLES[r.status]}`}>{r.status}</span>
                </div>
                <p className="text-sm text-gray-500">
                  {r.order?.user?.name || "User"} &middot; {r.order?.user?.email}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {r.fileName} &middot; {(r.fileSize / 1024).toFixed(1)} KB &middot; {new Date(r.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <a href={r.url} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline">View</a>
                <button onClick={() => downloadReceipt(r.id)} className="text-sm text-gray-600 hover:text-accent">Download</button>
                {r.status === "pending" && (
                  <>
                    <button onClick={() => updateStatus(r.id, "confirmed")} className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded-lg hover:bg-green-100">Confirm</button>
                    <button onClick={() => updateStatus(r.id, "rejected")} className="text-sm bg-red-50 text-red-700 px-3 py-1 rounded-lg hover:bg-red-100">Reject</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}