ALTER TABLE veg_deals ADD COLUMN IF NOT EXISTS invst_start_date date;

COMMENT ON COLUMN veg_deals.invst_start_date IS 'Investment Start Date from VegAgenda';
