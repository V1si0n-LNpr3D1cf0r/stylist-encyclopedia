let allItems = [];
let filteredItems = [];
let savedItems = new Set();
let currentPage = 1;
const ITEMS_PER_PAGE = 50;
let isCardView = false;

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('search').addEventListener('input', filter);
  document.getElementById('typeFilter').addEventListener('change', filter);
  document.getElementById('rarityFilter').addEventListener('change', filter);
  
  // Load saved items first
  loadSavedItems();
  loadAllData();
});

function loadSavedItems() {
  try {
    const saved = localStorage.getItem('stylistFavorites');
    if (saved) {
      savedItems = new Set(JSON.parse(saved));
    }
    updateSaveCounter();
  } catch (e) {
    console.error('Error loading saved items:', e);
  }
}

function saveFavorites() {
  try {
    localStorage.setItem('stylistFavorites', JSON.stringify(Array.from(savedItems)));
    updateSaveCounter();
  } catch (e) {
    console.error('Error saving favorites:', e);
  }
}

function updateSaveCounter() {
  const saveCountEl = document.getElementById('saveCount');
  const totalCountEl = document.getElementById('totalCount');
  const counterText = document.getElementById('saveCounterText');
  
  if (saveCountEl && totalCountEl) {
    saveCountEl.textContent = savedItems.size;
    totalCountEl.textContent = allItems.length;
  }
}

function toggleFavorite(id) {
  if (savedItems.has(id)) {
    savedItems.delete(id);
  } else {
    savedItems.add(id);
  }
  saveFavorites();
}

function saveAllFavorites() {
  // Save ALL items on current page
  filteredItems.forEach(item => {
    if (item.id) savedItems.add(item.id);
  });
  saveFavorites();
  displayPage(filteredItems); // Refresh to update checkboxes
}

function removeAllFavorites() {
  // Remove ALL items on current page from saved
  filteredItems.forEach(item => {
    if (item.id) savedItems.delete(item.id);
  });
  saveFavorites();
  displayPage(filteredItems); // Refresh to update checkboxes
}

function toggleInfo() {
  const modal = document.getElementById('infoModal');
  modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
}

function showFullImage(imgSrc) {
  const modal = document.getElementById('imageModal');
  const fullImg = document.getElementById('fullImage');
  fullImg.src = imgSrc;
  modal.style.display = 'block';
}

function closeImageModal() {
  document.getElementById('imageModal').style.display = 'none';
}

function loadAllData() {
  const dataFiles = [
    'hair', 'dress', 'coat', 'top', 'bottom', 'hosiery', 
    'shoes', 'makeup', 'accessory', 'soul'
  ];
  let loadedCount = 0;

  const checkComplete = () => {
    loadedCount++;
    if (loadedCount >= dataFiles.length) {
      console.log(`✅ Loaded ${allItems.length} total items`);
      updateSaveCounter(); // ✅ FIX: Update counter after loading
      if (allItems.length === 0) {
        document.getElementById('loading').innerHTML = '❌ No data files found! Check your data_*.json files.';
      } else {
        // Add unique IDs to items if missing
        allItems.forEach((item, index) => {
          if (!item.id) item.id = `item_${index}_${Date.now()}`;
        });
        filteredItems = allItems.filter(item => item.type === 'hair' || item.subtype === 'hair');
        populateTypeFilter();
        displayPage(filteredItems);
        document.getElementById('loading').style.display = 'none';
      }
    } else {
      document.getElementById('loading').textContent = `Loading... (${loadedCount}/${dataFiles.length})`;
    }
  };

  dataFiles.forEach(type => {
    fetch(`data_${type}.json`)
      .then(res => {
        if (!res.ok) return Promise.reject(`File not found: data_${type}.json`);
        return res.json();
      })
      .then(data => {
        console.log(`✅ Loaded data_${type}.json: ${data.length} items`);
        allItems.push(...data);
        checkComplete();
      })
      .catch(err => {
        console.warn(`⚠️ ${err}`);
        checkComplete();
      });
  });
}

function populateTypeFilter() {
  const select = document.getElementById('typeFilter');
  select.innerHTML = '<option value="">All Types</option>';
  
  const exactOrder = ['hair', 'dress', 'coat', 'top', 'bottom', 'hosiery', 'shoes', 'makeup', 'accessory', 'soul'];
  
  exactOrder.forEach(type => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
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
          <th>Save</th><th>Name</th><th>Type</th><th>Sub Type</th><th>Rarity</th>
          <th>Gorgeous</th><th>Simple</th><th>Elegant</th><th>Lively</th><th>Mature</th>
          <th>Cute</th><th>Sexy</th><th>Pure</th><th>Warm</th><th>Cool</th>
          <th>Main Color</th><th>Other Color</th><th>Nation</th><th>Suit</th>
          <th>Tag 1</th><th>Tag 2</th><th>In Suit</th><th>Pose</th><th>Animated</th><th>Image</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  items.forEach(item => {
    const isSaved = savedItems.has(item.id);
    html += `
      <tr>
        <td><input type="checkbox" ${isSaved ? 'checked' : ''} onchange="toggleFavorite('${item.id}')" class="save-checkbox"></td>
        <td>${item.name || '-'}</td>
        <td>${item.type || '-'}</td>
        <td>${item.subtype || '-'}</td>
        <td>${item.rarity || 0}❤</td>
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
        <td>${item.maincolor || '-'}</td>
        <td>${item.othercolor || '-'}</td>
        <td>${item.nation || '-'}</td>
        <td>${item.suit || '-'}</td>
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
    const isSaved = savedItems.has(item.id);
    html += `
      <div class="card" onclick="showFullImage('${item.img}')">
        <input type="checkbox" ${isSaved ? 'checked' : ''} onchange="toggleFavorite('${item.id}')" class="card-checkbox">
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
  let html = `<p>Showing ${Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of ${totalItems} items (Total: ${allItems.length})</p>`;
  html += '<div class="pagination">';
  if (currentPage > 1) html += `<button onclick="currentPage--; displayPage(filteredItems)">← Prev</button>`;
  for (let i = 1; i <= Math.min(5, totalPages); i++) {
    html += `<button onclick="currentPage=${i}; displayPage(filteredItems)" ${i===currentPage?'class="active"':''}>${i}</button>`;
  }
  if (currentPage < totalPages) html += `<button onclick="currentPage++; displayPage(filteredItems)">Next →</button>`;
  html += '</div>';
  return html;
}

function toggleView() {
  isCardView = !isCardView;
  displayPage(filteredItems);
}

