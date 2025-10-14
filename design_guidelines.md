# Design Guidelines: All-Set Mechanics - Professional Service Booking Platform

## Design Approach

**Selected Approach**: Design System-Based (Linear + Stripe Hybrid)  
**Justification**: This utility-focused platform for industry professionals requires clean efficiency, trust-building aesthetics, and reliable patterns. We'll draw from Linear's sharp typography and Stripe's professional minimalism while adding service industry credibility elements.

**Core Principles**:
- Professional credibility over flashy design
- Efficiency-first interactions with clear CTAs
- Trust-building through clean, organized layouts
- Mobile-optimized for on-the-go mechanics

## Color Palette

**Light Mode**:
- Primary Brand: 217 91% 60% (Professional blue - trust and reliability)
- Primary Dark: 217 91% 45%
- Background: 0 0% 100%
- Surface: 220 13% 97%
- Border: 220 13% 91%
- Text Primary: 222 47% 11%
- Text Secondary: 215 16% 47%
- Success: 142 76% 36% (job confirmed)
- Warning: 38 92% 50% (payment pending)
- Error: 0 84% 60%

**Dark Mode**:
- Primary Brand: 217 91% 60%
- Primary Dark: 217 91% 70%
- Background: 222 47% 11%
- Surface: 217 33% 17%
- Border: 217 33% 24%
- Text Primary: 210 40% 98%
- Text Secondary: 215 20% 65%

## Typography

**Font Stack**: Inter (Google Fonts) for entire application
- Hero/Display: 48px (3rem), font-weight 700, letter-spacing -0.02em
- H1: 36px (2.25rem), font-weight 700
- H2: 24px (1.5rem), font-weight 600
- H3: 20px (1.25rem), font-weight 600
- Body Large: 16px (1rem), font-weight 400, line-height 1.6
- Body: 14px (0.875rem), font-weight 400, line-height 1.5
- Small/Meta: 12px (0.75rem), font-weight 500

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16  
**Common Patterns**:
- Component padding: p-6 or p-8
- Section spacing: py-16 or py-20
- Card gaps: gap-6
- Form field spacing: space-y-4

**Breakpoints**:
- Mobile: Base (< 768px)
- Tablet: md (768px+)
- Desktop: lg (1024px+)
- Wide: xl (1280px+)

**Container Strategy**:
- Max width: max-w-7xl for main content
- Form containers: max-w-2xl
- Dashboard grids: Full width with inner padding

## Component Library

### Navigation
- **Header**: Sticky top navigation with logo left, main nav center, auth/profile right. Height: h-16. Background blur with border-bottom.
- **Mobile Menu**: Slide-in drawer from right with full-screen overlay

### Hero Section (Landing Page)
- **Layout**: Two-column split - left 60% content, right 40% image
- **Hero Image**: Professional mechanic working on vehicle (modern shop environment, well-lit, tools visible)
- **Height**: min-h-[600px] on desktop
- **Content**: Large headline, 2-sentence value prop, dual CTA buttons (primary "Get Started" + outline "How It Works")

### Job Request Cards
- **Structure**: White/surface background, rounded-lg, border, p-6
- **Header**: Service type badge + timestamp
- **Content**: Job title (font-semibold, text-lg), description preview (2 lines max), location with icon, preferred time slots
- **Footer**: Price estimate (bold, primary color) + action button
- **Hover State**: Subtle border color change, lift shadow

### Dashboard Layout
- **Left Sidebar**: Fixed, w-64, navigation links with icons (Dashboard, Jobs, Schedule, Payments, Settings)
- **Main Content Area**: Responsive grid for job cards (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- **Top Stats Bar**: 4-column grid showing active jobs, pending payments, completed work, total earnings

### Payment Contract Modal
- **Overlay**: Dark backdrop with backdrop-blur-sm
- **Modal**: max-w-2xl, centered, rounded-xl, shadow-2xl
- **Structure**: Header with job details, itemized pricing table, terms checkbox, Stripe Elements integration, dual buttons (Cancel outline + Confirm primary)

### Forms
- **Input Fields**: h-11, rounded-md, border, px-4, focus ring-2 ring-primary
- **Labels**: text-sm font-medium, mb-2
- **Textareas**: min-h-[120px], resize-y
- **Select Dropdowns**: Chevron icon right, same styling as inputs
- **Buttons**: h-11, px-6, rounded-md, font-medium, transition-all

### Status Badges
- **Requested**: Gray background (neutral)
- **Accepted**: Blue background (primary color)
- **Payment Pending**: Amber background (warning color)
- **Confirmed**: Green background (success color)
- **Completed**: Purple background
- All badges: px-3, py-1, rounded-full, text-xs font-semibold

### Appointment Cards (Calendar View)
- **Time-based Grid**: Vertical timeline with 30-minute slots
- **Appointment Block**: Colored left border (status color), rounded-r-lg, p-3, includes client name, service type, location icon + address, duration

## Additional Sections (Landing Page)

### How It Works (3-Step Process)
Grid layout (grid-cols-1 md:grid-cols-3), each step with large number, icon, title, description

### Features Grid
2-column layout (md:grid-cols-2), feature cards with icon, title, benefit statement

### Pricing/Benefits
Side-by-side comparison or single clear pricing card with bullet points

### Trust Indicators
- Customer testimonials (2-column grid with photos)
- Stats section (4-column: jobs completed, mechanics served, average rating, response time)

### Footer
- Multi-column layout: Company info, Quick Links, Legal, Contact
- Newsletter signup form
- Social media icons
- Copyright and trust badges

## Images

**Hero Section**: Large professional image of mechanic using tablet in modern workshop environment. Image should convey professionalism, technology adoption, cleanliness. Positioned on right side of hero (40% width).

**Features/How It Works**: Icon-based graphics, no additional photos needed

**Testimonials**: Square profile photos (96x96px, rounded-full) with mechanic headshots

**Dashboard**: No decorative images - focus on data visualization and clarity

## Animations

Use sparingly:
- Button hover: Subtle scale (hover:scale-105) and shadow increase
- Card hover: Translate up 1px, shadow enhancement
- Modal entry: Fade + scale from 95% to 100%
- Page transitions: None - instant for efficiency

**No scroll animations, parallax, or decorative motion** - professionals value speed and clarity.