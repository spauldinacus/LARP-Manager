# Full-Stack TypeScript Application

## Overview

This is a modern full-stack web application built with React frontend and Express.js backend using TypeScript. The application appears to be a character management system for a LARP (Live Action Role Playing) game, featuring character creation, experience tracking, and event management with admin capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### January 31, 2025
- **CRITICAL FIX: Events attended tracking now shows actual attendance**
  - Fixed XP progression page to track only events marked as attended by admins, not just RSVPs
  - Added new `getAttendedEventsCount` storage method to count only `attended = true` events
  - Updated API endpoint to return both attendance XP and actual events attended count
  - Events attended counter now displays accurate progression data based on real attendance
- **FIXED: User settings save functionality restored**
  - Fixed authentication hook to properly expose refetch function for settings updates
  - User settings (player name, chapter assignment) now save successfully
  - Authentication context properly updates after settings changes
- **DEPLOYMENT: Updated session configuration for Replit compatibility**
  - Set secure: false for Replit deployments (no internal HTTPS)
  - Added sameSite: 'lax' for better cookie compatibility
  - Session authentication now works properly in Replit deployment environment
- **CRITICAL FIX: Admin RSVP XP purchase updates now sync to character sheets**
  - Fixed React Query cache invalidation to refresh character data when admin modifies RSVP XP purchases
  - Experience entries and character totals now update immediately across all UI components
  - Character sheet modals now reflect real-time changes from admin RSVP modifications
- **Enhanced dashboard with player candle display**
  - Added prominent candle balance card visible to all players on dashboard
  - Styled with orange gradient theme and flame icon
  - Includes helpful explanation about using candles for XP purchases during events
- **MAJOR UPDATE: Removed character levels system and implemented total XP spent tracking**
  - Removed level field from character database schema
  - Added totalXpSpent field to track cumulative experience point expenditure
  - Updated character sheets to display "XP Spent" instead of "Level"
  - Implemented automatic XP spent calculation based on skill purchases and attribute increases
- **NEW: Event RSVP system with XP purchase options**
  - Created event_rsvps table with XP purchase tracking
  - Added RSVP functionality with limits: max 2 XP purchases, max 2 XP candle purchases
  - Implemented automatic XP awarding based on event attendance (3 base XP + purchased XP)
  - Created comprehensive RSVP management API endpoints
  - Built event RSVP UI with character selection and XP purchase options
- **Streamlined experience management**
  - Removed standalone experience page and manual XP grant functionality
  - Experience is now exclusively managed through events and RSVP purchases
  - Updated navigation to remove experience page link
  - Cleaned up dashboard quick actions to focus on event-based XP management
  - Updated all character displays to show "XP Spent" instead of "Level"
  - XP Spent calculation includes initial 25 XP plus all experience point expenditures
- **Enhanced dashboard statistics**
  - Replaced static percentages with dynamic real-time calculations
  - Added historical data comparison for growth tracking
  - Implemented actual next event countdown with event names
  - All dashboard metrics now reflect authentic data from the database
- **Enhanced character display formatting**
  - Capitalized first letter only of heritage, culture, and archetype names across all pages
  - Converted kebab-case with first letter capitalization (e.g., "ar-nura" → "Ar nura")
  - Applied consistent formatting to character cards, sheets, modals, and admin views
- **Enhanced chapter management system**
  - Added complete chapter management with database schema and API endpoints
  - Implemented player number generation system (format: FL25070001 - chapter code + year + month + sequence)
  - Created admin chapter management interface with create, edit, deactivate functions
  - Integrated chapters into navigation sidebar
- **Fixed navigation layout issues**
  - Applied consistent sidebar layout across all pages
  - Fixed sidebar disappearing when navigating to chapters or events pages
  - Added mobile navigation support for all sections
- **Fixed user management character editing**
  - Connected Edit button in user characters modal to open character sheet modal
  - Added CharacterSheetModal import and integration to user management screen
  - Edit functionality now opens the same character sheet interface as the main characters page
- **Previous updates:**
  - Fixed character creation system to match Thrune LARP rulebook specifications (pages 19-39)
  - Corrected heritage body/stamina values: Ar-Nura (8/12), Human (10/10), Stoneborn (15/5), Ughol (12/8), Rystarri (12/8)
  - Implemented heritage-specific culture restrictions as per rulebook
  - Added official heritage benefits, weaknesses, and costume requirements from rulebook
  - Set starting experience to 25 XP for all new characters with skill purchase system
  - Enhanced admin functionality with user character management modal

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: Radix UI components with shadcn/ui design system for consistent, accessible components
- **Styling**: Tailwind CSS with custom design tokens and dark theme support
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Framework**: Express.js with TypeScript for type safety
- **Runtime**: Node.js with ES modules
- **Database**: PostgreSQL with Neon serverless connection for scalable cloud database
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **Authentication**: Session-based authentication with admin role system

### Database Design
The application uses PostgreSQL with Drizzle ORM and includes these main entities:
- **users**: User profiles with admin flags, authentication data, and chapter associations
- **chapters**: LARP chapters with player number generation capabilities
- **characters**: Player characters with heritage, culture, archetype, game statistics, and total XP spent tracking
- **events**: LARP events with RSVP functionality and attendance tracking
- **eventRsvps**: Event RSVP system with XP purchase tracking (max 2 XP, max 2 XP candles)
- **experienceEntries**: Experience point tracking with reasons, event associations, and RSVP links
- **systemSettings**: Application configuration storage

## Key Components

### Authentication System
- **Session-based Authentication**: Uses PostgreSQL for session storage with express-session
- **Role-based Access**: Admin flag system for privileged operations
- **Security**: Bcrypt for password hashing, secure session configuration
- **Login/Registration**: Complete auth flow with form validation

### Character Management System
- **Character Creation**: Multi-step form with heritage, culture, and archetype selection
- **Game Rules Integration**: Implements official Thrune LARP ruleset with accurate stats
- **Character Sheets**: Detailed character views with experience history
- **Status Management**: Active/inactive character states

### Experience Tracking & Event RSVP System
- **XP Spent Tracking**: Real-time calculation of total experience points spent on skills and attributes
- **Event RSVP**: Players can RSVP to events with their characters and purchase additional XP
- **XP Purchase Limits**: Maximum 2 XP purchases and 2 XP candle purchases per event
- **Automatic XP Awards**: Base 3 XP for event attendance plus purchased XP automatically awarded
- **Event Integration**: Complete RSVP and attendance tracking linked to experience awards
- **Audit Trail**: Complete history of experience awards with reasons and RSVP associations
- **Admin Controls**: Admin-only experience management and attendance marking features

### UI/UX Design
- **Design System**: Comprehensive shadcn/ui component library
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Dark Theme**: Built-in dark mode with CSS custom properties
- **Accessibility**: Radix UI primitives ensure WCAG compliance

## Data Flow

1. **Client Requests**: React components use TanStack React Query for data fetching
2. **API Layer**: Express.js routes handle HTTP requests with validation
3. **Business Logic**: Server-side logic processes requests and enforces rules
4. **Database Operations**: Drizzle ORM manages type-safe database interactions
5. **Response Handling**: Structured JSON responses with error handling
6. **State Management**: React Query caches and synchronizes server state

## External Dependencies

### Production Dependencies
- **Database**: Neon PostgreSQL serverless database
- **UI Components**: Radix UI primitives for accessible components
- **Validation**: Zod for runtime type validation
- **Authentication**: bcrypt for password hashing
- **Session Storage**: connect-pg-simple for PostgreSQL session store

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **Vite**: Fast development server and optimized builds
- **ESBuild**: Fast TypeScript compilation for production
- **Replit Integration**: Special plugins for Replit development environment

## Deployment Strategy

### Development
- **Hot Reloading**: Vite provides instant feedback during development
- **Type Checking**: TSX for TypeScript execution in development
- **Database Migrations**: Drizzle Kit for schema management

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: ESBuild bundles server code into single file
- **Database**: Drizzle migrations ensure schema consistency
- **Environment**: NODE_ENV-based configuration switching

### Architecture Decisions

**Why Drizzle ORM**: Chosen for type safety, SQL-like syntax, and excellent TypeScript integration over alternatives like Prisma or raw SQL.

**Why Session-based Auth**: Provides better security for server-rendered applications and simpler logout handling compared to JWT tokens.

**Why TanStack React Query**: Offers powerful caching, background updates, and optimistic updates compared to basic fetch or SWR.

**Why Radix UI**: Ensures accessibility compliance and provides unstyled, customizable primitives compared to fully-styled libraries.

**Why Tailwind CSS**: Enables rapid UI development with consistent design tokens and excellent tree-shaking compared to CSS-in-JS solutions.