# Mobile check flow v0.7.0

Changes:
1. Mobile receiving-order item detail return button now dynamically returns to `/m/check/{orderId}` using the current route id.
2. Supplier/product code (`货号`) is larger on the mobile item list and detail page.
3. Product name on the mobile item detail page is no longer truncated with `...`; it wraps onto multiple lines when needed.

Existing point-goods business logic is unchanged.
