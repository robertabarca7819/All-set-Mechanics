# All-Set Mechanics - Professional Service Booking Platform

## Overview

All-Set Mechanics is a professional mechanical services booking platform that eliminates the need for phone calls and emails. The platform connects customers needing mechanical services with qualified service providers through a streamlined digital workflow. Customers can submit service requests with detailed information, providers can accept jobs, and both parties can communicate through an integrated messaging system. The platform also handles secure prepayment contracts to ensure trust and commitment from both parties.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**UI Component System**: The application uses shadcn/ui (New York style) as the design system foundation, built on top of Radix UI primitives. This provides a comprehensive set of accessible, customizable components with consistent styling.

**Styling Approach**: Tailwind CSS with a custom design token system. The application implements a dual-theme system (light/dark modes) using CSS custom properties for colors and consistent spacing primitives. Design follows a professional, efficiency-first approach inspired by Linear and Stripe, emphasizing trust and credibility through clean layouts.

**Routing**: Client-side routing implemented with Wouter, a lightweight alternative to React Router. Routes include:
- / (Home page)
- /request (Service request form)
- /provider-register (Provider registration)
- /provider-login (Provider login)
- /provider-dashboard (Protected provider dashboard)
- /admin (Admin dashboard with password authentication)
- /admin/calendar (Admin calendar view)
- /my-jobs (Customer self-service portal)
- /messages (Real-time messaging)
- /contract/:jobId (Payment contract page)
- 404 page for unmatched routes

**State Management**: 
- React Query (TanStack Query) for server state management and caching
- Local React state (useState, useContext) for UI state
- WebSocket integration for real-time messaging functionality

**Key Design Decisions**:
- Component-based architecture with reusable UI components in `/client/src/components/ui/`
- Feature-specific components in `/client/src/components/` (JobCard, MessageList, etc.)
- Path aliases configured for clean imports (@/ for client, @shared/ for shared code)

### Backend Architecture

**Runtime**: Node.js with Express.js framework

**Language**: TypeScript with ES modules

**API Design**: RESTful API with conventional HTTP methods:
- GET /api/conversations - Fetch user conversations
- GET /api/conversations/:jobId - Get conversation by job ID
- POST /api/conversations - Create new conversation
- POST /api/messages - Send message
- WebSocket endpoint at /ws for real-time messaging

**Provider Authentication APIs**:
- POST /api/provider/register - Create new provider account
- POST /api/provider/login - Authenticate provider
- POST /api/provider/logout - Destroy provider session
- GET /api/provider/verify - Verify current provider session

**Scheduling & Payment APIs**:
- POST /api/deposits/:jobId - Create deposit checkout session (admin only)
- POST /api/checkout-sessions - Create final payment checkout (admin only)
- POST /api/customer/request-access - Request email verification code
- POST /api/customer/verify-access - Verify code and issue access token
- GET /api/customer/jobs?token={token} - Get customer jobs by token
- POST /api/customer/reschedule - Reschedule appointment (24hr policy)
- POST /api/customer/cancel - Cancel appointment (24hr policy)
- POST /api/stripe/webhook - Handle Stripe payment events

**Data Storage Strategy**: The application uses PostgreSQL database with Drizzle ORM for persistent data storage. The storage layer abstracts data operations through the `IStorage` interface implemented by the `DatabaseStorage` class.

**Session Management**: Configured to use connect-pg-simple for PostgreSQL-based session storage (preparation for production deployment)

**Development vs Production**:
- Development mode uses Vite middleware for HMR (Hot Module Replacement)
- Production serves static built files
- Environment-specific error handling and logging

**Key Architectural Patterns**:
- Repository pattern via IStorage interface for data access abstraction
- Middleware-based request/response logging
- WebSocket client tracking with userId-based connection mapping
- Zod schema validation for type-safe data handling

### Database Schema Design

**ORM**: Drizzle ORM configured for PostgreSQL

**Schema Structure** (`shared/schema.ts`):

**Users Table**:
- id (UUID primary key)
- username (unique text)
- password (text)
- role (text: 'customer', 'provider', or 'admin')

**Provider Sessions Table**:
- id (UUID primary key)
- providerId (user reference)
- sessionToken (unique text)
- expiresAt (timestamp) - 24-hour expiration
- createdAt (timestamp)

**Jobs Table**:
- id (UUID primary key)
- serviceType, title, description (service details)
- location, preferredDate, preferredTime (scheduling)
- estimatedPrice (integer)
- status (text: requested/accepted/deposit_due/payment_pending/confirmed/completed)
- customerId, providerId (user references)
- createdAt (timestamp)
- **Scheduling fields**: customerEmail, isUrgent, responseDeadline, appointmentDateTime, previousAppointmentDateTime, rescheduleCount, rescheduledAt, cancelledAt
- **Deposit fields**: depositAmount (default 100), depositStatus, depositCheckoutSessionId, depositPaidAt
- **Customer access**: customerAccessToken (for self-service portal)
- **Cancellation**: cancellationFee, cancellationFeeStatus

**Customer Verification Codes Table**:
- id (UUID primary key)
- email (text)
- code (text) - 6-digit verification code
- expiresAt (timestamp) - 15-minute expiry
- createdAt (timestamp)

**Conversations Table**:
- id (UUID primary key)
- jobId, customerId, providerId (references)
- createdAt (timestamp)

**Messages Table**:
- id (UUID primary key)
- conversationId, senderId (references)
- content (text)
- createdAt (timestamp)

**Validation**: Zod schemas (insertUserSchema, insertJobSchema, etc.) provide runtime type validation and integrate with Drizzle for type-safe database operations.

**Migration Strategy**: Drizzle Kit configured to generate migrations in `/migrations` directory from schema definitions.

### Advanced Scheduling & Payment Features

**Deposit System**:
- $100 deposit required when provider accepts job
- Deposit checkout automatically created by admin
- Deposit amount deducted from final payment (estimatedPrice - depositAmount)
- Stripe webhook handles deposit payment confirmation
- Metadata distinguishes deposit vs final payment (metadata.type)

**Customer Self-Service Portal**:
- Email-based access with 2-step verification
- Step 1: Request 6-digit verification code (15-minute expiry)
- Step 2: Verify code to receive access token
- Access token stored in localStorage for persistence
- View jobs, reschedule, and cancel appointments

**Reschedule & Cancellation Policy**:
- **24-hour free window**: Free rescheduling/cancellation if ≥24 hours before appointment
- **Late fee**: $50 fee if rescheduling/canceling <24 hours before appointment
- Fee charged via Stripe checkout before reschedule/cancellation confirmed
- Tracks reschedule count and previous appointment times

**Urgent Request System**:
- Customers can flag requests as urgent
- 3-hour response deadline for urgent requests
- Visual highlighting in admin dashboard
- Response deadline tracked and displayed

**Calendar Integration**:
- Admin calendar view at /admin/calendar
- React-day-picker for monthly appointment display
- Color-coded appointments by status
- Click to view job details

**Job Filtering**:
- Filter by status (requested, accepted, confirmed, etc.)
- Filter by service type
- Filter by date range
- Filter by urgent flag
- Applied in both admin dashboard and customer portal

**Security Features**:
- Admin session expiry enforcement (checks expiresAt field)
- Provider authentication with cookie-based sessions (24-hour expiration)
- Password hashing using bcrypt for provider accounts
- Email verification required for customer access
- Verification codes expire in 15 minutes
- One-time use codes (deleted after verification)
- Customer access tokens scoped to email-specific jobs only

### Real-time Communication

**WebSocket Implementation**:
- WebSocket server integrated with HTTP server
- Client connection management via userId mapping
- Bidirectional message flow for instant messaging
- Custom hook (useWebSocket) encapsulates connection logic and message handling
- Automatic reconnection handling on client side

### Type Safety & Code Sharing

**Shared Types**: Database schema types and validation schemas are defined in `/shared/schema.ts` and imported by both client and server, ensuring type consistency across the full stack.

**Path Resolution**: TypeScript configured with path aliases (@/, @shared/, @assets/) for clean, maintainable imports throughout the codebase.

## External Dependencies

### UI Component Library
- **Radix UI**: Headless UI primitives for accessible components (dialogs, dropdowns, popovers, etc.)
- **shadcn/ui**: Pre-styled component system built on Radix UI with customizable themes
- **Lucide React**: Icon library for consistent iconography

### Styling & Design
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **class-variance-authority**: Type-safe variant styling for components
- **clsx & tailwind-merge**: Utility for conditional and merged CSS classes

### Data & State Management
- **TanStack React Query**: Server state management, caching, and synchronization
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime type validation and schema definition
- **@hookform/resolvers**: Integration between React Hook Form and Zod

### Database & ORM
- **Drizzle ORM**: TypeScript ORM for SQL databases
- **@neondatabase/serverless**: Neon PostgreSQL serverless driver
- **drizzle-kit**: Database migration and introspection tool

### Routing & Navigation
- **Wouter**: Lightweight client-side routing library

### Real-time Communication
- **ws (WebSocket)**: WebSocket library for real-time bidirectional communication

### Payment Processing (Planned)
- **Stripe**: Payment processing infrastructure
- **@stripe/stripe-js & @stripe/react-stripe-js**: Stripe integration for React

### Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundler for production builds
- **Replit Plugins**: Development tools for Replit environment (cartographer, dev-banner, runtime-error-modal)

### Utilities
- **date-fns**: Date manipulation and formatting
- **nanoid**: Unique ID generation
- **cmdk**: Command menu component for keyboard navigation