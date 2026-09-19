import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  const img = product.images?.find((i) => i.isPrimary)?.url || product.images?.[0]?.url;
  const price = product.price;
  const discounted = price * (1 - (product.discount || 0) / 100);

  return (
    <Link
      to={`/products/${product.id}`}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
        {img ? (
          <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <span className="text-gray-400 text-3xl">{product.name.charAt(0)}</span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm truncate">{product.name}</h3>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-accent font-bold">₨{discounted.toFixed(0)}</span>
          {product.discount > 0 && (
            <>
              <span className="text-gray-400 text-xs line-through">₨{price.toFixed(0)}</span>
              <span className="text-green-600 text-xs font-medium">{product.discount}% off</span>
            </>
          )}
        </div>
        <span className="inline-block mt-2 px-2 py-0.5 text-[11px] text-gray-500 bg-gray-100 rounded-full">{product.category?.name || "Product"}</span>
      </div>
    </Link>
  );
}