# Year Calendar

A simple, dependency-free calendar showing all 12 months of a year with ISO 8601 week numbers.

## Features
- 12-month view with previous/next year navigation
- Weeks start on Monday; each week shows its ISO 8601 week number
- Click a day to select/highlight it; click again to deselect (keyboard: Tab + Enter/Space)
- Category chips at the bottom: **All**, **Vacation** (blue), **On-Duty** (orange)
  - With Vacation or On-Duty active, clicking a day tags it with that category (click again to untag; clicking a day of the other category re-tags it), and days of other categories are dimmed
  - **All** shows every category at full strength; editing is disabled in this mode
- Click a week number to tag that week's working days (Mon–Fri) within the month with the active category; click again when all are tagged to untag them
- Counter at the bottom shows the total number of selected days, a per-category breakdown, and how many fall in the displayed year
- Selections persist in the browser's `localStorage`
- Today is highlighted; "Clear all" resets selections

## Running
No build step required.

- **Locally:** open `index.html` in a browser (double-click).
- **Static server:** serve the folder, e.g.
  ```sh
  python3 -m http.server 8000
  # or
  npx serve .
  ```
  then open http://localhost:8000.

## Files
- `index.html` – page structure
- `styles.css` – layout and styling
- `app.js` – calendar rendering, week numbers, selection logic
