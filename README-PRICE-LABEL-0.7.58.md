# v0.7.58 - Adjust label bottom row

Based on v0.7.57. Keeps each label at 80mm x 40mm and the supplied reference layout:
- Product image occupies the full-height left column.
- Product names occupy the upper-right area.
- Large price occupies the middle-right area.
- The entire lower-right row is a shared footer containing both barcode (left portion) and unit price (right portion).
- Product image uses object-fit: contain to avoid cropping.
- A4 remains 2 columns x 6 rows with 3mm gaps.
