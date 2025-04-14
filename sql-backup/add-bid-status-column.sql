-- SQL to add the bid_status column to the projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS bid_status TEXT DEFAULT 'accepting_bids';
