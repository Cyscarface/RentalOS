# RentalOS Kenya — Frontend Summary

The frontend for **RentalOS Kenya** is a Single Page Application (SPA) built with **React 18** and **Vite**. It acts as the primary user interface for all four user roles: Tenants, Landlords, Service Providers, and System Administrators.

## 🏗️ Architecture & Technology Stack
- **Framework:** React 18, utilizing functional components and hooks.
- **Build Tool:** Vite (configured with `@vitejs/plugin-react` for the automatic JSX transform).
- **Routing:** React Router v6 (`react-router-dom`) with role-based route protection (`PrivateRoute`).
- **State Management & Data Fetching:** React Query (`@tanstack/react-query`) for caching, background fetching, and synchronization with the Laravel backend.
- **HTTP Client:** Axios (`axios`), configured globally (`api.js`) with request interceptors to automatically attach the Bearer token and response interceptors to handle 401 Unauthorized errors gracefully.
- **Form Handling:** React Hook Form coupled with Zod (`zod`, `@hookform/resolvers`) for robust, schema-based client-side validation.
- **Styling:** Vanilla CSS (`index.css` and scoped `.css` files). A premium design system was built from scratch featuring:
  - Deep Navy & Teal colour palette with glassmorphism effects
  - Consistent layout variables (border radii, shadows, spacing)
  - Responsive pure CSS components (Cards, KPIs, Modals, Forms)
- **Icons:** Lucide React (`lucide-react`) for clean, modern SVG icons.

## 📂 Directory Structure (`frontend/src/`)

### 1. Core Configuration
- `App.jsx`: The root component housing the layout, routing tree, and global contexts (QueryClientProvider, AuthProvider, Toaster).
- `api.js`: Centralized Axios instance with categorized endpoint groups (`authApi`, `propertyApi`, `paymentApi`, etc.).
- `main.jsx`: The React mount entry point.
- `index.css`: The global design system and utility classes.

### 2. Context & Navigation
- `context/AuthContext.jsx`: Manages global user state, authentication tokens (LocalStorage), and login/logout business logic.
- `components/PrivateRoute.jsx`: A Higher-Order Component that protects sensitive routes and dynamically redirects users to their appropriate dashboard based on their `role`.
- `components/Navbar.jsx` & `Navbar.css`: A responsive, role-aware navigation bar that adapts its links depending on whether the logged-in user is a Tenant, Landlord, Provider, or Admin.

### 3. Public & Auth Pages
- **Auth:**
  - `Login.jsx`: Handles user authentication with automated redirection to OTP verification if the account is unverified.
  - `Register.jsx`: A two-step registration flow separating personal details from role selection.
  - `VerifyOtp.jsx`: A 6-digit dynamic input interface with a 10-minute countdown timer.
  - `Auth.css`: Shared styling for auth pages featuring background ambient "orbs".
- **Public Directory:**
  - `Home.jsx` & `Home.css`: Landing page featuring a hero section and a filterable, paginated grid of active properties.
  - `PropertyDetail.jsx`: Detailed property view showing images, lease terms, and landlord contact info, with a "Request Viewing" CTA for tenants.
  - `Services.jsx` & `ServiceDetail.jsx`: Public directory for browsing on-demand home service providers, reading reviews, and booking appointments.

### 4. Role-Specific Dashboards

**🏠 Tenant (`pages/tenant/`)**
- `Dashboard.jsx`: Overview of active tenancy, rent paid, pending bookings, and unread messages.
- `Payments.jsx`: Rent payment history, M-Pesa STK Push initiation form, and PDF receipt downloads.
- `Bookings.jsx`: Tracks service requests and allows tenants to leave Star-rated reviews for completed jobs.
- `Messages.jsx`: Real-time polling chat interface for communicating with landlords and providers.

**🏢 Landlord (`pages/landlord/`)**
- `Dashboard.jsx`: Financial KPIs and property performance metrics.
- `Properties.jsx`: Management table for all owned listings with status indicators.
- `AddProperty.jsx`: Submission form for new properties (goes into `pending` state awaiting admin approval).
- `Payments.jsx`: Tracks all incoming rent from tenants across various properties.
- `Messages.jsx`: Inherits the chat interface to talk to tenants.

**🔧 Service Provider (`pages/provider/`)**
- `Dashboard.jsx`: Tracks active services and booking statuses.
- `Services.jsx`: Allows providers to define their offerings, categories, and base pricing.
- `Bookings.jsx`: Queue for incoming requests from tenants where providers can Accept, Decline, or mark jobs as Complete.

**🛡️ Administrator (`pages/admin/`)**
- `Dashboard.jsx`: High-level system KPIs (Total Users, Active Properties, Revenue, Pending Approvals).
- `Users.jsx`: Platform-wide user directory with the ability to Suspend/Unsuspend accounts.
- `Properties.jsx`: The approval queue for landlord submissions. Admins can approve or reject (with an attached reason modal).
- `Revenue.jsx`: Monthly financial breakdown featuring an interactive CSS-only bar chart showing total rent processed and platform commission.
- `Bookings.jsx`: Audit trail of all platform service bookings.

## 🚀 Summary of Completion
The entire React implementation plan has been successfully executed. All 22 pages across the public facing site and the four distinct user portals have been implemented. The app uses real endpoints connecting to the Laravel backend, handles form validations cleanly, and maintains a premium dark-mode aesthetic throughout without relying on bulky CSS frameworks.
