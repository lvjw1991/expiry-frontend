# Fix based on v0.7.53-samsung-photo-capture-remark-fix

- Made the Barcode value in the desktop expiry-record list clickable.
- Clicking a barcode navigates to `/item-barcode-history?barcode=<barcode>`.
- The barcode history page reads the query parameter and automatically runs the history search on entry.
- Existing barcode-history manual search and session-state restoration remain available when no barcode query parameter is supplied.
- No changes were made to the mobile camera/photo-capture flow or remark display logic.

Build verification: `npm run build` could not be completed in this environment because the installed dependencies do not include the `vue-tsc` executable.
