-- Add more product categories for pharmaceutical products
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'syrup';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'suspension';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'injection';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'ointment';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'drops';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'vial';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'gel';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'lotion';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'spray';