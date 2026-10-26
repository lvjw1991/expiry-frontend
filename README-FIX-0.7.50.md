# v0.7.50 changes

- Based on v0.7.49.
- Added a desktop entry for barcode history lookup on the receiving-order management page.
- Added paginated barcode history search using `GET /api/items/barcode`; sorting is left to the backend.
- Added a history detail page that loads the selected item through `GET /api/items/{id}`.
- No backend, database, or mobile changes.

Build verification: `npm run build` could not be run in the provided environment because `vue-tsc` was not available in `node_modules/.bin`.
