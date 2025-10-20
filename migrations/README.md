# Database Migration for Business Email

This migration updates the customer_programs table to use business_email instead of business_id, which simplifies authentication and removes the need for Supabase admin access.

## Changes Made

1. Added `business_email` column to the `customer_programs` table
2. Updated all API routes to use business_email instead of business_id
3. Modified stored procedure to accept email instead of ID
4. Added proper indexes for optimal query performance

## How to Apply the Migration

1. Run the SQL migration script:

```sql
-- From file: migrations/add_business_email_to_customer_programs.sql
ALTER TABLE customer_programs 
ADD COLUMN business_email TEXT;

-- Update existing records to copy email from users table
UPDATE customer_programs cp
SET business_email = u.email
FROM users u
WHERE cp.business_id = u.id;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_customer_programs_business_email 
ON customer_programs(business_email);
```

2. Create a new version of the stored procedure with a different name to avoid function overloading issues:

```sql
-- From file: migrations/update_points_procedure_with_email.sql
-- Run this in your database SQL editor
```

This creates a new function `update_customer_points_with_email` that explicitly accepts a TEXT parameter for the creator's email.

## Verification

After applying the migration, make sure to:

1. Test customer verification flow with QR code scanning
2. Verify customer program enrollment works correctly
3. Confirm points management functions properly

## Rollback Plan

If needed, you can roll back by:

1. Reverting to using business_id in all API routes
2. Dropping the business_email column (not recommended if data has been added)