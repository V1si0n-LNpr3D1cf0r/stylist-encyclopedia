import json

with open('formatted_wardrobe_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Split by type for logical chunks (~2-5k items each)
types = {}
for item in data:
    t = item['type']
    if t not in types:
        types[t] = []
    types[t].append(item)

# Save each type as separate JSON file
for type_name, items in types.items():
    filename = f"data_{type_name}.json"
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print(f"Created {filename} with {len(items)} items")

print(f"Split into {len(types)} files total!")

formatted_data = []
for item in data:
    new_item = {
        "id": item.get("id", ""),
        "name": item.get("name", ""),
        "type": item.get("type", ""),
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
        "maincolor": "",
        "othercolor": "",
        "nation": "",
        "inasuit": item.get("inasuit", False),
        "suit": "",
        "pose": item.get("pose", False),
        "animated": item.get("animated", False),
        "img": f"images/{item.get('id', '')}.png"  # Generate from ID
    }
    formatted_data.append(new_item)

with open('formatted_wardrobe_data.json', 'w', encoding='utf-8') as f:
    json.dump(formatted_data, f, ensure_ascii=False, indent=2)

print(f"✅ Formatted {len(formatted_data)} items with new format!")
print(f"📁 Saved to output/wardrobe_data_v2.json")
print(f"🖼️ All images now use format: images/[ID].png")
