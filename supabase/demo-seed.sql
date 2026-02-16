-- HMS Proposal Builder - Demo Seed Data
-- Run AFTER the base seed.sql
-- Populates personnel, references, past projects, library items, and cost library items
-- All data sourced from the Columbia Memorial Hospital proposal

-- Org ID shorthand
-- '00000000-0000-0000-0000-000000000001'

-- ============================================
-- Personnel (from Interview Panel)
-- ============================================
INSERT INTO public.personnel (
  organization_id, full_name, title, role_type,
  years_in_industry, years_at_company, task_description,
  specialties, certifications
) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'Cody Gormley',
  'Controls & Construction Division Manager',
  'Preconstruction Manager/Estimator',
  10, 8,
  'Managing, installing, programming, and commissioning controls systems. Oversees preconstruction, estimating, and division operations.',
  ARRAY['Preconstruction', 'Estimating', 'Project Management', 'BMS Installation'],
  ARRAY['OSHA 30']
),
(
  '00000000-0000-0000-0000-000000000001',
  'Chad Plummer',
  'Project Manager',
  'Project Manager/QA-QC/Programming Operations',
  20, 12,
  'Combined experience installing, programming, and commissioning. Manages project operations, quality assurance, and programming workflows.',
  ARRAY['Project Management', 'QA/QC', 'Programming', 'Commissioning', 'BMS Operations'],
  ARRAY['OSHA 30', 'Distech Certified']
),
(
  '00000000-0000-0000-0000-000000000001',
  'Ben Walker',
  'Lead Programmer',
  'Programmer/Installer',
  20, 10,
  'Combined experience installing, programming, and commissioning. Servicing commercial and industrial controls systems.',
  ARRAY['BACnet Programming', 'Distech Controls', 'Schneider Electric', 'System Integration'],
  ARRAY['Distech Certified', 'Schneider Certified']
),
(
  '00000000-0000-0000-0000-000000000001',
  'Kasey Guerra',
  'Project Superintendent',
  'Programmer/Installer',
  25, 15,
  'Installing, programming, and commissioning controls systems. Servicing commercial and industrial controls. Field supervision and coordination.',
  ARRAY['Field Supervision', 'Installation', 'Commissioning', 'Controls Programming'],
  ARRAY['OSHA 30', 'Distech Certified']
),
(
  '00000000-0000-0000-0000-000000000001',
  'Kevin Cryer',
  'Controls Engineer',
  'Control Engineer',
  21, 5,
  'Leading electrical work, coordinating teams, managing BAS controls contractors, performing remote diagnostics, and ensuring accurate, compliant technical documentation.',
  ARRAY['Electrical Engineering', 'BAS Controls', 'Remote Diagnostics', 'Technical Documentation'],
  ARRAY['Journeyman Electrician']
);

-- ============================================
-- References (Owners & General Contractors)
-- ============================================
INSERT INTO public.references (
  organization_id, contact_name, title, company, phone, category, project_ids
) VALUES
-- Owners
(
  '00000000-0000-0000-0000-000000000001',
  'Ian Walter', 'Facilities Engineer', 'Columbia Memorial Hospital',
  '360.442.9601', 'Owner', ARRAY[]::uuid[]
),
(
  '00000000-0000-0000-0000-000000000001',
  'Cory Hughes', 'Facilities Engineer', 'Columbia Memorial Hospital',
  '971.286.8898', 'Owner', ARRAY[]::uuid[]
),
(
  '00000000-0000-0000-0000-000000000001',
  'Tyler Anderson', 'Director of Facilities Engineering', 'Providence Health Systems',
  '907.942.6075', 'Owner', ARRAY[]::uuid[]
),
(
  '00000000-0000-0000-0000-000000000001',
  'Brandon Butler', 'Facilities Manager', 'Providence Health Systems',
  '971.330.6868', 'Owner', ARRAY[]::uuid[]
),
(
  '00000000-0000-0000-0000-000000000001',
  'Stephen Weipert', 'Director of Facilities', 'PeaceHealth Health Systems',
  '517.375.6468', 'Owner', ARRAY[]::uuid[]
),
(
  '00000000-0000-0000-0000-000000000001',
  'Chuck Johnson', 'Facilities Manager', 'PeaceHealth Health Systems',
  '360.261.1746', 'Owner', ARRAY[]::uuid[]
),
(
  '00000000-0000-0000-0000-000000000001',
  'Pam Kaleal-Broderius', 'Project Manager', 'PeaceHealth Health Systems',
  '360.442.9601', 'Owner', ARRAY[]::uuid[]
),
(
  '00000000-0000-0000-0000-000000000001',
  'David Cobos', 'HVAC Supervisor', 'City of Hillsboro',
  '503.828.7627', 'Owner', ARRAY[]::uuid[]
),
-- General Contractors
(
  '00000000-0000-0000-0000-000000000001',
  'Robert Filley', 'Superintendent', 'Skanska',
  '971.271.4981', 'General Contractor', ARRAY[]::uuid[]
),
(
  '00000000-0000-0000-0000-000000000001',
  'Kate Betschart', 'Project Engineer', 'Skanska',
  '971.334.5211', 'General Contractor', ARRAY[]::uuid[]
),
(
  '00000000-0000-0000-0000-000000000001',
  'David Wright', 'Project Manager', 'Fortis Construction',
  '971.201.0519', 'General Contractor', ARRAY[]::uuid[]
),
(
  '00000000-0000-0000-0000-000000000001',
  'Josh Sierra', 'Superintendent', 'Pence Construction',
  '971.336.0300', 'General Contractor', ARRAY[]::uuid[]
),
(
  '00000000-0000-0000-0000-000000000001',
  'James Meyer', 'Project Manager', 'Anderson Construction',
  '503.349.5035', 'General Contractor', ARRAY[]::uuid[]
),
(
  '00000000-0000-0000-0000-000000000001',
  'Levi Robinson', 'Superintendent', 'Anderson Construction',
  '971.610.5341', 'General Contractor', ARRAY[]::uuid[]
);

-- ============================================
-- Past Projects (Case Studies)
-- ============================================
INSERT INTO public.past_projects (
  organization_id, project_name, project_type, building_type,
  client_name, square_footage, narrative, photos
) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'Willamette Falls Hospital East Expansion',
  'BMS Controls',
  'Healthcare',
  'Providence Health Systems',
  31375,
  'HMS completed a 31,375sf expansion of Providence Willamette Falls Medical Center which included a new central utility plant and oncology wing. The oncology wing encompassed a new pharmacy with stringent pressure, temperature, and humidity control requirements to maintain safe working conditions for the lab technicians using the bio safety cabinets. The new central utility plant implemented advanced staging and rotation programs along with integration into an existing steam heating plant hosted on a separate control system. The plant includes chillers, cooling towers, AHUs, emergency generators, and boiler systems. HMS worked alongside prime mechanical contractor and Fortis Construction in phases to keep the Boilers and Chillers that fed the existing hospital online and active during installation, startup and commissioning of the new plant while maintaining a strict schedule.',
  '["/images/case-studies/willamette-falls-hospital.jpg"]'::jsonb
),
(
  '00000000-0000-0000-0000-000000000001',
  'Providence POP 3 DDC Upgrade',
  'DDC Upgrade',
  'Lab/Office',
  'Providence Health Systems',
  NULL,
  'HMS and Total Mechanical successfully upgraded all DDC controllers from legacy Trane comm5 devices to new Distech BACnet IP controls while minimizing tenant impacts and downtime in a three-story lab building with 24/7 occupancy. This building requires critical pressure and temperature control to maintain a safe working environment for occupants and important lab samples. This building includes large exhaust fans, chillers, gas boilers, paralleled AHUs, and pumps with VFDs. It was imperative that HMS and Total Mechanical maintained thorough communication and cooperation through a multi-phase project while meeting or exceeding schedule milestones.',
  '["/images/case-studies/providence-pop3-upgrade.jpg"]'::jsonb
),
(
  '00000000-0000-0000-0000-000000000001',
  'Columbia Memorial Hospital Knight Cancer Center',
  'New Construction BMS',
  'Healthcare',
  'Columbia Memorial Hospital',
  18000,
  'New 18,000sf facility on the Columbia Memorial Hospital campus. HMS successfully worked with P&C on this new construction project to provide a full BMS system that seamlessly integrated into the existing campus controls server. This project included a CT room, Chiller, AHU, and electric reheat terminal units as well as pressure monitoring and mixing rooms critical air control. HMS provided the latest Distech controllers and has continued to support the pavilion, hospital, and cancer center buildings for CMH.',
  '["/images/case-studies/cmh-knight-cancer-center.jpg"]'::jsonb
);

-- ============================================
-- Library Items (Reusable section content)
-- Uses subqueries for section_type_id references
-- ============================================

-- Introduction Library Item
INSERT INTO public.library_items (
  organization_id, section_type_id, name, description, content, is_default
) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM public.section_types WHERE slug = 'introduction' AND organization_id = '00000000-0000-0000-0000-000000000001'),
  'HMS Standard Introduction',
  'Default company introduction for proposals',
  '{
    "body": "<p>HMS Commercial Service, Inc. has been in business providing complete control services for over 15 years. Our focus is retrofit installations, replacement, and service of building control systems in new and existing facilities. The individuals at HMS Commercial Service, Inc. have the experience and capabilities to manage all aspects of a project. Every job requires coordination, deliverables, and documentation. Knowing the urgency of our clients'' needs and who will perform best from our team is our strength.</p><p>Our team offers experiences on chillers, boilers, large commercial package equipment, pumps, fan systems, computer room units, cooling towers and miscellaneous HVAC equipment maintenance and repairs. Installation of new Schneider/Distech control systems, retrofit and integration of existing open building control systems.</p><p>HMS continually strives to improve upon its already highly successful approach to customer service and support. With each project HMS is diligent in assessing the needs, concerns, and wants from a client to provide a holistic and innovative solution. HMS is not interested in a project-by-project approach to the Controls &amp; Service industry but rather looks to build a lifelong relationship with our clients providing them with the highest level of service and reliability.</p>"
  }'::jsonb,
  true
),
-- Firm Background Library Item
(
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM public.section_types WHERE slug = 'firm_background' AND organization_id = '00000000-0000-0000-0000-000000000001'),
  'HMS Standard Background — Healthcare',
  'Standard firm background narrative for healthcare projects',
  '{
    "narrative": "<p>HMS is highly qualified to perform HVAC control work in hospital settings due to our extensive experience in critical environment systems, deep understanding of healthcare facility requirements, and commitment to precision and reliability, specifically in the integration, programming, and optimization of Building Management Systems (BMS).</p><p>We have ample experience designing and implementing BMS solutions that provide precise control over critical systems such as air handling units (AHUs), Chilled Water Plants, Heating Water Plants, isolation room pressurization, operating room temperature and humidity, and ventilation for infection control. Our team is proficient with leading BMS platforms such as Distech and Schneider allowing us to seamlessly integrate new or upgraded control systems with existing infrastructure.</p><p>We understand the importance of system redundancy, alarm management, and 24/7 monitoring in healthcare settings and are skilled in configuring trend logs, fault detection, and automated responses to maintain compliance with ASHRAE 170, NFPA, and other hospital regulatory standards. Our disciplined technicians approach ensures minimal disruption to hospital operations, while our commissioning and validation processes guarantee system performance and reliability in mission-critical environments.</p>"
  }'::jsonb,
  true
),
-- Site Logistics & Safety Library Item
(
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM public.section_types WHERE slug = 'site_logistics' AND organization_id = '00000000-0000-0000-0000-000000000001'),
  'HMS Standard Site Logistics & Safety',
  'Default site logistics and safety narrative',
  '{
    "body": "<h2>Site Specific Overview</h2><p>Site-specific safety protocols are fully implemented at this location, and we do not anticipate any issues; our team is logistically equipped to meet all operational and project demands effectively.</p><p>We are committed to providing a safe work environment free from unsanitary, hazardous, or dangerous conditions. Before work begins, all personnel will be briefed on relevant health and safety policies, site-specific hazards, and OSHA standards.</p><h3>Core Safety Practices Include:</h3><ol><li>Use of appropriate personal protective equipment (PPE)</li><li>Safe and proper use of tools, equipment, and machinery</li><li>Ongoing inspection and correction of unsafe conditions by competent persons</li><li>Immediate removal of defective tools or unsafe practices</li><li>Operation of equipment only by trained and authorized personnel</li></ol><h3>Employee Engagement</h3><p>Regular safety meetings will be held to review job-specific hazards and safety concerns. Employee feedback and participation are strongly encouraged. On multi-contractor sites, safety coordination will address shared risks and responsibilities.</p><h3>Access &amp; Resolution</h3><p>The SSSP will be accessible to all site personnel. Safety-related concerns should be brought to the project management team or competent person. All issues will be addressed promptly, in accordance with OSHA regulations and internal policy.</p><p>To maintain the highest safety standards, a Site-Specific Safety Plan (SSSP) will be implemented at each job site. This plan provides a quick-reference guide for project managers, competent people, employees, and subcontractors, ensuring alignment with major safety protocols.</p>"
  }'::jsonb,
  true
),
-- QA/QC/Commissioning Library Item
(
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM public.section_types WHERE slug = 'qaqc_commissioning' AND organization_id = '00000000-0000-0000-0000-000000000001'),
  'HMS Standard QA/QC/Commissioning',
  'Default quality assurance, quality control, and commissioning procedures',
  '{
    "quality_assurance": "<h2>Quality Assurance (QA)</h2><h3>Documentation Review</h3><p>Verify control system specifications, drawings, and project requirements. Ensure compliance with relevant government codes, standards, and regulations (e.g., NEC, ASHRAE, or other applicable codes).</p><h3>Submittals</h3><p>Review and approve submittals for control panels, sensors, and devices before procurement. Ensure materials and components meet project specifications and are approved by the project owner.</p><h3>Training and Communication</h3><p>Train installation teams on standards and QA procedures. Maintain open communication with the project team to address issues promptly.</p><h3>Mock-ups and Prototyping</h3><p>Test critical control systems (e.g., HVAC control panels) using prototypes to confirm functionality before full deployment.</p>",
    "quality_control": "<h2>Quality Control (QC)</h2><p><strong>Objective:</strong> Verify the installation and functionality of systems as per design and specifications.</p><h3>Pre-Installation Inspections</h3><p>Verify that wiring, conduits, and mounting locations align with approved plans. Ensure control panels and devices are installed securely and comply with specifications.</p><h3>Material Verification</h3><p>Check that all materials and equipment delivered to the site match approved submittals. Verify calibration certificates for sensors and instruments.</p><h3>Ongoing Inspections</h3><p>Conduct periodic site inspections to monitor installation quality. Use checklists to verify that wiring terminations, labeling, and connections are correct.</p><h3>Functional Testing</h3><p>Test each system individually (e.g., temperature sensors, actuators, alarms) to verify correct operation. Perform I/O point checks to ensure data integrity between field devices and the BMS.</p><h3>Deficiency Tracking</h3><p>Document and track any installation deficiencies. Implement a structured process for resolving issues and obtaining approvals for corrections.</p>",
    "commissioning": "<h2>Commissioning</h2><h3>Commissioning Plan</h3><p>Assist in a detailed commissioning plan outlining the sequence of operations, test protocols, and acceptance criteria provided by third party commissioning agency.</p><h3>System Calibration</h3><p>Verify network communication between devices and the BMS.</p><h3>Sequence of Operations Testing</h3><p>Test the agreed upon control logic for various operational scenarios (e.g., occupied/unoccupied modes, emergency overrides). Simulate fault conditions to ensure alarms and fail-safes operate correctly.</p><h3>Integrated System Testing</h3><p>Test the integration of all subsystems to ensure seamless operation. Confirm data logging and reporting functions in the BMS.</p><h3>Documentation</h3><p>Provide as-built drawings, calibration reports, and test results. Deliver an operation and maintenance (O&amp;M) manual, including troubleshooting guidelines.</p>"
  }'::jsonb,
  true
),
-- Closeout Library Item
(
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM public.section_types WHERE slug = 'closeout' AND organization_id = '00000000-0000-0000-0000-000000000001'),
  'HMS Standard Closeout',
  'Default closeout procedures, training, and warranty',
  '{
    "body": "<h2>Training Plans</h2><p>Train facility personnel on system operation and maintenance. Provide hands-on demonstrations and answer questions. HMS will tailor training to the needs and skill level of attendees.</p><h2>Final Handover</h2><h3>Punch List Completion</h3><p>Address all outstanding punch list items identified during inspections and commissioning.</p><h3>Owner Acceptance</h3><p>Conduct a walkthrough with facility staff to demonstrate system functionality. Obtain formal acceptance of the completed work.</p><h3>Warranty Support</h3><p>Provide post-installation support and warranty services for a defined period. Respond promptly to issues during the warranty phase to maintain compliance with contractual obligations. Provide technical support to the owner''s representative during the warranty period via phone, VPN, and onsite visit if necessary.</p>"
  }'::jsonb,
  true
);

-- ============================================
-- Cost Library Items (Standard controls line items)
-- ============================================
INSERT INTO public.cost_library_items (
  organization_id, description, type, default_amount
) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'BMS Controls Installation — Labor & Materials',
  'base',
  NULL
),
(
  '00000000-0000-0000-0000-000000000001',
  'Control Panel Fabrication & Wiring',
  'base',
  NULL
),
(
  '00000000-0000-0000-0000-000000000001',
  'Programming & Commissioning',
  'base',
  NULL
),
(
  '00000000-0000-0000-0000-000000000001',
  'Project Management & Engineering',
  'base',
  NULL
),
(
  '00000000-0000-0000-0000-000000000001',
  'Bond & Insurance',
  'base',
  NULL
),
(
  '00000000-0000-0000-0000-000000000001',
  'Off-Hours / Weekend Work',
  'adder',
  NULL
),
(
  '00000000-0000-0000-0000-000000000001',
  'Additional Programming Scope',
  'adder',
  NULL
),
(
  '00000000-0000-0000-0000-000000000001',
  'Owner-Furnished Equipment Credit',
  'deduct',
  NULL
);
