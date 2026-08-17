# v0.2.4 - Mobile expiry calendar API alignment

- Mobile expiry uses only `GET /api/records/calendar`.
- `/api/records` remains the PC expiry list API and is not called by mobile expiry.
- The calendar endpoint is queried for the entire visible month.
- The same three filters are sent to the calendar endpoint: `confirmStatus`, `processStatus`, `category`.
- Date clicks do not trigger an API request; the selected date is rendered from the already loaded month data.
- Switching month or changing any filter reloads the current month through `/api/records/calendar`.
- Calendar red dots and the selected-date product list therefore always come from the same filtered dataset.
- No date-range filter is exposed to the user.
