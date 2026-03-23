let allItems = [];
let filteredItems = [];
let savedItems = new Set();
let currentPage = 1;
let currentSaveFilter = 'all';
const ITEMS_PER_PAGE = 100;
let isCardView = false;
let loadingTimeout = null;

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('search').addEventListener('input', filter);
  document.getElementById('typeFilter').addEventListener('change', filter);
  document.getElementById('rarityFilter').addEventListener('change', filter);
  document.getElementById('nationFilter').addEventListener('change', filter);
  document.getElementById('mainColorFilter').addEventListener('change', filter);
  
  loadSavedItems();
  startLoadingWithTimeout();
});

function loadSavedItems() {
  try {
    const saved = localStorage.getItem('stylistFavorites');
    if (saved) savedItems = new Set(JSON.parse(saved));
  } catch(e) { console.error('Saved items load error:', e); }
}

function saveFavorites() {
  try {
    localStorage.setItem('stylistFavorites', JSON.stringify(Array.from(savedItems)));
    updateSaveCounter();
  } catch(e) { console.error('Save error:', e); }
}

function updateSaveCounter() {
  document.getElementById('saveCount').textContent = savedItems.size;
  document.getElementById('totalCount').textContent = allItems.length;
}

function toggleFavorite(id) {
  if (savedItems.has(id)) savedItems.delete(id);
  else savedItems.add(id);
  saveFavorites();
  filter();
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

function filterSavedItems() {
  currentSaveFilter = 'saved'; updateSaveFilterButtons(); filter();
}
function filterUnsavedItems() { currentSaveFilter = 'unsaved'; updateSaveFilterButtons(); filter(); }
function filterAllItems() { currentSaveFilter = 'all'; updateSaveFilterButtons(); filter(); }

function updateSaveFilterButtons() {
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(currentSaveFilter + 'FilterBtn').classList.add('active');
}

function clearAllFilters() {
  document.getElementById('search').value = '';
  ['typeFilter','rarityFilter','nationFilter','mainColorFilter'].forEach(id => 
    document.getElementById(id).value = '');
  filterAllItems(); filter();
}

function startLoadingWithTimeout() {
  loadingTimeout = setTimeout(forceCompleteLoading, 10000);
  const dataFiles = ['hair','dress','coat','top','bottom','hosiery','shoes','makeup','accessory','soul'];
  let loadedCount = 0;
  dataFiles.forEach(type => {
    fetch(`data_${type}.json`).then(res => res.ok ? res.json() : [])
      .then(data => { allItems.push(...data); loadedCount++; if (loadedCount === dataFiles.length) completeLoading(); })
      .catch(() => { loadedCount++; if (loadedCount === dataFiles.length) completeLoading(); });
  });
}

function completeLoading() {
  clearTimeout(loadingTimeout);
  allItems.forEach((item, i) => { if (!item.id) item.id = `item_${i}`; });
  console.log(`🎉 TOTAL: ${allItems.length} items`);
  updateSaveCounter(); populateAllFilters(); filter(); document.getElementById('loading').style.display = 'none';
}

function populateAllFilters() {
  populateTypeFilter(); populateNationFilter(); populateColorFilters();
}

// 🔥 NEW: CARD VIEW DETAIL POPUP
function showItemDetail(item) {
  const content = document.getElementById('itemDetailContent');
  const isSaved = savedItems.has(item.id);
  
  content.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <img src="${item.img}" style="width: 200px; height: 200px; object-fit: cover; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); margin-bottom: 20px;">
      <h2 style="color: #d63384; margin: 10px 0;">${item.name} <span style="font-size: 1.2em;">${item.rarity || 0}❤</span></h2>
      
      <div style="background: #f8f1f5; padding: 20px; border-radius: 12px; margin: 15px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
        <div><strong>Type:</strong> ${item.type || '-'} / ${item.subtype || '-'}</div>
        <div><strong>Nation:</strong> ${item.nation || '-'}</div>
        <div><strong>Main Color:</strong> ${item.maincolor || '-'}</div>
        <div><strong>Other Color:</strong> ${item.othercolor || '-'}</div>
        <div><strong>Suit:</strong> ${item.suit || '-'}</div>
        <div><strong>Tags:</strong> ${[item.tag1, item.tag2].filter(Boolean).join(', ') || 'None'}</div>
      </div>
      
      <div style="background: #fff5f8; padding: 20px; border-radius: 12px; border-left: 5px solid #ff69b4;">
        <strong style="color: #d63384;">Stats:</strong><br>
        Gorgeous: ${item.gorgeous || '-'} | Simple: ${item.simple || '-'} | Elegant: ${item.elegant || '-'}<br>
        Lively: ${item.lively || '-'} | Mature: ${item.mature || '-'} | Cute: ${item.cute || '-'}<br>
        Sexy: ${item.sexy || '-'} | Pure: ${item.pure || '-'} | Warm: ${item.warm || '-'} | Cool: ${item.cool || '-'}
      </div>
      
      <div style="margin-top: 20px;">
        <label style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; font-size: 16px;">
          <input type="checkbox" ${isSaved ? 'checked' : ''} onchange="toggleFavorite('${item.id}'); showItemDetail(${JSON.stringify(item).replace(/"/g, '&quot;')})" style="width: 20px; height: 20px; accent-color: #ff69b4;">
          <span>${isSaved ? '⭐ Saved' : '💾 Save Item'}</span>
        </label>
      </div>
    </div>
  `;
  document.getElementById('itemDetailModal').style.display = 'block';
}

function closeItemDetail() {
  document.getElementById('itemDetailModal').style.display = 'none';
}

function filter() {
  let tempFiltered = allItems.filter(item => {
    const search = document.getElementById('search').value.toLowerCase();
    const type = document.getElementById('typeFilter').value;
    const rarity = document.getElementById('rarityFilter').value;
    const nation = document.getElementById('nationFilter').value;
    const mainColor = document.getElementById('mainColorFilter').value;
    
    return item.name.toLowerCase().includes(search) &&
           (!type || item.type === type || item.subtype === type) &&
           (!rarity || item.rarity == rarity) &&
           (!nation || item.nation === nation) &&
           (!mainColor || item.maincolor === mainColor);
  });

  switch(currentSaveFilter) {
    case 'saved': tempFiltered = tempFiltered.filter(item => savedItems.has(item.id)); break;
    case 'unsaved': tempFiltered = tempFiltered.filter(item => !savedItems.has(item.id)); break;
  }
  
  filteredItems = tempFiltered; currentPage = 1; displayPage(filteredItems);
}

// [Rest of functions - populate filters, table/card views, etc. same as before]
function populateTypeFilter() {
  const select = document.getElementById('typeFilter');
  select.innerHTML = '<option value="">All Types</option>';
  ['hair','dress','coat','top','bottom','hosiery','shoes','makeup','accessory','soul']
    .forEach(type => {
      const option = document.createElement('option');
      option.value = type; option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
      select.appendChild(option);
    });
}

function populateNationFilter() {
  const nations = ['Apple Federal', 'Lilith Kingdom', 'Cloud Empire', 'Pigeon Kingdom', 'North Kingdom', 'Republic of Wasteland', 'Ruin Island'];
  const select = document.getElementById('nationFilter');
  select.innerHTML = '<option value="">All Nations</option>';
  nations.forEach(nation => {
    const option = document.createElement('option');
    option.value = nation; option.textContent = nation;
    select.appendChild(option);
  });
}

function populateColorFilters() {
  const colors = [...new Set(allItems.map(item => item.maincolor).filter(Boolean))].sort().slice(0, 20);
  const select = document.getElementById('mainColorFilter');
  select.innerHTML = '<option value="">All Main Colors</option>';
  colors.forEach(color => {
    const option = document.createElement('option');
    option.value = color; option.textContent = color;
    select.appendChild(option);
  });
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

function createCardView(items) {
  let html = '<div class="cards">';
  items.forEach(item => {
    html += `<div class="card" onclick="showItemDetail(${JSON.stringify(item).replace(/"/g, '&quot;')})">
      <input type="checkbox" ${savedItems.has(item.id)?'checked':''} onchange="toggleFavorite('${item.id}')" class="card-checkbox">
      <img src="${item.img}" onerror="this.src='https://via.placeholder.com/80'">
      <div>${item.name}</div><div>${item.type} | ${item.rarity}❤</div>
    </div>`;
  });
  return html + '</div>';
}

function createTableView(items) {
  let html = `<table><thead><tr><th>Save</th><th>Name</th><th>Type</th><th>Sub Type</th><th>Rarity</th><th>Gorgeous</th><th>Simple</th><th>Elegant</th><th>Lively</th><th>Mature</th><th>Cute</th><th>Sexy</th><th>Pure</th><th>Warm</th><th>Cool</th><th>Main Color</th><th>Other Color</th><th>Nation</th><th>Suit</th><th>Tag 1</th><th>Tag 2</th><th>In Suit</th><th>Pose</th><th>Animated</th><th>Image</th></tr></thead><tbody>`;
  items.forEach(item => {
    html += `<tr><td><input type="checkbox" ${savedItems.has(item.id)?'checked':''} onchange="toggleFavorite('${item.id}')" class="save-checkbox"></td><td>${item.name||'-'}</td><td>${item.type||'-'}</td><td>${item.subtype||'-'}</td><td>${item.rarity||0}❤</td><td>${item.gorgeous||'-'}</td><td>${item.simple||'-'}</td><td>${item.elegant||'-'}</td><td>${item.lively||'-'}</td><td>${item.mature||'-'}</td><td>${item.cute||'-'}</td><td>${item.sexy||'-'}</td><td>${item.pure||'-'}</td><td>${item.warm||'-'}</td><td>${item.cool||'-'}</td><td>${item.maincolor||'-'}</td><td>${item.othercolor||'-'}</td><td>${item.nation||'-'}</td><td>${item.suit||'-'}</td><td>${item.tag1||'-'}</td><td>${item.tag2||'-'}</td><td>${item.insuit?'Yes':'No'}</td><td>${item.pose?'Yes':'No'}</td><td>${item.animated?'Yes':'No'}</td><td><img src="${item.img}" width="60" onerror="this.src='https://via.placeholder.com/60'"></td></tr>`;
  });
  return html + '</tbody></table>';
}

function createPagination(totalPages, totalItems) {
  let html = `<p>Showing ${Math.min(currentPage*ITEMS_PER_PAGE,totalItems)} of ${totalItems} items</p><div class="pagination">`;
  if (currentPage > 1) html += `<button onclick="currentPage--;displayPage(filteredItems)">← Prev</button>`;
  for (let i = 1; i <= Math.min(5, totalPages); i++) html += `<button onclick="currentPage=${i};displayPage(filteredItems)" ${i===currentPage?'class="active"':''}>${i}</button>`;
  if (currentPage < totalPages) html += `<button onclick="currentPage++;displayPage(filteredItems)">Next →</button>`;
  return html + '</div>';
}

function toggleView() { isCardView = !isCardView; displayPage(filteredItems); }
function forceCompleteLoading() { console.log('🚨 TIMEOUT'); completeLoading(); }
function closeImageModal() { document.getElementById('imageModal').style.display = 'none'; }
function toggleInfo() {
  document.getElementById('infoModal').style.display = 
    document.getElementById('infoModal').style.display === 'block' ? 'none' : 'block';
}
