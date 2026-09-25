````md
# CureLink Design System

> Universal UI/UX guidelines for the CureLink frontend.
>
> This document is the single visual source of truth for all CureLink pages and components.
> Every page, component, dashboard, form, table, modal, and interaction must follow these rules unless an explicitly approved page design overrides them.

---

# 1. Design Direction

CureLink is a professional digital healthcare platform.

The interface must feel:

- Professional
- Clean
- Trustworthy
- Calm
- Modern
- Minimal
- Accessible
- Consistent
- Healthcare-oriented without feeling overly clinical

CureLink should feel like one unified healthcare product across:

- Public website
- Patient portal
- Doctor portal
- Administrator portal
- Authentication pages

Avoid making CureLink look like:

- A generic admin template
- A banking application
- A social media platform
- A heavily decorative SaaS dashboard
- An outdated hospital-management system
- An overly colorful application

The design should prioritize clarity, trust, simplicity, and usability.

---

# 2. Design Principles

## 2.1 Consistency First

Use the same visual language throughout the application.

Reuse existing:

- Buttons
- Inputs
- Cards
- Tables
- Badges
- Navigation
- Modals
- Typography
- Spacing
- Icons
- Loading states
- Empty states
- Feedback states

Do not create a new visual treatment for an individual page when an existing component can be reused.

---

## 2.2 Content Before Decoration

CureLink is a functional healthcare application.

Every UI element should have a clear purpose.

Avoid:

- Decorative gradients without purpose
- Excessive illustrations
- Excessive shadows
- Excessive animations
- Excessive cards
- Large decorative empty areas
- Unnecessary icons
- Visual effects that reduce readability

---

## 2.3 Clear Visual Hierarchy

Every page must clearly communicate:

1. Where the user is
2. What the page is for
3. What information matters most
4. What action the user should take

Primary actions must be visually stronger than secondary actions.

---

# 3. Brand Colors

CureLink uses a calm teal healthcare accent.

## Primary

```css
--color-primary: #0F766E;
````

Use for:

* Primary buttons
* Active navigation
* Links
* Important icons
* Focus states
* Selected states
* Accent lines
* Important interactive elements

Do not use the primary color for every piece of text.

## Primary Hover

```css
--color-primary-hover: #0D6B64;
```

Use for interactive hover states.

## Primary Light

```css
--color-primary-light: #E6F4F2;
```

Use for:

* Active navigation backgrounds
* Soft information areas
* Icon backgrounds
* Selected states
* Subtle highlights

---

# 4. Neutral Colors

The application should primarily use neutral colors.

```css
--color-background: #F8FAFC;
--color-surface: #FFFFFF;

--color-text-primary: #172033;
--color-text-secondary: #64748B;
--color-text-muted: #94A3B8;

--color-border: #E2E8F0;
--color-border-light: #EDF2F7;
```

## Background

Use `--color-background` for the overall application background.

## Surface

Use `--color-surface` for:

* Cards
* Panels
* Forms
* Tables
* Modals
* Dropdowns

## Primary Text

Use for:

* Page titles
* Section headings
* Patient/doctor names
* Important information
* Primary table content

## Secondary Text

Use for:

* Descriptions
* Metadata
* Supporting information

## Muted Text

Use for:

* Secondary metadata
* Timestamps
* Non-critical supporting information

Do not use muted text for important information.

---

# 5. Semantic Colors

Use semantic colors only to communicate meaning.

```css
--color-success: #16A34A;
--color-success-light: #DCFCE7;

--color-warning: #D97706;
--color-warning-light: #FEF3C7;

--color-error: #DC2626;
--color-error-light: #FEE2E2;

--color-info: #2563EB;
--color-info-light: #DBEAFE;
```

Examples:

```text
Confirmed → Success
Completed → Success
Pending → Warning
Cancelled → Error
Information → Info
```

Do not use semantic colors purely for decoration.

---

# 6. Typography

Use a clean modern sans-serif font.

Preferred:

```text
Inter
```

Fallback:

```text
system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

## Type Scale

### Page Title

```text
32px
font-weight: 700
line-height: 1.2
```

### Section Heading

```text
24px
font-weight: 600
line-height: 1.3
```

### Card Heading

```text
18px
font-weight: 600
line-height: 1.4
```

### Body

```text
15px
font-weight: 400
line-height: 1.6
```

### Small / Metadata

```text
13px
font-weight: 400
line-height: 1.5
```

### Button

```text
14px
font-weight: 600
```

Avoid unnecessarily large typography inside dashboards.

---

# 7. Spacing System

Use a 4px-based spacing system.

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

Prefer these values over arbitrary spacing.

Typical usage:

```text
Input internal spacing → 12–16px
Card padding → 24px
Section spacing → 32px
Page section spacing → 40–48px
```

---

# 8. Border Radius

Use moderately rounded components.

```css
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
```

Use:

```text
Inputs → 8px
Buttons → 8px
Cards → 12px
Large authentication cards → 16px
Modals → 12–16px
```

Do not make every element pill-shaped.

Pill shapes should primarily be reserved for statuses/tags where appropriate.

---

# 9. Shadows

Shadows must remain subtle.

```css
--shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.06);
--shadow-md: 0 4px 12px rgba(15, 23, 42, 0.08);
--shadow-lg: 0 10px 30px rgba(15, 23, 42, 0.10);
```

Cards should generally use:

```text
Border + subtle shadow
```

Avoid heavy floating shadows.

---

# 10. Page Layout

Authenticated application pages should generally follow:

```text
┌─────────────────────────────────────────────┐
│ Header                                      │
├──────────────┬──────────────────────────────┤
│              │                              │
│ Sidebar      │ Page Content                 │
│              │                              │
│              │                              │
│              │                              │
└──────────────┴──────────────────────────────┘
```

Pages should generally contain:

1. Navigation
2. Page title
3. Optional page description
4. Primary action
5. Main content
6. Supporting content

Do not unnecessarily fill the page with cards.

---

# 11. Dashboard Design

Dashboards should follow:

```text
Page Header
     ↓
Summary / KPI Cards
     ↓
Primary Information
     ↓
Secondary Information
```

Example:

```text
Good morning, Dr. Sharma

Today's overview

[Appointments] [Patients] [Available Slots] [Pending]

Today's Appointments
────────────────────────────────

Upcoming Appointments
────────────────────────────────
```

Only show information useful to that specific role.

Do not add statistics just to make the dashboard look full.

---

# 12. Cards

Cards group related information.

Default card:

```css
background: var(--color-surface);
border: 1px solid var(--color-border);
border-radius: var(--radius-lg);
```

Default padding:

```text
24px
```

Cards should have:

* Clear heading
* Clear content hierarchy
* Consistent spacing

Avoid cards inside cards unless there is a clear structural reason.

---

# 13. Buttons

## Primary Button

Use for the primary action.

```text
Background → Primary Teal
Text → White
Border Radius → 8px
Height → approximately 40–44px
Font Weight → 600
```

Examples:

```text
Create Account
Sign In
Book Appointment
Save Consultation
Add Availability
```

## Secondary Button

Use for secondary actions.

```text
Background → White
Border → Neutral border
Text → Primary text
```

## Text Button

Use for low-priority actions.

Examples:

```text
View all
Cancel
Forgot password?
```

## Destructive Button

Use only for destructive actions.

Examples:

```text
Delete
Cancel Appointment
Remove Slot
```

Use the error semantic color.

---

# 14. Forms

Forms must be simple and clear.

Standard structure:

```text
Label
Input
Helper/Error Text
```

Always provide visible labels.

Do not rely exclusively on placeholders as labels.

## Inputs

```text
Height → approximately 44px
Border → 1px neutral border
Radius → 8px
Background → White
```

Focus state:

```text
Border → Primary teal
Visible focus indication
```

Inputs must provide clear validation/error states.

---

# 15. Authentication Design

Authentication pages establish the visual language for CureLink.

Structure:

```text
CureLink Logo

Authentication Card

Heading
Supporting text

Form

Primary Button

Divider

Secondary navigation
```

Authentication cards should use:

* White surface
* Thin teal accent
* Subtle border
* Subtle shadow
* Rounded corners
* Clean spacing
* Minimal decoration

The Login and Signup designs provided for CureLink are the visual reference.

Do not create a different authentication design for Patient, Doctor, or Admin.

Only the content and route should differ.

---

# 16. Navigation

Navigation must clearly communicate the user's current location.

## Active Navigation

Use:

```text
Primary teal
+
Light teal background
```

## Inactive Navigation

Use:

```text
Neutral text
```

Navigation should remain consistent across:

* Patient portal
* Doctor portal
* Administrator portal

Only the available navigation items should differ according to role.

---

# 17. Tables

Use tables when displaying structured information.

Examples:

* Appointments
* Patients
* Doctor schedules
* Administrative records

Table rules:

* Clear column headings
* Comfortable row height
* Subtle separators
* Strong primary information
* Secondary metadata in muted text
* Consistent action alignment

Avoid excessive borders.

---

# 18. Status Badges

Use compact badges for statuses.

Examples:

```text
Confirmed
Pending
Completed
Cancelled
Available
Booked
```

Use semantic colors appropriately.

Examples:

```text
Confirmed → Success
Pending → Warning
Cancelled → Error
```

Status badges must not dominate the interface.

---

# 19. Icons

Use one consistent icon library throughout the application.

Icons must:

* Have consistent stroke weight
* Have consistent sizing
* Support the meaning of adjacent text

Recommended sizes:

```text
16px → Inline icons
18–20px → Navigation
20–24px → Cards/actions
```

Do not use icons purely as decoration when they provide no meaning.

---

# 20. Loading States

Any page that retrieves data must have a loading state.

Preferred:

* Skeleton loaders
* Loading indicators
* Disabled submission buttons

Never leave the user staring at a completely blank page while data loads.

---

# 21. Empty States

Empty states must explain the situation.

Bad:

```text
No data.
```

Good:

```text
No upcoming appointments

You don't have any scheduled appointments yet.
```

If an action can resolve the empty state, provide it.

Example:

```text
No available slots

Create your first availability.

[Add Availability]
```

---

# 22. Error States

Errors must be visible and understandable.

Do not expose raw backend errors to users.

Use messages such as:

```text
Unable to load appointments.

Please try again.
```

For forms:

```text
Please enter a valid email address.
```

Errors should clearly communicate:

1. What went wrong
2. What the user can do next

---

# 23. Success Feedback

Important user actions must provide visible feedback.

Examples:

```text
Appointment booked successfully.

Availability updated successfully.

Consultation saved successfully.

Profile updated successfully.
```

Use:

* Toasts
* Inline confirmations
* Status messages

depending on the context.

---

# 24. Modals

Use modals only when focused confirmation or input is required.

Good uses:

```text
Delete confirmation
Cancel appointment
Add availability
Edit availability
```

Avoid using modals as replacements for complete pages.

---

# 25. Responsive Design

CureLink must work properly on desktop and tablet.

Recommended breakpoints:

```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
```

## Desktop

Use:

* Sidebar
* Multi-column layouts
* Tables
* Dashboard cards

## Tablet

Adapt:

* Sidebar width
* Grid columns
* Card layouts
* Tables

Do not allow content to become cramped.

## Mobile

Where mobile support is implemented:

* Stack content
* Collapse navigation
* Make controls full-width where appropriate
* Prevent horizontal scrolling

Responsive behavior must preserve the original design rather than creating a completely different visual style.

---

# 26. Accessibility

All interactive controls must be:

* Keyboard reachable
* Clearly labelled
* Focus-visible
* Understandable without relying solely on color

Forms must have proper labels.

Buttons must clearly communicate their action.

Action icons must have accessible labels.

Never rely exclusively on color to communicate:

```text
Success
Error
Pending
```

Always include text, icons, or other semantic indicators.

---

# 27. Animation

Animations should be subtle and functional.

Allowed:

* Button hover
* Navigation transitions
* Modal transitions
* Toast appearance
* Small loading animations

Avoid:

* Large page animations
* Constant floating elements
* Excessive transitions
* Distracting effects

Animation must never slow down the user's workflow.

---

# 28. Content Style

CureLink uses concise, professional language.

Prefer:

```text
Book Appointment
Save Consultation
Add Availability
View Medical History
```

Avoid:

```text
Let's get started!!!
Click here now!!!
You're going to love this!!!
```

Healthcare information must be presented clearly and neutrally.

---

# 29. Role-Specific Design

Patient, Doctor, and Administrator interfaces must share the same CureLink visual identity.

Roles may differ in:

* Navigation
* Dashboard information
* Available actions
* Data
* Workflows

Roles must NOT have completely different visual identities.

Do not create:

```text
Patient → Green theme
Doctor → Blue theme
Admin → Purple theme
```

CureLink remains one product.

---

# 30. Doctor Interface

Doctor pages should prioritize:

1. Today's appointments
2. Upcoming appointments
3. Schedule / availability
4. Patients
5. Consultations
6. Medical records
7. Profile

Doctor pages should be clinically useful without becoming visually dense.

---

# 31. Patient Interface

Patient pages should prioritize:

1. Upcoming appointments
2. Booking
3. Doctors
4. Medical history
5. Visit history
6. Profile

The patient interface should remain simple enough for users without technical knowledge.

---

# 32. Administrator Interface

Administrator pages may contain denser information because administrators manage:

* Doctor profiles
* Appointments
* Platform activity

However, administrators must still use the same CureLink design system.

---

# 33. Do Not Do

Do not introduce any of the following without an explicit design decision:

* New primary colors
* Random gradients
* Glassmorphism
* Excessive rounded cards
* Excessive shadows
* Neon colors
* Giant typography
* Excessive animations
* Different button styles on different pages
* Different font families
* Random spacing values
* Random icon libraries
* Unnecessary decorative illustrations
* Dark mode unless explicitly designed
* Role-specific visual themes
* Unnecessary UI elements

---

# 34. Component Reuse

Before creating a new component, check whether an existing component can be reused.

Prefer shared components such as:

```text
Button
Card
Input
Modal
Badge
Table
EmptyState
LoadingState
```

Avoid unnecessary duplication such as:

```text
DoctorButton
PatientButton
AdminButton
```

unless there is a genuine behavioral difference.

Reuse components across roles whenever their behavior and appearance are the same.

---

# 35. Design Tokens

Centralize design values.

Use a single source of truth for design tokens.

Example:

```css
:root {
  --color-primary: #0F766E;
  --color-primary-hover: #0D6B64;
  --color-primary-light: #E6F4F2;

  --color-background: #F8FAFC;
  --color-surface: #FFFFFF;

  --color-text-primary: #172033;
  --color-text-secondary: #64748B;
  --color-text-muted: #94A3B8;

  --color-border: #E2E8F0;
  --color-border-light: #EDF2F7;

  --color-success: #16A34A;
  --color-success-light: #DCFCE7;

  --color-warning: #D97706;
  --color-warning-light: #FEF3C7;

  --color-error: #DC2626;
  --color-error-light: #FEE2E2;

  --color-info: #2563EB;
  --color-info-light: #DBEAFE;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
}
```

Do not scatter arbitrary design values throughout the application when a design token can be used.

---

# 36. Page Consistency Checklist

Before considering any page complete, verify:

* [ ] Uses CureLink typography
* [ ] Uses approved color tokens
* [ ] Uses consistent spacing
* [ ] Uses existing components where possible
* [ ] Uses consistent border radius
* [ ] Uses subtle shadows
* [ ] Has clear visual hierarchy
* [ ] Has visible interaction feedback
* [ ] Has loading state where required
* [ ] Has empty state where required
* [ ] Has error state where required
* [ ] Is keyboard accessible
* [ ] Works on desktop
* [ ] Works on tablet
* [ ] Does not introduce unnecessary visual elements
* [ ] Does not create a new visual language

---

# 37. Source of Truth

When implementing any CureLink page, use this priority:

1. Existing approved CureLink designs
2. This DESIGN.md
3. Existing reusable CureLink components
4. SRS functional requirements
5. Implementation-specific requirements

The SRS defines:

> WHAT CureLink must do.

The design system defines:

> HOW CureLink should look and behave.

Do not invent UI that conflicts with either.

---

# 38. Design Philosophy

CureLink should always feel like:

> "A calm, trustworthy healthcare platform that gets out of the user's way."

Every design decision should reinforce:

**Clarity → Trust → Simplicity → Consistency → Accessibility**

```
```
