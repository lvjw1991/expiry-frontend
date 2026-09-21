export const CATEGORY_OPTIONS = ['Fresh', 'NF', 'Frozen', 'Dry', 'Seasoning', 'Drink', 'Instant Noodle', 'Snack'] as const

export const SUGAR_OPTIONS = [
  'A - 0',
  'B - (0.5,2.5]',
  'C - (2.5,5]',
  'D - (5,8]',
  'E - (8,11]',
  'F - >11'
] as const

export const EXPIRY_OPTIONAL_CATEGORIES = ['Fresh', 'NF'] as const

export const isExpiryRequired = (category?: string) =>
  !!category && !EXPIRY_OPTIONAL_CATEGORIES.includes(category as (typeof EXPIRY_OPTIONAL_CATEGORIES)[number])
