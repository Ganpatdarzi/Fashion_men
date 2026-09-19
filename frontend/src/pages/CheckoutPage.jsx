import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useCart } from "../context/CartContext";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { refreshCart } = useCart();
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [newAddress, setNewAddress] = useState({ label: "Home", street: "", city: "", state: "", zip: "", country: "Pakistan", isDefault: false });
  const [addressMode, setAddressMode] = useState("existing");
  const [payment, setPayment] = useState("COD");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [placedOrder, setPlacedOrder] = useState(null);

  useEffect(() => {
    api.get("/cart").then(setCart).catch(() => {});
    api.get("/addresses").then((a) => {
      setAddresses(a);
      if (a.length) setSelectedAddress(String(a[0].id));
    }).catch(() => {});
  }, []);

  const items = cart?.items || [];

  const submitOrder = async () => {
    setError("");
    let addressId;
    if (addressMode === "new") {
      if (!newAddress.street || !newAddress.city) return setError("Please fill street and city");
      const created = await api.post("/addresses", newAddress);
      addressId = created.id;
    } else {
      if (!selectedAddress) return setError("Please select a delivery address");
      addressId = Number(selectedAddress);
    }

    setPlacing(true);
    try {
      const order = await api.post("/orders/checkout", { addressId, paymentMethod: payment });
      refreshCart();
      if (payment === "Card" || payment === "Online") {
        setPlacedOrder(order);
      } else {
        navigate(`/orders/${order.id}`);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setPlacing(false);
    }
  };

  if (!cart) return <div className="text-center py-20 text-gray-400">Loading checkout...</div>;

  if (items.length === 0 && !placedOrder) {
    return (
      <div className="text-center py-20 bg-white border border-gray-200 rounded-xl">
        <p className="text-gray-500 mb-4">Your cart is empty. Add items before checkout.</p>
        <Link to="/products" className="bg-accent text-white px-6 py-2.5 rounded-lg text-sm font-semibold">Go Shopping</Link>
      </div>
    );
  }

  if (placedOrder) {
    return <PaymentPending order={placedOrder} onDone={() => navigate(`/orders/${placedOrder.id}`)} />;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Checkout</h1>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2 space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-bold">Delivery Address</h3>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setAddressMode("existing")} className={`px-4 py-1.5 text-sm rounded-lg ${addressMode === "existing" ? "bg-accent text-white" : "border border-gray-200"}`}>Saved</button>
              <button onClick={() => setAddressMode("new")} className={`px-4 py-1.5 text-sm rounded-lg ${addressMode === "new" ? "bg-accent text-white" : "border border-gray-200"}`}>New Address</button>
            </div>

            {addressMode === "existing" ? (
              addresses.length === 0 ? (
                <p className="text-sm text-gray-400 mt-3">No saved addresses. Add a new one.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {addresses.map((a) => (
                    <label key={a.id} className={`flex items-start gap-2 border rounded-lg p-3 cursor-pointer ${Number(selectedAddress) === a.id ? "border-accent bg-accent-semi/40" : "border-gray-200"}`}>
                      <input type="radio" name="addr" checked={Number(selectedAddress) === a.id} onChange={() => setSelectedAddress(String(a.id))} />
                      <div className="text-sm">
                        <p className="font-semibold">{a.label}: {a.street}, {a.city}, {a.state} {a.zip}</p>
                        <p className="text-gray-500">{a.country}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {["street", "city", "state", "zip", "label"].map((f) => (
                  <input key={f} placeholder={f === "label" ? "Label (Home/Office)" : f.charAt(0).toUpperCase() + f.slice(1)} value={newAddress[f]} onChange={(e) => setNewAddress({ ...newAddress, [f]: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm col-span-2 focus:ring-2 focus:ring-accent focus:outline-none" />
                ))}
                <input placeholder="Country" value={newAddress.country} onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm col-span-2 focus:ring-2 focus:ring-accent focus:outline-none" />
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-bold mb-3">Payment Method</h3>
            <div className="space-y-2">
              {["COD", "Card", "Online"].map((p) => (
                <label key={p} className={`flex items-center gap-2 border rounded-lg p-3 cursor-pointer ${payment === p ? "border-accent bg-accent-semi/40" : "border-gray-200"}`}>
                  <input type="radio" name="pay" checked={payment === p} onChange={() => setPayment(p)} />
                  <span className="text-sm font-medium">{p === "COD" ? "Cash on Delivery" : p === "Card" ? "Credit/Debit Card" : "Online Bank Transfer"}</span>
                </label>
              ))}
            </div>

            {payment !== "COD" && (
              <div className="mt-4 bg-cream rounded-xl p-5 border border-gray-200">
                <h4 className="font-bold text-accent mb-3">Bank Transfer Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Bank</span><span className="font-semibold">Meezan Bank</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Account Title</span><span className="font-semibold">FashionMen (Pvt) Ltd</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Account No.</span><span className="font-semibold font-mono">0123-4567-8901-2345</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">IBAN</span><span className="font-semibold font-mono">PK12 MEZN 0123 4567 8901 2345</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Amount to Pay</span><span className="font-bold text-accent text-lg">₨{cart.total.toFixed(0)}</span></div>
                </div>
                <p className="mt-3 text-xs text-gray-500">After transferring, upload your receipt below. Your order will be confirmed after admin verification.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 h-fit sticky top-20">
          <h3 className="font-bold">Order Summary</h3>
          <div className="mt-3 space-y-2 text-sm max-h-48 overflow-y-auto">
            {items.map((it) => {
              const price = it.product.price * (1 - (it.product.discount || 0) / 100);
              return (
                <div key={it.id} className="flex justify-between text-gray-600">
                  <span className="truncate">{it.product.name} x{it.quantity}</span>
                  <span>₨{(price * it.quantity).toFixed(0)}</span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-gray-100 mt-3 pt-2 flex justify-between font-bold"><span>Total</span><span>₨{cart.total.toFixed(0)}</span></div>

          {error && <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg mt-3">{error}</div>}

          <button onClick={submitOrder} disabled={placing} className="w-full mt-4 bg-accent text-white font-semibold py-2.5 rounded-lg hover:bg-accent-dark disabled:opacity-50">
            {placing ? "Placing Order..." : "Place Order"}
          </button>
          <Link to="/cart" className="block text-center text-sm text-accent hover:underline mt-3">Back to cart</Link>
        </div>
      </div>
    </div>
  );
}

function PaymentPending({ order, onDone }) {
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [toast, setToast] = useState("");

  const handleUpload = async () => {
    if (!receiptFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("receipt", receiptFile);
      fd.append("orderId", order.id);
      await api.upload("/receipts/upload", fd);
      setUploaded(true);
      setToast("Receipt uploaded successfully!");
    } catch (e) {
      setToast(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {toast && <div className="fixed bottom-5 right-5 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">{toast}</div>}
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
        <div className="text-4xl mb-3">✓</div>
        <h2 className="text-xl font-bold mb-1">Order #{order.id} Placed</h2>
        <p className="text-sm text-gray-500 mb-4">Total: <span className="font-bold text-accent">₨{order.totalAmount.toFixed(0)}</span></p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-bold mb-3">Upload Payment Receipt</h3>
        <p className="text-sm text-gray-500 mb-3">Upload a screenshot or photo of your bank transfer confirmation.</p>
        <input type="file" accept="image/*,.pdf" onChange={(e) => setReceiptFile(e.target.files?.[0])} className="w-full text-sm border border-gray-200 rounded-lg p-2 mb-3" />
        {receiptFile && <p className="text-xs text-gray-500 mb-2">{receiptFile.name} ({(receiptFile.size / 1024).toFixed(1)} KB)</p>}
        <button onClick={handleUpload} disabled={!receiptFile || uploading || uploaded} className="w-full bg-accent text-white font-semibold py-2.5 rounded-lg hover:bg-accent-dark disabled:opacity-50">
          {uploading ? "Uploading..." : uploaded ? "Uploaded" : "Upload Receipt"}
        </button>
        <button onClick={onDone} className="w-full mt-3 text-accent hover:underline text-sm">View Order Details</button>
      </div>
    </div>
  );
}