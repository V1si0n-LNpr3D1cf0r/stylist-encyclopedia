let allItems = [];
let filteredItems = [];
let savedItems = new Set();
let currentPage = 1;
const ITEMS_PER_PAGE = 100;
let isCardView = false;
let loadingTimeout = null;

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('search').addEventListener('input', filter);
  document.getElementById('typeFilter').addEventListener('change', filter);
  document.getElementById('rarityFilter').addEventListener('change', filter);
  
  loadSavedItems();
  startLoadingWithTimeout();
});

function startLoadingWithTimeout() {
  // SAFETY NET: Force complete after 10 seconds
  loadingTimeout = setTimeout(forceCompleteLoading, 10000);
  
  const dataFiles = ['hair', 'dress', 'coat', 'top', 'bottom', 'hosiery', 'shoes', 'makeup', 'accessory', 'soul'];
  let loadedCount = 0;
  
  dataFiles.forEach((type, index) => {
    fetch(`data_${type}.json`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        console.log(`✅ ${type}: ${data.length} items`);
        allItems.push(...data);
        loadedCount++;
        if (loadedCount === dataFiles.length || index === dataFiles.length - 1) {
          completeLoading();
        }
      })
      .catch(() => {
        console.warn(`⚠️ Missing: data_${type}.json`);
        loadedCount++;
        if (loadedCount === dataFiles.length) {
          completeLoading();
        }
      });
  });
}

function forceCompleteLoading() {
  console.log('🚨 TIMEOUT - forcing load complete');
  completeLoading();
}

function completeLoading() {
  clearTimeout(loadingTimeout);
  
  // Generate IDs if missing
  allItems.forEach((item, i) => {
    if (!item.id) item.id = `item_${i}`;
  });
  
  console.log(`🎉 TOTAL ITEMS: ${allItems.length}`);
  
  updateSaveCounter();
  filteredItems = allItems.filter(item => item.type === 'hair' || item.subtype === 'hair');
  populateTypeFilter();
  displayPage(filteredItems);
  document.getElementById('loading').style.display = 'none';
}

function loadSavedItems() {
  try {
    const saved = localStorage.getItem('stylistFavorites');
    if (saved) savedItems = new Set(JSON.parse(saved));
  } catch(e) {
    console.error('Saved items load error:', e);
  }
}

function saveFavorites() {
  try {
    localStorage.setItem('stylistFavorites', JSON.stringify(Array.from(savedItems)));
    updateSaveCounter();
  } catch(e) {
    console.error('Save error:', e);
  }
}

function updateSaveCounter() {
  document.getElementById('saveCount').textContent = savedItems.size;
  document.getElementById('totalCount').textContent = allItems.length;
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
  filteredItems.forEach(item => savedItems.add(item.id));
  saveFavorites();
  displayPage(filteredItems);
}

function removeAllFavorites() {
  filteredItems.forEach(item => savedItems.delete(item.id));
  saveFavorites();
  displayPage(filteredItems);
}

// Rest of functions unchanged...
function toggleInfo() {
  document.getElementById('infoModal').style.display = 
    document.getElementById('infoModal').style.display === 'block' ? 'none' : 'block';
}

function showFullImage(imgSrc) {
  document.getElementById('fullImage').src = imgSrc;
  document.getElementById('imageModal').style.display = 'block';
}

function closeImageModal() {
  document.getElementById('imageModal').style.display = 'none';
}

function populateTypeFilter() {
  const select = document.getElementById('typeFilter');
  select.innerHTML = '<option value="">All Types</option>';
  ['hair', 'dress', 'coat', 'top', 'bottom', 'hosiery', 'shoes', 'makeup', 'accessory', 'soul']
    .forEach(type => {
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
    (!type || item.type === type || item.subtype === type) &&
    (!rarity || item.rarity == rarity)
  );
  currentPage = 1;
  displayPage(filteredItems);
}

function displayPage(items) {
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageItems = items.slice(start, end);

  document.getElementById('results').innerHTML = 
    isCardView ? createCardView(pageItems) + createPagination(totalPages, items.length)
               : createTableView(pageItems) + createPagination(totalPages, items.length);
}

function createTableView(items) {
  let html = `
    <table>
      <thead><tr>
        <th>Save</th><th>Name</th><th>Type</th><th>Sub Type</th><th>Rarity</th>
        <th>Gorgeous</th><th>Simple</th><th>Elegant</th><th>Lively</th><th>Mature</th>
        <th>Cute</th><th>Sexy</th><th>Pure</th><th>Warm</th><th>Cool</th>
        <th>Tag 1</th><th>Tag 2</th><th>Main Color</th><th>Other Color</th>
        <th>Nation</th><th>Suit</th><th>In Suit</th><th>Pose</th><th>Animated</th><th>Image</th>
      </tr></thead><tbody>
  `;
  items.forEach(item => {
    html += `
      <tr>
        <td><input type="checkbox" ${savedItems.has(item.id)?'checked':''} onchange="toggleFavorite('${item.id}')" class="save-checkbox"></td>
        <td>${item.name||'-'}</td><td>${item.type||'-'}</td><td>${item.subtype||'-'}</td><td>${item.rarity||0}❤</td>
        <td>${item.gorgeous||'-'}</td><td>${item.simple||'-'}</td><td>${item.elegant||'-'}</td><td>${item.lively||'-'}</td><td>${item.mature||'-'}</td>
        <td>${item.cute||'-'}</td><td>${item.sexy||'-'}</td><td>${item.pure||'-'}</td><td>${item.warm||'-'}</td><td>${item.cool||'-'}</td>
        <td>${item.tag1||'-'}</td><td>${item.tag2||'-'}</td><td>${item.maincolor||'-'}</td><td>${item.othercolor||'-'}</td>
        <td>${item.nation||'-'}</td><td>${item.suit||'-'}</td><td>${item.insuit?'Yes':'No'}</td><td>${item.pose?'Yes':'No'}</td><td>${item.animated?'Yes':'No'}</td>
        <td><img src="${item.img}" width="60" onerror="this.src='https://via.placeholder.com/60'"></td>
      </tr>`;
  });
  html += '</tbody></table>';
  return html;
}

function createCardView(items) {
  let html = '<div class="cards">';
  items.forEach(item => {
    html += `
      <div class="card" onclick="showFullImage('${item.img}')">
        <input type="checkbox" ${savedItems.has(item.id)?'checked':''} onchange="toggleFavorite('${item.id}')" class="card-checkbox">
        <img src="${item.img}" onerror="this.src='https://via.placeholder.com/80'">
        <div>${item.name}</div><div>${item.type} | ${item.rarity}❤</div>
      </div>`;
  });
  html += '</div>';
  return html;
}

function createPagination(totalPages, totalItems) {
  let html = `<p>Showing ${Math.min(currentPage*ITEMS_PER_PAGE,totalItems)} of ${totalItems} items</p>
    <div class="pagination">`;
  if (currentPage > 1) html += `<button onclick="currentPage--;displayPage(filteredItems)">← Prev</button>`;
  for (let i = 1; i <= Math.min(5, totalPages); i++) {
    html += `<button onclick="currentPage=${i};displayPage(filteredItems)" ${i===currentPage?'class="active"':''}>${i}</button>`;
  }
  if (currentPage < totalPages) html += `<button onclick="currentPage++;displayPage(filteredItems)">Next →</button>`;
  html += '</div>';
  return html;
}

function toggleView() {
  isCardView = !isCardView;
  displayPage(filteredItems);
}
