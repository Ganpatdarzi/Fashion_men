# FashionMen — Men's Fashion E-Commerce Platform

A full-stack men's fashion e-commerce application with admin panel, customer storefront, POS (Point of Sale), and payment receipt verification.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Express.js 5, Prisma ORM 5.22, SQLite |
| **Frontend** | React 19, React Router 7, Vite 8, Tailwind CSS 4 |
| **Auth** | JWT (jsonwebtoken), bcryptjs |
| **File Upload** | Multer (payment receipts) |
| **Database** | SQLite (dev) — swappable to PostgreSQL/MySQL via Prisma |

---

## Features

### Customer Storefront
- Homepage with hero banner, featured products, categories
- Product listing with search, category filter, price/brand/material/fit filters, sort
- Product detail with variant selection (size/color), images, reviews, add-to-cart
- Shopping cart with quantity controls, live badge count, toast notifications
- Wishlist — move items to cart, view wishlist
- Checkout — saved/new address, payment method (COD / Card / Online), order placement
- Card/Online payments show bank transfer details + receipt upload after order
- Order history + order detail with tracking stepper (Placed → Processing → Shipped → Out → Delivered)
- Receipt view/download on order detail page (for online/card orders)
- User profile (name, phone), address management

### Admin Panel
- Dark navbar — distinct from customer layout, links: Dashboard / POS / Products / Categories / Orders / Customers / Reviews / Receipts
- **Dashboard** — stat cards (users, products, orders, pending, sales), recent orders, quick-action cards
- **Product Management** — CRUD, images, variants (size/color/stock), category assignment
- **Category Management** — CRUD with subcategory support
- **Order Management** — status filter, status update dropdown, POS payment verification
- **Customer List** — view registered customers with order counts
- **Review Management** — view/delete product reviews
- **Payment Receipts** — filter by status, view/download, confirm/reject
- **POS (Point of Sale)** — in-store sales with customer details, variant picker, payment, printable receipt
- **Notifications** — bell icon with unread badge, auto-polled dropdown, type-colored badges (customer/order/review/receipt), mark read / mark all read

### Point of Sale (POS)
- Customer name (required) + phone number entry
- Optional "existing customer" dropdown with auto-fill
- Customer deduplication (same phone = same customer)
- Product search + grid with stock count
- Variant picker modal (size/color with stock) — single-variant auto-add
- Cart sidebar with qty controls, total, customer & payment selection
- **Cash** → paid immediately, order status Delivered
- **Card / Online** → order status Order Placed (pending), admin verifies payment → status changes to Delivered
- Printable receipt (browser print, CSS-isolates receipt only)
- Stock decremented on every sale (transactional)

### Payment Verification Flow
- Customer uploads receipt for online/card orders
- Admin views receipt, confirms/rejects → order status updates to Processing
- POS: admin clicks "Payment Received" to confirm → order marked Delivered

---

## Prerequisites

- **Node.js** 18+ (tested with 24.x)
- **npm** 9+
- **Git** (optional)

No database server required — SQLite is embedded and auto-created on first run.

---

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd fashion-men

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Set up environment
cp .env.example .env   # or create manually:
```

### .env

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-here"
PORT=5000
```

### Database Setup

```bash
# Push schema to database (creates tables)
npx prisma db push

# Seed default data (admin + demo products, categories, customers)
node prisma/seed.js
```

### Seed Data

The seed script creates:
- Admin user (`admin@fashion.com` / `admin123`)
- Demo customer (`customer@fashion.com` / `customer123`)
- 3 categories (Shirts, Polo Shirts, Jeans) with subcategories
- 3 products with variants (10 units each)
- Placeholder product images in `uploads/`

---

## Running the App

```bash
# Terminal 1 — Backend (port 5000)
npm start
# or: node src/index.js

# Terminal 2 — Frontend dev server (port 5173)
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

The frontend dev server proxies `/api` and `/uploads` to the backend on port 5000.

### Build for Production

```bash
cd frontend
npm run build
# Output in frontend/dist/
```

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@fashion.com | admin123 |
| Customer | customer@fashion.com | customer123 |

---

## Project Structure

```
fashion-men/
├── .env                          # Environment variables
├── package.json                  # Backend dependencies
├── src/
│   ├── index.js                  # Express app entry point
│   ├── middleware/
│   │   ├── auth.js               # JWT authenticate + adminOnly
│   │   └── errorHandler.js       # Global error handler
│   ├── routes/
│   │   ├── auth.js               # Register, login, profile
│   │   ├── products.js           # Product CRUD + listing
│   │   ├── categories.js         # Category CRUD
│   │   ├── cart.js               # Cart management
│   │   ├── wishlist.js           # Wishlist management
│   │   ├── orders.js             # Customer checkout + order history
│   │   ├── reviews.js            # Product reviews
│   │   ├── addresses.js          # Address CRUD
│   │   ├── receipts.js           # Payment receipt upload/download
│   │   └── admin.js              # Admin dashboard, orders, customers,
│   │                             #   reviews, notifications, POS
│   └── utils/
│       └── notify.js             # Admin notification helper
├── prisma/
│   ├── schema.prisma             # Database schema (15 models)
│   └── seed.js                   # Seed script
├── uploads/                      # Product images + receipt files
│   ├── *.jpg                     # Product placeholder images
│   └── receipts/                 # Uploaded payment receipts
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx              # Router + routes
        ├── index.css             # Tailwind + print styles
        ├── lib/api.js            # API client with auth + file upload
        ├── context/
        │   ├── AuthContext.jsx    # Login state, user, logout
        │   └── CartContext.jsx    # Cart count + refresh
        ├── hooks/
        │   └── useAdminNotifications.js  # Polling notifications hook
        ├── components/
        │   ├── Layout.jsx        # Customer navbar + footer
        │   ├── AdminLayout.jsx   # Admin navbar + bell + dropdown
        │   └── ProductCard.jsx   # Reusable product card
        └── pages/
            ├── HomePage.jsx
            ├── ProductsPage.jsx
            ├── ProductDetailPage.jsx
            ├── CartPage.jsx
            ├── WishlistPage.jsx
            ├── CheckoutPage.jsx
            ├── OrdersPage.jsx
            ├── OrderDetailPage.jsx
            ├── ProfilePage.jsx
            ├── AddressesPage.jsx
            ├── LoginPage.jsx
            ├── RegisterPage.jsx
            └── admin/
                ├── DashboardPage.jsx
                ├── AdminProductsPage.jsx
                ├── AdminCategoriesPage.jsx
                ├── AdminOrdersPage.jsx
                ├── AdminCustomersPage.jsx
                ├── AdminReviewsPage.jsx
                ├── AdminReceiptsPage.jsx
                └── AdminPosPage.jsx
```

---

## Database Schema (15 Models)

| Model | Purpose |
|-------|---------|
| **User** | Customers and admins (role field) |
| **Address** | Saved delivery addresses per user |
| **Category** | Top-level product categories |
| **Subcategory** | Subcategories within a category |
| **Product** | Product with price, discount, brand, material, fit |
| **ProductVariant** | Size/color variant with stock count |
| **ProductImage** | Product images (URL + isPrimary) |
| **Cart** | One cart per user |
| **CartItem** | Items in a cart (product + variant + qty) |
| **WishlistItem** | Saved products per user |
| **Order** | Customer order (status, paymentMethod, paid flag) |
| **OrderItem** | Line items in an order (product + variant + qty + price) |
| **Review** | Product reviews (rating + comment, one per user per product) |
| **PaymentReceipt** | Uploaded payment receipts for online/card orders |
| **AdminNotification** | Real-time notifications for the admin panel |

---

## API Endpoints

### Authentication (`/api/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | No | Register new customer |
| POST | `/login` | No | Login, returns JWT + user |
| GET | `/me` | Yes | Get current user profile |
| PUT | `/me` | Yes | Update profile (name, phone, password) |

### Products (`/api/products`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | List products (search, filter, sort, pagination) |
| GET | `/:id` | No | Get single product with variants, images, reviews |
| POST | `/` | Admin | Create product |
| PUT | `/:id` | Admin | Update product |
| DELETE | `/:id` | Admin | Delete product |
| POST | `/:id/variants` | Admin | Add variant |
| PUT | `/variants/:variantId` | Admin | Update variant stock |
| POST | `/:id/images` | Admin | Add image |

### Categories (`/api/categories`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | List all categories with subcategories |
| POST | `/` | Admin | Create category |
| PUT | `/:id` | Admin | Update category |
| DELETE | `/:id` | Admin | Delete category |
| POST | `/:id/subcategories` | Admin | Add subcategory |
| DELETE | `/subcategories/:id` | Admin | Delete subcategory |

### Cart (`/api/cart`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Yes | Get cart with items |
| POST | `/add` | Yes | Add item to cart (productId, variantId, quantity) |
| PUT | `/items/:id` | Yes | Update item quantity |
| DELETE | `/items/:id` | Yes | Remove item |

### Wishlist (`/api/wishlist`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Yes | Get wishlist |
| POST | `/` | Yes | Toggle wishlist item |
| GET | `/check/:productId` | Yes | Check if product is in wishlist |

### Orders (`/api/orders`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/checkout` | Yes | Place order from cart |
| GET | `/` | Yes | Get order history |
| GET | `/:id` | Yes | Get single order detail |

### Addresses (`/api/addresses`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Yes | List addresses |
| POST | `/` | Yes | Create address |
| PUT | `/:id` | Yes | Update address |
| DELETE | `/:id` | Yes | Delete address |

### Reviews (`/api/reviews`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/product/:productId` | No | Get reviews for product |
| POST | `/` | Yes | Create review |
| DELETE | `/:id` | Yes | Delete own review (or admin) |

### Payment Receipts (`/api/receipts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/upload` | Yes | Upload receipt (multipart/form-data) |
| GET | `/order/:orderId` | Yes | Get receipt for order |
| GET | `/pending` | Admin | List all receipts |
| PUT | `/:id/confirm` | Admin | Confirm or reject receipt |
| GET | `/download/:id` | Token | Download receipt file |

### Admin (`/api/admin`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/dashboard` | Admin | Dashboard stats |
| GET | `/orders` | Admin | List all orders (filter by status) |
| PUT | `/orders/:id` | Admin | Update order status |
| GET | `/customers` | Admin | List all customers |
| GET | `/reviews` | Admin | List all reviews |
| DELETE | `/reviews/:id` | Admin | Delete any review |
| GET | `/notifications` | Admin | Get notifications + unread count |
| PUT | `/notifications/:id/read` | Admin | Mark notification read |
| PUT | `/notifications/read-all` | Admin | Mark all notifications read |
| POST | `/pos/orders` | Admin | Create POS in-store order |
| PUT | `/pos/orders/:id/verify` | Admin | Verify POS payment |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `file:./dev.db` | SQLite database path (or PostgreSQL/MySQL URL) |
| `JWT_SECRET` | — | Secret key for JWT token signing |
| `PORT` | `5000` | Backend server port |

---

## Currency

All prices are in **Pakistani Rupee (₨ / PKR, U+20A8)**. Default country is Pakistan.

---

## License

ISC
