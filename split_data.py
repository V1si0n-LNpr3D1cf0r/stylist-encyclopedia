import json

def to_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in ["true", "1", "yes"]
    if isinstance(value, int):
        return value == 1
    return False

with open('data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

formatted_data = []
seen_ids = set()

for index, item in enumerate(data):
    item_id = item.get("id") or f"item_{index}"

    if item_id in seen_ids:
        item_id = f"{item_id}_{index}"
    seen_ids.add(item_id)

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
        "category": item.get("category") or item.get("nation") or "",
        "maincolor": item.get("maincolor", ""),
        "othercolor": item.get("othercolor", ""),
        "inasuit": to_bool(item.get("inasuit")),
        "suit": item.get("suit", ""),
        "pose": to_bool(item.get("pose")),
        "animated": item.get("animated", False),
        "img": f"img/{raw_type}/{item_id}.png"
    }

    formatted_data.append(new_item)

with open('data_clean.json', 'w', encoding='utf-8') as f:
    json.dump(formatted_data, f, ensure_ascii=False, indent=2)

print(f"✅ Cleaned {len(formatted_data)} items")

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