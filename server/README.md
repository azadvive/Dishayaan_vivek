# DishaYaaN Backend REST API Server

A complete, production-ready Node.js & Express REST API backend service for the **DishaYaaN Class 6–12 Mentorship Platform**.

---

## 🌟 Features

- **Authentication & User Management**:
  - JWT-based authentication & Supabase Auth token integration.
  - Role-based Access Control (RBAC): `student`, `mentor`, `admin`.
  - Profile management (bio, interests, education, domains, avatar image upload).
  - First-time administrator bootstrap endpoint (`POST /api/auth/admin-bootstrap`).

- **Academic Catalog & Mentors**:
  - Educational programs endpoint (`GET /api/programs`, `/api/programs/:slug`) with category/track filtering.
  - Verified mentors directory (`GET /api/mentors`, `/api/mentors/:slug`) with domain and language filtering.
  - Pricing plans (`GET /api/plans`).
  - Seamless zero-config fallback to static catalog data (`src/data/content.json`) if database is not yet seeded.

- **Booking & Scheduling**:
  - Session request submission (`POST /api/bookings`) with automatic slot conflict detection to prevent double-booking.
  - Booking tracking and history (`GET /api/bookings/my`).
  - Email notification dispatch via Resend.

- **Lead Intake & Enquiries**:
  - Quick Mentor Connect (`POST /api/enquiries/mentor-connect`) from modal and sticky bar.
  - Home demand and B2B school/partner requirement intake (`POST /api/enquiries/general`).

- **Path Finder Diagnostics**:
  - Persists student assessment answers, 6 capability axis scores, and top recommended career tracks (`POST /api/pathfinder/submit`).
  - Fetches assessment history (`GET /api/pathfinder/my`) for user dashboard display.

- **Community Discussion Forum**:
  - Public discussion feed (`GET /api/community/posts`) with tag and search filtering.
  - Post creation with multipart file attachments (up to 6MB) (`POST /api/community/posts`).
  - Threaded comment system (`POST /api/community/posts/:id/comments`).
  - Content moderation reporting (`POST /api/community/posts/:id/report`).

- **Grounded AI Career Assistant**:
  - Live AI completion (`POST /api/ai/chat`) powered by Groq / OpenAI-compatible endpoint.
  - Pre-grounded in DishaYaaN's specific course catalog, exam roadmaps, and mentors to avoid hallucinations.
  - Per-user daily question quota tracking and grounded rule-based fallback.

- **Payments & Razorpay Integration**:
  - Order creation with amount calculation in paise (`POST /api/payments/create-order`).
  - Webhook signature and payment verification (`POST /api/payments/verify`, `/api/payments/webhook`).
  - Automatic student enrollment activation upon successful payment.

- **Admin Operations Console**:
  - KPI overview metrics (`GET /api/admin/overview`).
  - Booking status management and mentor assignment (`PATCH /api/admin/bookings/:id`).
  - Lead and enquiry pipeline management (`GET /api/admin/enquiries`).
  - User role promotion/demotion (`PATCH /api/admin/users/:id/role`).
  - Content moderation (`POST /api/admin/moderate-post`).

- **Developer Experience**:
  - Interactive Swagger / OpenAPI documentation UI at `/api/docs`.
  - System health check at `/api/health`.
  - Database seeding utility script (`npm run seed`).
  - Dual compatibility facade for Netlify serverless function callers.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update `.env` with your Supabase credentials, Razorpay keys, and AI keys (optional; the server operates with grounded fallbacks if keys are not provided).

### 3. Run Database Migrations (Optional / Supabase)
Execute the SQL script in your Supabase SQL editor:
```sql
supabase/migrations/0001_init.sql
```

### 4. Seed the Database
Populate all 20+ programmes, mentors, and plans into your database:
```bash
npm run seed
```

### 5. Start the Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```
From the project root directory, you can also run:
```bash
npm run server
```

The server will start at:
- **API Base**: `http://localhost:5000`
- **Swagger Documentation**: `http://localhost:5000/api/docs`
- **Health Check**: `http://localhost:5000/api/health`

---

## 📡 API Reference Overview

| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/api/health` | GET | Server health check and system status | None |
| `/api/docs` | GET | Interactive Swagger UI API documentation | None |
| `/api/auth/register` | POST | Register student account | None |
| `/api/auth/login` | POST | Sign in and receive JWT token | None |
| `/api/auth/me` | GET | Get current authenticated user profile | Bearer Token |
| `/api/auth/profile` | PATCH | Update profile information | Bearer Token |
| `/api/auth/avatar` | POST | Upload user avatar image (<2MB) | Bearer Token |
| `/api/auth/admin-bootstrap` | POST | Bootstrap first admin account | Admin Secret |
| `/api/programs` | GET | List educational programs | None |
| `/api/programs/:slug` | GET | Get program details | None |
| `/api/mentors` | GET | List verified mentors | None |
| `/api/mentors/:slug` | GET | Get mentor details | None |
| `/api/plans` | GET | List membership and course pricing plans | None |
| `/api/bookings` | POST | Submit 1-on-1 mentorship session request | Optional |
| `/api/bookings/my` | GET | Get current user's session bookings | Bearer Token |
| `/api/enquiries/mentor-connect` | POST | Submit quick mentor connect lead | None |
| `/api/enquiries/general` | POST | Submit home demand / partner enquiry | None |
| `/api/pathfinder/submit` | POST | Save assessment score and top tracks | Optional |
| `/api/pathfinder/my` | GET | Get latest saved assessment history | Bearer Token |
| `/api/community/posts` | GET | List community forum posts | None |
| `/api/community/posts` | POST | Publish community post (<6MB attachment) | Optional |
| `/api/community/posts/:id/comments` | POST | Add comment to a post | Optional |
| `/api/community/posts/:id/report` | POST | Report post for moderation | Optional |
| `/api/ai/chat` | POST | Ask question to grounded AI Assistant | Optional (IP limited) |
| `/api/payments/create-order` | POST | Create Razorpay order | Optional |
| `/api/payments/verify` | POST | Verify Razorpay payment signature | Optional |
| `/api/payments/webhook` | POST | Razorpay webhook event listener | Webhook Secret |
| `/api/admin/overview` | GET | Platform KPI overview | Admin Only |
| `/api/admin/bookings` | GET | View all bookings | Admin Only |
| `/api/admin/bookings/:id` | PATCH | Confirm, reject, or assign mentor to booking | Admin Only |
| `/api/admin/users/:id/role` | PATCH | Change user role (`student`, `mentor`, `admin`) | Admin Only |
| `/api/admin/moderate-post` | POST | Hide or restore reported posts | Admin Only |
