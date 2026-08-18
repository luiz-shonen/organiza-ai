# Graph Report - organizaai  (2026-08-17)

## Corpus Check
- Corpus is ~27,478 words - fits in a single context window. You may not need a graph.

## Summary
- 470 nodes · 688 edges · 25 communities (21 shown, 4 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Root Application Component & Tests
- Angular Workspace Configuration
- Firestore Models & Data Types
- Guest Service & Address Lookup
- Package Dependencies & Dev Tools
- Event Detail Presentational Components
- Angular Core & Material Libraries
- Event Management Service & Containers
- Architecture Rules & Design Specs
- Routing & Authentication Guard
- App Shell & Admin Drawer Templates
- Guest Session Storage Service
- Event Detail View Templates
- User Profile & Theme Models
- Branding Icons & Favicons
- Event Editor View Templates
- Theme Switching Service
- Browser Notification Service
- Festa Junina Seasonal Assets
- Service Worker PWA Configuration
- Christmas Seasonal Theme Assets
- Easter Seasonal Theme Assets
- Admin Login View Templates
- Production Environment Configuration
- UI Styling Design Specifications

## God Nodes (most connected - your core abstractions)
1. `AuthService` - 23 edges
2. `PartyEvent` - 18 edges
3. `EventService` - 13 edges
4. `DashboardContainer` - 13 edges
5. `SeasonalThemeService` - 12 edges
6. `PartyItem` - 11 edges
7. `GuestService` - 11 edges
8. `ItemService` - 11 edges
9. `GuestSessionService` - 10 edges
10. `ThemeService` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Claude Agent Guidelines` --semantically_similar_to--> `Organiza AI Agent Guidelines`  [INFERRED] [semantically similar]
  .claude/CLAUDE.md → AGENTS.md
- `Gemini Agent Guidelines` --semantically_similar_to--> `Root Gemini Guidelines`  [INFERRED] [semantically similar]
  .gemini/GEMINI.md → GEMINI.MD
- `Vibrant Celebration Design Theme` --semantically_similar_to--> `Vibrant Celebration Theme & Tokens`  [INFERRED] [semantically similar]
  DESIGN.md → docs/specs/DESIGN.md
- `Glassmorphism & Vibrant Modernism Aesthetic` --semantically_similar_to--> `Glassmorphism & Depth Layering`  [INFERRED] [semantically similar]
  DESIGN.md → docs/specs/DESIGN.md
- `Root Gemini Guidelines` --references--> `Design System Specification`  [EXTRACTED]
  GEMINI.MD → docs/specs/DESIGN.md

## Import Cycles
- 4-file cycle: `src/app/core/models/index.ts -> src/app/core/models/user.model.ts -> src/app/core/services/theme.service.ts -> src/app/core/services/user.service.ts -> src/app/core/models/index.ts`

## Hyperedges (group relationships)
- **Agent Architecture & Coding Guidelines** — _claude_claude_agent_guidelines, _gemini_gemini_agent_guidelines, agents_agent_guidelines, gemini_root_guidelines, docs_specs_03_agent_rules_agent_coding_rules [INFERRED 0.95]
- **Vibrant Modernism & Glassmorphism Design System** — design_vibrant_celebration_theme, design_glassmorphism_aesthetic, docs_specs_design_design_system, docs_specs_design_glassmorphism_elevation [INFERRED 0.95]
- **Collaborative Event Management & RBAC Data Flow** — docs_specs_01_product_requirements_prd, docs_specs_01_product_requirements_user_personas, docs_specs_02_project_context_rbac_session_management, docs_specs_02_project_context_firestore_data_model [INFERRED 0.85]

## Communities (25 total, 4 thin omitted)

### Community 0 - "Root Application Component & Tests"
Cohesion: 0.06
Nodes (19): App, Component, ConfettiService, Injectable, AppDrawerType, DrawerService, Injectable, HeaderService (+11 more)

### Community 1 - "Angular Workspace Configuration"
Cohesion: 0.05
Nodes (42): build, serve, test, builder, configurations, defaultConfiguration, options, packageManager (+34 more)

### Community 2 - "Firestore Models & Data Types"
Cohesion: 0.09
Nodes (17): AddressDetails, PartyEventCreate, PartyEventUpdate, ClaimedBy, PartyItem, PartyItemCreate, SeasonalThemeConfig, SeasonalThemeId (+9 more)

### Community 3 - "Guest Service & Address Lookup"
Cohesion: 0.07
Nodes (14): allowedCommonJsDependencies, qrcode, Guest, GuestCreate, ViaCepResponse, GuestService, Injectable, LocationService (+6 more)

### Community 4 - "Package Dependencies & Dev Tools"
Cohesion: 0.06
Nodes (31): @angular/build, @angular/compiler-cli, canvas-confetti, jsdom, devDependencies, @angular/build, @angular/cli, @angular/compiler-cli (+23 more)

### Community 5 - "Event Detail Presentational Components"
Cohesion: 0.08
Nodes (15): EventCardComponent, Component, ItemListCardComponent, Component, Output, PixCardComponent, Component, RsvpFormComponent (+7 more)

### Community 6 - "Angular Core & Material Libraries"
Cohesion: 0.07
Nodes (29): @angular/animations, @angular/cdk, @angular/common, @angular/compiler, @angular/core, @angular/forms, @angular/material, @angular/platform-browser (+21 more)

### Community 7 - "Event Management Service & Containers"
Cohesion: 0.10
Nodes (9): PartyEvent, EventService, Injectable, DashboardContainer, Component, EventInfoCardComponent, Component, HomeContainer (+1 more)

### Community 8 - "Architecture Rules & Design Specs"
Cohesion: 0.08
Nodes (28): Claude Agent Guidelines, Gemini Agent Guidelines, Organiza AI Agent Guidelines, Glassmorphism & Vibrant Modernism Aesthetic, Vibrant Celebration Design Theme, Admin Event Management Module, Cross-Cutting Features (Theme & Skeletons), Guest RSVP & Item Claiming Module (+20 more)

### Community 9 - "Routing & Authentication Guard"
Cohesion: 0.11
Nodes (7): appConfig, routes, authGuard(), AuthService, Injectable, LoginContainer, Component

### Community 10 - "App Shell & Admin Drawer Templates"
Cohesion: 0.08
Nodes (25): App Sidenav Drawer, App Main Toolbar, Offline Status Banner, App Root Layout Template, Toolbar User Profile Menu, Add Administrator Form, Admin Management Drawer Template, Administrators List Section (+17 more)

### Community 11 - "Guest Session Storage Service"
Cohesion: 0.14
Nodes (9): GuestSession, GuestSessionService, Injectable, GuestFormDialogComponent, GuestFormDialogData, GuestFormDialogResult, Component, RsvpCardComponent (+1 more)

### Community 12 - "Event Detail View Templates"
Cohesion: 0.12
Nodes (17): Event Date and Location Badges, Event Card Presentational Component Template, Event Hero Image and Title, Event Info Card Component Template, Guest Form Dialog Component Template, Collaborative Item List Card Template, Claimable Item Row Component, Item List Component Template (+9 more)

### Community 13 - "User Profile & Theme Models"
Cohesion: 0.40
Nodes (4): UserProfile, ThemeMode, Injectable, UserService

### Community 14 - "Branding Icons & Favicons"
Cohesion: 0.25
Nodes (9): Android Chrome Icon 192x192, Android Chrome Icon 512x512, Apple Touch Icon, Organiza AI Brand and Icon Assets, Favicon 16x16 PNG, Favicon 32x32 PNG, Favicon SVG, Organiza AI Brand Logo SVG (+1 more)

### Community 15 - "Event Editor View Templates"
Cohesion: 0.22
Nodes (9): Event QR Code Canvas Element, Share Panel Template, Event Address ViaCep Step, Event Basic Information Step, Event Editor View Template, Event Guest List & Export Section, Event Items Manager Section, Event Pix Payment Step (+1 more)

### Community 18 - "Festa Junina Seasonal Assets"
Cohesion: 0.60
Nodes (5): Festa Junina Bonfire Graphic, Festa Junina Fireworks Graphic, Festa Junina Garland Graphic, Festa Junina Lantern Graphic, Festa Junina Seasonal Theme Assets

### Community 19 - "Service Worker PWA Configuration"
Cohesion: 0.50
Nodes (3): assetGroups, index, $schema

### Community 20 - "Christmas Seasonal Theme Assets"
Cohesion: 0.67
Nodes (4): Christmas Star of Bethlehem Graphic, Christmas Snowflake Graphic, Christmas Star Graphic, Christmas (Natal) Seasonal Theme Assets

### Community 21 - "Easter Seasonal Theme Assets"
Cohesion: 1.00
Nodes (3): Easter Cross Graphic, Easter Rays Graphic, Easter (Páscoa) Seasonal Theme Assets

### Community 22 - "Admin Login View Templates"
Cohesion: 0.67
Nodes (3): Google OAuth Sign-In Button, Email & Password Authentication Form, Admin Login View Template

## Knowledge Gaps
- **122 isolated node(s):** `$schema`, `version`, `packageManager`, `newProjectRoot`, `projectType` (+117 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `options` connect `Angular Workspace Configuration` to `Guest Service & Address Lookup`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Why does `allowedCommonJsDependencies` connect `Guest Service & Address Lookup` to `Angular Workspace Configuration`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **What connects `$schema`, `version`, `packageManager` to the rest of the system?**
  _122 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Root Application Component & Tests` be split into smaller, more focused modules?**
  _Cohesion score 0.05959183673469388 - nodes in this community are weakly interconnected._
- **Should `Angular Workspace Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.048726467331118496 - nodes in this community are weakly interconnected._
- **Should `Firestore Models & Data Types` be split into smaller, more focused modules?**
  _Cohesion score 0.08943089430894309 - nodes in this community are weakly interconnected._
- **Should `Guest Service & Address Lookup` be split into smaller, more focused modules?**
  _Cohesion score 0.06827880512091039 - nodes in this community are weakly interconnected._