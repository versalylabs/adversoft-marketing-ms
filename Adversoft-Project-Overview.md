# Adversoft — Project Overview

## 1. Product

**Adversoft** is a business management platform for outdoor advertising companies.

**Tagline:** Manage every billboard. Every booking. Every campaign.

The platform connects the complete outdoor-advertising lifecycle:

**Client → Booking → Billboard → Campaign → Artwork → Installation → Invoice**

The goal is to build a professional, modern SaaS-style product that can eventually be demonstrated and sold to billboard/outdoor advertising companies.

---

## 2. Product Vision

Adversoft should not feel like a collection of unrelated CRUD pages.

A billboard should connect to its location, availability, bookings, client, campaign, artwork, installation history and revenue.

A typical workflow should eventually look like:

1. Lead/client is created
2. Client requests advertising space
3. Staff selects suitable billboards
4. Availability is checked
5. Quotation is prepared
6. Client approves
7. Booking is confirmed
8. Campaign is created
9. Artwork is uploaded and approved
10. Installation is scheduled
11. Campaign becomes active
12. Invoice/payment is tracked
13. Campaign is reported
14. Booking can be renewed or expire

Build the architecture so these relationships can grow naturally as later phases are implemented.

---

## 3. Main Product Areas

The eventual system will contain:

- Dashboard
- CRM / Clients / Leads
- Billboard Inventory
- Billboard Map
- Pricing & Availability
- Bookings
- Public Billboard Marketplace
- Quotations
- Contracts
- Campaigns
- Artwork & Approvals
- Installations
- Maintenance
- Invoices & Payments
- Client Portal
- Notifications
- Reports & Analytics
- Documents
- Search & Activity Logs
- Settings
- Authentication & Permissions

Do **not** attempt to build all of these immediately.

Development is intentionally phased.

---

## 4. Product Faces

The finished platform will have three major experiences:

### Internal Operations App
Used by advertising-company staff to manage the business.

### Client Portal
Used by advertisers to view campaigns, approve artwork, view documents, invoices and reports, and interact with the company.

### Public Marketplace
A public-facing experience where potential advertisers can discover available billboard inventory and request bookings.

These can be developed incrementally.

---

## 5. Technology Direction

Preferred stack:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui or another strong component system
- PostgreSQL
- Prisma
- Production-ready authentication
- Cloud storage for files/images
- Mapbox or Google Maps for maps
- Transactional email provider
- Server-side PDF generation
- Vercel
- GitHub

If a specific technology choice needs to be adjusted during development, prefer solutions that are simple, maintainable, production-ready and compatible with the overall architecture.

---

## 6. Design Direction

The application should feel like a modern premium SaaS product rather than an old enterprise admin panel.

Priorities:

- Clean visual hierarchy
- Professional typography
- Spacious but efficient layouts
- Strong dashboard design
- Consistent components
- Responsive design
- Useful empty states
- Good loading states
- Clear error states
- Helpful notifications/toasts
- Accessible interactions
- Fast-feeling UI
- Consistent navigation

Use creativity where appropriate. The interface does not need to copy the examples in the original planning document literally.

The product name throughout the application is **Adversoft**.

Avoid placeholder branding from unrelated projects.

---

## 7. Core Data Concepts

The system will eventually revolve around entities such as:

- Users
- Roles
- Permissions
- Organizations
- Clients
- Contacts
- Leads
- Billboards
- Billboard Locations
- Billboard Types
- Pricing
- Bookings
- Campaigns
- Campaign Deliverables
- Quotations
- Contracts
- Artwork
- Artwork Versions
- Approvals
- Installations
- Maintenance Records
- Invoices
- Payments
- Documents
- Notifications
- Activity Logs

Relationships should be designed deliberately rather than creating isolated modules.

For example:

**Client**
- Campaigns
- Bookings
- Quotations
- Contracts
- Invoices
- Contacts

**Billboard**
- Location
- Bookings
- Campaigns
- Maintenance
- Installation history

---

# 8. Development Roadmap

## Phase 1 — Project Foundation

**Goal:** Establish the application architecture and development environment.

Build the initial application shell with:

- Next.js
- TypeScript
- Tailwind CSS
- UI/component system
- Main application layout
- Sidebar/navigation
- Header
- Responsive structure
- Environment configuration
- Basic error handling
- Loading states
- Toast/notification foundation
- Basic authentication structure
- Development database connection
- Sensible project/file structure

Initial navigation should anticipate the future product areas:

- Dashboard
- CRM
- Billboards
- Bookings
- Campaigns
- Artwork
- Installations
- Maintenance
- Quotations
- Contracts
- Invoices
- Payments
- Reports
- Client Portal
- Settings

### Phase 1 Deliverable

A running, polished Adversoft application shell that establishes the visual language and technical foundation for future phases.

**Do not implement the full business functionality of later phases yet.**

---

## Phase 2 — Database & Architecture

Design the relational database and relationships required by the platform.

Focus on:

- Users
- Roles
- Permissions
- Organizations
- Clients
- Contacts
- Leads
- Billboards
- Locations
- Pricing
- Bookings
- Campaigns
- Quotations
- Contracts
- Artwork
- Installations
- Maintenance
- Invoices
- Payments
- Documents
- Notifications
- Activity logs

---

## Phase 3 — Authentication & User Management

Implement:

- Login/logout
- Password security
- Sessions
- User profiles
- Organization/workspace
- Roles
- Permissions
- Protected routes
- Role-aware navigation

Initial roles may include:

- Super Admin
- Admin
- Sales Manager
- Sales Agent
- Campaign Manager
- Operations Manager
- Finance
- Technician
- Client

---

## Phase 4 — Main Dashboard

Create the operational command center.

Eventually show:

- Total billboards
- Available
- Occupied
- Reserved
- Maintenance
- Active campaigns
- Upcoming campaigns
- Expiring campaigns
- Pending approvals
- Outstanding invoices
- Revenue
- Recent activity
- Upcoming tasks

Add appropriate charts and visual summaries.

---

## Phase 5 — CRM / Client Management

Build:

- Clients
- Company information
- Contacts
- Notes
- Documents
- Leads
- Lead sources
- Lead status
- Sales pipeline
- Follow-ups
- Conversion to client
- Client history

---

## Phase 6 — Billboard Inventory

Build the core billboard management system.

A billboard should support information such as:

- Billboard ID/code
- Name
- Location
- GPS coordinates
- Address
- Size
- Type
- Orientation
- Lighting
- Rate
- Photos
- Description
- Status

Statuses:

- Available
- Reserved
- Occupied
- Maintenance
- Inactive

Include search, filters, sorting, history and appropriate management actions.

---

## Phase 7 — Interactive Billboard Map

Create an interactive map showing billboard inventory.

Eventually support:

- Billboard markers
- Status indicators
- Search
- Location filtering
- Billboard popups
- Billboard details
- Map/list toggle
- Nearby discovery

---

## Phase 8 — Pricing & Availability

Build:

- Billboard rates
- Daily/weekly/monthly pricing
- Seasonal pricing
- Installation charges
- Artwork charges
- Discounts
- Minimum booking duration
- Availability calendar

The system must eventually prevent conflicting/double bookings.

---

## Phase 9 — Booking System

Workflow:

**Select Client → Select Billboard → Select Dates → Check Availability → Calculate Price → Create Booking**

Booking statuses can include:

- Draft
- Pending
- Reserved
- Confirmed
- Active
- Completed
- Cancelled
- Expired

Support booking history, extensions, cancellations and renewals.

---

## Phase 10 — Public Billboard Marketplace

Create a public-facing billboard discovery experience.

Potential advertisers should be able to filter by things such as:

- Location
- Type
- Availability
- Budget

Results should show useful billboard information and allow:

**View Billboard → Request Booking**

Requests should eventually feed into the internal CRM.

---

## Phase 11 — Quotation System

Build professional quotations containing:

- Billboard rental
- Installation
- Artwork
- Printing
- Discounts
- Taxes
- Terms
- Expiry date

Workflow:

**Booking Request → Quotation → Client Review → Approval → Booking Confirmed**

Generate professional PDFs.

---

## Phase 12 — Contract Management

Connect approved bookings to contracts.

Support:

- Contract numbers
- Templates
- Dates
- Terms
- Documents
- Client
- Billboards
- Campaign
- Renewal date
- Expiry notifications

---

## Phase 13 — Campaign Management

Create campaign workspaces containing areas such as:

- Overview
- Brief
- Strategy
- Budget
- Billboards
- Deliverables
- Artwork
- Approvals
- Tasks
- Installation
- Documents
- Invoices
- Reports

Campaign statuses:

- Planning
- Awaiting Approval
- Scheduled
- Active
- Paused
- Completed
- Cancelled

---

## Phase 14 — Artwork & Approval

Build:

- Artwork uploads
- Version control
- Preview
- Comments
- Revision requests
- Approval/rejection
- Approval history

Every approval should record who approved, when, which version and relevant comments.

---

## Phase 15 — Installation Management

Manage physical campaign deployment.

Installation jobs should connect:

- Billboard
- Campaign
- Location
- Assigned team
- Scheduled date
- Instructions
- Artwork
- Status

Allow installation evidence such as photos and notes.

---

## Phase 16 — Maintenance

Build:

- Maintenance requests
- Fault reporting
- Technician assignment
- Priority
- Scheduling
- Maintenance history
- Photos
- Resolution notes
- Cost tracking

---

## Phase 17 — Invoicing & Payments

Build:

- Invoice numbers
- Clients
- Campaigns
- Bookings
- Line items
- Taxes
- Discounts
- Totals
- Due dates
- Payment records
- Payment methods
- References
- Payment status

---

## Phase 18 — Client Portal

Give clients a dedicated workspace for:

- Campaigns
- Billboards
- Pending approvals
- Bookings
- Quotations
- Contracts
- Invoices
- Payments
- Documents
- Reports

Clients should eventually be able to approve quotations/artwork and submit requests.

---

## Phase 19 — Notifications & Automation

Add notifications for important business events such as:

- Booking requests
- Quote approval
- Artwork approval/rejection
- Booking confirmation
- Campaign start/end
- Contract expiry
- Invoice overdue
- Maintenance issues
- Installation completion

Start with in-app notifications and email.

---

## Phase 20 — Reporting & Analytics

Build analytics around:

### Billboard
- Occupancy
- Revenue
- Location performance
- Booking frequency
- Average duration

### Client
- Revenue
- Campaigns
- Booking history
- Outstanding balances

### Campaign
- Value
- Duration
- Status

### Finance
- Revenue
- Outstanding invoices
- Payments
- Revenue over time
- Revenue by location

---

## Phase 21 — Document Management

Centralize:

- Artwork
- Contracts
- Quotations
- Invoices
- Campaign reports
- Installation photos
- Maintenance photos
- Client documents

Support appropriate upload, preview, download, deletion, versioning and access control.

---

## Phase 22 — Search & Activity Logs

Build:

- Global search
- Cross-module results
- Activity history
- Audit-friendly event records

Example activity:

> John approved Artwork V3  
> Mary created Booking #1042  
> Invoice #INV-2026-042 marked paid

---

## Phase 23 — Security & Production Hardening

Perform a dedicated security pass covering:

- Authentication
- Authorization
- Permissions
- API security
- Input validation
- File uploads
- Database security
- Environment variables
- Sessions
- Rate limiting
- CSRF/XSS protection
- SQL injection protection
- Audit logs
- Error handling

Remove development credentials, fake data and sensitive logging before production.

---

## Phase 24 — Testing & QA

Test the critical lifecycle:

**Client → Billboard → Booking → Quotation → Approval → Campaign → Artwork → Installation → Invoice → Payment → Report**

Also test:

- Mobile
- Desktop
- Browsers
- Permissions
- Invalid inputs
- Empty states
- Errors
- File uploads
- Large datasets
- Concurrent bookings

---

## Phase 25 — Production Infrastructure

Prepare:

- Production PostgreSQL
- Cloud file storage
- Transactional email
- Environment variables
- Domain
- DNS
- Monitoring
- Backups

---

## Phase 26 — Deployment

Deploy the application to the chosen production platform, initially targeting Vercel.

Configure:

- Git repository
- Production environment variables
- Database
- Storage
- Authentication
- Domain
- Email
- Build settings

---

## Phase 27 — Production Launch

Prepare:

- First organization
- First administrator
- Roles
- Billboard inventory
- Existing clients
- Existing campaigns
- Pricing

Complete final production checks before launch.

---

# 9. MVP Target

Do not try to build all 27 phases before having something demonstrable.

### MVP — Phases 1–11

The first meaningful product milestone is:

- Foundation
- Database
- Authentication
- Dashboard
- CRM
- Billboard management
- Map
- Availability
- Booking
- Public marketplace
- Quotations

This should create a credible demo for an outdoor advertising company.

### V1 — Phases 12–20

Add:

- Contracts
- Campaigns
- Artwork approvals
- Installation
- Maintenance
- Invoices
- Payments
- Client portal
- Notifications
- Analytics

### Production — Phases 21–27

Add:

- Documents
- Global search
- Activity logs
- Security hardening
- QA
- Infrastructure
- Deployment
- Launch

---

# 10. Agent Development Rules

These rules are important.

### Work phase-by-phase

Only implement the phase requested by the current task unless a small supporting change is genuinely required.

Do not jump ahead and attempt to build the entire roadmap.

### Inspect before changing

Before modifying the project, understand the existing structure and reuse good existing patterns.

### Keep architecture extensible

Later phases should be able to build on earlier ones without major rewrites.

### Prefer working software

A smaller completed feature is better than a large unfinished implementation.

### Use sensible defaults

When a minor implementation detail is unspecified, make a reasonable engineering/design decision rather than stopping unnecessarily.

### Avoid unnecessary complexity

Do not introduce infrastructure or abstractions before they are needed.

### Maintain consistency

Reuse components, patterns, naming conventions and design language throughout the project.

### Verify your work

After making changes, run appropriate checks/builds/tests and fix obvious errors before considering the phase complete.

### Do not fake functionality

If a feature is not implemented yet, don't make it appear fully functional through misleading placeholder behavior.

---

# 11. Phase Completion Standard

At the end of each phase:

1. Implement the requested functionality.
2. Make sure it integrates cleanly with the existing project.
3. Check for obvious errors.
4. Run relevant tests/build/type checks where available.
5. Keep the project in a runnable state.
6. Briefly summarize what was completed and any important decisions.

Then stop.

Wait for the next phase instruction.

---

# 12. Current Development Priority

**Current phase: Phase 1 — Project Foundation**

The immediate objective is NOT to build the entire Adversoft platform.

The immediate objective is to establish a polished, stable foundation that future phases can build upon.

