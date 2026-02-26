import json, sys

data = json.load(sys.stdin)
for p in data:
    meta = p.get("metadata") or {}
    reqs = meta.get("rfp_requirements", [])
    mappings = meta.get("requirement_mappings", [])
    if not reqs:
        continue
    print(f"Proposal: {p['id']}")
    print(f"  Requirements: {len(reqs)}, Mappings: {len(mappings)}")
    mapping_by_id = {}
    for m in mappings:
        mapping_by_id[m["req_id"]] = m["section_slug"]
    mismatched = 0
    for r in reqs:
        req_section = r["section_slug"]
        mapped_section = mapping_by_id.get(r["id"])
        if mapped_section and mapped_section != req_section:
            mismatched += 1
            desc = r["description"][:90]
            print(f"    MISMATCH: parse={req_section} -> actual={mapped_section}")
            print(f"             \"{desc}\"")
    print(f"  Total mismatched: {mismatched} of {len(reqs)}")
