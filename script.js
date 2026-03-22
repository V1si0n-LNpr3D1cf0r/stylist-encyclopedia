let items = [];

fetch("data.json")
  .then(res => res.json())
  .then(data => {
    items = data;
    display(items);
  });

document.getElementById("search").addEventListener("input", filter);
document.getElementById("typeFilter").addEventListener("change", filter);
document.getElementById("rarityFilter").addEventListener("change", filter);

function filter() {
  let search = document.getElementById("search").value.toLowerCase();
  let type = document.getElementById("typeFilter").value;
  let rarity = document.getElementById("rarityFilter").value;

  let filtered = items.filter(item => {
    return (
      item.name.toLowerCase().includes(search) &&
      (type === "" || item.type === type) &&
      (rarity === "" || item.rare == rarity)
    );
  });

  display(filtered);
}

function display(list) {
  let container = document.getElementById("results");

  let html = `
    <table border="1" style="margin:auto; border-collapse: collapse;">
      <tr>
        <th>Name</th>
        <th>Type</th>
        <th>Sub Type</th>
        <th>Rarity</th>
        <th>Gorgeous</th>
        <th>Simple</th>
        <th>Elegant</th>
        <th>Lively</th>
        <th>Mature</th>
        <th>Cute</th>
        <th>Sexy</th>
        <th>Pure</th>
        <th>Warm</th>
        <th>Cool</th>
        <th>Tag 1</th>
        <th>Tag 2</th>
        <th>In Suit</th>
        <th>Pose</th>
        <th>Animated</th>
        </th>
        <th>Image</th>
      </tr>
  `;

  list.forEach(item => {
    html += `
      <tr>
        <td>${item.name}</td>
        <td>${item.type}</td>
        <td>${item.subtype}</td>
        <td>${item.rarity}❤</td>
        <td>${item.gorgeous || "-"}</td>
        <td>${item.simple || "-"}</td>
        <td>${item.elegant || "-"}</td>
        <td>${item.lively || "-"}</td>
        <td>${item.mature || "-"}</td>
        <td>${item.cute || "-"}</td>
        <td>${item.sexy || "-"}</td>
        <td>${item.pure || "-"}</td>
        <td>${item.warm || "-"}</td>
        <td>${item.cool || "-"}</td>
        <td>${item.tag1 || "-"}</td>
        <td>${item.tag2 || "-"}</td>
        <td>${item.insuit || "-"}</td>
        <td>${item.pose || "-"}</td>
        <td>${item.animated || "-"}</td>
        <td>
          <img src="${item.img}" width="60"
          onerror="this.src='https://via.placeholder.com/60'">
        </td>
      </tr>
    `;
  });

  html += "</table>";
  container.innerHTML = html;
}