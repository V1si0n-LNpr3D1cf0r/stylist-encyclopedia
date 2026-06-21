let allItems = [];
let filteredItems = [];
let savedItems = new Set();
let currentPage = 1;
let currentSaveFilter = 'all';
const ITEMS_PER_PAGE = 42;
let isCardView = false;
let loadingTimeout = null;

function isItemSaved(item) {
  const idSaved = savedItems.has(String(item.id));
  const niidSaved = item.niid ? savedItems.has(String(item.niid)) : false;
  return idSaved || niidSaved;
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('search').addEventListener('input', filter);
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
  let tempFiltered = allItems.filter(item => {
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

    const matchTag1 = !tag1 || item.tag1 === tag1 || item.tag2 === tag1;
    const matchTag2 = !tag2 || item.tag1 === tag2 || item.tag2 === tag2;

    const matchMainColor = !mainColor || item.maincolor === mainColor || item.othercolor === mainColor || item.tertiary === mainColor;
    const matchOtherColor = !otherColor || item.maincolor === otherColor || item.othercolor === otherColor || item.tertiary === otherColor;
    const matchTertiaryColor = !tertiaryColor || item.maincolor === tertiaryColor || item.othercolor === tertiaryColor || item.tertiary === tertiaryColor;

    const isNumberSearch = /^\d+$/.test(search);

    const matchSearch =
      !search ||
      (item.name || "").toLowerCase().includes(search) ||
      (item.suit || "").toLowerCase().includes(search) ||
      (item.category || "").toLowerCase().includes(search) ||
      (item.tag1 || "").toLowerCase().includes(search) ||
      (item.tag2 || "").toLowerCase().includes(search) ||
      (isNumberSearch && (String(item.id).includes(search) || (item.niid && String(item.niid).includes(search))));

    return (
      matchSearch &&
      (!type || item.type === type || item.subtype === type) &&
      (!rarity || Number(item.rarity) === Number(rarity)) &&
      (!category || (item.category || "") === category) &&
      matchMainColor &&
      matchOtherColor &&
      matchTertiaryColor &&
      matchTag1 &&
      matchTag2
    );
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
          ${item.maincolor ? `<div><strong>Primary Color:</strong> ${item.maincolor}</div>` : ''}
          ${item.othercolor ? `<div><strong>Secondary Color:</strong> ${item.othercolor}</div>` : ''}
          ${item.tertiarycolor ? `<div><strong>Tertiary Color:</strong> ${item.tertiarycolor}</div>` : ''}
          ${item.suit ? `<div><strong>Suit:</strong> ${item.suit}</div>` : ''}
          ${tags.length ? `<div><strong>Tags:</strong> ${tags.join(', ')}</div>` : ''}
        </div>
        
        ${stats.length ? `
          <div style="background: rgba(255,255,255,0.7); padding: 20px; border-radius: 15px; border-left: 5px solid #ff69b4;">
            <strong style="color: #d63384; font-size: 16px;">Stats:</strong><br>
            ${stats.join(' | ')}
          </div>
        ` : ''}
      </div>
      ${item.desc || item.description ? `
  <div style="margin-top: 15px; font-size: 14px; color: #555; background: rgba(255,255,255,0.7); padding: 15px; border-radius: 12px;">
    <strong style="color:#d63384;">Description:</strong><br>
    ${item.desc || item.description}
  </div>
` : ''}
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
          <img src="${getImageUrl(item)}" onerror="this.src='https://placehold.co/400x400?text=No+Image'" class="card-image">
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
      <td><img src="${getImageUrl(item)}" class="table-img" onerror="this.src='https://placehold.co/400x400?text=No+Image'"></td>
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
