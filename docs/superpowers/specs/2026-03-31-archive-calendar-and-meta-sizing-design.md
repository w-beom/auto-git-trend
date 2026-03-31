# Archive Calendar And Meta Sizing Design

## Overview

Replace the current archive date dropdown in the hero with a calendar-style picker and rebalance the hero meta boxes so their visual height matches more consistently.

The current top picker solves navigation placement, but it still feels like a plain select control. The user now wants a calendar interaction and cleaner visual alignment across the publish date, captured time, total repository count, and archive date controls.

## Product Goal

- Let users change archive dates from a calendar-style control in the hero.
- Allow selection only for dates that are actually stored.
- Keep the existing routing rule where the latest date maps to `/`.
- Make the hero meta boxes feel aligned and visually balanced.

## Non-Goals

- Adding monthly or yearly archive browsing beyond the visible calendar.
- Supporting free-form manual date entry.
- Showing unavailable dates as routes that lead to 404 pages.
- Redesigning the hero headline or changing the overall visual identity.

## Current Context

The codebase already has:

- a hero-level archive picker component
- archive date data loaded for both homepage and archive pages
- routing rules that send the latest date to `/` and older dates to `/archive/[date]`

The gap is that the current control is still a native select. It does not present a calendar surface, and the surrounding meta boxes have uneven visual proportions.

## Recommended Approach

Replace the native select with a custom button-plus-popover calendar component.

The calendar component should:

- show the current date in the closed state
- open a small month calendar when activated
- enable only stored snapshot dates
- disable all other days
- route immediately when a valid stored date is clicked

This gives the user a true calendar interaction while keeping selection constrained to known valid dates.

## Calendar Interaction

### Closed State

The closed control should look like a compact date input in the hero meta row, with:

- a label such as `아카이브 날짜`
- the current date value
- a calendar affordance or disclosure icon

### Open State

The popover should show one month view at a time.

Behavior:

- the visible month defaults to the month containing the current page date
- stored dates are clickable
- unavailable dates are visually muted and not interactive
- clicking outside or selecting a date closes the popover

If stored dates span multiple months, the popover should allow month navigation, but still only activate dates that exist in the archive list.

## Navigation Rules

The existing route behavior stays unchanged:

- clicking the latest stored date routes to `/`
- clicking any older stored date routes to `/archive/[date]`

Unavailable dates should never route anywhere because they cannot be selected.

## Hero Meta Box Sizing

The hero meta row should be visually rebalanced around a shared control height.

Rules:

- `발행일`, `총 N개 저장소`, and the archive date control should use the same minimum height
- `Captured ...` may be wider, but should use the same minimum height as the other boxes
- text inside these boxes should be vertically centered
- width can vary by content, but height should feel consistent across the row

This should make the left-side meta boxes read as one coherent control strip instead of mixed cards with mismatched proportions.

## Responsive Behavior

- desktop: keep the boxes in a wrapped horizontal row
- mobile: allow boxes to stack cleanly without the calendar overflowing the viewport
- the calendar popover should stay usable at narrow widths, even if it needs a narrower layout or edge alignment

## Component Boundaries

Keep responsibilities narrow:

- `src/components/trending/archive-date-picker.tsx`
  - evolve from select control into calendar popover
- optional helper file under `src/components/trending/`
  - extract month-grid rendering if the picker file starts growing too large
- `src/app/globals.css`
  - add calendar popover and meta-row sizing styles
- `src/components/trending/snapshot-hero.tsx`
  - keep composition only, no calendar logic

## Error Handling

- if fewer than two stored dates exist, hide the calendar control
- if the current page date is missing from the stored date list, hide the control
- if month navigation lands on a month with no stored dates, the grid can still render, but only stored dates remain selectable

## Testing Strategy

### Calendar Component Tests

Verify:

- the current date appears in the closed state
- the popover opens and shows the expected month
- only stored dates are interactive
- clicking a stored older date routes to `/archive/[date]`
- clicking the latest stored date routes to `/`

### Hero Integration Tests

Verify:

- the hero still shows the current date as the selected archive value
- the hero renders the calendar control on both homepage and archive pages

### Style Tests

Verify:

- the meta row and archive control share consistent minimum-height styling
- the old plain select-specific assumptions are removed

## Success Criteria

- Archive date control opens a calendar-style picker instead of a plain dropdown.
- Only stored archive dates can be selected.
- Latest date still routes to `/`.
- Older stored dates still route to `/archive/[date]`.
- The hero meta boxes look visually aligned by height.
