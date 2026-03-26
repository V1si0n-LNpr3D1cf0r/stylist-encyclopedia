import json

with open('data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

formatted_data = []
seen_ids = set()

for index, item in enumerate(data):
    item_id = item.get("id") or f"item_{index}"

    # 🔥 FIX DUPLICATE IDS
    if item_id in seen_ids:
        item_id = f"{item_id}_{index}"
    seen_ids.add(item_id)

    # 🔥 CLEAN TYPE → folder name
    raw_type = item.get("type", "unknown").lower().replace(" ", "")

    new_item = {
        "id": item_id,
        "name": item.get("name", ""),
        "type": raw_type,
        "subtype": item.get("subtype", ""),
        "rarity": item.get("rarity", 0),
        "gorgeous": item.get("gorgeous", ""),
        "simple": item.get("simple", ""),
        "elegant": item.get("elegant", ""),
        "lively": item.get("lively", ""),
        "mature": item.get("mature", ""),
        "cute": item.get("cute", ""),
        "sexy": item.get("sexy", ""),
        "pure": item.get("pure", ""),
        "warm": item.get("warm", ""),
        "cool": item.get("cool", ""),
        "tag1": item.get("tag1", ""),
        "tag2": item.get("tag2", ""),
        
        # ✅ CATEGORY FIX (nation fallback)
        "category": item.get("category") or item.get("nation") or "",
        
        "maincolor": item.get("maincolor", ""),
        "othercolor": item.get("othercolor", ""),
        "inasuit": item.get("inasuit", False),
        "suit": item.get("suit", ""),
        "pose": item.get("pose", False),
        "animated": item.get("animated", False),

        # 🔥 IMAGE PATH FIX
        "img": f"img/{raw_type}/{item_id}.png"
    }

    formatted_data.append(new_item)

# SAVE CLEAN DATA
with open('data_clean.json', 'w', encoding='utf-8') as f:
    json.dump(formatted_data, f, ensure_ascii=False, indent=2)

print(f"✅ Cleaned {len(formatted_data)} items")

# 🔥 SPLIT BY TYPE
types = {}
for item in formatted_data:
    t = item.get('type', 'unknown')
    types.setdefault(t, []).append(item)

for t, items in types.items():
    filename = f"data_{t}.json"
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print(f"📁 {filename} → {len(items)} items")

print("🎉 DONE")