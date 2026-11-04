# v0.7.53 Samsung Internet camera fix

## Change
- Replaced the hidden `<input type="file" capture="environment">` camera-launch flow in `MobileBarcodeScanner.vue` with ZXing live camera scanning via `decodeFromVideoDevice`.
- Requests the environment-facing camera, displays a live video preview, and stops camera tracks after a successful scan, manual fallback, dialog close, or component unmount.
- Keeps the existing `open()` exposed method and `scanned` event contract, so `MobileCheckItems.vue` and its point-check business logic remain unchanged.
- Adds user-facing errors for insecure HTTP context, denied camera permission, missing camera, and camera-in-use conditions.

## Test
- Build was not completed in this environment: the archive has no installed frontend dependencies and `npm ci` timed out. Run `npm ci` and `npm run build` locally before deployment.
- Test on Samsung Galaxy A17 / Samsung Internet over HTTPS. Allow camera permission when prompted. Verify live preview, EAN barcode detection, manual input, close/stop behavior.
