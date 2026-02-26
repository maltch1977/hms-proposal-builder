import json, sys

data = json.load(sys.stdin)
meta = data[0]["metadata"]
reqs = meta.get("rfp_requirements", [])
mappings = meta.get("requirement_mappings", [])

SECTION_ORDER = [
    "cover_page", "introduction", "table_of_contents", "firm_background",
    "key_personnel", "project_schedule", "site_logistics", "qaqc_commissioning",
    "closeout", "reference_check", "interview_panel", "project_cost",
    "executive_summary",
]
order_map = {s: i for i, s in enumerate(SECTION_ORDER)}

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
        sys.stderr.write(f"  {r['description'][:70]}...\n    {old} -> {earliest[rid]}\n")

meta["rfp_requirements"] = reqs
sys.stderr.write(f"\nChanged {changed} requirements\n")

# Output clean JSON payload for PATCH
payload = {"metadata": meta}
json.dump(payload, sys.stdout, ensure_ascii=False)
