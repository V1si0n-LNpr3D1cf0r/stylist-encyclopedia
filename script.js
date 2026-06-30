let allItems = [];
let filteredItems = [];
let savedItems = new Set();
let currentPage = 1;
let currentSaveFilter = 'all';
const ITEMS_PER_PAGE = 42;
let isCardView = false;
let loadingTimeout = null;
let searchTimeout = null;

function isItemSaved(item) {
  const idSaved = savedItems.has(String(item.id));
  const niidSaved = item.niid ? savedItems.has(String(item.niid)) : false;
  return idSaved || niidSaved;
}

document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('search');
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(filter, 300);
  });

  document.getElementById('typeFilter').addEventListener('change', filter);
  document.getElementById('rarityFilter').addEventListener('change', filter);
  document.getElementById('categoryFilter').addEventListener('change', filter);
  document.getElementById('mainColorFilter').addEventListener('change', filter);
  document.getElementById('otherColorFilter').addEventListener('change', filter);

  const tertiaryFilter = document.getElementById('tertiaryColorFilter');
  if (tertiaryFilter) tertiaryFilter.addEventListener('change', filter);

  document.getElementById('tag1Filter').addEventListener('change', filter);
  document.getElementById('tag2Filter').addEventListener('change', filter);

  if (localStorage.getItem('darkMode') === 'on') {
    document.body.classList.add('dark');
  }

  loadSavedItems();
  startLoadingWithTimeout();
  loadCraftingData();
  loadChapterData();
  loadBreakdownData();
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

function getRepo(type) {

    const repoMap = {
        hair: "mn-dump-hair-b1",
        dress: "mn-dump-dress-b1",
        coat: "mn-dump-coat-b1",
        top: "mn-dump-top-b1",
        bottom: "mn-dump-bottom-b1",
        hosiery: "mn-dump-hosiery-b1",
        shoes: "mn-dump-shoes-b1",
        accessory: "mn-dump-accessory-b1",
        makeup: "mn-dump-makeup-b1",
        soul: "mn-dump-soul-b1"
    };

    return repoMap[type] || null;
}

function getImageUrl(item) {

    const repo = getRepo(item.type);

    if (!repo || !item.id)
        return "https://placehold.co/400x400?text=No+Image";

    return `https://V1si0n-LNpr3D1cf0r.github.io/${repo}/${item.id}.png`;
}

function loadSavedItems() {
  try {
    const saved = localStorage.getItem('stylistFavorites');
    if (saved) savedItems = new Set(JSON.parse(saved));
    updateSaveCounter();
  } catch(e) { console.error('Saved items load error:', e); }
}

function saveFavorites() {
  try {
    localStorage.setItem('stylistFavorites', JSON.stringify(Array.from(savedItems)));
    updateSaveCounter();
  } catch(e) { console.error('Save error:', e); }
}

function updateSaveCounter() {
  const total = allItems.length;
  const saved = savedItems.size;

  const percent = total ? Math.round((saved / total) * 100) : 0;

  document.getElementById('saveFill').style.width = percent + '%';
  document.getElementById('saveText').textContent = `${saved}/${total} (${percent}%)`;
}

function toggleFavorite(id) {
  const item = allItems.find(i => String(i.id) === String(id) || String(i.niid) === String(id));
  if (!item) return;

  const isSaved = isItemSaved(item);

  if (isSaved) {
    savedItems.delete(String(item.id));
    if (item.niid) savedItems.delete(String(item.niid));
  } else {
    savedItems.add(String(item.id));
    if (item.niid) savedItems.add(String(item.niid));
  }
  
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
    'tertiaryColorFilter', 
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
  loadingTimeout = setTimeout(forceCompleteLoading, 15000); 
  
  fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vQfXbX-O6q1yIBOGr-Jd9yx6mvu5oRGekCKajNqlGROaLDFxC7RlOLkTvAUiYdPpMlDO65-v7jKpnNf/pub?output=csv') 
    .then(res => res.ok ? res.text() : '')
    .then(text => {
      if (text) {
        allItems = parseCSV(text);
      }
      completeLoading();
    })
    .catch(err => {
      console.error('Error loading CSV directly:', err);
      completeLoading();
    });
}

function parseCSV(text) {
  let ret = [''], i = 0, p = '', s = true;
  let rows = [];
  for (let l of text) {
    if ('"' === l) {
      if (s && l === p) ret[i] += l;
      s = !s;
    } else if (',' === l && s) {
      l = ret[++i] = '';
    } else if ('\n' === l && s) {
      if ('\r' === p) ret[i] = ret[i].slice(0, -1);
      rows.push(ret);
      ret = ['']; i = 0;
    } else {
      ret[i] += l;
    }
    p = l;
  }
  if (ret[0] !== '' || ret.length > 1) rows.push(ret);

  if (rows.length === 0) return [];
  const headers = rows[0].map(h => h.trim().toLowerCase());
  const data = [];
  
  for (let j = 1; j < rows.length; j++) {
    if (rows[j].length === 1 && rows[j][0].trim() === '') continue;
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = rows[j][index] ? rows[j][index].trim() : '';
    });
    
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        if (obj[key].toUpperCase() === 'TRUE') obj[key] = true;
        else if (obj[key].toUpperCase() === 'FALSE') obj[key] = false;
      }
    }
    data.push(obj);
  }
  return data;
}

function completeLoading() {
  clearTimeout(loadingTimeout);
  const seen = new Set();

  allItems.forEach((item, i) => {
   if (!item.id) {
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
  
  console.log(`🎉 TOTAL: ${allItems.length} items - CSV Loaded!`);
  updateSaveCounter(); 
  populateAllFilters(); 
  filter(); 
  document.getElementById('loading').style.display = 'none';
}

function populateAllFilters() {
  populateTypeFilter(); populateCategoryFilter(); populateColorFilters(); populateExtraFilters();
}

function filter() {
  const search = document.getElementById('search').value.toLowerCase().trim();
  const type = document.getElementById('typeFilter').value;
  const rarity = document.getElementById('rarityFilter').value;
  const category = document.getElementById('categoryFilter').value;
  const mainColor = document.getElementById('mainColorFilter').value;
  const otherColor = document.getElementById('otherColorFilter').value;
  const tertiaryColorElem = document.getElementById('tertiaryColorFilter');
  const tertiaryColor = tertiaryColorElem ? tertiaryColorElem.value : '';
  const tag1 = document.getElementById('tag1Filter').value;
  const tag2 = document.getElementById('tag2Filter').value;
  const isNumberSearch = search ? /^\d+$/.test(search) : false;

  let tempFiltered = allItems.filter(item => {
    if (type && item.type !== type && item.subtype !== type) return false;
    if (rarity && Number(item.rarity) !== Number(rarity)) return false;
    if (category && (item.category || "") !== category) return false;
    if (tag1 && item.tag1 !== tag1 && item.tag2 !== tag1) return false;
    if (tag2 && item.tag1 !== tag2 && item.tag2 !== tag2) return false;
    if (mainColor && item.maincolor !== mainColor && item.othercolor !== mainColor && item.tertiary !== mainColor) return false;
    if (otherColor && item.maincolor !== otherColor && item.othercolor !== otherColor && item.tertiary !== otherColor) return false;
    if (tertiaryColor && item.maincolor !== tertiaryColor && item.othercolor !== tertiaryColor && item.tertiary !== tertiaryColor) return false;

    if (search) {
      if (isNumberSearch) {
        if (!(String(item.id).includes(search) || (item.niid && String(item.niid).includes(search)))) return false;
      } else {
        const searchTerms = search.split(' ').filter(word => word.trim() !== '');
        const allRowText = Object.values(item).join(' ').toLowerCase();
        
        const matchesSearch = searchTerms.every(word => allRowText.includes(word));
        if (!matchesSearch) return false;
      }
    }

    return true;
  });

  switch(currentSaveFilter) {
    case 'saved':
      tempFiltered = tempFiltered.filter(item => isItemSaved(item));
      break;
    case 'unsaved':
      tempFiltered = tempFiltered.filter(item => !isItemSaved(item));
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
  const isSaved = isItemSaved(item); 
  
  const stats = [];
  const statFields = ['gorgeous', 'simple', 'elegant', 'lively', 'mature', 'cute', 'sexy', 'pure', 'warm', 'cool'];
  statFields.forEach(stat => {
    if (item[stat] && item[stat] !== '-' && item[stat] !== '0') {
      stats.push(`<strong>${stat.charAt(0).toUpperCase() + stat.slice(1)}:</strong> ${item[stat]}`);
    }
  });
  
  const tags = [];
  if (item.tag1) tags.push(item.tag1);
  if (item.tag2) tags.push(item.tag2);
  
  content.innerHTML = `
    <div style="padding: 10px;">
      
      <div style="display: flex; flex-wrap: wrap; gap: 25px; align-items: flex-start;">
        
        <div style="flex-shrink: 0; margin: 0 auto;">
          <img src="${getImageUrl(item)}" style="width: 220px; height: 220px; object-fit: cover; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
        </div>
        
        <div style="flex: 1; min-width: 250px; text-align: left;">
          <h2 style="color: #d63384; margin: 0 0 10px 0; font-size: 1.8em; line-height: 1.2;">
            ${item.name || 'Unknown Item'} 
            <span style="font-size: 0.8em; color: #ff69b4; white-space: nowrap;">${item.rarity || 0}♥</span>
          </h2>
          
          <div style="margin-bottom: 20px;">
            <label style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; font-size: 15px; background: white; padding: 10px 20px; border-radius: 25px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 2px solid #ffd6e7; transition: 0.2s;">
              <input type="checkbox" ${isSaved ? 'checked' : ''} onchange="toggleFavorite('${item.id}'); showItemDetail(${JSON.stringify(item).replace(/"/g, '&quot;')})" style="width: 18px; height: 18px; accent-color: #ff69b4;">
              <span style="color: #333; font-weight: 600;">${isSaved ? '⭐ Owned' : '💾 Save Item'}</span>
            </label>
          </div>

          ${item.desc || item.description ? `
            <div style="font-size: 14px; color: #555; background: rgba(255,105,180,0.05); padding: 15px; border-radius: 12px; border-left: 4px solid #ff69b4; line-height: 1.5;">
              <em>"${item.desc || item.description}"</em>
            </div>
          ` : ''}
        </div>
      </div>

      <div style="background: linear-gradient(135deg, #fff5f8, #ffe4e6); padding: 25px; border-radius: 20px; margin-top: 25px; border: 2px solid #ffd6e7; text-align: left;">
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; font-size: 14px; margin-bottom: 20px; color: #444;">
          ${item.type ? `<div><strong style="color:#d63384;">Type:</strong> ${item.type}${item.subtype ? ' / ' + item.subtype : ''}</div>` : ''}
          ${item.category ? `<div><strong style="color:#d63384;">Category:</strong> ${item.category}</div>` : ''}
          ${item.maincolor ? `<div><strong style="color:#d63384;">Main Color:</strong> ${item.maincolor}</div>` : ''}
          ${item.othercolor ? `<div><strong style="color:#d63384;">Other Color:</strong> ${item.othercolor}</div>` : ''}
          ${item.tertiary ? `<div><strong style="color:#d63384;">Tertiary:</strong> ${item.tertiary}</div>` : ''}
          ${item.suit ? `<div><strong style="color:#d63384;">Suit:</strong> ${item.suit}</div>` : ''}
          ${tags.length ? `<div><strong style="color:#d63384;">Tags:</strong> ${tags.join(', ')}</div>` : ''}
        </div>
        
        ${stats.length ? `
          <div style="background: rgba(255,255,255,0.7); padding: 15px; border-radius: 15px; border-left: 4px solid #d63384; display: flex; flex-wrap: wrap; gap: 12px; font-size: 14px;">
            ${stats.join('<span style="color:#ccc;">|</span>')}
          </div>
        ` : ''}
        
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
  const category = ['Apple', 'Lilith', 'Cloud', 'Pigeon', 'North', 'Wasteland', 'Ruin', 'Story Suits', 'Classic', 'Luxury', 'Festivals', 'Troupe', '4 Seasons', 'Stars', 'Happiness', 'Wonder Museum', 'Fairytale', 'Gallery'];
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
  const tertiaryColors = [...new Set(allItems.map(i => i.tertiary).filter(Boolean))];
  const tag1s = [...new Set(allItems.map(i => i.tag1).filter(Boolean))];
  const tag2s = [...new Set(allItems.map(i => i.tag2).filter(Boolean))];

  fillSelect('otherColorFilter', otherColors);
  
  if (document.getElementById('tertiaryColorFilter')) {
      fillSelect('tertiaryColorFilter', tertiaryColors);
  }
  
  fillSelect('tag1Filter', tag1s);
  fillSelect('tag2Filter', tag2s);
}

function fillSelect(id, values) {
  const select = document.getElementById(id);

  const labels = {
    otherColorFilter: "All Other Colors",
    tertiaryColorFilter: "All Tertiary Colors",
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
  items.forEach((item, index) => { 
    const isMissingData = !item.name || !item.rarity || !item.type;
    const warningClass = isMissingData ? 'missing-data-border' : '';
    
    html += `
      <div class="card ${warningClass}" style="animation-delay: ${index * 0.03}s">
        <div class="card-content" onclick="showItemDetail(${JSON.stringify(item).replace(/"/g, '&quot;')})">
          <img src="${getImageUrl(item)}" loading="lazy" onerror="this.src='https://placehold.co/400x400?text=No+Image'" class="card-image">
          <div class="card-name">${item.name}</div>
          <div class="card-type">${item.type} | ${item.rarity || 0}♥</div>
        </div>
        <label class="card-checkbox-label">
          <input type="checkbox" value="${item.id}" ${isItemSaved(item)?'checked':''} 
                 onchange="toggleFavorite('${item.id}'); filter()" 
                 class="card-checkbox">
        </label>
      </div>
    `;
  });
  return html + '</div>';
}

function createTableView(items) {
  let html = `<table><thead><tr><th>Save</th><th>Name</th><th>Type</th><th>Sub Type</th><th>Rarity</th><th>Gorgeous</th><th>Simple</th><th>Elegant</th><th>Lively</th><th>Mature</th><th>Cute</th><th>Sexy</th><th>Pure</th><th>Warm</th><th>Cool</th><th>Main Color</th><th>Other Color</th><th>Tertiary Color</th><th>Category</th><th>Suit</th><th>Tag 1</th><th>Tag 2</th><th>In Suit</th><th>Pose</th><th>Animated</th><th>Image</th></tr></thead><tbody>`;
  
  items.forEach(item => {
    html += `<tr>
      <td><input type="checkbox" value="${item.id}" ${isItemSaved(item)?'checked':''} onchange="toggleFavorite('${item.id}')" class="save-checkbox"></td>
      <td>${item.name || '-'}</td>
      <td>${item.type || '-'}</td>
      <td>${item.subtype || '-'}</td>
      <td>${item.rarity || 0}♥</td>
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
      <td>${item.tertiary || '-'}</td>
      <td>${item.category || '-'}</td>
      <td>${item.suit || '-'}</td>
      <td>${getTagBadge(item.tag1)}</td>
      <td>${getTagBadge(item.tag2)}</td>
      <td>${item.inasuit ? 'Yes' : 'No'}</td>
      <td>${item.pose ? 'Yes' : 'No'}</td>
      <td>${item.animated ? 'Yes' : 'No'}</td>
      <td><td><img src="${getImageUrl(item)}" class="table-img" loading="lazy" onerror="this.src='https://placehold.co/400x400?text=No+Image'"></td>
    </tr>`;
  });
  
  return html + '</tbody></table>';
}

function renderColor(colorName) {
  if (!colorName) return '-';
  const map = { "White": "#ffffff", "Pink": "#ffc0cb", "Red": "#ff0000", /* add more */ };
  const hex = map[colorName] || "#ccc";
  return `<span class="color-swatch" style="background:${hex}"></span>${colorName}`;
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

function toggleDarkMode() {
  document.body.classList.toggle('dark');
  const btn = document.getElementById('darkModeBtn');

  const isDark = document.body.classList.contains('dark');
  btn.textContent = isDark ? '𖤓' : '⏾';

  localStorage.setItem('darkMode', isDark ? 'on' : 'off');
}

function getTagBadge(tagName) {
  if (!tagName) return '';
  const tagColors = {
    "Sun Care": "#f28c3a",
    "Dancer": "#f26c6c",
    "Floral": "#e38b84",
    "Winter": "#7b9ca6",
    "Sailor": "#4f7fd8",
    "Traditional": "#df6b4f",
    "Bunny": "#f47cc6",
    "Lady": "#d9a23b",
    "Britain": "#5b74c9",
    "Swimsuit": "#54b6dc",
    "Shower": "#62c8cb",
    "Kimono": "#d98b78",
    "Lolita": "#f35fa8",
    "Gothic": "#6b5b5b",
    "Sports": "#5aa9df",
    "Street": "#6d6ab3",
    "Pajamas": "#b28acb",
    "Wedding": "#b99b9b",
    "Army": "#73863d",
    "Chic": "#757575",
    "Preppy": "#a94a4a",
    "Unisex": "#6a9556",
    "Future": "#6d9dc5",
    "Fairy": "#ff6f9f",
    "Apron": "#c95d5d",
    "Cheongsam": "#d66a6a",
    "Maiden": "#666666",
    "Evening Gown": "#7261b6",
    "Musician": "#cf5a5a",
    "Workwear": "#5f93c6",
    "Animal": "#bf8b78",
    "Goddess": "#c887db",
    "POP": "#f15b5b",
    "Homewear": "#e6a27b",
    "Chinese Classical": "#6b5252",
    "Multicultural": "#d6ad2e",
    "Republic of China": "#6c79a8",
    "European": "#5d5d5d",
    "Swordsman": "#5c8fd8",
    "Rain": "#6ab37c",
    "Modern China": "#8a7070",
    "Dryad": "#7b6666",
    "Bohemia": "#f38a34",
    "Paramedics": "#6bc7c7"
  };
  
  const color = tagColors[tagName] || "#a0a0a0"; 
  return `<span class="tag-badge" style="background-color: ${color}">${tagName}</span>`;
}

function renderColorSwatch(colorName) {
  if (!colorName) return '-';
  const colorMap = {
    "White": "#ffffff", "Pink": "#ffc0cb", "Red": "#ff0000",
    "Black": "#000000", "Blue": "#0000ff", "Yellow": "#ffff00"
  };
  const hex = colorMap[colorName] || "#ccc";
  return `<span class="color-swatch" style="background:${hex}"></span>${colorName}`;
}

function importWbakFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);
      let itemsToImport = [];

      if (Array.isArray(importedData)) {
        itemsToImport = importedData;
      } else if (importedData && Array.isArray(importedData.items)) {
        itemsToImport = importedData.items;
      }

      const normalizedItems = itemsToImport.map(id => String(id));
      
      savedItems = new Set(normalizedItems);
      saveFavorites();
      
      filter();
      console.log("Imported items count:", savedItems.size);
      console.log("Sample ID from Saved:", [...savedItems][0]);
      
      alert(`Success! Na-import ang ${savedItems.size} items.`);
    } catch (err) {
      alert("Error: Hindi mabasa ang file.");
      console.error(err);
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

function exportWbakFile() {
  const itemsArray = Array.from(savedItems);
  
  const jsonString = JSON.stringify(itemsArray);
  
  const blob = new Blob([jsonString], { type: 'application/octet-stream' });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my_wardrobe.wbak';
  document.body.appendChild(a);
  a.click();
  
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function updateCheckboxes() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  
  checkboxes.forEach(cb => {
    if (savedItems.has(cb.value)) {
      cb.checked = true;
      cb.closest('.card')?.classList.add('selected');
    } else {
      cb.checked = false;
      cb.closest('.card')?.classList.remove('selected');
    }
  });
}

function toggleSidebar() {
  const sidebar = document.getElementById("mySidebar");
  sidebar.classList.toggle("open");
}

function openTab(evt, tabName) {
  const tabContents = document.getElementsByClassName("tab-content");
  for (let i = 0; i < tabContents.length; i++) {
    tabContents[i].style.display = "none";
  }

  const tabBtns = document.getElementsByClassName("tab-btn");
  for (let i = 0; i < tabBtns.length; i++) {
    tabBtns[i].classList.remove("active");
  }

  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.classList.add("active");
}

function toggleSidebar() {
  const sidebar = document.getElementById("mySidebar");
  sidebar.classList.toggle("open");
  
  document.body.classList.toggle("sidebar-open");
}

function switchView(viewId, btnElement) {
  const views = document.querySelectorAll('.main-view');
  views.forEach(view => {
    view.style.display = 'none';
  });
  
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.classList.remove('active');
  });
  
  document.getElementById(viewId).style.display = 'block';
  
  if (btnElement) {
    btnElement.classList.add('active');
  }

  if (window.innerWidth <= 900) {
    toggleSidebar();
  }
}

let craftingData = [];
let filteredCraftingData = [];
let currentCraftingPage = 1;

let chapterData = [];
let filteredChapterData = [];
let currentChapterPage = 1;

const ITEMS_PER_TAB_PAGE = 50;

function loadCraftingData() {
  const craftingUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQfXbX-O6q1yIBOGr-Jd9yx6mvu5oRGekCKajNqlGROaLDFxC7RlOLkTvAUiYdPpMlDO65-v7jKpnNf/pub?gid=1432725843&single=true&output=csv'; 
  fetch(craftingUrl)
    .then(res => res.ok ? res.text() : '')
    .then(text => {
      if (text) {
        craftingData = parseCSV(text).filter(row => row['item name'] || row['item']);
        filteredCraftingData = [...craftingData];

        const obtainTypes = [...new Set(craftingData.map(r => r['obtain'] || r['recipe obtainment']).filter(Boolean))].sort();
        const select = document.getElementById('obtainFilter');
        obtainTypes.forEach(opt => select.innerHTML += `<option value="${opt}">${opt}</option>`);
        
        renderCraftingTable();
      }
    });
}

function filterCrafting() {
  const search = document.getElementById('craftingSearch').value.toLowerCase();
  const obtain = document.getElementById('obtainFilter').value;
  
  filteredCraftingData = craftingData.filter(row => {
    const name = (row['item name'] || row['item'] || '').toLowerCase();
    const rowObtain = (row['obtain'] || row['recipe obtainment'] || '');
    return name.includes(search) && (obtain === "" || rowObtain === obtain);
  });
  
  currentCraftingPage = 1;
  renderCraftingTable();
}

function renderCraftingTable() {
  const container = document.getElementById('craftingResults');
  if (!filteredCraftingData.length) { container.innerHTML = '<p>No items found.</p>'; return; }

  const start = (currentCraftingPage - 1) * ITEMS_PER_TAB_PAGE;
  const pageData = filteredCraftingData.slice(start, start + ITEMS_PER_TAB_PAGE);

  let html = `<table><thead><tr><th>Item Name</th><th>Design Obtainment</th><th>Crafting Method</th></tr></thead><tbody>`;
  
  pageData.forEach((row, index) => {
    const itemName = row['item name'] || row['item'] || '-';
    const obtain = row['obtain'] || row['recipe obtainment'] || '-';
    const globalIndex = craftingData.indexOf(row); 
    
    html += `<tr>
      <td style="font-weight: bold; color: var(--text-title);">${itemName}</td>
      <td>${obtain}</td>
      <td><button class="recipe-btn" onclick="openCraftingModal(${globalIndex})">View Crafting</button></td>
    </tr>`;
  });
  
  html += `</tbody></table>`;
  container.innerHTML = html;
  
  const totalPages = Math.ceil(filteredCraftingData.length / ITEMS_PER_TAB_PAGE);
  document.getElementById('craftingPagination').innerHTML = `
    <button onclick="currentCraftingPage--; renderCraftingTable()" ${currentCraftingPage === 1 ? 'disabled' : ''}>&laquo; Prev</button>
    <span>Page ${currentCraftingPage} of ${totalPages}</span>
    <button onclick="currentCraftingPage++; renderCraftingTable()" ${currentCraftingPage === totalPages ? 'disabled' : ''}>Next &raquo;</button>
  `;
}

function openCraftingModal(index) {
  const row = craftingData[index];
  
  document.getElementById('recipeTitle').innerText = row['item name'] || row['item'] || 'Unknown Item';
  document.getElementById('recipeObtain').innerText = row['obtain'] || row['recipe obtainment'] || 'Unknown';
  
  const mainImg = document.getElementById('recipeMainImg');
  const mainId = row['id'] || row['item id'] || ''; 
  
  if (mainId) {
    mainImg.src = `https://raw.githubusercontent.com/V1si0n-LNpr3D1cf0r/mn-dump-craftables/main/${mainId}.png`;
    mainImg.style.display = 'block';
  } else {
    mainImg.style.display = 'none';
  }

  let materialsHtml = '';
  for(let i=1; i<=4; i++) {
    const matName = row[`cloth${i}`] || row[`required ${i}`];
    const matAmt = row[`amount needed ${i}`] || row[`amount${i}`];
    const matId = row[`material id ${i}`] || row[`id ${i}`] || '';

    if (matName) {
      let iconUrl = matId ? `https://raw.githubusercontent.com/V1si0n-LNpr3D1cf0r/mn-dump-icons/main/icon${matId}.png` : '';
      if (!iconUrl) {
          const found = allItems.find(item => item.name === matName);
          if (found && found.id) {
              iconUrl = `https://raw.githubusercontent.com/V1si0n-LNpr3D1cf0r/mn-dump-icons/main/icon${found.id}.png`;
          }
      }
      
      materialsHtml += `
        <div class="material-row" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <div class="material-left" style="display: flex; align-items: center;">
            <img src="${iconUrl}" class="material-icon" style="width: 30px; height: 30px; margin-right: 10px; border-radius: 5px;" onerror="this.style.display='none'">
            <span class="material-name">${matName}</span>
          </div>
          <span class="material-amt">x${matAmt || 1}</span>
        </div>`;
    }
  }
  
  if(!materialsHtml) materialsHtml = '<p>No materials required.</p>';
  document.getElementById('recipeMaterials').innerHTML = materialsHtml;
  document.getElementById('craftingModal').style.display = 'flex';
}

function closeCraftingModal() {
  document.getElementById('craftingModal').style.display = 'none';
}

function loadChapterData() {
  const chapterUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQfXbX-O6q1yIBOGr-Jd9yx6mvu5oRGekCKajNqlGROaLDFxC7RlOLkTvAUiYdPpMlDO65-v7jKpnNf/pub?gid=563709766&single=true&output=csv'; 
  fetch(chapterUrl)
    .then(res => res.ok ? res.text() : '')
    .then(text => {
      if (text) {
        chapterData = parseCSV(text).filter(row => row['stage']);
        filteredChapterData = [...chapterData];
        
        populateChapterDropdowns();
        
        renderChapterTable();
      }
    });
}

function populateChapterDropdowns() {
  const chapterSelect = document.getElementById('chapterFilter');
  if (chapterSelect) {
     const chapters = [...new Set(chapterData.map(r => {
         const stage = r['stage'] || '';
         return stage.split('-')[0]; 
     }).filter(Boolean))].sort((a,b) => parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, '')));

     chapterSelect.innerHTML = '<option value="">All Chapters</option>';
     chapters.forEach(c => chapterSelect.innerHTML += `<option value="${c}">Chapter ${c}</option>`);
  }
}

function filterChapters() {
  const search = document.getElementById('chapterSearch').value.toLowerCase();
  const volumeSelect = document.getElementById('volumeFilter');
  const volume = volumeSelect ? volumeSelect.value : "";
  const chapterSelect = document.getElementById('chapterFilter');
  const chapter = chapterSelect ? chapterSelect.value : "";
  
  filteredChapterData = chapterData.filter(row => {
    const stage = (row['stage'] || '').toLowerCase();
    const name = (row['name'] || '').toLowerCase();
    const vol = String(row['volume no.'] || row['volume'] || '');
    
    const matchesSearch = stage.includes(search) || name.includes(search);
    const matchesVol = (volume === "" || vol === volume);
    
    let matchesChap = true;
    if (chapter !== "") {
        matchesChap = stage.startsWith(chapter.toLowerCase() + '-');
    }
    
    return matchesSearch && matchesVol && matchesChap;
  });
  
  currentChapterPage = 1;
  renderChapterTable();
}

const attributeColors = {
  'simple': '#8091a1',
  'gorgeous': '#eeb362',
  'lively': '#ff9776',
  'elegant': '#aa93c3',
  'cute': '#ff7186',
  'mature': '#ff7878',
  'pure': '#53babf',
  'sexy': '#aaa3ca',
  'cool': '#69accc',
  'warm': '#fd764c'
};

// --- UPDATED RENDER CHAPTER TABLE ---
function renderChapterTable() {
  const container = document.getElementById('chapterResults');
  
  // TIMING FIX: If chapters loaded but the main encyclopedia is still downloading, wait and try again!
  if (typeof allItems !== 'undefined' && allItems.length === 0) {
      container.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--accent);">Loading item databases... please wait.</p>';
      setTimeout(renderChapterTable, 500);
  }

  if (!filteredChapterData.length) { 
      container.innerHTML = '<p style="text-align:center; padding: 20px;">No stages found.</p>'; 
      return; 
  }

  const start = (currentChapterPage - 1) * ITEMS_PER_TAB_PAGE;
  const pageData = filteredChapterData.slice(start, start + ITEMS_PER_TAB_PAGE);

  let html = `<table><thead><tr><th>Vol.</th><th>Stage</th><th>Name</th><th>Attributes</th><th>Tag 1</th><th>Tag 2</th><th>Item Requirements</th><th>Maiden Drops</th><th>Princess Drops</th></tr></thead><tbody>`;
  
  pageData.forEach(row => {
    // Format Attributes
    let attributes = [row['attributes 1'], row['attributes 2'], row['attributes 3'], row['attributes 4'], row['attributes 5']]
      .filter(Boolean)
      .map(attr => {
        let cleanAttr = attr.trim();
        if (cleanAttr.toLowerCase() === 'elegance') cleanAttr = 'Elegant';
        const color = (typeof attributeColors !== 'undefined') ? (attributeColors[cleanAttr.toLowerCase()] || 'var(--accent)') : 'var(--accent)';
        return `<span class="tag-badge" style="background-color: ${color}; color: white; border: none;">${cleanAttr}</span>`;
      }).join(' ');

    let tags = [row['tags 1'], row['tags 2']]
      .filter(Boolean)
      .map(tag => getTagBadge(tag))
      .join(' ');
    
    let itemRequirements = [row['item requirements']]
      .filter(Boolean)
      .map(req => `<span class="tag-badge" style="background-color: #6c757d; color: white; border: none;">${req}</span>`)
      .join(' ');
    // Format Maiden Drops (Injects the image next to the text)
    let maidenDrops = [row['maiden drops 1'], row['maiden drops 2']]
      .filter(Boolean)
      .map(drop => `<div style="display:flex; align-items:center; margin-bottom:4px;">${getDropIconUrl(drop)}<span>${drop}</span></div>`)
      .join('');
      
    // Format Princess Drops (Injects the image next to the text)
    let princessDrops = [row['princess drops 1'], row['princess drops 2']]
      .filter(Boolean)
      .map(drop => `<div style="display:flex; align-items:center; margin-bottom:4px;">${getDropIconUrl(drop)}<span>${drop}</span></div>`)
      .join('');

    html += `<tr>
      <td>${row['volume no.'] || row['volume'] || '-'}</td>
      <td>${row['stage'] || '-'}</td>
      <td style="font-weight: bold; color: var(--text-title);">${row['name'] || '-'}</td>
      <td>${attributes || '-'}</td>
      <td>${row['tags 1'] || '-'}</td>
      <td>${row['tags 2'] || '-'}</td>
      <td>${row['item requirements'] || '-'}</td>
      <td>${maidenDrops || '-'}</td>
      <td>${princessDrops || '-'}</td>
    </tr>`;
  });
  
  html += `</tbody></table>`;
  container.innerHTML = html;
  
  // Draw Pagination
  const totalPages = Math.ceil(filteredChapterData.length / ITEMS_PER_TAB_PAGE);
  const pagination = document.getElementById('chapterPagination');
  if(pagination) {
      pagination.innerHTML = `
        <button onclick="currentChapterPage--; renderChapterTable()" ${currentChapterPage === 1 ? 'disabled' : ''}>&laquo; Prev</button>
        <span>Page ${currentChapterPage} of ${totalPages}</span>
        <button onclick="currentChapterPage++; renderChapterTable()" ${currentChapterPage === totalPages ? 'disabled' : ''}>Next &raquo;</button>
      `;
  }
}

window.onclick = function(event) {
  const modal = document.getElementById('craftingModal');
  if (event.target == modal) closeCraftingModal();
}

// --- UPDATED ICON HELPER ---
function getDropIconUrl(dropName) {
  if (!dropName) return '';
  
  // Make the search case-insensitive and remove accidental spaces
  const searchName = dropName.toLowerCase().trim();
  
  // Ensure allItems exists and has loaded
  if (typeof allItems !== 'undefined' && allItems.length > 0) {
    // Search the encyclopedia for the exact drop name
    const found = allItems.find(i => {
        const itemName = (i.name || i['item name'] || '').toLowerCase().trim();
        return itemName === searchName;
    });
    
    // If we found the item, grab its ID and build the image
    if (found && (found.id || found.niid)) {
      const id = found.id || found.niid; // Supports both 'id' and 'niid' column headers
      return `<img src="https://raw.githubusercontent.com/V1si0n-LNpr3D1cf0r/mn-dump-icons/main/icon${id}.png" style="width: 25px; height: 25px; vertical-align: middle; margin-right: 8px; border-radius: 4px;" onerror="this.style.display='none'">`;
    }
  }
  
  return ''; // Return nothing if not found yet
}

function filterEncyclopedia() {
  const rawSearch = document.getElementById('search').value.toLowerCase();
  
  const searchTerms = rawSearch.split(' ').filter(word => word.trim() !== '');

  const typeVal = document.getElementById('typeFilter').value;
  const rarityVal = document.getElementById('rarityFilter').value;
  const catVal = document.getElementById('categoryFilter').value;

  filteredData = encyclopediaData.filter(row => {
    
    const allRowText = Object.values(row).join(' ').toLowerCase();

    const matchesSearch = searchTerms.every(word => allRowText.includes(word));

    const matchesType = (typeVal === "" || row['type'] === typeVal);
    const matchesRarity = (rarityVal === "" || row['rarity'] === rarityVal);
    const matchesCat = (catVal === "" || row['category'] === catVal);
    return matchesSearch && matchesType && matchesRarity && matchesCat; 
  });

  currentEncyclopediaPage = 1;
  renderEncyclopediaView(); 
}

let breakdownData = [];

function loadBreakdownData() {
  const breakdownUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQfXbX-O6q1yIBOGr-Jd9yx6mvu5oRGekCKajNqlGROaLDFxC7RlOLkTvAUiYdPpMlDO65-v7jKpnNf/pub?gid=333774526&single=true&output=csv'; 
  
  fetch(breakdownUrl)
    .then(res => res.ok ? res.text() : '')
    .then(text => {
      if (text) {
        breakdownData = parseCSV(text);
        renderBreakdownGallery();
      }
    })
    .catch(err => console.error('Error loading breakdowns:', err));
}

function renderBreakdownGallery() {
  const container = document.getElementById('suitGalleryList');
  container.innerHTML = ''; // Clear container on load
  
  breakdownData.forEach((suit, index) => {
    if (!suit['suit name']) return; // Skip empty rows
    
    // Create a wrapper for the accordion
    const wrapper = document.createElement('div');
    wrapper.style.cssText = "background: var(--bg-color, #ffffff); border: 2px solid #ffb6c1; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);";

    // Create the clickable header/button
    const btn = document.createElement('button');
    btn.className = 'suit-gallery-btn'; 
    btn.style.cssText = "width: 100%; padding: 15px 20px; background: rgba(255, 182, 193, 0.15); border: none; cursor: pointer; font-weight: bold; font-size: 1.1em; color: #d63384; text-align: left; display: flex; justify-content: space-between; align-items: center; transition: background 0.3s;";
    
    // Add hover effect
    btn.onmouseover = () => btn.style.background = 'rgba(255, 182, 193, 0.3)';
    btn.onmouseout = () => btn.style.background = 'rgba(255, 182, 193, 0.15)';
    
    btn.innerHTML = `<span>${suit['suit name']}</span> <span id="arrow-${index}" style="font-size: 0.8em;">▼</span>`;
    
    // Create the content container (hidden by default)
    const content = document.createElement('div');
    content.id = `suit-content-${index}`;
    content.style.cssText = "display: none; padding: 15px; border-top: 2px solid #ffb6c1; gap: 15px; overflow-x: auto; background: var(--bg-color, #fafafa);";
    
    // Trigger the toggle function when the button is clicked
    btn.onclick = () => toggleSuitGallery(index, suit);

    wrapper.appendChild(btn);
    wrapper.appendChild(content);
    container.appendChild(wrapper);
  });
}

function toggleSuitGallery(index, suit) {
  const content = document.getElementById(`suit-content-${index}`);
  const arrow = document.getElementById(`arrow-${index}`);
  
  if (content.style.display === 'none') {
    
    if (content.innerHTML === '') {
      const itemIds = suit['item ids'] ? String(suit['item ids']).split(',') : [];
      
      const suitName = suit['suit name'] || suit['name'] || ''; 
      
      if (itemIds.length === 0) {
          content.innerHTML = '<p style="color: var(--text-color, #666);">No images available for this suit.</p>';
      } else {
          itemIds.forEach(id => {
            const cleanId = id.trim();
            if (!cleanId) return;
            
            let filename = cleanId;
            if (suitName && !cleanId.includes('-')) {
               filename = `${suitName}-${cleanId}`;
            }
            
            const img = document.createElement('img');
            img.src = `https://raw.githubusercontent.com/V1si0n-LNpr3D1cf0r/mn-dump-breakdown/main/${filename}.png`;
            img.style.cssText = "height: 250px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); border: 1px solid #ffd6e7; object-fit: contain; flex-shrink: 0; background: var(--glass-bg);";
            
            img.onclick = function() {
            const modal = document.getElementById('fullImageModal');
            const fullImg = document.getElementById('fullImageDisplay');
            fullImg.src = this.src; // Set the modal image to the one you just tapped
            modal.style.display = 'flex'; // Show the modal
           };

            img.alt = `Loading ${filename}...`;
            
            // If the image fails to load, hide it so broken image icons don't show
            img.onerror = () => { img.style.display = 'none'; };
            
            content.appendChild(img);
          });
      }
    }
    
    // Show the container as a flex row
    content.style.display = 'flex';
    arrow.textContent = '▲'; 
    
  } else {
    // If it's open, hide it
    content.style.display = 'none';
    arrow.textContent = '▼';
  }
}