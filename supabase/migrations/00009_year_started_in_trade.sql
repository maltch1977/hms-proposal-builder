-- Change "years_in_industry" to "year_started_in_trade"
-- Instead of storing a number that goes stale, store the year they started
-- and auto-calculate experience dynamically.

-- Convert existing data: years_in_industry -> year they started
-- e.g. 10 years experience in 2026 -> year_started = 2016
alter table public.personnel
  add column year_started_in_trade integer;

update public.personnel
  set year_started_in_trade = extract(year from now())::integer - years_in_industry
  where years_in_industry is not null;

alter table public.personnel
  drop column years_in_industry;
