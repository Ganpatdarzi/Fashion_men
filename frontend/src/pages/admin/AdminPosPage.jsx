import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { api } from "../../lib/api";

function price(p) {
  return p.price * (1 - (p.discount || 0) / 100);
}

const METHOD_LABELS = { "POS Cash": "Cash", "POS Card": "Card", "POS Online": "Online" };

export default function AdminPosPage() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [payment, setPayment] = useState("Cash");
  const [picker, setPicker] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const [scanCode, setScanCode] = useState("");
  const [scanMsg, setScanMsg] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraErr, setCameraErr] = useState("");
  const scanRef = useRef(null);
  const scanBufferRef = useRef("");
  const scanningRef = useRef(false);
  const scannerRef = useRef(null);
  const scannerDivId = "pos-camera-scanner";

  useEffect(() => {
    if (scanMsg) {
      const t = setTimeout(() => setScanMsg(null), 3500);
      return () => clearTimeout(t);
    }
  }, [scanMsg]);

  const load = () => {
    api.get("/products?limit=200").then((d) => setProducts(d.products)).catch(() => {});
  };

  useEffect(() => {
    load();
    api.get("/admin/customers").then(setCustomers).catch(() => {});
    return () => stopCamera();
  }, []);

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {}
      try {
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
  };

  const startCamera = async () => {
    setCameraErr("");
    setCameraOpen(true);
    try {
      await new Promise((r) => setTimeout(r, 100));
      const scanner = new Html5Qrcode(scannerDivId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 220 },
        async (decodedText) => {
          await stopCamera();
          setCameraOpen(false);
          runScan(decodedText);
        },
        () => {}
      );
    } catch (err) {
      setCameraErr(err?.message || "Could not start camera. Allow camera access and try again.");
      setCameraOpen(false);
      scannerRef.current = null;
    }
  };

  const selectCustomer = (e) => {
    const id = e.target.value;
    setCustomerId(id);
    const c = customers.find((x) => x.id === Number(id));
    setName(c?.name || "");
    setPhone(c?.phone || "");
  };

  const editName = (e) => {
    setName(e.target.value);
    setCustomerId("");
  };

  const editPhone = (e) => {
    setPhone(e.target.value);
    setCustomerId("");
  };

  const addToCart = (v, qty) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.variantId === v.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
        return next;
      }
      return [...prev, { variantId: v.id, product: v.product, variant: v, quantity: qty }];
    });
    setPicker(null);
  };

  const changeQty = (variantId, delta) => {
    setCart((prev) => prev.map((c) => c.variantId === variantId ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c));
  };

  const removeItem = (variantId) => setCart((prev) => prev.filter((c) => c.variantId !== variantId));

  const filtered = products.filter((p) => (p.name + " " + (p.brand || "")).toLowerCase().includes(search.toLowerCase()));

  const subtotal = cart.reduce((s, c) => s + price(c.product) * c.quantity, 0);

  const runScan = async (code) => {
    const clean = (code || "").trim();
    if (!clean) return;
    setScanMsg(null);
    try {
      const data = await api.get(`/admin/pos/scan/${encodeURIComponent(clean)}`);
      if (data.variant) {
        if (data.variant.stock <= 0) return setScanMsg({ type: "err", text: `${data.product.name} (${data.variant.size}/${data.variant.color}) is out of stock` });
        addToCart({ ...data.variant, product: data.product }, 1);
        setScanMsg({ type: "ok", text: `Added: ${data.product.name} (${data.variant.size}/${data.variant.color})` });
      } else {
        const opts = data.product.variants.filter((v) => v.stock > 0);
        if (!opts.length) {
          setScanMsg({ type: "err", text: `${data.product.name} is out of stock` });
        } else if (opts.length === 1) {
          addToCart({ ...opts[0], product: data.product }, 1);
          setScanMsg({ type: "ok", text: `Added: ${data.product.name} (${opts[0].size}/${opts[0].color})` });
        } else {
          setPicker({ product: data.product, variants: opts, selected: opts[0].id, qty: 1 });
          setScanMsg({ type: "ok", text: `${data.product.name} found - select size & color` });
        }
      }
    } catch (err) {
      setScanMsg({ type: "err", text: err.message || "Barcode not found" });
    }
  };

  const handleScan = (e) => {
    e.preventDefault();
    const code = scanCode;
    setScanCode("");
    scanRef.current?.focus();
    runScan(code);
  };

  const resetScanBuffer = () => {
    scanBufferRef.current = "";
    scanningRef.current = false;
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (scanRef.current && document.activeElement === scanRef.current) return;
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key.length === 1) {
        scanBufferRef.current += e.key;
        scanningRef.current = true;
        return;
      }
      if ((e.key === "Enter" || e.key === "NumpadEnter") && scanningRef.current) {
        e.preventDefault();
        const code = scanBufferRef.current;
        resetScanBuffer();
        runScan(code);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const completeSale = async () => {
    setError("");
    if (!customerId && !name.trim()) return setError("Customer name is required");
    setPlacing(true);
    try {
      const order = await api.post("/admin/pos/orders", {
        customerId: customerId ? Number(customerId) : null,
        customerName: customerId ? undefined : name,
        customerPhone: customerId ? undefined : phone,
        items: cart.map((c) => ({ variantId: c.variantId, quantity: c.quantity })),
        paymentMethod: payment,
      });
      setDone(order);
      setCart([]);
      setName("");
      setPhone("");
      setCustomerId("");
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setPlacing(false);
    }
  };

  const verifyPayment = async () => {
    try {
      const updated = await api.put(`/admin/pos/orders/${done.id}/verify`);
      setDone({ ...done, paid: true, status: updated.status });
    } catch (e) {
      setError(e.message);
    }
  };

  if (done) {
    return <Receipt order={done} onPaid={verifyPayment} onNew={() => setDone(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">POS · Point of Sale</h1>
          <p className="text-sm text-gray-500">Create in-store sales and print receipts.</p>
        </div>
        <span className="text-sm font-semibold text-gray-600">Cart: {cart.reduce((s, c) => s + c.quantity, 0)} items · ₨{subtotal.toFixed(0)}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 items-start">
        <div className="lg:col-span-2 space-y-4">
          <form
            onSubmit={handleScan}
            className="flex items-center gap-3 bg-white border-2 border-accent-semi rounded-xl px-4 py-3 focus-within:border-accent transition-colors"
          >
            <span className="shrink-0 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white bg-accent rounded">Scan</span>
            <input
              ref={scanRef}
              value={scanCode}
              onChange={(e) => setScanCode(e.target.value)}
              placeholder="Scan barcode or type code, then Enter"
              autoFocus
              className="flex-1 text-sm bg-transparent focus:outline-none"
            />
            <button
              type="button"
              onClick={startCamera}
              className="shrink-0 text-xs font-semibold bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-accent"
            >
              Open Camera Scanner
            </button>
            <span className="text-xs text-gray-400">Enter ↵</span>
          </form>
          {scanMsg && (
            <div className={`text-xs px-3 py-2 rounded-lg ${scanMsg.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {scanMsg.text}
            </div>
          )}

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:outline-none"
          />

          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-xl text-gray-400">No products found.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filtered.map((p) => {
                const inStock = p.variants.some((v) => v.stock > 0);
                return (
                  <div key={p.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="aspect-square bg-gray-50 flex items-center justify-center">
                      {p.images?.[0]?.url ? (
                        <img src={p.images[0].url} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl font-bold text-gray-200">{p.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="font-bold text-accent">₨{price(p).toFixed(0)}</span>
                        <span className="text-[11px] text-gray-400">{p.variants.reduce((s, v) => s + v.stock, 0)} in stock</span>
                      </div>
                      <button
                        onClick={() => {
                          const opts = p.variants.filter((v) => v.stock > 0);
                          if (!opts.length) return;
                          if (opts.length === 1) addToCart({ ...opts[0], product: p }, 1);
                          else setPicker({ product: p, variants: opts, selected: opts[0].id, qty: 1 });
                        }}
                        disabled={!inStock}
                        className="w-full mt-2 bg-gray-900 text-white text-sm font-semibold py-1.5 rounded-lg hover:bg-accent disabled:opacity-40"
                      >
                        {inStock ? "Add" : "Out of stock"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 lg:sticky lg:top-20">
          <h3 className="font-bold mb-3">Sale Cart</h3>

          {cart.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Cart is empty. Add products from the left.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto mb-3">
              {cart.map((c) => (
                <div key={c.variantId} className="border border-gray-100 rounded-lg p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.product.name}</p>
                      <p className="text-[11px] text-gray-400">{c.variant.size} · {c.variant.color} · <span className="text-gray-500">₨{price(c.product).toFixed(0)}</span></p>
                    </div>
                    <button onClick={() => removeItem(c.variantId)} className="text-gray-300 hover:text-red-500 text-sm leading-none">✕</button>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <div className="flex items-center border border-gray-200 rounded-lg">
                      <button onClick={() => changeQty(c.variantId, -1)} className="px-2 py-0.5 text-gray-500 hover:text-accent">−</button>
                      <span className="px-2 text-sm font-semibold">{c.quantity}</span>
                      <button onClick={() => changeQty(c.variantId, 1)} className="px-2 py-0.5 text-gray-500 hover:text-accent">+</button>
                    </div>
                    <span className="font-bold text-sm">₨{(price(c.product) * c.quantity).toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-gray-100 pt-3 space-y-2.5">
            <div className="flex justify-between font-bold"><span>Total</span><span>₨{subtotal.toFixed(0)}</span></div>

            <label className="block">
              <span className="text-xs text-gray-500 font-medium">Existing customer (optional)</span>
              <select value={customerId} onChange={selectCustomer} className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="">New customer</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
              </select>
            </label>

            <label className="block">
              <span className="text-xs text-gray-500 font-medium">Customer Name *</span>
              <input value={name} onChange={editName} placeholder="Customer name" className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent focus:outline-none" />
            </label>

            <label className="block">
              <span className="text-xs text-gray-500 font-medium">Phone Number</span>
              <input value={phone} onChange={editPhone} placeholder="03XX-XXXXXXX" className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent focus:outline-none" />
            </label>

            <label className="block">
              <span className="text-xs text-gray-500 font-medium">Payment Method</span>
              <select value={payment} onChange={(e) => setPayment(e.target.value)} className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option>Cash</option>
                <option>Card</option>
                <option>Online</option>
              </select>
            </label>

            {payment !== "Cash" && (
              <p className="text-[11px] text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-2">
                Payment will be marked pending. Confirm received payment to hand over products.
              </p>
            )}

            {error && <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg">{error}</div>}

            <button onClick={completeSale} disabled={cart.length === 0 || placing} className="w-full bg-accent text-white font-bold py-3 rounded-lg hover:bg-accent-dark disabled:opacity-50">
              {placing ? "Completing..." : "Complete Sale"} · ₨{subtotal.toFixed(0)}
            </button>
          </div>
        </div>
      </div>

      {picker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" onClick={() => setPicker(null)}>
          <div className="bg-white rounded-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-1">{picker.product.name}</h3>
            <p className="text-sm text-gray-500 mb-3">Select size & color</p>

            <div className="space-y-2 max-h-56 overflow-y-auto mb-3">
              {picker.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setPicker({ ...picker, selected: v.id })}
                  className={`w-full flex items-center justify-between border rounded-lg px-3 py-2 text-sm ${picker.selected === v.id ? "border-accent bg-accent-semi/40" : "border-gray-200"}`}
                >
                  <span>{v.size} · {v.color}</span>
                  <span className="text-xs text-gray-400">{v.stock} in stock</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-gray-500">Qty</span>
              <div className="flex items-center border border-gray-200 rounded-lg">
                <button onClick={() => setPicker({ ...picker, qty: Math.max(1, picker.qty - 1) })} className="px-3 py-1 text-gray-500 hover:text-accent">−</button>
                <span className="px-3 text-sm font-semibold">{picker.qty}</span>
                <button onClick={() => setPicker({ ...picker, qty: picker.qty + 1 })} className="px-3 py-1 text-gray-500 hover:text-accent">+</button>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setPicker(null)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2 rounded-lg">Cancel</button>
              <button
                onClick={() => {
                  const v = picker.variants.find((x) => x.id === picker.selected);
                  addToCart({ ...v, product: picker.product }, picker.qty);
                }}
                className="flex-1 bg-accent text-white font-semibold py-2 rounded-lg hover:bg-accent-dark"
              >
                Add to Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {cameraOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="font-bold">Scan Barcode</h3>
              <button onClick={() => { stopCamera(); setCameraOpen(false); }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <div className="p-4 bg-gray-900">
              <div id={scannerDivId} className="w-full overflow-hidden rounded-lg" />
            </div>
            <p className="text-xs text-gray-500 px-5 py-3">Point the camera at a product barcode. It will be added automatically.</p>
          </div>
        </div>
      )}

      {cameraErr && (
        <div className="fixed bottom-5 right-5 bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg shadow-lg z-50 max-w-xs">{cameraErr}</div>
      )}
    </div>
  );
}

function Receipt({ order, onPaid, onNew }) {
  return (
    <div className="max-w-md mx-auto space-y-4">
      <div id="pos-receipt" className="bg-white border border-gray-200 rounded-xl p-6 text-sm">
        <div className="text-center border-b border-dashed border-gray-300 pb-3">
          <p className="text-xl font-extrabold tracking-tight">Fashion<span className="text-accent">Men</span></p>
          <p className="text-xs text-gray-500 mt-1">In-store Purchase Receipt</p>
        </div>

        <div className="py-3 space-y-1 text-xs">
          <div className="flex justify-between"><span className="text-gray-500">Receipt</span><span className="font-semibold">#{order.id}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Date</span><span>{new Date(order.createdAt).toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Customer</span><span>{order.user?.name}</span></div>
          {order.user?.phone && <div className="flex justify-between"><span className="text-gray-500">Phone</span><span>{order.user.phone}</span></div>}
          <div className="flex justify-between"><span className="text-gray-500">Payment</span><span>{METHOD_LABELS[order.paymentMethod] || order.paymentMethod}</span></div>
        </div>

        <div className="border-t border-dashed border-gray-300 py-2">
          {order.items.map((it) => (
            <div key={it.id} className="flex justify-between gap-2 py-1">
              <div className="min-w-0">
                <p className="truncate font-medium">{it.product.name}</p>
                <p className="text-[11px] text-gray-400">{it.variant?.size} · {it.variant?.color} × {it.quantity} × ₨{it.price.toFixed(0)}</p>
              </div>
              <span className="font-semibold shrink-0">₨{(it.price * it.quantity).toFixed(0)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-gray-300 pt-3 pb-2 flex justify-between items-center">
          <span className="font-bold">TOTAL</span>
          <span className="text-xl font-extrabold text-accent">₨{order.totalAmount.toFixed(0)}</span>
        </div>

        <div className={`rounded-lg px-3 py-2 text-center text-xs font-semibold ${order.paid ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"}`}>
          {order.paid ? "PAID" : "PAYMENT PENDING VERIFICATION"}
        </div>

        <p className="text-center text-[11px] text-gray-400 pt-3">Thank you for shopping!</p>
      </div>

      {!order.paid && (
        <button onClick={onPaid} className="w-full bg-green-600 text-white font-bold py-2.5 rounded-lg hover:bg-green-700">
          Payment Received — Verify & Deliver
        </button>
      )}

      <div className="flex gap-2">
        <button onClick={() => window.print()} className="flex-1 bg-gray-900 text-white font-semibold py-2.5 rounded-lg hover:bg-gray-800">
          Print Receipt
        </button>
        <button onClick={onNew} className="flex-1 bg-accent text-white font-semibold py-2.5 rounded-lg hover:bg-accent-dark">
          New Sale
        </button>
      </div>
    </div>
  );
}