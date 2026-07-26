---
name: LifeLine
colors:
  surface: '#fff8f7'
  surface-dim: '#f1d3d0'
  surface-bright: '#fff8f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff0ee'
  surface-container: '#ffe9e6'
  surface-container-high: '#ffe2de'
  surface-container-highest: '#f9dcd8'
  on-surface: '#271816'
  on-surface-variant: '#5b403d'
  inverse-surface: '#3e2c2a'
  inverse-on-surface: '#ffedea'
  outline: '#8f6f6c'
  outline-variant: '#e4beb9'
  surface-tint: '#b91c1c'
  primary: '#93000b'
  on-primary: '#ffffff'
  primary-container: '#b91c1c'
  on-primary-container: '#ffcdc7'
  inverse-primary: '#ffb4ab'
  secondary: '#455f87'
  on-secondary: '#ffffff'
  secondary-container: '#b5d0fd'
  on-secondary-container: '#3e5980'
  tertiary: '#00497f'
  on-tertiary: '#ffffff'
  tertiary-container: '#0061a6'
  on-tertiary-container: '#c1dbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb4ab'
  on-primary-fixed: '#410002'
  on-primary-fixed-variant: '#93000b'
  secondary-fixed: '#d5e3ff'
  secondary-fixed-dim: '#adc8f5'
  on-secondary-fixed: '#001c3b'
  on-secondary-fixed-variant: '#2d486d'
  tertiary-fixed: '#d2e4ff'
  tertiary-fixed-dim: '#a0caff'
  on-tertiary-fixed: '#001c37'
  on-tertiary-fixed-variant: '#00497e'
  background: '#fff8f7'
  on-background: '#271816'
  surface-variant: '#f9dcd8'
  primary-dark: '#7F1D1D'
  primary-light: '#FEE2E2'
  secondary-dark: '#152A43'
  secondary-light: '#D6E4F0'
  success: '#16A34A'
  warning: '#F59E0B'
  danger: '#EF4444'
  info: '#3B82F6'
  neutral-50: '#F8F9FA'
  neutral-100: '#F1F3F5'
  neutral-200: '#DEE2E6'
  neutral-300: '#CED4DA'
  neutral-500: '#6C757D'
  neutral-700: '#343A40'
  neutral-900: '#121212'
  dark-bg: '#1A1A2E'
  dark-surface: '#16213E'
  dark-surface-alt: '#0F3460'
  dark-border: '#2C2C44'
  dark-text-primary: '#EAEAEA'
  dark-text-muted: '#8E8EA0'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
  h1:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.3'
  h2:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: '1.3'
  h3:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.4'
  body:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
  button:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.0'
  code:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  h1-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  gutter-desktop: 24px
  margin-mobile: 16px
---

# LifeLine — UI Design System
> **Document:** Design System & Style Guide  
> **Project:** LifeLine — Blood Donation Platform  
> **Team:** Sanguine (Group 05)  
> **Version:** 1.0 | **Date:** 25/06/2026  
> **Purpose:** Single source of truth for all UI prototyping in Stitch. Import this file into Stitch before generating any screen to ensure visual consistency across independently built modules.

---

## 1. Brand Identity

### 1.1 App Name & Tagline
- **Name:** LifeLine
- **Tagline:** "Kết nối giọt máu — Cứu sống sinh mạng" / "Connecting every drop — Saving every life"

### 1.2 Logo Concept
- A stylized blood drop merged with a heartbeat (ECG) line
- Primary color: Blood Crimson `#B91C1C`
- Use rounded/soft shapes to convey warmth and trust

### 1.3 Brand Personality
- **Trustworthy** — Medical-grade reliability
- **Warm** — Human-centered, approachable
- **Modern** — Clean, minimal, tech-forward
- **Urgent** — Capable of conveying emergency with clarity

---

## 2. Color Palette

### 2.1 Primary Colors
| Token             | Hex       | Usage                                      |
|:------------------|:----------|:-------------------------------------------|
| `--primary`       | `#B91C1C` | Primary CTA buttons, active nav, key icons |
| `--primary-dark`  | `#7F1D1D` | Hover states, pressed buttons              |
| `--primary-light` | `#FEE2E2` | Subtle backgrounds, badges, highlights     |

### 2.2 Secondary Colors
| Token               | Hex       | Usage                                  |
|:---------------------|:----------|:---------------------------------------|
| `--secondary`        | `#1E3A5F` | Links, info badges, secondary actions  |
| `--secondary-dark`   | `#152A43` | Hover states for secondary elements    |
| `--secondary-light`  | `#D6E4F0` | Info banners, selection highlights     |

### 2.3 Semantic Colors
| Token        | Hex       | Usage                              |
|:-------------|:----------|:-----------------------------------|
| `--success`  | `#16A34A` | Success toasts, completed status   |
| `--warning`  | `#F59E0B` | Warnings, pending states           |
| `--danger`   | `#EF4444` | Errors, delete actions, SOS alerts |
| `--info`     | `#3B82F6` | Informational messages             |

### 2.4 Neutral Colors
| Token            | Hex       | Usage                            |
|:-----------------|:----------|:---------------------------------|
| `--neutral-50`   | `#F8F9FA` | Page background (light mode)     |
| `--neutral-100`  | `#F1F3F5` | Card backgrounds, input fields   |
| `--neutral-200`  | `#DEE2E6` | Borders, dividers                |
| `--neutral-300`  | `#CED4DA` | Disabled state, placeholder text |
| `--neutral-500`  | `#6C757D` | Secondary text, labels           |
| `--neutral-700`  | `#343A40` | Body text                        |
| `--neutral-900`  | `#121212` | Headings, primary text           |

### 2.5 Dark Mode & Sidebar Theme
| Token                 | Hex       | Usage                              |
|:----------------------|:----------|:-----------------------------------|
| `--dark-bg`           | `#1A1A2E` | Page background, sidebar base      |
| `--dark-surface`      | `#16213E` | Card / panel surfaces, sidebar items |
| `--dark-surface-alt`  | `#0F3460` | Sidebar hover / active item bg     |
| `--dark-border`       | `#2C2C44` | Borders, sidebar dividers          |
| `--dark-text-primary` | `#EAEAEA` | Primary text on dark surfaces      |
| `--dark-text-muted`   | `#8E8EA0` | Secondary text, inactive nav items |

---

## 3. Typography

### 3.1 Font Family
- **Primary:** `Inter` (Google Fonts) — for all UI text
- **Monospace:** `JetBrains Mono` — for codes, IDs, QR data

### 3.2 Type Scale
| Role           | Size   | Weight     | Line Height | Usage                            |
|:---------------|:-------|:-----------|:------------|:---------------------------------|
| Display        | 36px   | Bold (700) | 1.2         | Hero sections, landing           |
| H1             | 28px   | Bold (700) | 1.3         | Page titles                      |
| H2             | 22px   | SemiBold (600) | 1.3     | Section headings                 |
| H3             | 18px   | SemiBold (600) | 1.4     | Card titles, sub-section heads   |
| Body           | 16px   | Regular (400) | 1.5      | Paragraphs, descriptions         |
| Body Small     | 14px   | Regular (400) | 1.5      | Table cells, meta text           |
| Caption        | 12px   | Medium (500)  | 1.4      | Labels, timestamps, helper text  |
| Button         | 14px   | SemiBold (600) | 1.0     | All button labels                |

---

## 4. Spacing & Grid

### 4.1 Spacing Scale (Base: 4px)
| Token    | Value |
|:---------|:------|
| `--sp-1` | 4px   |
| `--sp-2` | 8px   |
| `--sp-3` | 12px  |
| `--sp-4` | 16px  |
| `--sp-5` | 20px  |
| `--sp-6` | 24px  |
| `--sp-8` | 32px  |
| `--sp-10`| 40px  |
| `--sp-12`| 48px  |
| `--sp-16`| 64px  |

### 4.2 Layout Grid
- **Desktop:** 12-column grid, 1200px max-width, 24px gutter
- **Tablet:** 8-column grid, 768px breakpoint
- **Mobile:** 4-column grid, 375px min-width, 16px gutter

---

## 5. Component Library

### 5.1 Buttons

| Variant    | Background       | Text Color    | Border         | Radius | Height |
|:-----------|:-----------------|:--------------|:---------------|:-------|:-------|
| Primary    | `--primary`      | `#FFFFFF`     | none           | 8px    | 44px   |
| Secondary  | transparent      | `--primary`   | 1px `--primary`| 8px    | 44px   |
| Ghost      | transparent      | `--neutral-700`| none          | 8px    | 44px   |
| Danger     | `--danger`       | `#FFFFFF`     | none           | 8px    | 44px   |
| Disabled   | `--neutral-200`  | `--neutral-300`| none          | 8px    | 44px   |

- **Hover:** darken background 10%, scale `1.02`, transition `0.2s ease`
- **Active:** darken 15%, scale `0.98`
- **Icon buttons:** 40×40px, centered icon, same radius

### 5.2 Input Fields

- **Height:** 44px
- **Border:** 1px solid `--neutral-200`
- **Border Radius:** 8px
- **Focus:** border color `--primary`, box-shadow `0 0 0 3px rgba(185,28,28,0.15)`
- **Error:** border color `--danger`, helper text in `--danger`
- **Label:** Caption style, `--neutral-500`, placed above input
- **Placeholder:** `--neutral-300`, italic

### 5.3 Cards

- **Background:** `#FFFFFF` (light) / `--dark-surface` (dark)
- **Border Radius:** 12px
- **Shadow:** `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)`
- **Hover shadow:** `0 4px 12px rgba(0,0,0,0.12)`
- **Padding:** 24px
- **Transition:** `box-shadow 0.2s ease, transform 0.2s ease`

### 5.4 Tables (Staff/Admin Panels)

- **Header:** `--neutral-100` background, `--neutral-700` text, SemiBold
- **Rows:** alternate `#FFFFFF` / `--neutral-50`
- **Hover row:** `--primary-light` background
- **Cell padding:** 12px 16px
- **Border:** 1px solid `--neutral-200` between rows

### 5.5 Badges & Status Chips

| Status      | Background       | Text Color     | Example Uses               |
|:------------|:-----------------|:---------------|:---------------------------|
| Active      | `#DCFCE7`        | `#166534`      | Account active, campaign live |
| Suspended   | `#FEE2E2`        | `#991B1B`      | Account suspended          |
| Pending     | `#FEF3C7`        | `#92400E`      | Verification pending       |
| Completed   | `#DBEAFE`        | `#1E40AF`      | Donation completed         |
| Emergency   | `#EF4444`        | `#FFFFFF`      | SOS alert badge            |

- **Border Radius:** 9999px (pill shape)
- **Padding:** 4px 12px
- **Font:** Caption size, Medium weight

### 5.6 Navigation

#### Sidebar (Staff & Admin Dashboards)
- **Width:** 260px (expanded), 72px (collapsed)
- **Background:** `--dark-bg` (`#1A1A2E`)
- **Active item:** left border 3px `--primary`, background `--dark-surface-alt`, text `#FFFFFF`
- **Inactive item:** text `--dark-text-muted` (`#8E8EA0`)
- **Hover item:** background `--dark-surface` (`#16213E`), text `--dark-text-primary`
- **Icon size:** 20px
- **Item height:** 44px
- **Section dividers:** 1px `--dark-border` (`#2C2C44`)

#### Top Navigation (Donor App)
- **Height:** 64px
- **Background:** `#FFFFFF` with bottom border `--neutral-200`
- **Logo:** left-aligned
- **Nav items:** center, Body Small, `--neutral-700`
- **Active item:** `--primary` text, bottom border 2px `--primary`
- **Profile avatar:** 36px circle, right-aligned

#### Mobile Bottom Tab Bar
- **Height:** 56px + safe area
- **Background:** `#FFFFFF`
- **Active tab:** `--primary` icon + label
- **Inactive tab:** `--neutral-300` icon, `--neutral-500` label
- **Icon size:** 24px

### 5.7 Modals & Dialogs

- **Overlay:** `rgba(0, 0, 0, 0.5)`
- **Container:** white, border-radius 16px, max-width 480px
- **Padding:** 32px
- **Close button:** top-right, X icon
- **Animation:** fade-in + slide-up, 0.25s

### 5.8 Toast Notifications

- **Position:** top-right, 24px from edges
- **Border Radius:** 8px
- **Shadow:** `0 4px 12px rgba(0,0,0,0.15)`
- **Left border:** 4px colored by semantic type (success/warning/danger/info)
- **Auto dismiss:** 4 seconds
- **Animation:** slide-in from right

---

## 6. Iconography

- **Style:** Outlined, consistent 1.5px stroke
- **Recommended Library:** Lucide Icons or Heroicons (Outline variant)
- **Sizes:** 16px (inline), 20px (nav/buttons), 24px (feature icons), 32px (empty states)
- **Color:** inherit from parent text color

---

## 7. Illustrations & Imagery

- **Style:** Flat/semi-flat vector illustrations with warm tones
- **Empty states:** Use illustration + message + CTA button
- **Avatar placeholder:** Circle with user initials, `--primary-light` background
- **Map style:** Clean, light-themed map tiles (Google Maps or Mapbox light style)

---

## 8. Motion & Animation

| Animation          | Duration | Easing           | Usage                         |
|:-------------------|:---------|:-----------------|:------------------------------|
| Hover lift         | 200ms    | ease-out         | Cards, buttons                |
| Page transition    | 300ms    | ease-in-out      | Route changes                 |
| Modal enter        | 250ms    | ease-out         | Dialog open                   |
| Modal exit         | 200ms    | ease-in          | Dialog close                  |
| Skeleton pulse     | 1.5s     | ease-in-out loop | Loading placeholders          |
| Toast slide-in     | 300ms    | ease-out         | Notification appearance       |
| Sidebar collapse   | 250ms    | ease-in-out      | Navigation toggle             |

---

## 9. Page Templates & Layout Structure

### 9.1 Donor App Layout (Web)
```
┌──────────────────────────────────────────┐
│  Top Nav (Logo | Nav Items | Avatar)     │  64px
├──────────────────────────────────────────┤
│                                          │
│            Main Content Area             │  flex-grow
│         (max-width: 1200px, centered)    │
│                                          │
├──────────────────────────────────────────┤
│  Footer (Links | Copyright)              │  auto
└──────────────────────────────────────────┘
```

### 9.2 Staff / Admin Dashboard Layout
```
┌────────┬─────────────────────────────────┐
│        │  Header (Breadcrumb | Search    │  64px
│ Side   │       | Notifications | Avatar) │
│ bar    ├─────────────────────────────────┤
│ 260px  │                                 │
│        │       Page Content Area         │  flex-grow
│        │    (padding: 24px–32px)         │
│        │                                 │
│        ├─────────────────────────────────┤
│        │  Footer (optional)              │
└────────┴─────────────────────────────────┘
```

### 9.3 Auth Pages (Login / Register / Reset)
```
┌──────────────────────────────────────────┐
│                                          │
│   ┌─────────────┬──────────────────┐     │
│   │  Branding   │   Auth Form      │     │  Centered vertically
│   │  Panel      │   Card           │     │  
│   │  (Illust.)  │   (max 420px)    │     │
│   └─────────────┴──────────────────┘     │
│                                          │
└──────────────────────────────────────────┘
```

---

## 10. Role-Specific UI Mapping

This table maps each actor to their portal type and the screens they should have:

### 10.1 Donor (Mobile-first Web App)
| Module                  | Screens                                                    |
|:------------------------|:-----------------------------------------------------------|
| Auth                    | Login, Register (CCCD scan), Reset Password, OTP Verify    |
| Dashboard / Home        | Welcome banner, quick stats, upcoming appointment, news    |
| Profile                 | View profile, Edit profile                                 |
| Map & Booking           | Interactive map, Campaign detail, Schedule form, E-Ticket  |
| Appointments            | Appointment list, Appointment detail, Cancel confirm       |
| News Feed               | Article list (cards), Article detail                       |
| Notifications           | Notification list, Notification preferences                |
| SOS Alerts              | SOS alert card, Respond confirmation                       |
| Donation Journey        | Timeline view, Achievements/badges, Level progress         |
| AI Chatbot              | Chat overlay / full-screen chat                            |
| Community               | Facebook link (redirect only)                              |

### 10.2 Blood Center Staff (Desktop Dashboard)
| Module                  | Screens                                                    |
|:------------------------|:-----------------------------------------------------------|
| Auth                    | Login                                                      |
| Dashboard               | Overview stats, quick actions                             |
| Campaign Management     | Campaign list, Create campaign form, Campaign detail/edit  |
| Donor Registrations     | Registration list, Registration detail/edit, QR scanner    |
| Content Management      | Article list, Create/edit article (rich editor)            |
| Notifications           | Notification list, Notification detail                     |
| Blood Inventory         | Inventory dashboard (charts), Blood bag search, Bag detail, Stock In form, Stock Out form |

### 10.3 Hospital Staff (Desktop Dashboard)
| Module                  | Screens                                                    |
|:------------------------|:-----------------------------------------------------------|
| Auth                    | Login                                                      |
| Dashboard               | Overview stats, active SOS requests                       |
| SOS Management          | Create SOS form, SOS list, SOS detail/monitor, SOS reports |

### 10.4 Administrator (Desktop Dashboard)
| Module                  | Screens                                                    |
|:------------------------|:-----------------------------------------------------------|
| Auth                    | Login                                                      |
| Dashboard               | System overview, quick stats                              |
| User Management         | User list (filterable table), User detail, Create/edit user form |
| Role Management         | Role list, Role detail (permission matrix), Create/edit role |
| System Monitoring       | Activity logs (filterable table), Log detail, Usage dashboard (charts) |
| System Configuration    | Config categories, Config edit form                        |
| Feature Toggles         | Toggle list with switches                                  |

---

## 11. Responsive Breakpoints

| Breakpoint | Width      | Target          |
|:-----------|:-----------|:----------------|
| `xs`       | < 480px    | Small phones    |
| `sm`       | ≥ 480px    | Large phones    |
| `md`       | ≥ 768px    | Tablets         |
| `lg`       | ≥ 1024px   | Small desktops  |
| `xl`       | ≥ 1280px   | Large desktops  |

---

## 12. Accessibility Guidelines

- **Contrast Ratio:** Minimum 4.5:1 for body text, 3:1 for large text
- **Focus indicators:** Visible outline on all interactive elements
- **Touch targets:** Minimum 44×44px on mobile
- **Alt text:** Required for all images and icons
- **ARIA labels:** Required for icon-only buttons
- **Keyboard navigation:** All interactive elements must be reachable via Tab

---

## 13. Naming Convention for Screens

Use this pattern so all team members generate consistently named screens:

```
[Role]-[Module]-[Action/View]
```

**Examples:**
- `Donor-Auth-Login`
- `Donor-Map-Browse`
- `Donor-Appointment-Schedule`
- `Staff-Campaign-Create`
- `Staff-Inventory-Dashboard`
- `Hospital-SOS-Create`
- `Admin-Users-List`
- `Admin-Roles-Edit`

---

## 14. Stitch Import Instructions

When starting a new Stitch project or session:

1. **Copy this entire DESIGN.md file** and paste it into Stitch's system prompt / context input
2. **Prefix every screen prompt** with: `"Follow the LifeLine DESIGN.md design system. "`
3. **Use the naming convention** from Section 13 for screen titles
4. **Reference specific sections** (e.g., "Use the Button styles from Section 5.1") when detailing components

This ensures that every team member, regardless of which module they are responsible for, produces visually consistent UI prototypes.
