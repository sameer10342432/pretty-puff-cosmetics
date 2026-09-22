================================================================================
PRETTY PUFF LUXURY COSMETICS — DATABASE INSTALLATION DIRECTORY
================================================================================

This directory contains the SQL schema definitions for initial database setup:

1. safe_schema.sql
   - Non-destructive idempotent schema definition
   - Uses `CREATE TABLE IF NOT EXISTS` for all 31 application tables
   - Preserves any existing tables, columns, indexes, and records

IMPORTANT WARNING:
------------------
- If your database already contains tables or production data, DO NOT import this file.
- This file is ONLY needed if setting up a completely new or empty database.
- Pretty Puff NEVER automatically imports or executes this file on page loads.

HOW TO IMPORT (ONLY IF DATABASE IS EMPTY):
------------------------------------------
1. Log into cPanel -> Databases -> phpMyAdmin.
2. Select your database: `muhamma1_prettypuff`.
3. Click the "Import" tab at the top.
4. Select `safe_schema.sql` from this folder and click "Go".
================================================================================
