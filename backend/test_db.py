"""Quick test: verify Supabase DB + Storage connections work."""
from dotenv import load_dotenv
load_dotenv()

from services.database import get_history, get_history_by_id

# Test 1: Get history list
print("=== Test get_history ===")
items = get_history(limit=5)
print(f"Items from Supabase: {len(items)}")
for item in items[:3]:
    sid = item.get("session_id", "?")
    mode = item.get("mode", "?")
    disease = item.get("disease_name", "?")
    created = item.get("created_at", "?")
    print(f"  - {sid} | {mode} | {disease} | {created}")

# Test 2: Get history by id (use first item if available)
if items:
    first_id = items[0].get("id", "")
    print(f"\n=== Test get_history_by_id({first_id}) ===")
    detail = get_history_by_id(first_id)
    if detail:
        print(f"  session_id: {detail.get('session_id')}")
        print(f"  mode: {detail.get('mode')}")
        print(f"  has result: {'result' in detail and detail['result'] is not None}")
        print(f"  plant_url: {detail.get('plant_url', 'none')}")
    else:
        print("  Detail NOT FOUND (None returned)")
else:
    print("\n=== No items in DB — skipping detail test ===")

print("\nDone!")
