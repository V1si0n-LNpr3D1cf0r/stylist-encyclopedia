let allItems = [];
let filteredItems = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 100;
let isCardView = false;

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('search').addEventListener('input', filter);
  document.getElementById('typeFilter').addEventListener('change', filter);
  document.getElementById('rarityFilter').addEventListener('change', filter);
  loadAllData();
});

function loadAllData() {
  const dataFiles = [
    'hair', 'dress', 'coat', 'top', 'bottom', 'hosiery', 
    'shoes', 'makeup', 'accessory', 'soul'
  ];
  let loadedCount = 0;

  dataFiles.forEach(type => {
    fetch(`data_${type}.json`)
      .then(res => res.json())
      .then(data => {
        allItems.push(...data);
        loadedCount++;
        if (loadedCount === dataFiles.length) 
          filteredItems = allItems.filter(item => item.type === 'hair' || item.subtype === 'hair');
          populateTypeFilter();
          displayPage(filteredItems);
          document.getElementById('loading').style.display = 'none';
        }
      })
      .catch(err => {
        console.error('Load error for ' + type + ':', err);
        loadedCount++;
        if (loadedCount === dataFiles.length) {
          filteredItems = allItems.filter(item => item.type === 'hair' || item.subtype === 'hair');
          populateTypeFilter();
          displayPage(filteredItems);
          document.getElementById('loading').style.display = 'none';
        }
      });
  });
}

function populateTypeFilter() {
  const select = document.getElementById('typeFilter');
  select.innerHTML = '<option value="">All Types</option>';
  
  // ✅ YOUR EXACT ORDER - not random!
  const exactOrder = ['hair', 'dress', 'coat', 'top', 'bottom', 'hosiery', 'shoes', 'makeup', 'accessory', 'soul'];
  
  exactOrder.forEach(type => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = type.charAt(0).toUpperCase() + type.slice(1).replace(/^\w/, c => c.toUpperCase());
    select.appendChild(option);
  });
}

function filter() {
  const search = document.getElementById('search').value.toLowerCase();
  const type = document.getElementById('typeFilter').value;
  const rarity = document.getElementById('rarityFilter').value;

  filteredItems = allItems.filter(item => 
    item.name.toLowerCase().includes(search) &&
    (type === '' || item.type === type || item.subtype === type) &&
    (rarity === '' || item.rarity == rarity)
  );
  
  currentPage = 1;
  displayPage(filteredItems);
}

function displayPage(items) {
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageItems = items.slice(start, end);

  const container = document.getElementById('results');
  
  if (isCardView) {
    container.innerHTML = createCardView(pageItems) + createPagination(totalPages, items.length);
  } else {
    container.innerHTML = createTableView(pageItems) + createPagination(totalPages, items.length);
  }
}

function createTableView(items) {
  let html = `
    <table>
      <thead>
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
          <th>Image</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  items.forEach(item => {
    html += `
      <tr>
        <td>${item.name}</td>
        <td>${item.type}</td>
        <td>${item.subtype}</td>
        <td>${item.rarity}❤</td>
        <td>${item.gorgeous || '-'}</td>
        <td>${item.simple || '-'}</td>
        <td>${item.elegant || '-'}</td>
        <td>${item.lively || '-'}</td>
        <td>${item.mature || '-'}</td>
        <td>${item.cute || '-'}</td>
        <td>${item.sexy || '-'}</td>
        <td>${item.pure || '-'}</td>
        <td>${item.warm || '-'}</td>
        <td>${item.cool || '-'}</td>
        <td>${item.tag1 || '-'}</td>
        <td>${item.tag2 || '-'}</td>
        <td>${item.insuit ? 'Yes' : 'No'}</td>
        <td>${item.pose ? 'Yes' : 'No'}</td>
        <td>${item.animated ? 'Yes' : 'No'}</td>
        <td><img src="${item.img}" width="60" onerror="this.src='https://via.placeholder.com/60'"></td>
      </tr>
    `;
  });
  
  html += '</tbody></table>';
  return html;
}

function createCardView(items) {
  let html = '<div class="cards">';
  items.forEach(item => {
    html += `
      <div class="card" title="${item.name} (${item.rarity}❤)">
        <img src="${item.img}" onerror="this.src='https://via.placeholder.com/80'">
        <div>${item.name}</div>
        <div>${item.type} | ${item.rarity}❤</div>
      </div>
    `;
  });
  html += '</div>';
  return html;
}

function createPagination(totalPages, totalItems) {
  let html = `<p>Showing ${Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of ${totalItems} items</p>`;
  html += '<div class="pagination">';
  
  if (currentPage > 1) {
    html += `<button onclick="currentPage--; displayPage(filteredItems)">← Prev</button>`;
  }
  
  for (let i = 1; i <= Math.min(5, totalPages); i++) {
    html += `<button onclick="currentPage=${i}; displayPage(filteredItems)" ${i===currentPage?'class="active"':''}>${i}</button>`;
  }
  
  if (currentPage < totalPages) {
    html += `<button onclick="currentPage++; displayPage(filteredItems)">Next →</button>`;
  }
  
  html += '</div>';
  return html;
}

function toggleView() {
  isCardView = !isCardView;
  displayPage(filteredItems);
}
