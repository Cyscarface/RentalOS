# RentalOS Kenya — Backend Summary

> **Stack:** Laravel 12 · PHP 8.2 · SQLite (dev) · Sanctum v4.3 · DomPDF v3.1  
> **Generated:** 2026-02-28 | **Tests:** 30/30 passing ✅

---

## Crosscheck Against Implementation Plan

| Area | Planned | Status |
|---|---|---|
| Database Migrations (10 tables) | ✅ | ✅ All 13 migration files run |
| Eloquent Models (10 models) | ✅ | ✅ All 10 created with relationships |
| Sanctum Authentication | ✅ | ✅ Configured |
| CORS | ✅ | ✅ Allows `localhost:5173` |
| API Routes | ✅ | ✅ 45 routes, cached |
| AuthController (register/login/OTP/logout) | ✅ | ✅ Complete |
| Role Middleware | ✅ | ✅ `role:tenant\|landlord\|provider\|admin` |
| PropertyController | ✅ | ✅ Complete (+ policy) |
| RentPaymentController + M-Pesa | ✅ | ✅ STK Push + callback + receipt PDF |
| ServiceController | ✅ | ✅ Complete |
| BookingController | ✅ | ✅ Complete (+ policy) |
| MessageController | ✅ | ✅ Complete |
| ReviewController | ✅ | ✅ Complete (+ policy) |
| AdminController | ✅ | ✅ Dashboard, users, revenue |
| PropertyPolicy | ✅ | ✅ Ownership + admin bypass |
| BookingPolicy | ✅ | ✅ Provider enforcement |
| ReviewPolicy | ✅ | ✅ Completed-booking gate |
| PDF Receipts (DomPDF) | ✅ | ✅ Installed + wired |
| OTP via Email | ✅ | ✅ Queued OtpMail + Log fallback |
| PHPUnit Feature Tests | ✅ | ✅ 30 tests, 59 assertions |

---

## Project Structure

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Controller.php           # Base (AuthorizesRequests + ValidatesRequests)
│   │   │   ├── AuthController.php       # register, login, verify-otp, logout, me
│   │   │   ├── PropertyController.php   # Browse, landlord CRUD, admin approve/reject
│   │   │   ├── RentPaymentController.php# STK Push, M-Pesa callback, receipt PDF
│   │   │   ├── ServiceController.php    # Provider CRUD, public browse
│   │   │   ├── BookingController.php    # Create, accept, decline, complete
│   │   │   ├── MessageController.php    # Conversations, thread, send
│   │   │   ├── ReviewController.php     # Submit, provider reviews
│   │   │   └── AdminController.php      # Dashboard, users, revenue
│   │   └── Middleware/
│   │       └── RoleMiddleware.php       # role:tenant|landlord|provider|admin
│   ├── Mail/
│   │   └── OtpMail.php                 # Queued Mailable
│   ├── Models/
│   │   ├── User.php                    # HasApiTokens, roles, helpers
│   │   ├── Property.php                # Status constants, relationships
│   │   ├── PropertyImage.php           # url accessor
│   │   ├── TenantProperty.php
│   │   ├── RentPayment.php             # M-Pesa fields
│   │   ├── Service.php
│   │   ├── Booking.php                 # commission_amount
│   │   ├── Message.php                 # isRead() helper
│   │   ├── Review.php
│   │   └── AuditLog.php               # static record() helper
│   ├── Policies/
│   │   ├── PropertyPolicy.php          # Landlord ownership + admin bypass
│   │   ├── BookingPolicy.php           # Provider enforcement
│   │   └── ReviewPolicy.php            # Completed-booking gate
│   └── Services/
│       ├── OtpService.php              # 6-digit OTP, 10min TTL, queued email
│       ├── MpesaService.php            # STK Push, OAuth token (cached 55min)
│       └── PdfReceiptService.php       # download() + stream() via DomPDF
├── database/
│   ├── factories/UserFactory.php       # phone, role, is_suspended defaults
│   └── migrations/                     # 13 migration files
├── resources/views/
│   ├── emails/otp.blade.php            # Branded OTP email (HTML)
│   └── pdf/receipt.blade.php           # Branded PDF receipt
├── routes/api.php                      # 45 routes, role-grouped
├── tests/Feature/
│   ├── AuthTest.php                    # 11 cases
│   ├── RentPaymentTest.php             # 8 cases
│   └── BookingTest.php                 # 10 cases
└── config/
    ├── auth.php                        # Sanctum api guard
    ├── cors.php                        # localhost:5173 allowed
    └── services.php                    # mpesa block
```

---

## Database Tables (13 total)

| Table | Purpose |
|---|---|
| `users` | Multi-role users with OTP, suspension, Sanctum tokens |
| `properties` | Rental listings with status workflow |
| `property_images` | Images per property |
| `tenant_properties` | Tenant↔property lifecycle link |
| `rent_payments` | M-Pesa payments with STK fields |
| `services` | Provider-offered services |
| `bookings` | Service bookings with commission tracking |
| `messages` | In-app messaging between users |
| `reviews` | Post-booking reviews (1 per booking) |
| `audit_logs` | System-wide action audit trail |
| `personal_access_tokens` | Sanctum token store |
| `cache` | Laravel cache (queue/session) |
| `jobs` | Queue job store |

---

## API Endpoints (45 routes)

### Public (no auth)
| Method | Endpoint | Controller |
|---|---|---|
| GET | `/api/ping` | Health check |
| GET | `/api/properties` | Browse active listings |
| GET | `/api/properties/{id}` | Listing detail |
| GET | `/api/services` | Browse services |
| GET | `/api/services/{id}` | Service detail |
| GET | `/api/reviews/provider/{id}` | Provider reviews + avg rating |
| POST | `/api/auth/register` | Register (dispatches OTP email) |
| POST | `/api/auth/login` | Login (handles suspended/unverified) |
| POST | `/api/auth/verify-otp` | Verify OTP → issues Sanctum token |
| POST | `/api/payments/callback` | M-Pesa STK callback (Safaricom webhook) |

### Auth — All Roles
| Method | Endpoint |
|---|---|
| POST | `/api/auth/logout` |
| GET | `/api/auth/me` |
| GET/POST | `/api/messages/*` (conversations, thread, send) |

### Tenant Only
`POST /api/properties/{id}/request-viewing`  
`POST /api/payments/initiate` · `GET /api/payments/history` · `GET /api/payments/{id}/receipt`  
`POST /api/bookings` · `GET /api/bookings/my`  
`POST /api/reviews`

### Landlord Only
`GET /api/landlord/properties`  
`POST/PUT/DELETE /api/properties`  
`GET /api/payments/landlord/summary`

### Provider Only
`GET /api/provider/services`  
`POST/PUT/DELETE /api/services`  
`GET /api/bookings/provider`  
`POST /api/bookings/{id}/accept|decline|complete`

### Admin Only
`GET /api/admin/dashboard|users|properties|bookings|payments|revenue`  
`POST /api/admin/users/{id}/suspend|unsuspend`  
`POST /api/admin/properties/{id}/approve|reject`

---

## Security Measures

| Layer | Implementation |
|---|---|
| **Authentication** | Sanctum token-based (Bearer). Tokens revoked on logout. |
| **Role enforcement** | `RoleMiddleware` — checks `user.role`, blocks suspended accounts |
| **Resource ownership** | `PropertyPolicy`, `BookingPolicy`, `ReviewPolicy` — admin bypass with `before()` |
| **OTP TTL** | 6-digit, expires in 10 minutes, cleared on use |
| **Password rules** | Min 8 chars via `Password::min(8)` |
| **State guards** | Bookings: can't skip accept → complete |
| **Suspension** | Forced token revocation on suspend, blocked at middleware level |
| **Audit trail** | `AuditLog::record()` on all critical actions |
| **M-Pesa callback** | Matched by `checkout_request_id` — graceful no-op if unknown |

---

## Test Results

```
php artisan test

  PASS  Tests\Feature\AuthTest          (11 tests)
  PASS  Tests\Feature\BookingTest       (10 tests)
  PASS  Tests\Feature\RentPaymentTest   (8 tests)
  PASS  Tests\Feature\ExampleTest       (1 test)

  Tests: 30 passed (59 assertions)
  Duration: 2.13s  |  Exit code: 0 ✅
```

---

## What's NOT Yet Built (Frontend / Future)

| Item | Notes |
|---|---|
| React Frontend | Next phase |
| SMS for OTP | `OtpService` has hook ready — swap `Mail::queue()` with AfricasTalking/Twilio |
| Real M-Pesa creds | Add to `.env`: `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY`, `MPESA_CALLBACK_URL` |
| Queue worker | Run `php artisan queue:work` for OTP emails to actually dispatch |
| PDF stream endpoint | `PdfReceiptService::stream()` exists — add `/receipt/preview` route if needed |
| Rate limiting | Add `throttle:6,1` to `/api/auth/*` routes in `api.php` |
