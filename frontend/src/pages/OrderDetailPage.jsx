import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";

const STEPS = ["Order Placed", "Processing", "Shipped", "Out for Delivery", "Delivered"];
const STATUS_COLORS = {
  "Order Placed": "bg-blue-50 text-blue-600",
  Processing: "bg-yellow-50 text-yellow-600",
  Shipped: "bg-purple-50 text-purple-600",
  "Out for Delivery": "bg-orange-50 text-orange-600",
  Delivered: "bg-green-50 text-green-600",
  Cancelled: "bg-red-50 text-red-600",
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const loadReceipt = () => {
    api.get(`/receipts/order/${id}`).then(setReceipt).catch(() => setReceipt(null));
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    setIsAdmin(user?.role === "admin");
    api.get(`/orders/${id}`).then(setOrder).catch((e) => setError(e.message));
    loadReceipt();
  }, [id]);

  const handleUpload = async () => {
    if (!receiptFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("receipt", receiptFile);
      fd.append("orderId", id);
      await api.upload("/receipts/upload", fd);
      setReceiptFile(null);
      setToast("Receipt uploaded successfully!");
      loadReceipt();
    } catch (e) {
      setToast(e.message);
    } finally {
      setUploading(false);
    }
  };

  const downloadReceipt = () => {
    const token = localStorage.getItem("token");
    window.open(`/api/receipts/download/${receipt?.id}?token=${token}`, "_blank");
  };

  if (error) return <div className="text-center py-20 text-gray-500">{error}</div>;
  if (!order) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  const stepIndex = STEPS.indexOf(order.status);
  const isOnline = order.paymentMethod !== "COD";

  return (
    <div className="space-y-5">
      {toast && <div className="fixed bottom-5 right-5 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">{toast}</div>}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.id}</h1>
          <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()} • {order.paymentMethod}</p>
        </div>
        <span className={`px-3 py-1 text-sm font-medium rounded-full ${STATUS_COLORS[order.status] || "bg-gray-100"}`}>{order.status}</span>
      </div>

      {order.status !== "Cancelled" && stepIndex >= 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between relative">
            {STEPS.map((s, i) => (
              <div key={s} className="flex flex-col items-center flex-1 relative">
                {i > 0 && <div className={`absolute top-3 left-0 right-1/2 h-0.5 ${i <= stepIndex ? "bg-accent" : "bg-gray-200"}`} />}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10 ${i <= stepIndex ? "bg-accent text-white" : "bg-gray-200 text-gray-500"}`}>{i + 1}</div>
                <span className={`text-[11px] mt-1.5 text-center ${i <= stepIndex ? "text-accent font-medium" : "text-gray-400"}`}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isOnline && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <h3 className="font-bold">Payment Receipt</h3>
            {receipt && (
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${receipt.status === "confirmed" ? "bg-green-50 text-green-600" : receipt.status === "rejected" ? "bg-red-50 text-red-600" : "bg-yellow-50 text-yellow-600"}`}>
                {receipt.status === "confirmed" ? "Confirmed" : receipt.status === "rejected" ? "Rejected" : "Pending Verification"}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {isAdmin
              ? "Customer has not uploaded a receipt for this order yet."
              : "This is an online/card payment. Bank transfer details were shown at checkout. Upload your payment receipt so the admin can verify it."}
          </p>

          {!receipt && !isAdmin && (
            <div className="mt-3 flex flex-wrap gap-3 items-end">
              <input type="file" accept="image/*,.pdf" onChange={(e) => setReceiptFile(e.target.files?.[0])} className="text-sm border border-gray-200 rounded-lg p-2 flex-1 min-w-48" />
              <button onClick={handleUpload} disabled={!receiptFile || uploading} className="bg-accent text-white font-semibold text-sm px-5 py-2 rounded-lg hover:bg-accent-dark disabled:opacity-50">
                {uploading ? "Uploading..." : "Upload Receipt"}
              </button>
            </div>
          )}

          {receipt && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <a href={receipt.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-accent hover:underline text-sm font-medium">
                View Receipt
              </a>
              <button onClick={downloadReceipt} className="inline-flex items-center gap-2 text-gray-600 hover:text-accent text-sm font-medium">
                Download
              </button>
              {receipt.status === "rejected" && !isAdmin && (
                <div className="mt-2 w-full flex flex-wrap gap-3 items-end">
                  <input type="file" accept="image/*,.pdf" onChange={(e) => setReceiptFile(e.target.files?.[0])} className="text-sm border border-gray-200 rounded-lg p-2 flex-1 min-w-48" />
                  <button onClick={handleUpload} disabled={!receiptFile || uploading} className="bg-accent text-white font-semibold text-sm px-5 py-2 rounded-lg hover:bg-accent-dark disabled:opacity-50">
                    {uploading ? "Uploading..." : "Re-upload Receipt"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-bold mb-3">Items</h3>
          <div className="space-y-3">
            {order.items.map((it) => {
              const img = it.product?.images?.[0]?.url;
              return (
                <div key={it.id} className="flex gap-3 items-center border-b border-gray-100 pb-3">
                  {img ? <img src={img} className="w-12 h-12 rounded-lg object-cover" /> : <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">{it.product?.name?.charAt(0)}</div>}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{it.product?.name}</p>
                    <p className="text-xs text-gray-400">{it.variant?.size} • {it.variant?.color} • Qty {it.quantity}</p>
                  </div>
                  <span className="font-bold text-sm">₨{(it.price * it.quantity).toFixed(0)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 h-fit sticky top-20">
          <h3 className="font-bold mb-3">Details</h3>
          <div className="text-sm space-y-2">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₨{order.totalAmount.toFixed(0)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Shipping</span><span className="text-green-600">Free</span></div>
            <div className="border-t border-gray-100 pt-2 flex justify-between font-bold"><span>Total</span><span>₨{order.totalAmount.toFixed(0)}</span></div>
          </div>
          <div className="mt-4 bg-cream-light rounded-lg p-3">
            <p className="font-semibold text-xs text-gray-500 mb-1">DELIVERY ADDRESS</p>
            <p className="text-sm">{order.deliveryAddress}</p>
          </div>
          <Link to="/orders" className="block text-center text-sm text-accent hover:underline mt-4">Back to orders</Link>
        </div>
      </div>
    </div>
  );
}