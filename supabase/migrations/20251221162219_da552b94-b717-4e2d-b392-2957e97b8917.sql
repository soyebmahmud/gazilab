-- Add new role values to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'accounts';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'it';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'md';