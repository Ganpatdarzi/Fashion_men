# Software Requirements Specification (SRS)

## FashionMen — Men's Fashion E-Commerce Platform

**Version:** 1.0  
**Date:** 2026-09-07  
**Status:** Final  

---

## Table of Contents

1. Introduction
   1.1 Purpose
   1.2 Scope
   1.3 Definitions, Acronyms, and Abbreviations
   1.4 References
2. Overall Description
   2.1 Product Perspective
   2.2 Product Functions
   2.3 User Classes and Characteristics
   2.4 Operating Environment
   2.5 Design and Implementation Constraints
   2.6 Assumptions and Dependencies
3. Specific Requirements
   3.1 Functional Requirements
   3.2 Non-Functional Requirements
   3.3 External Interface Requirements
4. System Architecture
   4.1 Architecture Overview
   4.2 Data Perspective (Entity-Relationship Summary)
   4.3 Security Model
5. API Specification
6. User Interface Design
7. Notification & Real-Time Requirements
8. Payment Handling Requirements
9. POS Requirements
10. Testing Requirements
11. Appendix — Glossary

---

## 1. Introduction

### 1.1 Purpose

This document specifies the functional and non-functional requirements for the **FashionMen** men's fashion e-commerce platform. FashionMen provides a customer-facing online store, a separate admin panel for managing the store, and a Point-of-Sale (POS) module for in-store sales. The purpose of this SRS is to serve as the definitive reference for developers, testers, and stakeholders.

### 1.2 Scope

The system consists of three integrated subsystems:

1. **Customer Storefront** (React SPA)
   - Product browsing, search, filtering
   - Cart, wishlist, checkout, order tracking
   - User accounts, addresses, profile, reviews

2. **Admin Panel**
   - Product/category/order/customer/review management
   - Dashboard with analytics
   - Payment receipt verification
   - Notification center
   - POS module

3. **Backend API** (Express + Prisma)
   - RESTful JSON API
   - JWT authentication and role-based authorization
   - SQLite database persistence
   - File upload for payment receipts

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|------|-----------|
| SRS | Software Requirements Specification |
| POS | Point of Sale — in-store terminal for direct sales |
| SPA | Single Page Application |
| JWT | JSON Web Token |
| COD | Cash on Delivery |
| PKR / ₨ | Pakistani Rupee (U+20A8) — the platform currency |
| CRUD | Create, Read, Update, Delete |
| Prisma | ORM used for database access |
| Multer | Node.js middleware for multipart file uploads |
| DRF | Distributed Resource Framework (not used) |
| Admin | User with `role = "admin"`; full system access |
| Walk-in | A POS sale without a preregistered customer |

### 1.4 References

- Project README (README.md)
- Prisma Schema (`prisma/schema.prisma`)
- Backend source (`src/`)
- Frontend source (`frontend/src/`)

---

## 2. Overall Description

### 2.1 Product Perspective

FashionMen is a **green-field** application. It is a standalone system comprising:

- **Backend API service** — Express.js app running on port 5000.
- **Frontend SPA** — React (Vite) app running on port 5173 in development, proxying `/api` and `/uploads` to the backend.
- **Database** — SQLite via Prisma, stored at `prisma/dev.db`.

The system places **no build-time coupling** between the modules; frontend and backend communicate exclusively through the documented REST API.

### 2.2 Product Functions

**Customer Functions (FR-C section):**
- Register / login / update profile
- Browse catalog, search, filter, sort
- View product details (images, variants, reviews)
- Maintain cart and wishlist
- Manage delivery addresses
- Place orders (COD, Card, Online bank transfer)
- Upload/retrieve payment receipts for online/card orders
- View order history and track order status

**Admin Functions (FR-A section):**
- Dashboard with key business metrics
- Manage products, variants, images, stock
- Manage categories and subcategories
- Manage order statuses and payment verification
- View and moderate customer reviews
- View customers
- Manage payment receipts (view/download/confirm/reject)
- Operate POS terminal
- Receive and manage notifications

### 2.3 User Classes and Characteristics

| Class | Description | Privileges |
|-------|-------------|-----------|
| **Guest** | Unauthenticated visitor | Browse and search catalog; view product details |
| **Customer** | Registered shopper | All guest actions + cart, wishlist, checkout, orders, addresses, profile, reviews |
| **Admin** | Store operator | All platform functionality including admin panel, POS, and payment verification |

### 2.4 Operating Environment

- **Node.js** ≥ 18 (tested on 24.x)
- **npm** ≥ 9
- **Windows / Linux / macOS**
- Modern browser (Chrome, Edge, Firefox, Safari) — no IE support
- No database server installation required (embedded SQLite)

### 2.5 Design and Implementation Constraints

- Backend must use **Express.js**, **Prisma ORM**, **JWT**, **bcryptjs**, and **Multer**.
- Frontend must use **React 19**, **Vite**, **Tailwind CSS 4**.
- Currency display must use the **₨ (PKR)** symbol; default country **Pakistan**.
- Authentication must be **stateless JWT** stored client-side in `localStorage`.
- The UI must avoid excessive vertical scrolling and element overlap; page-to-page flow must be connected and navigable.
- Color theme: half white and light cream (Tailwind `@theme` tokens: `cream`, `cream-light`, `accent`, `accent-dark`, `accent-semi`).
- Backend remains **simple/non-complex**; monolith routing in `src/routes/`.

### 2.6 Assumptions and Dependencies

- The admin user is **pre-seeded**; there is no self-service admin registration.
- Placeholder product images are static files in `uploads/`.
- Payment integration is **manual/illustrative**: bank account details are shown, and verification is performed by the admin from an uploaded receipt or POS confirmation — no real payment gateway.
- Internet access is not required for runtime beyond bundle load in production.

---

## 3. Specific Requirements

### 3.1 Functional Requirements

#### 3.1.1 Authentication & User Management (FR-C-AUTH)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-C-AUTH-1 | The system shall allow a guest to register with name, email, password, and optional phone. | High |
| FR-C-AUTH-2 | The system shall reject registration when the email already exists. | High |
| FR-C-AUTH-3 | Passwords shall be hashed using bcrypt (10 rounds) before storage. | High |
| FR-C-AUTH-4 | The system shall issue a JWT (7-day expiry) upon successful registration/login. | High |
| FR-C-AUTH-5 | Registered users shall be assigned `role = "customer"`. | High |
| FR-C-AUTH-6 | Users shall be able to update their name, phone, and password. | Medium |
| FR-C-AUTH-7 | Users may not modify their email after registration. | Medium |
| FR-C-AUTH-8 | Protected routes shall verify the JWT; invalid/expired tokens shall be rejected with 401. | High |
| FR-C-AUTH-9 | Admin-only routes shall additionally verify `role = "admin"`, else return 403. | High |

#### 3.1.2 Catalog & Products (FR-C-PROD)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-C-PROD-1 | Guests and customers shall browse active products. | High |
| FR-C-PROD-2 | Product listing shall support search by name, filter by category/subcategory/brand/material/fit/price, and sorting (latest, price asc/desc, popular). | High |
| FR-C-PROD-3 | Product listing shall support pagination (default 12 per page). | Medium |
| FR-C-PROD-4 | Product detail shall display images, price, discount, brand, material, fit, variants (size/color/stock), and reviews. | High |
| FR-C-PROD-5 | Product price display shall reflect discount: `display = price × (1 − discount/100)`. | High |
| FR-C-PROD-6 | Inactive products shall be hidden from the public catalog. | High |

#### 3.1.3 Categories (FR-C-CAT)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-C-CAT-1 | Categories shall be shown on the homepage and filtered product views. | High |
| FR-C-CAT-2 | Categories may contain subcategories. | Medium |

#### 3.1.4 Cart (FR-C-CART)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-C-CART-1 | Only authenticated customers may use the cart. | High |
| FR-C-CART-2 | The system shall persist one cart per user. | High |
| FR-C-CART-3 | Users shall add products by variant (size/color) and quantity. | High |
| FR-C-CART-4 | Users shall update quantity and remove items. | High |
| FR-C-CART-5 | The global navbar shall display the live cart item count. | High |
| FR-C-CART-6 | Adding to cart shall trigger a toast notification with the updated count. | Medium |
| FR-C-CART-7 | Cart totals shall reflect discounted prices. | High |

#### 3.1.5 Wishlist (FR-C-WISH)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-C-WISH-1 | Authenticated customers shall toggle products on/off their wishlist. | High |
| FR-C-WISH-2 | The system shall enforce a unique (user, product) constraint. | High |
| FR-C-WISH-3 | Users shall be able to move a wishlist item into the cart directly. | Medium |

#### 3.1.6 Checkout & Orders (FR-C-ORDER)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-C-ORDER-1 | Checkout shall require a delivery address (saved or newly entered). | High |
| FR-C-ORDER-2 | Payment methods: **COD**, **Card**, **Online bank transfer**. | High |
| FR-C-ORDER-3 | Order creation shall be **transactional**: validate stock, create order + items, decrement stock, clear the cart. | High |
| FR-C-ORDER-4 | Stock shall never go negative; insufficient stock rejects order creation. | High |
| FR-C-ORDER-5 | New orders shall default to status "Order Placed". | High |
| FR-C-ORDER-6 | Customers shall view their full order history (newest first) and single-order detail. | High |
| FR-C-ORDER-7 | Order detail shall show a tracking stepper: Order Placed → Processing → Shipped → Out for Delivery → Delivered (or Cancelled). | High |
| FR-C-ORDER-8 | Order statuses shall be updatable by the admin. | High |
| FR-C-ORDER-9 | Cart count shall refresh after checkout. | Medium |

#### 3.1.7 Delivery Addresses (FR-C-ADDR)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-C-ADDR-1 | Customers shall list/create/update/delete delivery addresses. | High |
| FR-C-ADDR-2 | New addresses default to country "Pakistan". | High |
| FR-C-ADDR-3 | Checkout shall prefer a selected saved address. | High |

#### 3.1.8 Reviews (FR-C-REV)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-C-REV-1 | Authenticated customers shall review products with a 1–5 rating and optional comment. | High |
| FR-C-REV-2 | A customer may review a product only once (unique user+product). | High |
| FR-C-REV-3 | Users and admins may delete reviews. | High |
| FR-C-REV-4 | Creating a review shall generate an admin notification. | High |

#### 3.1.9 Payment Receipts (FR-ALL-RECEIPT)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ALL-RECEIPT-1 | Card/Online checkout shall display the store's bank account details (bank name, account title, account number, IBAN, amount). | High |
| FR-ALL-RECEIPT-2 | After placing an online/card order, the customer shall upload a payment receipt (image/PDF, ≤ 5 MB). | High |
| FR-ALL-RECEIPT-3 | ONLY the order owner may upload a receipt; existing confirmed receipts may not be replaced. | High |
| FR-ALL-RECEIPT-4 | Receipts shall default to status `pending`. | High |
| FR-ALL-RECEIPT-5 | The admin shall view/download receipts and set status to `confirmed` or `rejected`. | High |
| FR-ALL-RECEIPT-6 | Confirming a receipt shall update the order status to "Processing". | High |
| FR-ALL-RECEIPT-7 | Customers shall view and download their own receipt on the order detail page. | High |
| FR-ALL-RECEIPT-8 | Rejected receipts may be re-uploaded by the customer. | High |
| FR-ALL-RECEIPT-9 | Uploading a receipt shall generate an admin notification. | High |
| FR-ALL-RECEIPT-10 | Receipt download shall accept the JWT as a query parameter (for `window.open`). | Medium |

#### 3.1.10 Admin — Products & Categories (FR-A-PROD)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-A-PROD-1 | The admin shall create, edit, deactivate, and delete products. | High |
| FR-A-PROD-2 | The admin shall add/remove product images and set the primary image. | High |
| FR-A-PROD-3 | The admin shall add variants (size/color) and update stock counts. | High |
| FR-A-PROD-4 | When a variant's total stock reaches 0, the product card shall display "Out of stock" in POS. | Medium |

#### 3.1.11 Admin — Orders (FR-A-ORDER)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-A-ORDER-1 | The admin shall list all orders with customer info, items, total, status. | High |
| FR-A-ORDER-2 | The admin shall filter orders by status. | Medium |
| FR-A-ORDER-3 | The admin shall update order status. | High |
| FR-A-ORDER-4 | POS orders shall display a payment badge (Paid / Awaiting Verification) with a "Confirm Payment Received" action. | High |

#### 3.1.12 Admin — Dashboard (FR-A-DASH)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-A-DASH-1 | Dashboard shall display: total users, products, total orders, pending orders, total sales (sum of non-cancelled orders). | High |
| FR-A-DASH-2 | Dashboard shall list the 5 most recent orders. | Medium |
| FR-A-DASH-3 | Dashboard shall provide quick-action cards (POS, Manage Orders, Manage Products). | Medium |

#### 3.1.13 Admin — Customers & Reviews (FR-A-CUST)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-A-CUST-1 | The admin shall list customers (name, email, phone, order count, created date). | High |
| FR-A-CUST-2 | The admin shall list all product reviews with the author and product. | High |
| FR-A-CUST-3 | The admin shall delete any review. | High |
| FR-A-CUST-4 | Creating a new customer registration shall generate an admin notification. | High |

#### 3.1.14 Admin — Notifications (FR-A-NOTIF)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-A-NOTIF-1 | The system shall generate a notification on each of: new customer registration, new order, new review, and receipt upload/re-upload. | High |
| FR-A-NOTIF-2 | Notifications shall store type, message, navigation link, read flag, and timestamp. | High |
| FR-A-NOTIF-3 | The admin navbar shall show a bell with an unread-count badge. | High |
| FR-A-NOTIF-4 | The bell dropdown shall list the latest 20 notifications with type-colored badges and relative timestamps. | High |
| FR-A-NOTIF-5 | Clicking a notification shall mark it read and navigate to its linked page. | High |
| FR-A-NOTIF-6 | The admin shall be able to mark all notifications read. | High |
| FR-A-NOTIF-7 | The frontend shall poll for new notifications every 15 seconds. | Medium |
| FR-A-NOTIF-8 | POS orders created by the admin shall NOT generate a "new order" notification. | High |

#### 3.1.15 Point of Sale (FR-A-POS)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-A-POS-1 | The POS shall allow searching products by name/brand and adding them to a sale cart. | High |
| FR-A-POS-2 | Multi-variant products require size/color selection via a picker modal showing stock. | High |
| FR-A-POS-3 | POS shall capture a **customer name (required)** and **phone number**. | High |
| FR-A-POS-4 | Existing remote customers may be selected from a dropdown (autofills name/phone). | Medium |
| FR-A-POS-5 | POS shall de-duplicate customers by phone number (reuse, do not duplicate). | Medium |
| FR-A-POS-6 | POS supports payment methods **Cash**, **Card**, **Online**. | High |
| FR-A-POS-7 | **Cash** sales are marked `paid = true` and status **Delivered** immediately. | High |
| FR-A-POS-8 | **Card/Online** sales are marked `paid = false` with status **Order Placed**; the admin verifies payment before delivery. | High |
| FR-A-POS-9 | The receipt view for unpaid orders displays "PAYMENT PENDING VERIFICATION" and a "Payment Received — Verify & Deliver" button. | High |
| FR-A-POS-10 | A printable receipt shall be generated listing store, receipt #, date, customer, phone, payment method, items, and total. | High |
| FR-A-POS-11 | Printing shall isolate the receipt (`#pos-receipt`) and hide the admin UI via print CSS. | Medium |
| FR-A-POS-12 | POS stock decrement shall be transactional, matching the checkout path. | High |
| FR-A-POS-13 | POS orders shall use payment labels `POS Cash`, `POS Card`, `POS Online`. | High |
| FR-A-POS-14 | The admin order list shall show POS payment verification status. | High |

### 3.2 Non-Functional Requirements

#### 3.2.1 Performance (NFR-PERF)

| ID | Requirement |
|----|-------------|
| NFR-PERF-1 | API responses should return in < 500 ms under normal load. |
| NFR-PERF-2 | The frontend bundle should build in < 5 s on typical hardware (current build ≈ 48 modules). |
| NFR-PERF-3 | Product list endpoints must paginate; the POS uses `limit=200` with client-side search. |
| NFR-PERF-4 | Notification polling (15 s) must be lightweight and not block the UI. |

#### 3.2.2 Security (NFR-SEC)

| ID | Requirement |
|----|-------------|
| NFR-SEC-1 | Passwords stored only as bcrypt hashes — never plain text or reversible. |
| NFR-SEC-2 | JWT secret in environment variable, never committed. |
| NFR-SEC-3 | Ownership checks on sensitive resources (orders, receipts, reviews): a user may not access another user's data. |
| NFR-SEC-4 | Admin endpoints enforce `adminOnly`; `role` is embedded in the JWT. |
| NFR-SEC-5 | File uploads restricted by extension/MIME (images/PDF) and size (≤ 5 MB). |
| NFR-SEC-6 | Secrets must never appear in client code or logs. |

#### 3.2.3 Reliability & Data Integrity (NFR-REL)

| ID | Requirement |
|----|-------------|
| NFR-REL-1 | Order creation and stock consumption must run in a DB transaction (all-or-nothing). |
| NFR-REL-2 | Unique constraints prevent duplicate carts, wishlist entries, reviews, and receipts per order. |
| NFR-REL-3 | Deleting users/products cascades to dependent child records where appropriate. |

#### 3.2.4 Usability & UI (NFR-UI)

| ID | Requirement |
|----|-------------|
| NFR-UI-1 | Theme: half white, half light cream; accent `#b08968`. |
| NFR-UI-2 | No overlapping fixed elements; layouts must not force extreme scrolling. |
| NFR-UI-3 | Toasts confirm key actions (cart add, order placed, settlement). |
| NFR-UI-4 | Admin and customer navigation are visually distinct. |
| NFR-UI-5 | All prices formatted as `₨N`. |

#### 3.2.5 Compatibility (NFR-COMP)

| ID | Requirement |
|----|-------------|
| NFR-COMP-1 | Frontend must run on Chrome, Edge, Firefox, Safari (ES2019+). |
| NFR-COMP-2 | Backend must run cross-platform (Windows/Linux/macOS) with Node ≥ 18. |

### 3.3 External Interface Requirements

| Interface | Specification |
|-----------|---------------|
| Client → Backend | JSON over HTTP(S), REST conventions, `Authorization: Bearer <JWT>` |
| File upload | `multipart/form-data` via Multer; field name `receipt` |
| Static assets | `/uploads/**` served by Express static middleware |
| Dev proxy | Vite proxies `/api` and `/uploads` → `http://localhost:5000` |
| Database | Prisma client → SQLite (file `prisma/dev.db`) |

---

## 4. System Architecture

### 4.1 Architecture Overview

```
                    ┌─────────────────────────────┐
                    │     React SPA (Vite :5173)  │
                    │  Customer storefront UI     │
                    │  Admin panel + POS          │
                    └──────────────┬──────────────┘
                                   │  /api, /uploads (proxy)
                    ┌──────────────▼──────────────┐
                    │        Express API (:5000)  │
                    │   middleware/auth (JWT)     │
                    │   routes/* (REST modules)   │
                    │   utils/notify (notif)      │
                    └──────┬───────────────┬──────┘
                           │               │
              ┌────────────▼───┐   ┌───────▼─────────┐
              │  SQLite (Prisma)│   │ uploads/ files  │
              └────────────────┘   └─────────────────┘
```

**Request lifecycle:** SPA → `fetch` via `frontend/src/lib/api.js` → Vite dev proxy → Express route → Prisma → response JSON → SPA renders.

### 4.2 Data Perspective (Entity-Relationship Summary)

```
User 1───N Address
User 1───1 Cart  ───N CartItem ──N──1 ProductVariant
User 1───N WishlistItem
User 1───N Order ───N OrderItem ──N──1 ProductVariant
Order 1───0..1 PaymentReceipt
User 1───N Review  N──1 Product
Category 1───N Subcategory 1───N Product 1───N ProductVariant / ProductImage
AdminNotification (standalone)
```

Cardinality and cascade rules are enforced in `prisma/schema.prisma`.

### 4.3 Security Model

- **Authentication:** stateless JWT (HS256), 7-day expiry, payload `{ id, email, role }`.
- **Authorization:**
  - `authenticate` middleware — decodes JWT, attaches `req.user`.
  - `adminOnly` middleware — requires `req.user.role === "admin"`.
- **Ownership:** order/receipt/review routes validate `userId` equality before returning data.
- **Secrets:** `.env` holds `JWT_SECRET`; `.gitignore` excludes `.env`.

---

## 5. API Specification

> Full table of endpoints is maintained in **README.md § API Endpoints**. Summary of route modules:

| Module | Base path | Auth required |
|--------|-----------|---------------|
| Auth | `/api/auth` | Mixed |
| Categories | `/api/categories` | Mixed |
| Products | `/api/products` | Mixed |
| Cart | `/api/cart` | Yes |
| Wishlist | `/api/wishlist` | Yes |
| Orders | `/api/orders` | Yes |
| Reviews | `/api/reviews` | Mixed |
| Addresses | `/api/addresses` | Yes |
| Receipts | `/api/receipts` | Yes/Admin |
| Admin | `/api/admin` | Admin |

### Standard error format

```json
{ "error": "Human-readable message" }
```

Status codes: `400` validation, `401` unauthenticated, `403` forbidden, `404` not found, `500` server error.

---

## 6. User Interface Design

### 6.1 Pages — Customer

| Route | Page |
|-------|------|
| `/` | Home (hero, categories, featured) |
| `/products` | Catalog (search/filter/sort/pagination) |
| `/products/:id` | Product detail (variants, reviews, add) |
| `/cart` | Cart |
| `/wishlist` | Wishlist |
| `/checkout` | Checkout (address + payment + bank details) |
| `/orders` | Order history |
| `/orders/:id` | Order detail (tracking stepper + receipt) |
| `/addresses` | Address book |
| `/profile` | Profile management |
| `/login`, `/register` | Auth pages |

### 6.2 Pages — Admin

| Route | Page |
|-------|------|
| `/admin` | Dashboard |
| `/admin/pos` | Point of Sale |
| `/admin/products` | Product management |
| `/admin/categories` | Category management |
| `/admin/orders` | Order management |
| `/admin/customers` | Customer list |
| `/admin/reviews` | Review moderation |
| `/admin/receipts` | Payment receipts |

### 6.3 Components

- `Layout` — customer navbar (cart badge + toast) + footer
- `AdminLayout` — dark admin navbar (bell dropdown, links, profile) + admin footer
- `ProductCard` — reusable product preview
- `CartContext` — global cart count + `refreshCart()`
- `useAdminNotifications` — polling hook for the bell

---

## 7. Notification & Real-Time Requirements

| ID | Requirement |
|----|-------------|
| FR-N-1 | Event sources: customer registration, order placement, review creation, receipt upload/re-upload. |
| FR-N-2 | Notification payload: `type` (customer/order/review/receipt), `message`, `link`, `read`, `createdAt`. |
| FR-N-3 | Delivery mechanism: frontend polling of `GET /api/admin/notifications` every 15 s (no WebSocket dependency). |
| FR-N-4 | Admin UI presents unread badge + dropdown; actions mark individual or all notifications as read. |

---

## 8. Payment Handling Requirements

### 8.1 Online Store Payments

| ID | Requirement |
|----|-------------|
| FR-PAY-1 | COD requires no online action; order proceeds immediately. |
| FR-PAY-2 | Card/Online: customer is shown a static bank account block (bank, title, account no., IBAN, payable amount). |
| FR-PAY-3 | Customer must upload a payment receipt after transfer; order remains `pending` until admin verifies. |
| FR-PAY-4 | On verification, receipt → `confirmed`, order → `Processing`; on rejection, customer may re-upload. |

### 8.2 POS Payments

| ID | Requirement |
|----|-------------|
| FR-PAY-5 | Cash → paid immediately, Delivered. |
| FR-PAY-6 | Card/Online → `paid=false`, Order Placed; admin verifies via "Confirm Payment Received" → Delivered. |

### 8.3 Receipt Files

| Constraint | Value |
|-----------|-------|
| Allowed formats | jpg, jpeg, png, gif, webp, pdf |
| Max size | 5 MB |
| Storage | `uploads/receipts/` |
| Unique per order | One active receipt per order |

---

## 9. POS Requirements

Covered in detail under FR-A-POS. Key operational rules:

1. Name required; phone optional but encouraged (drives dedup).
2. Products added with variant + quantity; stock enforced.
3. Payment method determines immediate vs. deferred fulfilment.
4. Receipt generation is a client-side printable view — no server-side PDF dependency.
5. POS transactions decrement inventory through the same transactional path as online checkout.

---

## 10. Testing Requirements

| ID | Level | Requirement |
|----|-------|-------------|
| TEST-1 | Build | `cd frontend && npm run build` must complete with 0 errors. |
| TEST-2 | Backend | Backend must start on port 5000 with no exceptions. |
| TEST-3 | Smoke | Login (admin & customer), product list, order checkout paths return 2xx. |
| TEST-4 | E2E (auth) | Register → login → `/me` returns the profile. |
| TEST-5 | E2E (checkout) | Cart → checkout → order created → stock decremented → cart cleared. |
| TEST-6 | E2E (receipt) | Upload receipt → admin confirms → order status becomes Processing. |
| TEST-7 | E2E (POS) | POS sale (Cash) → paid + Delivered; POS sale (Card) → pending → verify → Delivered. |
| TEST-8 | E2E (notify) | New customer registration → admin notification appears unread. |
| TEST-9 | Security | Non-owner receives 403/404 on foreign order/receipt access. |
| TEST-10 | Validation | Over-quantity order rejects with "Insufficient stock". |

---

## 11. Appendix — Glossary

| Term | Meaning |
|------|---------|
| Receipt | Uploaded proof-of-payment file attached to an online/card order |
| Verify | Admin action confirming POS payment received (→ Delivered) |
| Confirm | Admin action accepting a payment receipt (→ Processing) |
| Cart count | Sum of item quantities in the customer's cart (badge) |
| Bulk/simple | Project constraint: keep backend architecture simple |

---

*End of Software Requirements Specification.*