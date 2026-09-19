import { useEffect, useState } from "react";
import { api } from "../../lib/api";

const STATUSES = ["Order Placed", "Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];
const STATUS_COLORS = {
  "Order Placed": "bg-blue-50 text-blue-600",
  Processing: "bg-yellow-50 text-yellow-600",
  Shipped: "bg-purple-50 text-purple-600",
  "Out for Delivery": "bg-orange-50 text-orange-600",
  Delivered: "bg-green-50 text-green-600",
  Cancelled: "bg-red-50 text-red-600",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("");
  const [toast, setToast] = useState("");

  const load = () => api.get(`/admin/orders${filter ? `?status=${encodeURIComponent(filter)}` : ""}`).then(setOrders).catch(() => {});
  useEffect(() => { load(); }, [filter]);
  useEffect(() => { if (toast) setTimeout(() => setToast(""), 2500); }, [toast]);

  const updateStatus = async (id, status) => {
    await api.put(`/admin/orders/${id}`, { status });
    setToast(`Order #${id} → ${status}`);
    load();
  };

  const updateReceipt = async (receiptId, status) => {
    await api.put(`/receipts/${receiptId}/confirm`, { status });
    setToast(`Payment ${status}`);
    load();
  };

  const verifyPos = async (id) => {
    await api.put(`/admin/pos/orders/${id}/verify`);
    setToast(`Payment verified for order #${id}`);
    load();
  };

  const receiptBadge = (r) => {
    if (!r) return null;
    return (
      <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full capitalize ${r.status === "confirmed" ? "bg-green-50 text-green-600" : r.status === "rejected" ? "bg-red-50 text-red-600" : "bg-yellow-50 text-yellow-600"}`}>
        {r.status}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {toast && <div className="fixed bottom-5 right-5 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">{toast}</div>}

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter("")} className={`px-3 py-1.5 text-sm rounded-lg ${!filter ? "bg-gray-900 text-white" : "bg-white border border-gray-200"}`}>All ({orders.length})</button>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 text-sm rounded-lg ${filter === s ? "bg-gray-900 text-white" : "bg-white border border-gray-200"}`}>{s}</button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl text-gray-400">No orders {filter ? `with status "${filter}"` : ""}.</div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Order #{o.id}</p>
                  <p className="text-xs text-gray-400">{o.user?.name} • {o.user?.email}</p>
                  <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleString()}</p>
                </div>
                <span className="font-bold text-accent">₨{o.totalAmount.toFixed(0)}</span>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                <div className="flex items-center gap-2 text-sm">
                  {o.paymentMethod}
                  <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-sm">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                {o.items.map((it) => (
                  <span key={it.id} className="bg-gray-50 px-2 py-1 rounded">{Math.round(it.price)} × {it.quantity}</span>
                ))}
              </div>

              {o.paymentMethod.startsWith("POS") ? (
                <div className="mt-3 border-t border-gray-100 pt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">Payment:</span>
                    {o.paid ? (
                      <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-green-50 text-green-600">Paid</span>
                    ) : (
                      <>
                        <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-yellow-50 text-yellow-600">Awaiting Verification</span>
                        <button onClick={() => verifyPos(o.id)} className="text-[11px] bg-green-50 text-green-700 px-2 py-0.5 rounded hover:bg-green-100">Confirm Payment Received</button>
                      </>
                    )}
                  </div>
                </div>
              ) : o.paymentMethod !== "COD" ? (
                <div className="mt-3 border-t border-gray-100 pt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">Payment Verification:</span>
                    {o.receipt ? (
                      <>
                        {receiptBadge(o.receipt)}
                        <a href={o.receipt.url} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">View Receipt</a>
                        {o.receipt.status === "pending" && (
                          <div className="flex gap-1.5">
                            <button onClick={() => updateReceipt(o.receipt.id, "confirmed")} className="text-[11px] bg-green-50 text-green-700 px-2 py-0.5 rounded hover:bg-green-100">Confirm</button>
                            <button onClick={() => updateReceipt(o.receipt.id, "rejected")} className="text-[11px] bg-red-50 text-red-700 px-2 py-0.5 rounded hover:bg-red-100">Reject</button>
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">No receipt uploaded yet</span>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}