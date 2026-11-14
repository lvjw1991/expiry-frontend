# Price Label Printing - v0.7.54

Based on `expiry-frontend-v0.7.53-barcode-history-link`.

## Features
- Added a desktop Price Label Printing menu item available to both ADMIN and STAFF roles.
- Added product selection through `GET /api/category-management` with `CategoryStatus=all`.
- Added receiving-order product selection through `GET /api/tags/orders/{orderId}/items`.
- Added a shared confirmation list with edit/remove actions.
- Added price-tag editing through `PUT /api/tags/items/{id}`. English name, Finnish name, and sale price are required. Net content and net unit are optional; supported units are KG and L.
- Added latest-data preview through `GET /api/tags/items?idList=...` immediately before preview.
- Added A4 print layout with 2 columns x 6 rows (12 labels per page), product image, barcode, sale price, and server-provided unit price.

## Notes
- No print quantity is maintained; one selected product produces one label.
- Product selection from a receiving order uses the product list endpoint and merges products into the same confirmation list.
- Unit price is displayed from the backend `unitPrice` field; it is not calculated in the browser.
- The API path and `CategoryStatus=all` query parameter follow the latest explicit integration instruction.

## Build verification
`npm run build` was attempted, but this environment could not install dependencies: `npm ci --offline` reported that the `vue-tsc` package tarball was not cached, and the online install timed out. The build therefore remains unverified in this environment.
