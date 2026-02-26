import json, sys, re

data = json.load(sys.stdin)
for sec in data:
    slug = sec["section_types"]["slug"]
    content = sec.get("content") or {}
    if not isinstance(content, dict):
        continue
    for field, val in content.items():
        if isinstance(val, str):
            marks = re.findall(r'<mark[^>]*data-req-id="([^"]+)"[^>]*data-req-type="([^"]+)"', val)
            for rid, rtype in marks:
                print(f"  {slug}/{field}: {rid} = {rtype}")
