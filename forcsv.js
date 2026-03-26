const fs = require("fs");

function csvToJSON(csvText) {
  const lines = csvText.split("\n").filter(line => line.trim() !== "");
  const headers = lines[0].split(",").map(h => h.trim());

  return lines.slice(1).map((line, index) => {
    const values = line.split(",").map(v => v.trim());
    let obj = {};

    headers.forEach((header, i) => {
      obj[header] = values[i] || "";
    });

    return {
      id: obj.id || `item_${index}`,
      name: obj.name || "",
      type: obj.type || "",
      subtype: obj.subtype || "",
      rarity: Number(obj.rarity) || 0,
      gorgeous: obj.gorgeous || "",
      simple: obj.simple || "",
      elegant: obj.elegant || "",
      lively: obj.lively || "",
      mature: obj.mature || "",
      cute: obj.cute || "",
      sexy: obj.sexy || "",
      pure: obj.pure || "",
      warm: obj.warm || "",
      cool: obj.cool || "",
      tag1: obj.tag1 || "",
      tag2: obj.tag2 || "",
      maincolor: obj.maincolor || "",
      othercolor: obj.othercolor || "",
      category: obj.category || "",
      inasuit: obj.inasuit === "true" || obj.inasuit === "1",
      suit: obj.suit || "",
      pose: obj.pose === "true" || obj.pose === "1",
      animated: obj.animated === "true" || obj.animated === "1",
      img: `images/${obj.id}.png`
    };
  });
}

const csv = fs.readFileSync("data.csv", "utf-8");

const json = csvToJSON(csv);

fs.writeFileSync("data.json", JSON.stringify(json, null, 2));

console.log("✅ Converted successfully!");