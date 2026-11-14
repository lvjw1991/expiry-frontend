# Price Label Printing - v0.7.56

Based on `v0.7.55-price-label-api-fix`.

## Changes
- Changed latest price-tag lookup to `POST /api/tags/items`.
- Sends selected product IDs as a JSON array in the request body, e.g. `[1,2,3]`.
- Removed the `HAPPY BOY` brand text from the printed label.
- Expanded the product image region and uses `object-fit: contain` with centered positioning so the whole image is shown without cropping.

## Existing behavior retained
- Product lookup uses `GET /api/products/category-management` with `categoryStatus=ALL`.
- Both ADMIN and STAFF can access price label printing.
- A4 layout remains 2 columns x 6 rows (12 labels per page).
