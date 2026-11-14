# v0.7.59 - Product selection detail loading

Based on v0.7.58.
- On entering the page, do not automatically query the product search list. Product search runs only after the user initiates a search.
- Removed sale price from the product search result table.
- Clicking Add calls `GET /api/products/{id}` and only adds the returned full product detail to the confirmation list after success.
- Duplicate add attempts show an informational message and do not add a second copy.
- Product detail request failures show an error and do not add the product.
- Keeps the receiving-order list loading behavior and all existing print/preview behavior.
