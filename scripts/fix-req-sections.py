"""
One-time fix: update each requirement's section_slug to match the earliest
section where its content was actually mapped (by mapping order).
"""
import json, sys

data = json.load(sys.stdin)
meta = data[0]["metadata"]
reqs = meta.get("rfp_requirements", [])
mappings = meta.get("requirement_mappings", [])

# Sidebar section order (from the proposal)
SECTION_ORDER = [
    "cover_page", "introduction", "table_of_contents", "firm_background",
    "key_personnel", "project_schedule", "site_logistics", "qaqc_commissioning",
    "closeout", "reference_check", "interview_panel", "project_cost",
    "executive_summary",
]
order_map = {s: i for i, s in enumerate(SECTION_ORDER)}

# Build: req_id -> earliest section_slug from mappings
earliest = {}
for m in mappings:
    rid = m["req_id"].replace("req_", "")
    slug = m["section_slug"]
    if rid not in earliest or order_map.get(slug, 999) < order_map.get(earliest[rid], 999):
        earliest[rid] = slug

changed = 0
for r in reqs:
    rid = r["id"].replace("req_", "")
    if rid in earliest and earliest[rid] != r["section_slug"]:
        old = r["section_slug"]
        r["section_slug"] = earliest[rid]
        changed += 1
        print(f"  {r['description'][:70]}...")
        print(f"    {old} -> {earliest[rid]}")

meta["rfp_requirements"] = reqs
print(f"\nChanged {changed} requirements")

# Output the updated metadata as JSON
json.dump(meta, sys.stdout)
