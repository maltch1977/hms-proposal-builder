import json, sys

data = json.load(sys.stdin)
meta = data[0]["metadata"]
reqs = meta.get("rfp_requirements", [])
mappings = meta.get("requirement_mappings", [])

print("=== Requirements by section ===")
by_section = {}
for r in reqs:
    s = r["section_slug"]
    if s not in by_section:
        by_section[s] = []
    by_section[s].append(r)

for s, rs in by_section.items():
    print(f"\n{s} ({len(rs)} reqs):")
    for r in rs:
        filled = "GREEN" if r.get("auto_filled") else "ORANGE"
        desc = r["description"][:100]
        print(f"  [{filled}] {desc}")

print(f"\n=== Mappings ({len(mappings)}) ===")
for m in mappings:
    slug = m["section_slug"]
    field = m["field"]
    rid = m["req_id"]
    rtype = m["req_type"]
    print(f"  {slug}/{field} -> {rid} ({rtype})")
