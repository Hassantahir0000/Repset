# Gym Management System (GMS)

A modern, multi-tenant Gym Management System designed for gym owners to manage members, memberships, attendance, payments, trainers, classes, leads, inventory, reporting, and day-to-day gym operations from one platform.

The product is intended to be developed as a reusable SaaS product that can be demonstrated and sold to multiple gyms.

---

## 1. Product Vision

The goal is to build more than a simple membership tracker.

The system should become a **business operating system for gyms**, covering the complete customer lifecycle:

```text
NEW CUSTOMER
     ↓
Lead
     ↓
Follow-up
     ↓
Membership
     ↓
Payment
     ↓
Digital Membership Card
     ↓
QR Check-in
     ↓
Trainer
     ↓
Workout Plan
     ↓
Attendance
     ↓
Membership Expiry
     ↓
WhatsApp Reminder
     ↓
Renewal
```

The application must be modular, scalable, secure, multi-tenant, and suitable for deployment as a SaaS product.

---

# 2. Product Architecture

The platform should support multiple gym organizations/tenants.

```text
Platform
│
├── Gym A
│   ├── Branch 1
│   └── Branch 2
│
├── Gym B
│   └── Branch 1
│
└── Gym C
    ├── Branch 1
    ├── Branch 2
    └── Branch 3
```

Each organization's data must be isolated from every other organization.

A user belonging to Gym A must never be able to access Gym B data, even by manipulating API requests.

---

# 3. Major Modules

```text
Gym Management System
│
├── Dashboard
├── Organization Management
├── Branch Management
├── Members
├── Memberships
├── Attendance
├── Check-in / Access Control
├── Payments & Billing
├── Expenses
├── Staff & Trainers
├── Personal Training
├── Workout Plans
├── Diet / Nutrition
├── Classes
├── Class Scheduling
├── Leads / CRM
├── Marketing
├── Notifications
├── WhatsApp Integration
├── Store / POS
├── Inventory
├── Suppliers
├── Reports & Analytics
├── Gym Settings
├── User & Role Management
├── Multi-Branch Management
├── Documents
├── Audit Logs
└── Platform / SaaS Administration
```

---

# 4. Dashboard

The dashboard should provide the gym owner with an immediate overview of the business.

## Today's Overview

- Total members
- Active members
- New members today
- Expiring memberships
- Expired memberships
- Today's check-ins
- Today's revenue
- Pending payments
- New leads
- Personal training sessions
- Today's classes
- Staff currently working
- Current gym occupancy

## Financial Summary

- Today's revenue
- Weekly revenue
- Monthly revenue
- Membership revenue
- Personal training revenue
- Store revenue
- Other income
- Expenses
- Net revenue

## Membership Statistics

- Active memberships
- Expired memberships
- Expiring memberships
- Frozen memberships
- Cancelled memberships
- Pending activations

## Charts

- Revenue over time
- New memberships
- Membership cancellations
- Attendance
- Member retention
- Revenue by membership type
- Revenue by branch
- Revenue by trainer

## Alerts

Examples:

```text
18 memberships expire within 7 days
7 members have unpaid invoices
12 leads have not been contacted
4 PT packages have <= 2 sessions remaining
Low stock: Protein Powder
```

---

# 5. Member Management

Member management is one of the core modules.

## Member Profile

Store:

### Personal Information

- Member ID
- Photo
- First name
- Last name
- Gender
- Date of birth
- Phone
- Email
- Address
- Emergency contact
- CNIC / government ID
- Join date
- Lead/referral source

### Membership

- Current membership
- Membership status
- Start date
- Expiry date
- Freeze status

### Financial

- Total paid
- Outstanding balance
- Invoices
- Payment history

### Fitness

- Height
- Weight
- Body fat
- Fitness goals
- Medical notes
- Assigned trainer

### Activity

- Attendance
- Workout plans
- Diet plans
- Measurements
- PT sessions
- Class bookings
- Documents
- Notes

## Member Profile Tabs

```text
Overview
Memberships
Payments
Attendance
Workout
Nutrition
Measurements
Personal Training
Classes
Documents
Notes
Activity Log
```

## Member Actions

- Add member
- Edit member
- Archive member
- Freeze membership
- Renew membership
- Change membership
- Transfer branch
- Assign trainer
- Add payment
- Generate invoice
- Record measurement
- Create workout plan
- Create diet plan
- Send message
- Upload document
- Add note

---

# 6. Membership Management

## Membership Plans

Allow gym owners to create plans such as:

- Monthly
- Quarterly
- 6 Months
- Annual
- Student
- Couple
- Family
- Corporate
- VIP
- Off-Peak

Each plan should support:

- Name
- Duration
- Price
- Registration fee
- Discount
- Branch availability
- Access hours
- Maximum visits
- Freeze allowance
- Guest passes
- Class access
- PT access
- Store discount

## Membership Lifecycle

```text
Lead
 ↓
Prospect
 ↓
Membership Purchased
 ↓
Active
 ↓
Expiring
 ↓
Expired
```

## Membership Features

- Start date
- End date
- Auto-renewal
- Grace period
- Freeze
- Extension
- Upgrade
- Downgrade
- Transfer
- Cancellation
- Refund
- Membership history

---

# 7. Attendance

## Check-in Methods

Support:

- Manual check-in
- QR code
- Barcode
- RFID
- Fingerprint integration
- Face recognition integration

Hardware integrations should be designed behind an abstraction/interface so different access-control providers can be added later.

Example:

```text
AccessControlProvider
```

## Attendance Record

```text
Member
Check-in
Check-out
Duration
Branch
Entry method
```

## Attendance Dashboard

- Today's attendance
- Peak hours
- Average visits per member
- Most frequent members
- Members who have not visited recently
- Attendance by day
- Attendance by month

## Attendance Alerts

Example:

```text
Member has not visited for 14 days.
```

This can trigger an automated notification or CRM follow-up.

---

# 8. Access Control

Access rules may include:

```text
Membership active → Allow

Membership expired → Deny

Membership frozen → Deny

Outside membership hours → Deny

Wrong branch → Deny

Payment overdue → Optional deny
```

Potential integrations:

- RFID readers
- Barcode scanners
- QR scanners
- Turnstiles
- Biometric devices
- Smart locks

Do not tightly couple the application to a single hardware vendor.

---

# 9. Payments & Billing

## Payment Methods

Support:

- Cash
- Bank transfer
- Card
- Online payment
- Wallet
- Partial payment

Pakistan-specific payment providers can later include:

- Easypaisa
- JazzCash
- Bank transfers
- Card terminals

Payment providers should be abstracted so international providers can be added later.

## Payment Record

```text
Payment ID
Member
Invoice
Amount
Payment method
Date
Reference number
Received by
Branch
Notes
```

## Invoices

Invoice fields:

- Invoice number
- Member
- Items
- Discounts
- Tax
- Total
- Paid amount
- Balance
- Payment status

Statuses:

```text
Paid
Partially Paid
Pending
Overdue
Cancelled
Refunded
```

## Receipts

Generate printable and PDF receipts.

---

# 10. Automated Billing

Support:

- Recurring memberships
- Auto-renewal
- Payment reminders
- Failed payment notifications
- Expiry reminders
- Automatic invoice generation

Example workflow:

```text
Membership expires in 7 days
        ↓
Reminder

Expires in 3 days
        ↓
Reminder

Expires tomorrow
        ↓
Reminder

Expired
        ↓
Renewal campaign
```

---

# 11. Expenses

## Expense Categories

- Rent
- Electricity
- Water
- Internet
- Salaries
- Equipment
- Maintenance
- Cleaning
- Marketing
- Software
- Supplies
- Other

## Expense Record

```text
Category
Amount
Date
Branch
Vendor
Payment method
Receipt
Description
```

## Recurring Expenses

Examples:

```text
Rent → Monthly
Internet → Monthly
Electricity → Monthly
Staff salary → Monthly
```

---

# 12. Staff Management

Support:

- Managers
- Receptionists
- Trainers
- Nutritionists
- Cleaners
- Sales staff
- Admins
- Accountants

## Staff Profile

- Name
- Photo
- Phone
- Email
- Role
- Joining date
- Salary
- Branch
- Emergency contact
- Documents

## Staff Attendance

- Check-in
- Check-out
- Late arrival
- Absence
- Overtime

---

# 13. Trainer Management

## Trainer Profile

```text
Trainer
├── Profile
├── Qualifications
├── Specializations
├── Assigned Members
├── PT Packages
├── Sessions
├── Schedule
├── Attendance
├── Earnings
└── Performance
```

## Trainer Specializations

Examples:

- Weight loss
- Muscle building
- Strength
- CrossFit
- Rehabilitation
- Bodybuilding
- Nutrition

## Trainer Commissions

Example:

```text
PT Package = Rs 20,000
Trainer commission = 40%
Trainer earns = Rs 8,000
```

Commission rules should be configurable.

---

# 14. Personal Training

## PT Packages

Examples:

```text
10 Sessions
20 Sessions
30 Sessions
Monthly PT
Unlimited PT
```

## Session Tracking

```text
Member
Trainer
Date
Time
Duration
Status
Notes
```

Statuses:

- Scheduled
- Completed
- Cancelled
- No-show

## Package Balance

```text
PT Package

20 Sessions

Used: 13
Remaining: 7
```

---

# 15. Workout Plans

## Exercise Library

Each exercise can contain:

- Name
- Muscle group
- Equipment
- Difficulty
- Instructions
- Video
- Image

## Workout Program

Example:

```text
Workout A

Bench Press
4 × 10

Incline Dumbbell Press
3 × 12

Cable Fly
3 × 15
```

## Program Structure

```text
Week 1
 ├── Monday
 ├── Wednesday
 └── Friday

Week 2
 ├── Monday
 ├── Wednesday
 └── Friday
```

## Track Progress

- Weight
- Reps
- Sets
- Duration
- Calories
- Personal records

---

# 16. Nutrition / Diet

Optional for MVP but should be supported by the architecture.

## Diet Plans

```text
Breakfast
Lunch
Snack
Dinner
Pre-workout
Post-workout
```

Track:

- Calories
- Protein
- Carbohydrates
- Fat
- Water
- Supplements

## Nutritionist Features

- Create plans
- Assign plans
- Track progress
- Update plans
- Add notes

---

# 17. Body Measurements

Track:

- Weight
- Height
- BMI
- Body fat %
- Chest
- Waist
- Arms
- Thighs
- Hips

## Progress Charts

Show changes over time.

## Progress Photos

Allow:

- Front
- Side
- Back

Include appropriate privacy controls.

---

# 18. Classes

Support group classes such as:

- Yoga
- Zumba
- CrossFit
- HIIT
- Spinning
- Boxing
- Pilates

## Class

Fields:

```text
Class name
Trainer
Capacity
Duration
Location
Branch
Description
```

## Schedule

Example:

```text
Monday

6:00 PM → Yoga
7:00 PM → HIIT
8:00 PM → CrossFit
```

---

# 19. Class Booking

Members can:

- View classes
- Book classes
- Cancel bookings
- Join waitlists

## Capacity

```text
Capacity: 20
Booked: 18
Available: 2
```

## Waitlist

```text
Member A
Member B
Member C
```

When a spot becomes available, notify the next member.

---

# 20. Leads / CRM

The CRM is an important commercial feature.

The system should track not only existing members but also potential customers.

## Lead Sources

- Walk-in
- Website
- Facebook
- Instagram
- WhatsApp
- Referral
- Google
- Advertisement

## Lead Pipeline

```text
New Lead
   ↓
Contacted
   ↓
Interested
   ↓
Trial
   ↓
Negotiation
   ↓
Converted
```

## Lead Profile

- Name
- Phone
- Email
- Source
- Interested membership
- Assigned salesperson
- Follow-up date
- Notes

## Follow-ups

Examples:

```text
Call tomorrow
WhatsApp in 3 days
Trial session Saturday
```

## Conversion Analytics

Example:

```text
100 Leads
↓
60 Contacted
↓
35 Interested
↓
20 Trials
↓
12 Members
```

---

# 21. Trial Memberships

Support:

- Free trial
- 1-day pass
- 3-day pass
- 7-day trial
- Paid trial

Track:

```text
Trial started
Trial expires
Converted?
Reason if not converted
```

---

# 22. Marketing

## Campaigns

Campaign types:

- New membership
- Renewal
- Birthday
- Inactive members
- Expired members
- PT promotions
- Referral campaigns

## Segmentation

Example:

```text
Members who haven't visited in 14 days
AND
Membership is still active
```

The resulting audience can be used for a campaign.

---

# 23. Notifications

Support:

- Email
- SMS
- WhatsApp
- Push notifications

## Notification Types

- Membership expiry
- Payment reminder
- Welcome message
- Birthday
- Class reminder
- PT reminder
- Inactive member
- Membership renewal

## Templates

Templates should support variables.

Example:

```text
Hi {{member_name}},

Your membership at {{gym_name}}
expires on {{expiry_date}}.

Renew today to continue your training.
```

---

# 24. WhatsApp Integration

WhatsApp should be a major optional integration, especially for markets where WhatsApp is widely used.

Potential notifications:

- Membership expiry
- Payment receipt
- Invoice
- Class reminder
- PT reminder
- Birthday
- Welcome
- Lead follow-up

Future possibility:

```text
Customer:
"I want to renew my membership"

        ↓

Automated assistant

        ↓

Membership options

        ↓

Payment link
```

AI/automated WhatsApp conversations should be considered a later-phase feature.

---

# 25. POS / Gym Shop

Many gyms sell:

- Protein
- Supplements
- Shakes
- Water
- Gym clothing
- Gloves
- Accessories

## Sale

```text
Product
Quantity
Price
Discount
Tax
Total
Payment method
Customer
Staff
```

## Member Purchase History

Example:

```text
Protein Powder × 2
Shaker × 1
Water × 10
```

---

# 26. Inventory

## Product

```text
Product
SKU
Category
Supplier
Cost
Selling price
Stock
Minimum stock
```

## Inventory Movements

```text
Purchase +20
Sale -2
Damaged -1
Adjustment +3
```

## Low Stock Alerts

```text
Whey Protein
Current: 3
Minimum: 10
```

---

# 27. Suppliers

Manage:

- Supplier
- Contact information
- Products
- Purchases
- Outstanding payments
- Purchase history

---

# 28. Reports & Analytics

## Membership Reports

- Active members
- New members
- Expired members
- Expiring members
- Cancelled memberships
- Membership growth

## Financial Reports

- Revenue
- Expenses
- Profit
- Outstanding payments
- Revenue by branch
- Revenue by membership
- Revenue by trainer
- Revenue by payment method

## Attendance Reports

- Daily attendance
- Monthly attendance
- Peak hours
- Member attendance
- Inactive members

## Sales Reports

- POS sales
- Product sales
- Top products
- Inventory value

## CRM Reports

- Leads
- Lead sources
- Conversion rate
- Follow-up performance

---

# 29. Member Retention

Track:

```text
New Members
Renewals
Cancellations
Expired
Churn
Retention
```

Identify members who may need attention using configurable signals such as:

- Membership approaching expiry
- Reduced attendance
- No visits
- Payment issues

Example:

```text
At Risk

Member: Ahmed
Last visit: 21 days ago
Membership expires: 18 days
```

The system should present these as business signals rather than making unsupported predictions.

---

# 30. Multi-Branch Management

Support organizations with multiple locations.

```text
Gym
│
├── Islamabad Branch
├── Rawalpindi Branch
└── Lahore Branch
```

Allow:

- Branch-specific members
- Branch-specific staff
- Branch-specific revenue
- Branch-specific expenses
- Branch-specific inventory
- Branch-specific classes
- Cross-branch membership

Owner can switch between:

```text
All Branches
Islamabad Branch
Rawalpindi Branch
Lahore Branch
```

---

# 31. User Roles & Permissions

Use granular RBAC.

## Roles

```text
Owner
Super Admin
Branch Manager
Receptionist
Trainer
Nutritionist
Sales Staff
Accountant
```

## Permissions

Example:

```text
Members
  view
  create
  edit
  archive

Payments
  view
  create
  refund

Reports
  view

Settings
  manage
```

Permissions should be configurable rather than hard-coded.

---

# 32. Audit Logs

Every important administrative action should be auditable.

Track:

```text
Who
Did what
When
Where
```

Example:

```text
Ahmed changed Hassan's membership

19 Sep 2026 10:32 AM

Old:
Monthly — Rs 5,000

New:
Annual — Rs 45,000
```

Audit logs should be immutable from normal application users.

---

# 33. Documents

## Member Documents

- CNIC / ID
- Medical forms
- Waivers
- Agreements
- Photos
- Other documents

## Staff Documents

- CNIC
- Contracts
- Certifications
- Other HR documents

Use secure storage and access controls.

---

# 34. Digital Membership Card

Each member can have a digital membership card.

Example:

```text
┌─────────────────────────────┐
│       POWER GYM             │
│                             │
│       [PHOTO]               │
│                             │
│       Hassan Ahmed          │
│       ID: GM-00123          │
│                             │
│       Valid until           │
│       20 Oct 2026           │
│                             │
│          [ QR CODE ]        │
└─────────────────────────────┘
```

The QR code can be used for gym check-in.

---

# 35. Member Mobile App

Not required for MVP, but the backend should be designed to support it.

## Member Home

```text
Membership
Attendance
Next class
PT session
Workout
```

## Features

- Digital membership card
- QR check-in
- Workout plan
- Diet plan
- Book classes
- PT schedule
- Payments
- Invoices
- Attendance
- Body measurements
- Notifications
- Trainer communication

---

# 36. Trainer Mobile App

Trainer dashboard:

```text
Today's sessions
Members
Workout plans
Member progress
Measurements
PT packages
Schedule
```

Trainers can record:

```text
Session completed
Exercises
Weight
Reps
Notes
```

---

# 37. Owner Mobile App

Owner dashboard:

```text
Revenue today
New members
Attendance
Outstanding payments
Expiring memberships
Expenses
Leads
```

---

# 38. Gym Settings

## General

- Gym name
- Logo
- Address
- Phone
- Email
- Website
- Social media

## Business

- Currency
- Tax
- Invoice numbering
- Receipt format

## Membership

- Freeze rules
- Grace periods
- Expiry rules

## Notifications

- Email provider
- SMS provider
- WhatsApp provider

## Branches

- Add branch
- Edit branch
- Archive branch

---

# 39. SaaS Billing

This is the billing system for the gym owners using YOUR platform.

It is separate from gym-member payments.

Architecture:

```text
Your Platform
       │
       ├── Gym A → Starter
       ├── Gym B → Professional
       └── Gym C → Enterprise
```

## Example Plans

### Starter

- Members
- Memberships
- Attendance
- Payments

### Professional

Everything in Starter +

- Trainers
- PT
- Classes
- CRM
- Reports
- WhatsApp

### Enterprise

Everything +

- Multi-branch
- Advanced analytics
- API
- Custom branding
- Advanced permissions

Plans should be configurable and feature-based rather than hard-coded.

---

# 40. Super Admin Panel

The platform owner needs a separate administration area.

## Platform Dashboard

```text
Total gyms
Active gyms
Total members
MRR
New gyms
Churned gyms
System health
```

## Gym Management

- Create gym
- Suspend gym
- Activate gym
- Change plan
- View usage
- View subscription
- Support access
- Administrative impersonation with complete audit trail

## Platform Billing

- Subscriptions
- Invoices
- Payments
- Failed payments

---

# 41. API

Build the backend as a properly versioned API.

Example:

```text
/api/v1/auth
/api/v1/organizations
/api/v1/branches
/api/v1/members
/api/v1/memberships
/api/v1/attendance
/api/v1/payments
/api/v1/invoices
/api/v1/trainers
/api/v1/personal-training
/api/v1/classes
/api/v1/leads
/api/v1/products
/api/v1/inventory
/api/v1/reports
```

Use consistent:

- HTTP status codes
- Error responses
- Validation
- Pagination
- Filtering
- Sorting
- Search
- Authorization

---

# 42. Security Requirements

Security is mandatory for a commercial application.

Implement:

- Authentication
- MFA / 2FA
- RBAC
- Tenant isolation
- Branch-level permissions
- API authorization
- Rate limiting
- Input validation
- Secure password hashing
- Session management
- Audit logs
- Encryption in transit
- Encryption at rest where appropriate
- Secure file uploads
- Database backups
- Data retention policies
- Soft deletion
- CSRF protection where applicable
- XSS protection
- SQL/NoSQL injection protection

## Critical Requirement: Tenant Isolation

Every tenant-scoped query must enforce organization/tenant context.

Example:

```text
Current user
    ↓
Organization context
    ↓
Authorization
    ↓
Tenant-scoped database query
```

Never rely on the frontend to enforce tenant isolation.

---

# 43. Global Search

Provide global search across relevant entities.

Example:

```text
Search:
Hassan
GM-00123
03001234567
INV-1023
```

Search results can include:

```text
Members
Invoices
Payments
Leads
Products
```

---

# 44. Import / Export

Gym owners may already have Excel/CSV data.

## Import

Support:

```text
Excel / CSV
     ↓
Data mapping
     ↓
Validation
     ↓
Preview
     ↓
Import
```

Example mapping:

```text
Name → name
Phone → phone
Membership → membership
Expiry → expiryDate
```

## Export

Allow exporting:

- Members
- Payments
- Attendance
- Reports
- Expenses
- Leads
- Inventory

Formats:

- CSV
- Excel
- PDF where appropriate

---

# 45. Backup & Recovery

For SaaS deployments:

```text
Automatic database backups
Daily
Weekly
Monthly
```

Also provide:

- Backup monitoring
- Disaster recovery procedures
- Restore procedures
- Recovery testing

---

# 46. Internationalization

Avoid hard-coding country-specific assumptions.

Support:

- Currency
- Timezone
- Date format
- Language
- Tax configuration
- Phone number format

Potential languages:

- English
- Urdu
- Arabic

---

# 47. Pakistan Localization

The initial commercial market can be localized for Pakistan while keeping the core platform international.

Potential support:

```text
PKR
Easypaisa
JazzCash
Bank Transfer
Cash
WhatsApp
CNIC
Pakistani phone numbers
English
Urdu
```

Payment providers should use an abstraction layer so international providers can later be integrated.

---

# 48. AI Features — Future Phase

AI should not be a dependency for the MVP.

Potential future features:

## AI Receptionist

```text
Customer:
"What are your membership prices?"

AI:
"Our monthly membership is Rs X..."
```

## AI Lead Follow-up

Generate personalized follow-up messages.

## AI Workout Assistant

```text
Member:
"I have 30 minutes today."

AI:
"Here is a 30-minute workout..."
```

## AI Business Insights

```text
Your attendance dropped this month.

12 members have not visited
in 14+ days.
```

## Natural Language Reporting

Owner:

```text
"How much revenue did Islamabad
branch generate last month?"
```

The AI should query a controlled reporting layer rather than directly accessing arbitrary database operations.

---

# 49. MVP Scope

Do NOT build the entire system initially.

The first version should be a **sellable MVP**.

## Phase 1 — Core MVP

### Authentication & Organization

- Authentication
- Organization setup
- Branches
- Users
- Roles/permissions

### Members

- Member CRUD
- Member profile
- Member photo
- Membership
- Membership history

### Memberships

- Membership plans
- Activate membership
- Renew membership
- Freeze membership
- Expire membership
- Cancel membership

### Attendance

- Manual check-in
- QR check-in
- Attendance history

### Payments

- Payments
- Invoices
- Receipts
- Outstanding balances

### Dashboard

- Members
- Revenue
- Attendance
- Expiring memberships
- Pending payments

### Reports

- Membership report
- Revenue report
- Attendance report

### Notifications

- Membership expiry
- Payment reminder

### CRM

- Leads
- Follow-ups
- Conversion tracking

---

# 50. Phase 2

Add:

- Trainers
- Personal training
- Workout plans
- Body measurements
- Classes
- Class booking
- Diet plans
- WhatsApp
- Expenses
- Advanced reports

---

# 51. Phase 3

Add:

- POS
- Inventory
- Suppliers
- Multi-branch enhancements
- Mobile apps
- RFID
- Biometric integration
- Advanced automation
- Member portal
- Trainer portal

---

# 52. Phase 4 — SaaS & AI

Add:

- Self-service gym signup
- Subscription billing
- Automated onboarding
- AI receptionist
- AI analytics
- AI workout assistant
- Marketing automation
- Public API
- White labeling
- Custom domains

---

# 53. Recommended Technical Architecture

Phase 1 should use a **single Next.js application**. Do not create a separate backend service service.

## Architecture

```text
                    ┌─────────────────────────┐
                    │        Next.js          │
                    │                         │
                    │  App Router             │
                    │  Server Components      │
                    │  Client Components      │
                    │  Server Actions         │
                    │  Route Handlers         │
                    │  Business Logic         │
                    └────────────┬────────────┘
                                 │
                              Prisma
                                 │
                    ┌────────────▼────────────┐
                    │       PostgreSQL        │
                    │                         │
                    │     Multi-tenant DB     │
                    └─────────────────────────┘
```

## Phase 1 Stack

### Application

- Next.js
- TypeScript
- App Router
- React
- Server Components
- Client Components where interactivity requires them
- Server Actions for internal mutations
- Route Handlers for HTTP endpoints and integrations

### Styling / UI

- Tailwind CSS
- Reusable component library
- Responsive design
- Accessible UI

### Database

- PostgreSQL

### ORM

- Prisma

### Validation

- Zod or an equivalent TypeScript validation library

### Authentication

Use a mature authentication solution compatible with Next.js.

Support:

- Email/password
- Session management
- MFA / 2FA
- Password reset
- Email verification
- Role-based authorization

### Infrastructure

The application should be deployable as a single Next.js application.

Potential infrastructure:

- Azure
- PostgreSQL hosting
- Azure Blob Storage for files
- Application Insights
- Azure DevOps CI/CD

---

# 53.1 Application Architecture Principles

The project should be organized by business domain rather than putting all logic into generic folders.

Recommended structure:

```text
gym-management-system/
│
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── members/
│   │   │   ├── memberships/
│   │   │   ├── attendance/
│   │   │   ├── payments/
│   │   │   ├── trainers/
│   │   │   ├── classes/
│   │   │   ├── crm/
│   │   │   ├── expenses/
│   │   │   ├── inventory/
│   │   │   └── reports/
│   │   └── api/
│   │
│   ├── components/
│   │   ├── ui/
│   │   └── shared/
│   │
│   ├── features/
│   │   ├── organizations/
│   │   ├── branches/
│   │   ├── members/
│   │   ├── memberships/
│   │   ├── attendance/
│   │   ├── payments/
│   │   ├── trainers/
│   │   ├── personal-training/
│   │   ├── classes/
│   │   ├── crm/
│   │   ├── expenses/
│   │   ├── inventory/
│   │   └── reports/
│   │
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── permissions.ts
│   │   ├── tenant.ts
│   │   └── utils.ts
│   │
│   └── middleware.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── public/
│
├── docs/
│
├── .env.example
├── next.config.ts
├── package.json
└── README.md
```

The exact folder structure may evolve as the project grows, but business domains should remain clearly separated.

---

# 53.2 Data Access Pattern

Do not put raw Prisma queries throughout UI components.

Use a predictable server-side flow:

```text
UI
 ↓
Server Action / Route Handler
 ↓
Input Validation
 ↓
Authentication
 ↓
Authorization
 ↓
Tenant / Branch Context
 ↓
Business Logic
 ↓
Prisma
 ↓
PostgreSQL
```

Example:

```text
Renew Membership
        ↓
renewMembership()
        ↓
Validate input
        ↓
Check authenticated user
        ↓
Check permission
        ↓
Resolve organization
        ↓
Verify member belongs to organization
        ↓
Verify membership rules
        ↓
Prisma transaction
        ↓
Update membership
        ↓
Create invoice/payment records
        ↓
Create audit log
```

Business-critical operations should use Prisma transactions where multiple database records must remain consistent.

---

# 53.3 Server Actions

Use Next.js Server Actions for internal application mutations where appropriate.

Examples:

```text
createMember()
updateMember()
archiveMember()
createMembership()
renewMembership()
freezeMembership()
recordAttendance()
createInvoice()
recordPayment()
createLead()
scheduleFollowUp()
```

Server Actions must:

- Validate input
- Authenticate the user
- Check permissions
- Resolve tenant context
- Validate branch access
- Perform business rules
- Return structured success/error results

Never trust data supplied by the client.

---

# 53.4 Route Handlers

Use Next.js Route Handlers when an HTTP endpoint is required.

Examples:

```text
/api/v1/...
```

Potential uses:

- External webhooks
- Payment provider callbacks
- WhatsApp webhooks
- QR check-in integrations
- Hardware integrations
- Public API
- Future mobile application
- External system integrations

Route Handlers must use the same authentication, authorization, validation, and tenant-isolation rules as Server Actions.

---

# 53.5 Multi-Tenant Architecture

The application must be multi-tenant from the beginning.

Core hierarchy:

```text
Platform
   │
   └── Organization
          │
          ├── Branch
          │
          ├── Users
          │
          ├── Members
          │
          ├── Memberships
          │
          ├── Payments
          │
          ├── Attendance
          │
          └── Other business data
```

Most business entities should contain an `organizationId` directly or be safely reachable through an organization-owned parent.

Where branch-specific data is required, use `branchId`.

Example:

```text
Member
├── id
├── organizationId
├── branchId
├── name
└── ...
```

---

# 53.6 Tenant Isolation

Tenant isolation is a critical security requirement.

A user belonging to:

```text
Gym A
```

must never be able to access:

```text
Gym B
```

data.

Tenant isolation must be enforced server-side.

Do not rely on:

- Hidden frontend fields
- Client-side filtering
- Route visibility
- UI permissions alone

Every database operation involving tenant-owned data must be scoped to the authenticated organization.

Example conceptual pattern:

```text
Current Session
      ↓
organizationId
      ↓
Authorization
      ↓
Prisma query scoped by organizationId
      ↓
PostgreSQL
```

For branch-restricted users, also enforce `branchId` access.

---

# 53.7 Prisma Guidelines

Use Prisma as the primary data-access layer.

Requirements:

- Use Prisma migrations
- Keep schema changes version-controlled
- Use transactions for multi-record business operations
- Add appropriate indexes
- Define foreign-key relationships
- Define unique constraints
- Use enums where appropriate
- Use soft deletion where business records need historical preservation
- Avoid N+1 query patterns
- Paginate large datasets
- Select only required fields where appropriate
- Keep Prisma access on the server

The Prisma schema should be treated as a central source of truth for the database structure.

---

# 53.8 PostgreSQL Guidelines

PostgreSQL should be the primary database for Phase 1.

Use relational constraints to protect data integrity.

Important areas include:

- Organizations
- Branches
- Users
- Members
- Memberships
- Invoices
- Payments
- Attendance
- Classes
- Bookings
- Products
- Inventory
- Expenses

Use:

- Foreign keys
- Unique constraints
- Indexes
- Transactions
- Appropriate numeric types for financial amounts
- UTC timestamps with explicit timezone handling
- Database-level constraints where useful

Financial values should not use floating-point numbers.

---

# 53.9 API Design

Even though Phase 1 uses a single Next.js application, keep Route Handlers and internal server APIs clean enough to support future integrations.

Use:

```text
/api/v1/...
```

for HTTP endpoints that need to exist.

Example:

```text
/api/v1/members
/api/v1/memberships
/api/v1/attendance
/api/v1/payments
/api/v1/invoices
/api/v1/trainers
/api/v1/classes
/api/v1/leads
/api/v1/products
/api/v1/inventory
/api/v1/reports
```

Use consistent:

- HTTP status codes
- Error structures
- Validation
- Pagination
- Filtering
- Sorting
- Search
- Authorization

Do not create HTTP APIs for every internal operation if a Server Action is the more appropriate mechanism.

---

# 53.10 Future Scalability

Do not introduce distributed services prematurely.

Phase 1 should remain:

```text
Next.js
   │
Prisma
   │
PostgreSQL
```

Additional infrastructure can be introduced only when there is a concrete requirement.

Possible future additions include:

```text
Next.js
   │
   ├── Server Actions
   ├── Route Handlers
   │
   ├── Background Jobs
   │
   ├── Redis / Cache
   │
   ├── Object Storage
   │
   └── External Integrations
             │
        PostgreSQL
```

Potential future needs:

- Background job processing
- Scheduled notifications
- Large-scale reporting
- Queue-based integrations
- Mobile applications
- Public API
- High-volume webhooks
- External payment systems
- WhatsApp automation

Do not add these to Phase 1 unless required.

---

# 53.11 Environment Configuration

Use environment variables for configuration and secrets.

Example:

```text
DATABASE_URL=
AUTH_SECRET=
NEXT_PUBLIC_APP_URL=
STORAGE_CONNECTION_STRING=
EMAIL_API_KEY=
WHATSAPP_API_KEY=
```

Requirements:

- Commit `.env.example`
- Never commit real secrets
- Keep production secrets outside source control
- Validate required environment variables at application startup
- Separate development, test, staging, and production configuration

---

# 53.12 Testing

Testing should cover:

### Unit Tests

- Membership calculations
- Freeze/extension rules
- Payment calculations
- Permission checks
- Lead conversion logic
- Attendance rules

### Integration Tests

- Database operations
- Server Actions
- Authentication
- Authorization
- Tenant isolation
- Membership lifecycle

### End-to-End Tests

Critical workflows:

```text
Create member
      ↓
Create membership
      ↓
Generate invoice
      ↓
Record payment
      ↓
Check in member
      ↓
Renew membership
```

Also test unauthorized cross-tenant access.

---

# 54. Core Database Entities

Suggested initial data model:

```text
Organization
Branch
User
Role
Permission

Member
MembershipPlan
Membership
Attendance

Invoice
InvoiceItem
Payment
Refund

Trainer
PTPackage
PTSession

WorkoutPlan
Workout
Exercise

DietPlan
Meal

Class
ClassSchedule
ClassBooking

Lead
LeadActivity
FollowUp

Product
Inventory
InventoryTransaction
Supplier

Expense

Notification
NotificationTemplate

Document
AuditLog
```

---

# 55. Recommended Development Backlog

Create development tickets/modules approximately as follows:

```text
GMS-001 Authentication
GMS-002 Organization Management
GMS-003 Branch Management
GMS-004 User Management
GMS-005 RBAC

GMS-010 Member Management
GMS-011 Member Profile
GMS-012 Membership Plans
GMS-013 Membership Lifecycle

GMS-020 Attendance
GMS-021 QR Check-in

GMS-030 Payments
GMS-031 Invoices
GMS-032 Receipts

GMS-040 Dashboard
GMS-041 Reports

GMS-050 CRM
GMS-051 Leads
GMS-052 Follow-ups

GMS-060 Trainers
GMS-061 Personal Training

GMS-070 Workout
GMS-071 Nutrition

GMS-080 Classes
GMS-081 Booking

GMS-090 Expenses

GMS-100 POS
GMS-101 Inventory

GMS-110 Notifications
GMS-111 WhatsApp

GMS-120 Mobile App

GMS-130 SaaS Billing
GMS-131 Super Admin
```

---

# 56. Product UX Principle

The owner dashboard should not feel like a generic administration panel.

When the owner logs in, show actionable business information.

Example:

```text
Good morning, Ahmed

TODAY

428 Active Members
137 Check-ins
Rs 84,500 Revenue
19 Memberships Expiring
Rs 125,000 Outstanding
8 New Leads
```

Then:

```text
ACTION REQUIRED

19 memberships expiring
12 inactive members
7 unpaid invoices
5 leads awaiting follow-up
```

The application should make the most important actions obvious.

---

# 57. Main Business Lifecycle

The product should connect its modules rather than treating them as isolated CRUD screens.

```text
Lead
 ↓
Trial
 ↓
Membership
 ↓
Invoice
 ↓
Payment
 ↓
Member
 ↓
Digital Membership Card
 ↓
Check-in
 ↓
Attendance
 ↓
Trainer / Class
 ↓
Workout / Nutrition
 ↓
Membership Expiry
 ↓
Notification
 ↓
Renewal
```

This lifecycle should be reflected throughout the application.

---

# 58. Product Positioning

For initial sales, position the product around business outcomes rather than simply calling it membership software.

Example positioning:

> **A complete platform to manage your members, payments, attendance, trainers and gym operations from one place.**

The demo should demonstrate:

1. A new lead enters the CRM.
2. The lead is followed up.
3. The customer purchases a membership.
4. An invoice is generated.
5. Payment is recorded.
6. A digital membership card is created.
7. The customer checks in using QR.
8. The trainer manages the customer.
9. Attendance and fitness progress are tracked.
10. The system detects an upcoming membership expiry.
11. The customer receives a WhatsApp reminder.
12. The customer renews.

This demonstrates the interconnected value of the platform.

---

# 59. Development Rules for Coding AI

When using coding AI tools to build this application:

- Do not generate the entire application in one prompt.
- Build one module at a time.
- Define database models before implementing complex UI.
- Define API contracts before implementing frontend integrations.
- Use TypeScript throughout the stack.
- Keep business logic out of React components.
- Use service/repository layers where appropriate.
- Enforce authorization server-side.
- Enforce tenant isolation server-side.
- Validate all incoming API data.
- Add automated tests for business-critical logic.
- Use migrations for database schema changes.
- Use seed data for development/demo environments.
- Keep integrations behind interfaces/adapters.
- Use feature flags for unfinished features.
- Use structured logging.
- Add audit logging for sensitive operations.
- Do not expose secrets in frontend code.
- Do not commit `.env` files containing secrets.
- Use environment-specific configuration.
- Document APIs.
- Keep modules independently testable.
- Prefer reusable components over duplicated UI.
- Design for accessibility.
- Design responsive interfaces from the beginning.

---

# 60. Suggested Initial Folder Structure

Example frontend/backend monorepo:

```text
gym-management-system/
│
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   ├── organizations/
│   │   │   │   ├── members/
│   │   │   │   ├── memberships/
│   │   │   │   ├── attendance/
│   │   │   │   ├── payments/
│   │   │   │   ├── crm/
│   │   │   │   └── reports/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   └── routes/
│   │   └── package.json
│   │
│   └── api/
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── organizations/
│       │   │   ├── branches/
│       │   │   ├── members/
│       │   │   ├── memberships/
│       │   │   ├── attendance/
│       │   │   ├── payments/
│       │   │   ├── crm/
│       │   │   └── reports/
│       │   ├── middleware/
│       │   ├── shared/
│       │   └── config/
│       └── package.json
│
├── packages/
│   ├── types/
│   ├── ui/
│   ├── validation/
│   └── config/
│
├── infrastructure/
│
├── docs/
│
├── .env.example
├── README.md
└── package.json
```

---

# 61. Definition of Done for Each Module

Every module should ideally include:

```text
Database model
↓
Migration
↓
Validation schema
↓
API endpoints
↓
Authorization
↓
Service/business logic
↓
Unit tests
↓
Integration tests
↓
Frontend pages
↓
Reusable components
↓
Loading states
↓
Error states
↓
Empty states
↓
Responsive UI
↓
Audit logging where appropriate
↓
Documentation
```

A module should not be considered complete simply because its CRUD screens work.

---

# 62. Final Product Goal

The finished platform should allow a gym owner to answer almost every operational question from one system:

```text
How many members do I have?
Who is expiring?
Who hasn't visited recently?
Who owes money?
How much did we make this month?
Where did the revenue come from?
How much did we spend?
Which trainer has which members?
How many PT sessions remain?
Which classes are full?
How many leads do we have?
Where are leads coming from?
How many leads converted?
What products are low in stock?
How is each branch performing?
```

The long-term goal is:

> **One platform for managing the entire gym business — from lead acquisition to membership, attendance, training, payments, retention and renewal.**
