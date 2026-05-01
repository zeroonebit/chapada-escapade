// PixaPro · tab-gallery.js — Gallery tab (sumário promoted/discarded/pending)
//
// Globals expostos: summaryData, promotedFilter, assetTags, saveAssetTags,
//                   collectAssetTags, fetchSummary, renderGallery
//
// Dependências: MANIFEST, decisions (tab-manager), Api, Store, $, fillSumGrid

let summaryData = null;
let promotedFilter = 'folders'; // folders | files | type | tags

// Tags state: { [assetPath]: ['tag1', 'tag2'] }
let assetTags = Store.loadTags();
function saveAssetTags(){
  Store.saveTags(assetTags);
  Api.saveTags(assetTags);
}
function collectAssetTags(){
  const set = new Set();
  Object.values(assetTags).forEach(tags => tags.forEach(t => set.add(t)));
  return [...set].sort();
}

// Carrega registry do disk se existir (merge: localStorage wins por ser mais recente)
Api.loadTags().then(data => {
  if(data && typeof data === 'object'){
    assetTags = {...data, ...assetTags};
    saveAssetTags();
  }
});

async function fetchSummary(){
  return await Api.listAssets();
}

function renderGallery(){
  const fsAssets = summaryData?.filesystem || [];
  const orphans  = summaryData?.orphans || [];

  // Promoted = filesystem assets em pastas categorizadas + decisions promote
  const fsPromoted    = fsAssets.filter(a => /\/(objects|vegetation|enemies|hud|chars\/[^\/]+\/)/.test(a.path) && !/inbox/.test(a.path));
  const localPromoted = MANIFEST.filter(m => decisions[m.id]?.action === 'promote');

  // Discarded = decisions discard
  const localDiscarded = MANIFEST.filter(m => decisions[m.id]?.action === 'discard');

  // Pending = inbox + manifest sem decisão + orfãos do PixelLab
  const inboxAssets  = fsAssets.filter(a => /inbox/.test(a.path));
  const localPending = MANIFEST.filter(m => !decisions[m.id] || decisions[m.id].action === 'rename');

  const promotedItems = [
    ...fsPromoted.map(a => ({path: a.path, name: a.path.split(/[\\/]/).pop()})),
    ...localPromoted.map(m => ({path: m.path, name: m.name})),
  ];
  $("sumPromoted").textContent = promotedItems.length;
  $("sumPromotedBd").innerHTML = `📁 ${fsPromoted.length} no filesystem · 📋 ${localPromoted.length} marcados (manager)`;
  window._promotedItems = promotedItems;
  fillSumGrid('sumPromotedGrid', promotedItems, promotedFilter);

  $("sumDiscarded").textContent = localDiscarded.length;
  $("sumDiscardedBd").innerHTML = `📋 ${localDiscarded.length} marcados (manager)<br><span style="opacity:.5">obs: descartados ainda não removidos do disco</span>`;
  fillSumGrid('sumDiscardedGrid', localDiscarded.map(m => ({path: m.path, name: m.name})));

  $("sumPending").textContent = inboxAssets.length + orphans.length;
  $("sumPendingBd").innerHTML = `📁 ${inboxAssets.length} no inbox<br>☁ ${orphans.length} órfãos no PixelLab (sem decisão local)`;
  fillSumGrid('sumPendingGrid', inboxAssets.map(a => ({path: a.path, name: a.path.split(/[\\/]/).pop()})));

  if(!summaryData){
    fetchSummary().then(d => { summaryData = d || {filesystem:[], orphans:[]}; renderGallery(); });
  }
}

// ⏳ PENDING panel unificado (roxo) — Audit tab.
// Anim frames colapsados ao parent (1 thumb por anim, não 232 frames).
// Outline color-coded: blue=in-game, yellow=not in-game.
// Click → loadAuditAsset() carrega no stage; asset NÃO sai da lista
// (decisões só via P/D/R/C buttons ou hotkeys).
function renderInGamePanel(){
  if (!$("sumPendingTotal")) return;
  if (!summaryData) {
    fetchSummary().then(d => { summaryData = d || {filesystem:[], orphans:[]}; renderInGamePanel(); });
    return;
  }
  const fsAssets = summaryData?.filesystem || [];
  const decidedPaths = new Set();
  for (const k in decisions) {
    const p = decisions[k]?.path;
    if (p) decidedPaths.add(p.replace(/^\.\.\//, ''));
  }

  // Coleta tudo sem decisão
  const allUnaudited = [];   // {path, name, inGame: bool, isAnimGroup?, animKey?}
  const seenPaths = new Set();
  for (const a of fsAssets) {
    const path = a.abs || a.path.replace(/^\.\.\//, '');
    if (decidedPaths.has(path)) continue;
    seenPaths.add(path);
    allUnaudited.push({
      path: a.path,
      cleanPath: path,
      name: path.split(/[\\/]/).pop().replace('.png',''),
      inGame: !/inbox/.test(path),
    });
  }
  for (const m of MANIFEST) {
    if (decisions[m.id]?.action) continue;
    if (m._audit) continue;
    const cleanPath = (m.path || '').replace(/^\.\.\//, '');
    if (cleanPath && seenPaths.has(cleanPath)) continue;
    allUnaudited.push({
      path: m.path,
      cleanPath,
      name: m.name,
      inGame: !/inbox/.test(cleanPath),
    });
  }

  // === Collapse anim frames ===
  // Path padrão: chars/<char>/anims/<anim>/<dir>/frame_NNN.png
  // Group key = chars/<char>/anims/<anim> → 1 thumb representativo (primeiro frame S/sul ou qualquer)
  const ANIM_RE = /\/anims\/([^/]+)\/([^/]+)\/frame_\d+\.png$/;
  const animGroups = new Map();   // key → { repPath, count, inGame, name }
  const standalone = [];

  for (const it of allUnaudited) {
    const m = it.cleanPath.match(/^(.+?\/anims\/[^/]+)\/[^/]+\/frame_\d+\.png$/);
    if (m) {
      const groupKey = m[1];  // chars/vaca/anims/walk
      if (!animGroups.has(groupKey)) {
        const animName = groupKey.split('/').slice(-3).join('/');  // vaca/anims/walk
        animGroups.set(groupKey, {
          path: it.path, cleanPath: it.cleanPath,
          name: '🎬 ' + animName,
          inGame: it.inGame,
          count: 0,
          isAnimGroup: true,
          groupKey,
        });
      }
      const g = animGroups.get(groupKey);
      g.count++;
      // Prefere frame de direção S (sul) como rep
      if (/\/S\//.test(it.cleanPath) && /frame_000/.test(it.cleanPath)) {
        g.path = it.path;
        g.cleanPath = it.cleanPath;
      }
    } else {
      standalone.push(it);
    }
  }
  const items = [...standalone, ...animGroups.values()];

  // Render no painel unificado
  $("sumPendingTotal").textContent = items.length;
  const inGameCount = items.filter(x => x.inGame).length;
  const notInGameCount = items.length - inGameCount;
  $("sumPendingBd").innerHTML =
    `<span style="color:#9fcfe8;">🔵 ${inGameCount} in-game</span> · ` +
    `<span style="color:#f4c95d;">🟡 ${notInGameCount} not in-game</span> · ` +
    `<span style="opacity:.6;">Click no thumb pra abrir no stage. Anim frames colapsados.</span>`;

  const grid = $("sumPendingGridUnified");
  if (!grid) return;
  grid.innerHTML = '';
  for (const it of items) {
    const wrap = document.createElement('div');
    wrap.className = 'thumb';
    wrap.style.width = '46px'; wrap.style.height = '46px';
    wrap.style.cursor = 'pointer';
    wrap.style.position = 'relative';
    wrap.style.borderColor = it.inGame ? '#4da9e8' : '#f4c95d';
    wrap.style.borderWidth = '2px';
    wrap.title = it.name + (it.isAnimGroup ? ` (${it.count} frames)` : '');
    const img = document.createElement('img');
    img.src = it.path;
    wrap.appendChild(img);
    if (it.isAnimGroup) {
      const badge = document.createElement('span');
      badge.textContent = '🎬';
      badge.style.cssText = 'position:absolute;top:-3px;right:-3px;font-size:10px;background:#1a1410;border-radius:50%;width:14px;height:14px;display:flex;align-items:center;justify-content:center;';
      wrap.appendChild(badge);
    }
    wrap.onclick = () => {
      if (typeof loadAuditAsset === 'function') loadAuditAsset(it.path, it.name);
    };
    grid.appendChild(wrap);
  }
}

// === Filter bar do PROMOTED ===
document.querySelectorAll('#promotedFilterBar button').forEach(b => {
  b.onclick = () => {
    promotedFilter = b.dataset.filter;
    document.querySelectorAll('#promotedFilterBar button').forEach(x => x.classList.toggle('active', x === b));
    if(window._promotedItems) fillSumGrid('sumPromotedGrid', window._promotedItems, promotedFilter);
  };
});

// === Refresh button ===
let _galleryRefreshing = false;
$("btnRefreshSummary")?.addEventListener('click', async () => {
  if(_galleryRefreshing) return; // Bug fix: debounce double-click
  _galleryRefreshing = true;
  const btn = $("btnRefreshSummary");
  btn.textContent = '⏳ Scanning…';
  btn.disabled = true;
  summaryData = null;
  summaryData = await fetchSummary() || {filesystem:[], orphans:[]};
  renderGallery();
  btn.textContent = '↻ Refresh';
  btn.disabled = false;
  _galleryRefreshing = false;
});
