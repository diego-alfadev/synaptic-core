# Search filters

Synthetic fixture shaped like an upstream ODD feature document: owned by another harness, read in
place, never copied or reformatted. It has no checkboxes and no section after the progress log, which
is the shape a tolerant reader must accept.

## Objective

Let the catalogue search filter by category and price range.

## Problem

Users scroll through every result because the search has no filters.

## Why

Support tickets about "cannot find" doubled after the catalogue grew.

## Scope

- Category filter on the search page.
- Price range filter on the search page.

## Constraints

- No new dependency.

## Tasks

- T1 Add the category filter to the query builder.
- T2 Add the price range filter.
- T3 Wire both filters into the search page.

## Acceptance

- A search with a category returns only items in that category.

## Progress

- 2026-11-01 T1 done in commit 3f2a9c1; query builder tests pass.
- 2026-11-02 T2 started.
