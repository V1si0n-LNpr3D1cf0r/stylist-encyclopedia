let allItems = [];
let filteredItems = [];
let savedItems = new Set();
let currentPage = 1;
let currentSaveFilter = 'all';
const ITEMS_PER_PAGE = 30;
let isCardView = false;
let loadingTimeout = null;

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('search').addEventListener('input', filter);
  document.getElementById('typeFilter').addEventListener('change', filter);
  document.getElementById('rarityFilter').addEventListener('change', filter);
  document.getElementById('categoryFilter').addEventListener('change', filter);
  document.getElementById('mainColorFilter').addEventListener('change', filter);
  document.getElementById('otherColorFilter').addEventListener('change', filter);
  document.getElementById('tag1Filter').addEventListener('change', filter);
  document.getElementById('tag2Filter').addEventListener('change', filter);

  loadSavedItems();
  startLoadingWithTimeout();
});

function getImageUrl(item) {
  const base = "https://V1si0n-LNpr3D1cf0r.github.io/";

  const repoMap = {
    makeup: "mn-dump-makeup-b1",
    hair: "mn-dump-hair-b1",
    dress: "mn-dump-dress-b1",
    coat: "mn-dump-coat-b1",
    top: "mn-dump-top-b1",
    bottom: "mn-dump-bottom-b1",
    hosiery: "mn-dump-hosiery-b1",
    shoes: "mn-dump-shoes-b1",
    accessory: "mn-dump-accessory-b1",
    soul: "mn-dump-soul-b1"
  };

  const type = item.type || item.subtype;
  const repo = repoMap[type];

  if (!repo || !item.id) {
    return "https://placehold.co/400x400?text=No+Image";
  }

  return `${base}${repo}/${item.id}.png`;
}

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
  filteredItems.forEach(item => {
    if (item && item.id) {
      savedItems.add(item.id);
    }
  });

  saveFavorites();
  filter();
}

  saveFavorites();
  displayPage(filteredItems);

function removeAllFavorites() {
  filteredItems.forEach(item => {
    if (item && item.id) {
      savedItems.delete(item.id);
    }
  });

  saveFavorites();
  filter();
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

  const filters = [
    'typeFilter',
    'rarityFilter',
    'categoryFilter',
    'mainColorFilter',
    'otherColorFilter',
    'tag1Filter',
    'tag2Filter'
  ];

  filters.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.selectedIndex = 0;
    }
  });

  currentSaveFilter = 'all';
  updateSaveFilterButtons();

  filter();
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
const seen = new Set();

allItems.forEach((item, i) => {
  if (!item.id || seen.has(item.id)) {
    item.id = `item_${i}`;
  }
  seen.add(item.id);
});
  
  const exactOrder = ['hair', 'dress', 'coat', 'top', 'bottom', 'hosiery', 'shoes', 'makeup', 'accessory', 'soul'];
  allItems.sort((a, b) => {
    const aIndex = exactOrder.indexOf(a.type || a.subtype || '');
    const bIndex = exactOrder.indexOf(b.type || b.subtype || '');
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });
  
  console.log(`🎉 TOTAL: ${allItems.length} items - HAIR FIRST`);
  console.log("ALL:", allItems.length);
  console.log("FILTERED:", filteredItems.length);
  updateSaveCounter(); populateAllFilters(); filter(); document.getElementById('loading').style.display = 'none';
}

function populateAllFilters() {
  populateTypeFilter(); populateCategoryFilter(); populateColorFilters(); populateExtraFilters();
}

function filter() {
  let tempFiltered = allItems.filter(item => {
    const search = document.getElementById('search').value.toLowerCase();
    const type = document.getElementById('typeFilter').value;
    const rarity = document.getElementById('rarityFilter').value;
    const category = document.getElementById('categoryFilter').value;

    const mainColor = document.getElementById('mainColorFilter').value;
    const otherColor = document.getElementById('otherColorFilter').value;
    const tag1 = document.getElementById('tag1Filter').value;
    const tag2 = document.getElementById('tag2Filter').value;

    const matchTag1 = !tag1 || item.tag1 === tag1 || item.tag2 === tag1;
    const matchTag2 = !tag2 || item.tag1 === tag2 || item.tag2 === tag2;

    const matchMainColor = !mainColor || item.maincolor === mainColor || item.othercolor === mainColor;
    const matchOtherColor = !otherColor || item.maincolor === otherColor || item.othercolor === otherColor;

    return (
      (item.name || "").toLowerCase().includes(search) &&
      (!type || item.type === type || item.subtype === type) &&
      (!rarity || Number(item.rarity) === Number(rarity)) &&

      (!category || (item.category || "") === category) &&

      matchMainColor &&
      matchOtherColor &&
      matchTag1 &&
      matchTag2
    );
  });

  switch(currentSaveFilter) {
    case 'saved':
      tempFiltered = tempFiltered.filter(item => savedItems.has(item.id));
      break;
    case 'unsaved':
      tempFiltered = tempFiltered.filter(item => !savedItems.has(item.id));
      break;
  }

filteredItems = tempFiltered;

const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
if (currentPage > totalPages) {
  currentPage = totalPages || 1;
}

displayPage(filteredItems);
}

function showItemDetail(item) {
  const content = document.getElementById('itemDetailContent');
  const isSaved = savedItems.has(item.id);
  
  const stats = [];
  const statFields = ['gorgeous', 'simple', 'elegant', 'lively', 'mature', 'cute', 'sexy', 'pure', 'warm', 'cool'];
  statFields.forEach(stat => {
    if (item[stat] && item[stat] !== '-' && item[stat] !== '0') {
      stats.push(`${stat.charAt(0).toUpperCase() + stat.slice(1)}: ${item[stat]}`);
    }
  });
  
  const tags = [];
  if (item.tag1) tags.push(item.tag1);
  if (item.tag2) tags.push(item.tag2);
  
  content.innerHTML = `
    <div style="text-align: center; padding: 30px 20px 20px;">
      <img src="${getImageUrl(item)}" style="width: 220px; height: 220px; object-fit: cover; border-radius: 20px; box-shadow: 0 15px 40px rgba(0,0,0,0.3); margin-bottom: 25px;">
      
      <h2 style="color: #d63384; margin: 0 0 20px 0; font-size: 1.8em;">
        ${item.name} 
        <span style="font-size: 1.3em; color: #ff69b4;">${item.rarity || 0}♥</span>
      </h2>
      
      <div style="background: linear-gradient(135deg, #fff5f8, #ffe4e6); padding: 25px; border-radius: 20px; margin: 20px 0; border: 2px solid #ffd6e7;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; font-size: 15px; margin-bottom: 20px;">
          ${item.type ? `<div><strong>Type:</strong> ${item.type}${item.subtype ? ' / ' + item.subtype : ''}</div>` : ''}
          ${item.category ? `<div><strong>Category:</strong> ${item.category}</div>` : ''}
          ${item.maincolor ? `<div><strong>Main Color:</strong> ${item.maincolor}</div>` : ''}
          ${item.othercolor ? `<div><strong>Other Color:</strong> ${item.othercolor}</div>` : ''}
          ${item.inasuit ? `<div><strong>Suit:</strong> ${item.inasuit}</div>` : ''}
          ${tags.length ? `<div><strong>Tags:</strong> ${tags.join(', ')}</div>` : ''}
        </div>
        
        ${stats.length ? `
          <div style="background: rgba(255,255,255,0.7); padding: 20px; border-radius: 15px; border-left: 5px solid #ff69b4;">
            <strong style="color: #d63384; font-size: 16px;">Stats:</strong><br>
            ${stats.join(' | ')}
          </div>
        ` : ''}
      </div>
      
      <div style="padding: 20px 0;">
        <label style="display: inline-flex; align-items: center; gap: 12px; cursor: pointer; font-size: 18px; background: white; padding: 15px 25px; border-radius: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 2px solid #ffd6e7;">
          <input type="checkbox" ${isSaved ? 'checked' : ''} onchange="toggleFavorite('${item.id}'); showItemDetail(${JSON.stringify(item).replace(/"/g, '&quot;')})" style="width: 22px; height: 22px; accent-color: #ff69b4;">
          <span style="color: #333; font-weight: 600;">${isSaved ? '⭐ Saved' : '💾 Save Item'}</span>
        </label>
      </div>
    </div>
  `;
  document.getElementById('itemDetailModal').style.display = 'block';
}

function closeItemDetail() {
  document.getElementById('itemDetailModal').style.display = 'none';
}

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

function populateCategoryFilter() {
  const category = ['Apple', 'Lilith', 'Cloud', 'Pigeon', 'North', 'Wasteland', 'Ruin', 'Story Suit', 'Classic', 'Luxury', 'Festivals', 'Troupe', '4 Seasons', 'Stars', 'Happiness', 'Wonder Museum', 'Fairytale', 'Gallery'];
  const select = document.getElementById('categoryFilter');
  select.innerHTML = '<option value="">All Category</option>';
  category.forEach(category => {
    const option = document.createElement('option');
    option.value = category; option.textContent = category;
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

function populateExtraFilters() {
  const otherColors = [...new Set(allItems.map(i => i.othercolor).filter(Boolean))];
  const tag1s = [...new Set(allItems.map(i => i.tag1).filter(Boolean))];
  const tag2s = [...new Set(allItems.map(i => i.tag2).filter(Boolean))];

  fillSelect('otherColorFilter', otherColors);
  fillSelect('tag1Filter', tag1s);
  fillSelect('tag2Filter', tag2s);
}

function fillSelect(id, values) {
  const select = document.getElementById(id);

  const labels = {
    otherColorFilter: "All Other Colors",
    tag1Filter: "All Tag 1",
    tag2Filter: "All Tag 2"
  };

  select.innerHTML = `<option value="">${labels[id] || "All"}</option>`;

  values.sort().forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    select.appendChild(opt);
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
    html += `
      <div class="card">
        <div class="card-content" onclick="showItemDetail(${JSON.stringify(item).replace(/"/g, '&quot;')})">
          <img src="${getImageUrl(item)}" onerror="this.src='https://placehold.co/400x400?text=No+Image'" class="card-image">
          <div class="card-name">${item.name}</div>
          <div class="card-type">${item.type} | ${item.rarity || 0}♥</div>
          <div class="card-desc">${item.desc ? item.desc : 'No description yet.'}</div>
        </div>
        <label class="card-checkbox-label">
          <input type="checkbox" ${savedItems.has(item.id)?'checked':''} 
                 onchange="toggleFavorite('${item.id}'); filter()" 
                 class="card-checkbox">
        </label>
      </div>
    `;
  });
  return html + '</div>';
}

function createTableView(items) {
  let html = `<table><thead><tr><th>Save</th><th>Name</th><th>Type</th><th>Sub Type</th><th>Rarity</th><th>Gorgeous</th><th>Simple</th><th>Elegant</th><th>Lively</th><th>Mature</th><th>Cute</th><th>Sexy</th><th>Pure</th><th>Warm</th><th>Cool</th><th>Main Color</th><th>Other Color</th><th>Category</th><th>Suit</th><th>Tag 1</th><th>Tag 2</th><th>In Suit</th><th>Pose</th><th>Animated</th><th>Image</th></tr></thead><tbody>`;
  items.forEach(item => {
    html += `<tr><td><input type="checkbox" ${savedItems.has(item.id)?'checked':''} onchange="toggleFavorite('${item.id}')" class="save-checkbox"></td><td>${item.name||'-'}</td><td>${item.type||'-'}</td><td>${item.subtype||'-'}</td><td>${item.rarity||0}♥</td><td>${item.gorgeous||'-'}</td><td>${item.simple||'-'}</td><td>${item.elegant||'-'}</td><td>${item.lively||'-'}</td><td>${item.mature||'-'}</td><td>${item.cute||'-'}</td><td>${item.sexy||'-'}</td><td>${item.pure||'-'}</td><td>${item.warm||'-'}</td><td>${item.cool||'-'}</td><td>${item.maincolor||'-'}</td><td>${item.othercolor||'-'}</td><td>${item.category||'-'}</td><td>${item.suit||'-'}</td><td>${item.tag1||'-'}</td><td>${item.tag2||'-'}</td><td>${item.inasuit?'Yes':'No'}</td><td>${item.pose?'Yes':'No'}</td><td>${item.animated?'Yes':'No'}</td><td><img src="${getImageUrl(item)}" width="60" onerror="this.src='https://placehold.co/400x400?text=No+Image'"></td></tr>`;
  });
  return html + '</tbody></table>';
}

function createPagination(totalPages, totalItems) {
  let html = `<p>Showing ${Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of ${totalItems} items</p>`;
  html += `<div class="pagination">`;

  if (currentPage > 1) {
    html += `<button onclick="currentPage--;displayPage(filteredItems)">←</button>`;
  }

  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, currentPage + 2);

  if (currentPage <= 3) {
    start = 1;
    end = Math.min(5, totalPages);
  }
  if (currentPage >= totalPages - 2) {
    start = Math.max(1, totalPages - 4);
    end = totalPages;
  }

  for (let i = start; i <= end; i++) {
    html += `<button onclick="currentPage=${i};displayPage(filteredItems)" ${i === currentPage ? 'class="active"' : ''}>${i}</button>`;
  }

  if (currentPage < totalPages) {
    html += `<button onclick="currentPage++;displayPage(filteredItems)">→</button>`;
  }

  html += `</div>`;
  return html;
}

function toggleView() { isCardView = !isCardView; displayPage(filteredItems); }
function forceCompleteLoading() { console.log('🚨 TIMEOUT'); completeLoading(); }
function closeImageModal() { document.getElementById('imageModal').style.display = 'none'; }
function toggleInfo() {
  document.getElementById('infoModal').style.display = 
    document.getElementById('infoModal').style.display === 'block' ? 'none' : 'block';

}