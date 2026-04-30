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

// 🎮 IN-GAME panel — render no Audit tab (chamado por tab-manager quando tab Audit
// está ativa). Lista PNGs em pastas categorizadas (não inbox) sem decisão registrada.
function renderInGamePanel(){
  if (!$("sumInGame")) return;
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
  const inGameUnaudited = fsAssets.filter(a => {
    const path = a.abs || a.path.replace(/^\.\.\//, '');
    if (/inbox/.test(path)) return false;
    if (decidedPaths.has(path)) return false;
    return true;
  });
  $("sumInGame").textContent = inGameUnaudited.length;
  const byCat = {};
  for (const a of inGameUnaudited) {
    const path = a.abs || a.path;
    let cat = 'outros';
    const m = path.match(/pixel_labs\/([^/]+)(?:\/([^/]+))?(?:\/([^/]+))?/);
    if (m) {
      if (m[1] === 'hud')                cat = '📺 HUD';
      else if (m[1] === 'items')         cat = '🍔 items';
      else if (m[1] === 'chars' && m[2] === 'nature') cat = '🌳 nature/' + (m[3] || '?');
      else if (m[1] === 'chars' && m[3] === 'anims')  cat = '🎬 anims/' + (m[2] || '?');
      else if (m[1] === 'chars')         cat = '🧍 chars/' + (m[2] || '?');
    }
    byCat[cat] = (byCat[cat] || 0) + 1;
  }
  const sorted = Object.entries(byCat).sort((a,b) => b[1] - a[1]);
  $("sumInGameBd").innerHTML = sorted.slice(0, 8)
    .map(([c, n]) => `<span style="color:#9fcfe8;margin-right:10px;">${c}: <strong>${n}</strong></span>`)
    .join('') + (sorted.length > 8 ? ` <span style="opacity:.5">+ ${sorted.length-8} cats</span>` : '');
  fillSumGrid('sumInGameGrid', inGameUnaudited.map(a => ({path: a.path, name: a.path.split(/[\\/]/).pop()})));
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
