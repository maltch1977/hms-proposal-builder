-- HMS Proposal Builder - Seed Data
-- Creates the HMS organization and default section types

-- ============================================
-- HMS Organization
-- ============================================
insert into public.organizations (
  id, name, slug, logo_url,
  primary_color, secondary_color, accent_color, body_text_color,
  company_name, company_address, company_phone, company_website, company_email,
  footer_text
) values (
  '00000000-0000-0000-0000-000000000001',
  'HMS Commercial Service, Inc.',
  'hms',
  '/images/hms_logo.png',
  '#1B365D', '#2B5797', '#C9A227', '#333333',
  'HMS Commercial Service, Inc.',
  'Portland, Oregon',
  '',
  '',
  '',
  'HMS Commercial Service, Inc.'
);

-- ============================================
-- Default Section Types
-- ============================================
insert into public.section_types (organization_id, slug, display_name, description, default_order, is_system, is_auto_generated) values
  ('00000000-0000-0000-0000-000000000001', 'cover_page', 'Cover Page', 'Proposal cover with client info and optional project photo', 1, true, false),
  ('00000000-0000-0000-0000-000000000001', 'introduction', 'Introduction', 'Opening narrative introducing HMS and the proposal', 2, true, false),
  ('00000000-0000-0000-0000-000000000001', 'table_of_contents', 'Table of Contents', 'Auto-generated table of contents with page numbers', 3, true, true),
  ('00000000-0000-0000-0000-000000000001', 'firm_background', 'Firm Background & Experience', 'Company qualifications narrative and past project case studies', 4, true, false),
  ('00000000-0000-0000-0000-000000000001', 'key_personnel', 'Key Personnel & Org Chart', 'Project team selection with organizational chart and personnel table', 5, true, false),
  ('00000000-0000-0000-0000-000000000001', 'project_schedule', 'Project Schedule', 'Gantt chart upload and execution strategy', 6, true, false),
  ('00000000-0000-0000-0000-000000000001', 'site_logistics', 'Site Logistics & Safety', 'Site logistics narrative with EMR rating table', 7, true, false),
  ('00000000-0000-0000-0000-000000000001', 'qaqc_commissioning', 'QA/QC/Commissioning', 'Quality assurance, quality control, and commissioning procedures', 8, true, false),
  ('00000000-0000-0000-0000-000000000001', 'closeout', 'Closeout', 'Project closeout procedures, training, and warranty', 9, true, false),
  ('00000000-0000-0000-0000-000000000001', 'reference_check', 'Reference Check', 'Client and contractor reference contacts', 10, true, false),
  ('00000000-0000-0000-0000-000000000001', 'interview_panel', 'Interview Panel', 'Auto-generated team presentation for client interviews', 11, true, true),
  ('00000000-0000-0000-0000-000000000001', 'project_cost', 'Project Cost', 'Detailed cost breakdown with line items and totals', 12, true, false);

-- ============================================
-- Sample EMR Ratings
-- ============================================
insert into public.emr_ratings (organization_id, year, rating) values
  ('00000000-0000-0000-0000-000000000001', 2021, 0.75),
  ('00000000-0000-0000-0000-000000000001', 2022, 0.73),
  ('00000000-0000-0000-0000-000000000001', 2023, 0.71),
  ('00000000-0000-0000-0000-000000000001', 2024, 0.69),
  ('00000000-0000-0000-0000-000000000001', 2025, 0.68);
