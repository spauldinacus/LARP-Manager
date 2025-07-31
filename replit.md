# Full-Stack TypeScript Application

## Overview

This is a modern full-stack web application built with React frontend and Express.js backend using TypeScript. The application appears to be a character management system for a LARP (Live Action Role Playing) game, featuring character creation, experience tracking, and event management with admin capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

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
- **users**: User profiles with admin flags and authentication data
- **characters**: Player characters with heritage, culture, archetype, and game statistics
- **experienceEntries**: Experience point tracking with reasons and event associations
- **events**: LARP events that can award experience to characters
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

### Experience Tracking
- **XP Awards**: Bulk experience assignment to multiple characters
- **Event Integration**: Link experience awards to specific LARP events
- **Audit Trail**: Complete history of experience awards with reasons
- **Admin Controls**: Admin-only experience management features

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