# Archive Top Picker Design

## Overview

Move archive date navigation from the homepage body into the top hero area so users can change dates from the most prominent part of the page.

The current implementation adds a dedicated archive section below the latest snapshot content. It works, but the user now wants archive date selection to happen at the top of the page instead. This change keeps the same date data source and archive routes while changing the navigation surface and interaction model.

## Product Goal

- Let users pick archive dates from the hero area at the top of the page.
- Keep the homepage anchored to the latest snapshot.
- Show the currently viewed date as the selected value.
- Use the same archive picker on both the homepage and archive pages.

## Non-Goals

- Reworking the overall hero content hierarchy.
- Adding a separate archive landing page.
- Reintroducing the archive date list section lower on the page.
- Adding filtering, grouping, or search for archive dates.

## Current Context

The codebase already has:

- `getSnapshotArchiveDates()` returning successful snapshot dates in descending order.
- a homepage archive section component that renders all dates as links.
- `SnapshotHero` as the top-of-page component for both homepage and archive views.
- `SiteShell` as the shared composition layer for latest and archive pages.

The missing behavior is top-of-page date selection that reflects the currently viewed date and routes users directly when they change it.

## Recommended Approach

Replace the lower archive section with a hero-level date picker rendered beside the existing hero metadata chips.

The picker should be a focused, reusable component whose only job is:

- render the current date as the selected option
- render all available archive dates as options
- navigate when the selection changes

This keeps the page structure stable while moving the interaction to a more discoverable location.

## Navigation Behavior

### Current Date as Default Value

The picker default value should always match the date currently being viewed:

- on `/`, the selected value is the latest snapshot date
- on `/archive/[date]`, the selected value is that archive date

This keeps the control state aligned with page content and avoids a disconnected placeholder state.

### Route Targets

All successful snapshot dates remain available in the picker.

Navigation rules:

- selecting the latest snapshot date routes to `/`
- selecting any older date routes to `/archive/[date]`

This preserves the rule that the homepage is the latest snapshot view while still letting the latest date appear naturally inside the same picker.

## UI Design

### Placement

The picker belongs inside the hero metadata area, alongside:

- publish date
- capture time
- total repository count

It should feel like part of the same control strip, not like a separate content section.

### Visibility Rules

- if there is no snapshot to render, do not show the picker
- if fewer than two dates are available, hide the picker because there is nothing meaningful to choose

This avoids showing a dead control.

### Visual Direction

The picker should follow the existing editorial system:

- same border and shadow language as meta chips
- clear label such as `아카이브 날짜`
- strong readability at narrow widths

The control should look intentional inside the hero rather than like a default browser form dropped into the layout.

## Component Boundaries

Keep responsibilities narrow:

- `src/components/trending/archive-date-picker.tsx`
  - render the top picker and handle route navigation
- `src/components/trending/snapshot-hero.tsx`
  - accept archive date data and place the picker in the hero meta area
- `src/components/trending/site-shell.tsx`
  - pass archive dates and current date to the hero
- `src/app/page.tsx`
  - continue fetching latest snapshot plus archive dates
- `src/app/archive/[date]/page.tsx`
  - also fetch archive dates so the picker works on archive pages

The old body-level archive list component can be removed once the picker replaces it.

## Error Handling

- invalid archive dates continue to use the existing archive page `notFound` path
- if archive dates cannot be loaded for a page that otherwise has a snapshot, render the page without the picker
- if the selected date somehow does not exist in the option list, still render the current page and omit the control rather than show a mismatched state

## Testing Strategy

### Picker Component Tests

Verify:

- the current date is selected by default
- changing to an older date navigates to `/archive/[date]`
- changing to the latest date navigates to `/`
- the picker does not render when fewer than two dates are available

### Page Integration Tests

Verify:

- the homepage renders the picker in the hero when archive dates are available
- the archive page also renders the picker with the archive date selected
- the body-level archive section no longer renders

### Empty-State Safety

Verify:

- the existing homepage empty state still renders alone
- no picker appears when there is no snapshot content

## Success Criteria

- Archive date selection moves from the lower page body to the hero area.
- The picker shows the currently viewed date as its selected value.
- Selecting the latest date routes to `/`.
- Selecting an older date routes to `/archive/[date]`.
- The old body-level archive list is removed.
