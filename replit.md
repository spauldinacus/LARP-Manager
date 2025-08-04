# Full-Stack TypeScript Application

## Overview
This is a modern full-stack web application for a LARP (Live Action Role Playing) character management system. Its main purpose is to facilitate character creation, experience tracking, and event management, including robust admin capabilities. The project aims to provide a comprehensive tool for LARP communities, streamlining character progression and event organization with a focus on adherence to the Thrune rulebook.

## Recent Changes (January 2025)
- **XP System Overhaul**: Consolidated all XP cost calculations into a single source of truth in `shared/schema.ts`
- **Fixed Heritage Base Values**: Corrected ar-nura body from 10 to 8, ensuring consistency with Thrune rulebook
- **Centralized Calculations**: All components now use unified `getAttributeCost()` and `HERITAGE_BASES` constants
- **Database Consistency**: Rebuilt all character XP tracking to eliminate discrepancies between character lists and sheets
- **Character Creation Fix**: Resolved frontend errors and ensured proper attribute cost tracking during character creation
- **Dual Archetype System**: Added complete second archetype purchase functionality for 50 XP with priority-based skill costs
- **Experience History Fix**: Corrected skill purchase tracking in experience history - now properly records all skill purchases during character creation
- **Chapters Access Enhancement**: Made chapters page viewable by all users with member counts and clickable member lists, while keeping editing admin-only
- **Auto-RSVP Feature**: When admins award event-related experience to characters, the system automatically creates/updates RSVPs marking characters as attended
- **RSVP Migration Fix**: Fixed historical data where characters previously marked as attended by admin were missing RSVP records
- **Sidebar Navigation Update**: Added chapters page to left sidebar menu for all authenticated users
- **Deployment Health Check Fix**: Added comprehensive health check endpoints and proper server configuration for reliable deployment verification
- **Database Schema Fix**: Restored missing user title field and resolved database query errors affecting characters and players pages
- **Chapter Members Title Fix**: Added missing title field to chapter members API query, restoring title badges in member lists
- **Comprehensive Candle Management System**: Created admin-only candle management functionality with player listing, transaction history, add/remove capabilities, and alphabetical sorting by player name
- **Unified Candle Management UX**: Improved user experience to show transaction history first, then add/remove buttons; created reusable modal component used across both Users and Candles pages
- **Integrated Role-Based Admin System**: Unified the role system with admin permissions - when users are assigned "Admin" or "Super Admin" roles, their `is_admin` field is automatically set to true, granting full admin access throughout the application
- **Chapter Visibility Control**: Inactive chapters are now hidden from regular users but remain visible to admins for management purposes
- **Complete Character Display Format**: Fixed character displays to show full "Heritage Culture Archetype" format instead of abbreviated "Heritage Archetype" (e.g., "Stoneborn Akhunrasi Tinker" instead of "Stoneborn Tinker")
- **Username Field Removal**: Completely removed username field from all frontend components, replacing with playerName in dashboard, sidebar, and mobile navigation to prevent charAt errors
- **Dynamic Game Data Management System**: Created comprehensive admin-only system for managing heritages, cultures, archetypes, and skills with proper database tables, API endpoints, and tabbed UI interface
- **Game Data Population**: Migrated all existing character creation data (5 heritages, 15 cultures, 28 archetypes, 30+ skills) from constants to dynamic database tables with full CRUD operations
- **Game Data Page Layout Fix**: Resolved sidebar disappearing issue by implementing proper layout structure with mobile navigation support and SelectItem value validation
- **Dynamic XP Recalculation System**: Implemented comprehensive XP cost updates when game data changes - when admins modify heritage secondary skills, archetype primary/secondary skills, the system automatically recalculates all character XP costs and updates experience history entries to reflect new costs (5 XP primary archetype, 10 XP secondary archetype/heritage, 20 XP default)
- **Experience History Cost Updates**: Fixed XP recalculation to properly update individual experience entries in character history when skill costs change, ensuring accurate tracking and display of XP expenditures based on current game data relationships
- **Character Data Migration**: Updated all characters to use proper UUID references to dynamic heritage/archetype tables instead of legacy string values, enabling full integration with the dynamic game data system
- **Complete Vercel Serverless Migration**: Successfully migrated from monolithic Express.js server to Vercel serverless functions using Neon HTTP driver, iron-session encrypted cookies, and preserved 100% frontend compatibility with zero code changes required
- **Serverless Schema Compatibility Fix**: Converted TypeScript schema to JavaScript ES modules (shared/schema.js) to resolve import issues in serverless functions, enabling proper database operations in the serverless environment

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom design tokens and dark theme support
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Session Management**: PostgreSQL-backed sessions using `connect-pg-simple`
- **Authentication**: Session-based authentication with admin role system

### Database Design
The application uses PostgreSQL with Drizzle ORM and includes these main entities:
- **users**: User profiles with authentication data and chapter associations.
- **chapters**: LARP chapters with player number generation capabilities.
- **characters**: Player characters with heritage, culture, archetype, game statistics, and total XP spent tracking.
- **events**: LARP events with RSVP functionality and attendance tracking.
- **eventRsvps**: Event RSVP system with XP purchase tracking (max 2 XP, max 2 XP candles).
- **experienceEntries**: Experience point tracking with reasons, event associations, and RSVP links.
- **systemSettings**: Application configuration storage.

### Key Features and Implementations
- **Authentication System**: Session-based authentication using PostgreSQL for session storage, role-based access (admin flag system), Bcrypt for password hashing, and secure session configuration. Includes complete login/registration flow.
- **Character Management System**: Multi-step character creation form adhering to Thrune LARP rulebook specifications (pages 19-39), including heritage-specific values, culture restrictions, benefits, weaknesses, and costume requirements. Features detailed character sheets with experience history and active/inactive status management.
- **Experience Tracking & Event RSVP System**: Real-time calculation of total experience points spent on skills and attributes. Players can RSVP to events with their characters and purchase additional XP/XP candles (limited to 2 each per event). Base 3 XP awarded for event attendance plus purchased XP. Includes audit trail of experience awards and admin controls for experience management and attendance marking.
- **UI/UX Design**: Utilizes a comprehensive shadcn/ui component library, responsive design with a mobile-first approach, built-in dark mode, and accessibility ensured by Radix UI primitives.

### Architectural Decisions
- **Drizzle ORM**: Chosen for type safety, SQL-like syntax, and excellent TypeScript integration.
- **Session-based Auth**: Provides enhanced security for server-rendered applications and simplified logout handling.
- **TanStack React Query**: Offers powerful caching, background updates, and optimistic updates for server state management.
- **Radix UI**: Ensures accessibility compliance and provides unstyled, customizable primitives.
- **Tailwind CSS**: Enables rapid UI development with consistent design tokens and effective tree-shaking.

## External Dependencies

### Production Dependencies
- **Database**: Neon PostgreSQL serverless database
- **UI Components**: Radix UI primitives
- **Validation**: Zod
- **Authentication**: bcrypt
- **Session Storage**: `connect-pg-simple`

### Development Tools
- **TypeScript**
- **Vite**
- **ESBuild**
- **Replit Integration**