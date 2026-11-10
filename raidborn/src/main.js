// Меню, инвентарь, магазин, награды, управление и главный цикл.
import * as gfx from './gfx.js';
import { B, input, startBattle, update, endBattle } from './game.js';
import { sfx, setSound, unlock, suspend } from './sfx.js';
import { L, RU, RAR, TIER_NAME, WEAPONS, WTYPES, PERKS, SLOTS, SLOT_NAME, MAX_ITEM_LVL, itemName, itemStats, upgradeCost, sellValue, itemPower, rollItem,
  CHESTS, chestCost, FREE_CHEST_MS, LOCS, LEVELS, levelGold, levelXp, xpNeed, league, LEAGUES, RIVALS, loadSave, newSave, store, getItem, heroStats, maxLoc } from './data.js';

const $ = id => document.getElementById(id);
let S = loadSave(), mode = 'menu', tab = 'home', paused = false, selLv = 0, modalClose = null, last = 0;
const cleared = () => { let n = 0; while (n < LEVELS && S.prog[n] > 0) n++; return n; };
selLv = Math.min(LEVELS - 1, cleared());
document.documentElement.lang = RU ? 'ru' : 'en';
setSound(S.sound);
const fmt = n => n >= 10000 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : '' + n;
const recPower = lv => Math.round(150 * Math.pow(1.14, lv));

// ---------- Иконки предметов ----------
const icons = new Map();
const TCOL = ['#58c26a', '#f0b35a', '#7fd6ff', '#ff6b5a'];
function icon(it) {
  const key = [it.slot, it.type, it.perk, it.rar, it.tier].join('|');
  if (icons.has(key)) return icons.get(key);
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), R = RAR[it.rar];
  const g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, R.color); g.addColorStop(1, R.dark); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  x.fillStyle = 'rgba(255,255,255,.16)'; x.beginPath(); x.ellipse(64, 20, 90, 34, 0, 0, 7); x.fill();
  x.lineJoin = x.lineCap = 'round'; x.strokeStyle = '#140d33'; x.lineWidth = 7;
  const tc = TCOL[it.tier], steel = '#eef3f8';
  const poly = (pts, fill) => { x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.stroke(); x.fillStyle = fill; x.fill(); };
  x.save(); x.translate(64, 60);
  if (it.slot === 'weapon') {
    if (it.type === 'sword') { x.rotate(0.78); poly([[-8, -52], [0, -62], [8, -52], [8, 18], [-8, 18]], steel); poly([[-24, 18], [24, 18], [24, 28], [-24, 28]], tc); poly([[-6, 28], [6, 28], [6, 50], [-6, 50]], '#8a5a2b'); }
    else if (it.type === 'daggers') { for (const s of [-1, 1]) { x.save(); x.rotate(s * 0.6); poly([[-7, -44], [0, -54], [7, -44], [7, 6], [-7, 6]], steel); poly([[-16, 6], [16, 6], [16, 14], [-16, 14]], tc); poly([[-5, 14], [5, 14], [5, 34], [-5, 34]], '#8a5a2b'); x.restore(); } }
    else if (it.type === 'hammer') { x.rotate(0.6); poly([[-6, -20], [6, -20], [6, 54], [-6, 54]], '#8a5a2b'); poly([[-34, -52], [34, -52], [34, -14], [-34, -14]], steel); poly([[-34, -38], [34, -38], [34, -28], [-34, -28]], tc); }
    else if (it.type === 'bow') { x.rotate(-0.5); x.lineWidth = 15; x.beginPath(); x.arc(-14, 0, 46, -1.25, 1.25); x.stroke(); x.strokeStyle = tc; x.lineWidth = 8; x.stroke();
      x.strokeStyle = '#140d33'; x.lineWidth = 3; x.beginPath(); x.moveTo(0.5, -44); x.lineTo(0.5, 44); x.stroke(); x.lineWidth = 7; poly([[-30, -3], [36, -3], [36, -10], [52, 0], [36, 10], [36, 3], [-30, 3]], steel); }
    else { x.rotate(0.5); poly([[-5, -22], [5, -22], [5, 56], [-5, 56]], '#8a5a2b'); x.beginPath(); x.arc(0, -38, 20, 0, 7); x.stroke(); x.fillStyle = tc; x.fill(); x.fillStyle = 'rgba(255,255,255,.7)'; x.beginPath(); x.arc(-6, -44, 6, 0, 7); x.fill(); }
  } else if (it.slot === 'armor') {
    poly([[-38, -40], [-16, -48], [0, -38], [16, -48], [38, -40], [44, -8], [28, -2], [26, 44], [0, 52], [-26, 44], [-28, -2], [-44, -8]], tc);
    poly([[-12, -14], [12, -14], [12, 26], [0, 32], [-12, 26]], steel);
  } else {
    x.lineWidth = 11; x.beginPath(); x.arc(0, -22, 34, 2.6, 6.82); x.stroke(); x.strokeStyle = '#ffd23d'; x.lineWidth = 5; x.stroke(); x.strokeStyle = '#140d33'; x.lineWidth = 7;
    poly([[0, -4], [24, 22], [0, 52], [-24, 22]], { crit: '#ff5a5a', speed: '#6dff8a', leech: '#ff5ad1', charge: '#ffd23d' }[it.perk]);
    x.fillStyle = 'rgba(255,255,255,.6)'; x.beginPath(); x.moveTo(0, 4); x.lineTo(12, 22); x.lineTo(0, 24); x.closePath(); x.fill();
  }
  x.restore();
  const url = c.toDataURL(); icons.set(key, url); return url;
}
const isEq = it => SLOTS.some(s => S.eq[s] === it.id);
function card(it, big) {
  const eq = getItem(S, S.eq[it.slot]), better = eq && eq.id !== it.id && itemPower(it) > itemPower(eq) * 1.01;
  return `<div class="it" data-a="item" data-v="${it.id}"><img src="${icon(it)}" alt="">${big ? '' : `<span>${L('Ур.', 'Lv')} ${it.lvl}</span>`}${isEq(it) && !big ? '<em>✓</em>' : ''}${better && !big ? '<u>▲</u>' : ''}</div>`;
}

// ---------- Меню ----------
const NAV = [
  ['shop', L('Магазин', 'Shop'), '<path d="M4 9h16l-1.4 10.2a2 2 0 0 1-2 1.8H7.4a2 2 0 0 1-2-1.8zM8 9V7a4 4 0 0 1 8 0v2h-2V7a2 2 0 0 0-4 0v2z"/>'],
  ['hero', L('Герой', 'Hero'), '<path d="M12 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 12c5 0 9 2.5 9 5.5V22H3v-2.500C3 16.500 7 14 12 14z"/>'],
  ['home', L('Битва', 'Battle'), '<path d="M3 3h4l10 10 2-2 2 2-3 3 3 3-2 2-3-3-3 3-2-2 2-2L3 7zM17 3h4v4l-4.500 4.500-4-4z"/>'],
  ['arena', L('Арена', 'Arena'), '<path d="M6 3h12v2h3v3a5 5 0 0 1-4.600 5A6 6 0 0 1 13 15.900V18h3v3H8v-3h3v-2.100A6 6 0 0 1 7.600 13 5 5 0 0 1 3 8V5h3zm0 4H5v1a3 3 0 0 0 1.500 2.600zm12 0v3.600A3 3 0 0 0 19 8V7z"/>'],
];
function render() {
  const st = heroStats(S), need = xpNeed(S.lvl);
  $('top').innerHTML = `<div class="pill" id="lvl"><b class="sh">${S.lvl}</b><i><u style="width:${Math.min(100, S.xp / need * 100)}%"></u></i></div>
    <div class="grow"></div><div class="pill sh"><span class="coin"></span>${fmt(S.gold)}</div>
    <button class="pill" id="snd" data-a="sound">${S.sound ? '🔊' : '🔇'}</button>`;
  const freeReady = Date.now() >= S.freeAt;
  $('nav').innerHTML = NAV.map(n => `<button class="${tab === n[0] ? 'on' : ''}" data-a="tab" data-v="${n[0]}"><svg viewBox="0 0 24 24">${n[2]}</svg><i>${n[1]}${n[0] === 'shop' && freeReady ? '<span class="dot"></span>' : ''}</i></button>`).join('');
  const pg = $('page');
  if (tab === 'home') {
    const loc = Math.floor(selLv / 5), open = cleared(), rec = recPower(selLv);
    let chips = '';
    for (let i = loc * 5; i < loc * 5 + 5; i++) {
      const st2 = S.prog[i] || 0, lock = i > open;
      chips += `<button class="lv sh ${i === selLv ? 'sel' : ''} ${lock ? 'lock' : ''} ${i % 5 === 4 ? 'boss' : ''}" data-a="lv" data-v="${i}">${lock ? '🔒' : i % 5 === 4 ? '☠' : i + 1}<small>${'★'.repeat(st2)}</small></button>`;
    }
    pg.innerHTML = `<div class="pill sh" id="pow">⚔ ${L('Сила', 'Power')}: ${fmt(st.power)}</div>
      <div class="panel"><div class="locrow"><button class="btn d arr" data-a="loc" data-v="-1" ${loc === 0 ? 'disabled' : ''}>◀</button>
      <h3 class="sh">${loc + 1}. ${LOCS[loc].name}</h3><button class="btn d arr" data-a="loc" data-v="1" ${loc === 3 ? 'disabled' : ''}>▶</button></div>
      <div class="lvls">${chips}</div>
      <div class="rec"><span>${L('Рекомендуемая сила', 'Recommended power')}: <b class="${st.power >= rec * 0.85 ? 'ok' : 'bad'}">${fmt(rec)}</b></span><span><span class="coin"></span>${levelGold(selLv) * (S.prog[selLv] ? 1 : 2)}</span></div>
      <button class="btn y big" data-a="play" ${selLv > open ? 'disabled' : ''}>${selLv % 5 === 4 ? L('Бой с боссом', 'Boss fight') : L('В бой!', 'Battle!')}</button></div>`;
  } else if (tab === 'hero') {
    const w = WEAPONS[st.wtype];
    const eq = SLOTS.map(s => { const it = getItem(S, S.eq[s]); return `<div class="slot">${it ? card(it) : '<div class="empty"></div>'}${SLOT_NAME[s]}</div>`; }).join('');
    const inv = S.items.filter(i => !isEq(i)).sort((a, b) => itemPower(b) - itemPower(a)).map(i => card(i)).join('');
    pg.innerHTML = `<div class="panel full" style="flex:0 1 62%"><div class="stats">
      <div class="stat sh"><small>${L('Здоровье', 'Health')}</small>❤ ${fmt(st.hp)}</div><div class="stat sh"><small>${L('Атака', 'Attack')}</small>⚔ ${fmt(st.atk)}</div>
      <div class="stat sh"><small>${L('Сила', 'Power')}</small>${fmt(st.power)}</div></div>
      <div class="eq">${eq}</div><div class="mut" style="margin-bottom:8px">${L('Суперудар', 'Super')}: ${w.sup} · ${L('Сумка', 'Bag')}: ${S.items.length - SLOTS.filter(s => S.eq[s]).length}</div>
      <div class="scroll"><div class="grid">${inv || ''}</div>${inv ? '' : `<p class="mut" style="padding:18px">${L('Сумка пуста. Предметы выпадают в боях и сундуках.', 'The bag is empty. Items drop in battles and chests.')}</p>`}</div></div>`;
  } else if (tab === 'shop') {
    const tier = maxLoc(S), left = S.freeAt - Date.now();
    const tm = left > 0 ? `${Math.floor(left / 3600000)}:${String(Math.floor(left / 60000) % 60).padStart(2, '0')}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}` : '';
    pg.innerHTML = `<div class="panel full" style="flex:0 1 auto"><h3 class="sh" style="margin-bottom:4px">${L('Сундуки', 'Chests')}</h3>
      <p class="mut" style="margin-bottom:10px">${L('Предметы уровня', 'Item tier')}: «${TIER_NAME[tier]}» · ${L('открывается новыми локациями', 'new locations unlock better tiers')}</p>
      <div class="chest"><div class="box" style="background:#7de35a"></div><div class="t sh">${L('Бесплатный сундук', 'Free chest')}<small>${L('Раз в 3 часа', 'Every 3 hours')}</small></div>
      <button class="btn g" data-a="free" ${left > 0 ? 'disabled' : ''} id="freeBtn">${left > 0 ? tm : L('Открыть', 'Open')}</button></div>
      ${CHESTS.map(c => { const cost = chestCost(c, tier); return `<div class="chest"><div class="box" style="background:${c.color}"></div><div class="t sh">${c.name}
        <small>${c.odds.map((o, i) => o ? `<span style="color:${RAR[i].color}">${o}%</span>` : '').filter(Boolean).join(' · ')}</small></div>
        <button class="btn y" data-a="chest" data-v="${c.id}" ${S.gold < cost ? 'disabled' : ''}><span class="coin"></span>${fmt(cost)}</button></div>`; }).join('')}</div>`;
  } else {
    const lg = league(S.trophies), i = LEAGUES.indexOf(lg), nx = LEAGUES[i + 1];
    pg.innerHTML = `<div class="panel"><div class="league"><div class="tro sh">🏆 ${S.trophies}</div><b class="sh" style="color:${lg.color}">${lg.name}</b>
      ${nx ? `<div class="bar"><u style="width:${(S.trophies - lg.at) / (nx.at - lg.at) * 100}%"></u></div><div class="mut">${L('До лиги', 'Next league')} «${nx.name}»: ${nx.at - S.trophies} 🏆</div>` : ''}</div>
      <p class="mut" style="margin-bottom:12px">${L('Дуэль один на один, 75 секунд. Соперниками управляет компьютер.', 'One-on-one duel, 75 seconds. Opponents are computer-controlled.')}<br>${L('Побед', 'Wins')}: ${S.wins}</p>
      <button class="btn r big" data-a="arena">${L('Найти соперника', 'Find opponent')}</button></div>`;
  }
}
function showMenu() {
  mode = 'menu'; paused = false; endBattle();
  $('battle').classList.remove('on'); $('menu').classList.add('on'); $('vign').style.opacity = 0;
  hud.clearRect(0, 0, innerWidth, innerHeight);
  gfx.showLobby(heroStats(S)); render();
}
function modal(html, onClose) { $('modal').innerHTML = `<div class="panel">${html}</div>`; $('modal').classList.add('on'); modalClose = onClose || null; }
function closeModal() { $('modal').classList.remove('on'); $('modal').innerHTML = ''; modalClose = null; }

function itemModal(id) {
  const it = getItem(S, id); if (!it) return;
  const s = itemStats(it), max = it.lvl >= MAX_ITEM_LVL, n = max ? s : itemStats(it, it.lvl + 1), cost = upgradeCost(it), eq = isEq(it), cur = getItem(S, S.eq[it.slot]);
  const line = (label, a, b) => a ? `<div>${label}: <b>${a}</b>${!max && b > a ? ` <span class="up">→ ${b}</span>` : ''}</div>` : '';
  let cmp = '';
  if (!eq && cur) { const d = Math.round(itemPower(it) - itemPower(cur)); cmp = `<div class="${d >= 0 ? 'up' : 'dn'}">${L('Сила', 'Power')}: ${d >= 0 ? '+' : ''}${d} ${L('к надетому', 'vs equipped')}</div>`; }
  const lastWeapon = it.slot === 'weapon' && S.items.filter(i => i.slot === 'weapon').length < 2;
  modal(`<div class="it bigit">${`<img src="${icon(it)}" alt="">`}</div><h3 class="sh" style="color:${RAR[it.rar].color};font-size:21px">${itemName(it)}</h3>
    <div class="mut">${RAR[it.rar].name} · ${SLOT_NAME[it.slot]} · ${L('ур.', 'lv')} ${it.lvl}/${MAX_ITEM_LVL}</div>
    <div class="lines" style="margin-top:8px">${line('⚔ ' + L('Атака', 'Attack'), s.atk, n.atk)}${line('❤ ' + L('Здоровье', 'Health'), s.hp, n.hp)}
    ${s.perk ? `<div class="up">${PERKS[s.perk].fmt(s.perkVal)}</div>` : ''}
    ${it.slot === 'weapon' ? `<div class="mut">${WEAPONS[it.type].desc}.<br>${L('Суперудар', 'Super')}: ${WEAPONS[it.type].sup}</div>` : ''}${cmp}</div>
    <div class="col">${eq ? '' : `<button class="btn g" data-a="equip" data-v="${id}">${L('Надеть', 'Equip')}</button>`}
    <button class="btn y" data-a="upg" data-v="${id}" ${max || S.gold < cost ? 'disabled' : ''}>${max ? L('Макс. уровень', 'Max level') : `${L('Улучшить', 'Upgrade')} <span><span class="coin"></span>${fmt(cost)}</span>`}</button>
    <div class="row" style="margin:0">${eq || lastWeapon ? '' : `<button class="btn r" data-a="sell" data-v="${id}">${L('Продать', 'Sell')} +${sellValue(it)}</button>`}<button class="btn d" data-a="close">${L('Закрыть', 'Close')}</button></div></div>`);
}
function openChest(odds, tier, color) {
  const it = rollItem(S, tier, odds); S.items.push(it); store(S); sfx.chest();
  modal(`<h3 class="sh">${L('Новый предмет!', 'New item!')}</h3><div class="it bigit shake">${`<img src="${icon(it)}" alt="">`}</div>
    <h3 class="sh" style="color:${RAR[it.rar].color};font-size:20px">${itemName(it)}</h3><div class="mut">${RAR[it.rar].name} · ${SLOT_NAME[it.slot]}</div>
    <div class="row"><button class="btn g" data-a="item" data-v="${it.id}">${L('Смотреть', 'View')}</button><button class="btn d" data-a="close">OK</button></div>`);
  render();
}
function addXp(n) { S.xp += n; let ups = 0; while (S.xp >= xpNeed(S.lvl)) { S.xp -= xpNeed(S.lvl); S.lvl++; ups++; } return ups; }

// ---------- Бой ----------
function begin(cfg) {
  closeModal(); mode = 'battle'; paused = false;
  $('menu').classList.remove('on'); $('battle').classList.add('on');
  const st = heroStats(S);
  startBattle({ ...cfg, hero: st, onEnd: onBattleEnd });
  $('bSup').firstElementChild.textContent = WEAPONS[st.wtype].sup; $('bDash').firstElementChild.textContent = L('Рывок', 'Dash');
  const tip = $('tip');
  if (S.tut < 2 && cfg.mode === 'level') { S.tut++; tip.style.display = 'block'; tip.innerHTML = L('Веди пальцем — герой идёт и сам бьёт ближайшего врага.<br>Красные круги — уходи из них!', 'Drag to move — the hero attacks the nearest enemy automatically.<br>Red circles — get out of them!'); setTimeout(() => tip.style.display = 'none', 6500); }
  else tip.style.display = 'none';
}
function playLevel(lv) { selLv = lv; begin({ mode: 'level', lv }); }
function findRival() {
  const me = heroStats(S), k = 0.8 + Math.min(0.36, S.trophies / 2200 * 0.36) + (Math.random() - 0.5) * 0.12;
  const rv = { hp: Math.round(me.hp * k), atk: Math.round(me.atk * k), crit: 0.08, speed: 1, leech: 0, charge: 1, wtype: WTYPES[Math.floor(Math.random() * WTYPES.length)],
    armorTier: maxLoc(S), armorRar: Math.min(3, Math.floor(Math.random() * 2 + S.trophies / 700)), wRar: Math.min(3, Math.floor(Math.random() * 2 + S.trophies / 700)),
    name: RIVALS[Math.floor(Math.random() * RIVALS.length)], skill: Math.min(1, 0.15 + S.trophies / 1600) };
  rv.power = Math.round(rv.atk * 4 + rv.hp * 0.5);
  modal(`<h3 class="sh">${L('Поиск соперника', 'Searching')}…</h3><div class="spin"></div>`);
  setTimeout(() => {
    if (!$('modal').classList.contains('on')) return;
    modal(`<h3 class="sh">${L('Соперник найден', 'Opponent found')}</h3><div class="vs sh"><div>${me.name}<small>⚔ ${fmt(me.power)}</small><small>${WEAPONS[me.wtype].name}</small></div><b>VS</b>
      <div>${rv.name}<small>⚔ ${fmt(rv.power)}</small><small>${WEAPONS[rv.wtype].name}</small></div></div>`);
    sfx.boss();
    setTimeout(() => { if ($('modal').classList.contains('on')) begin({ mode: 'arena', loc: Math.floor(Math.random() * (maxLoc(S) + 1)), rival: rv }); }, 1500);
  }, 900 + Math.random() * 900);
}
function onBattleEnd(r) {
  let gold = 0, xp = 0, item = null, extra = '', tro = 0;
  if (r.mode === 'level') {
    const first = !S.prog[r.lv], loc = Math.floor(r.lv / 5), boss = r.lv % 5 === 4;
    if (r.win) {
      gold = levelGold(r.lv) * (first ? 2 : 1); xp = levelXp(r.lv); S.prog[r.lv] = Math.max(S.prog[r.lv] || 0, r.stars);
      if (boss && first) item = rollItem(S, loc, [0, 70, 26, 4]); else if (Math.random() < 0.24) item = rollItem(S, loc, [70, 25, 5, 0]);
      if (boss && first && loc < 3) extra = `<div class="up" style="margin-top:6px">${L('Открыта локация', 'Location unlocked')}: ${LOCS[loc + 1].name}!</div>`;
    } else { gold = Math.round(levelGold(r.lv) * 0.15); xp = Math.round(levelXp(r.lv) * 0.2); }
  } else {
    const base = 30 + Math.round(S.trophies * 0.12) + maxLoc(S) * 40;
    if (r.win) { tro = 26 + Math.floor(Math.random() * 9); gold = base; xp = Math.round(levelXp(Math.min(19, cleared())) * 0.6); S.wins++; }
    else { tro = -Math.min(S.trophies, 16 + Math.floor(Math.random() * 7)); gold = Math.round(base * 0.2); }
    S.trophies += tro;
  }
  S.gold += gold; if (item) S.items.push(item);
  const ups = addXp(xp); store(S);
  if (ups) setTimeout(sfx.up, 900);
  const next = r.mode === 'level' && r.win && r.lv + 1 < LEVELS;
  modal(`<h3 class="sh" style="color:${r.win ? '#ffd23d' : '#ff7a7a'};font-size:32px">${r.win ? L('Победа!', 'Victory!') : L('Поражение', 'Defeat')}</h3>
    ${r.mode === 'level' && r.win ? `<div class="stars sh">${'★'.repeat(r.stars)}<s>${'★'.repeat(3 - r.stars)}</s></div>` : ''}
    <div class="rew sh">${gold ? `<div><span class="coin"></span>+${gold}</div>` : ''}${xp ? `<div>XP +${xp}</div>` : ''}${tro ? `<div>🏆 ${tro > 0 ? '+' : ''}${tro}</div>` : ''}</div>
    ${item ? `<div class="it bigit" style="width:84px" data-a="none">${`<img src="${icon(item)}" alt="">`}</div><div class="mut" style="color:${RAR[item.rar].color}">${itemName(item)} · ${RAR[item.rar].name}</div>` : ''}
    ${ups ? `<div class="up" style="font-size:18px;margin-top:6px">${L('Новый уровень героя', 'Hero level up')}: ${S.lvl}!</div>` : ''}${extra}
    ${!r.win ? `<p class="mut" style="margin-top:8px">${L('Улучшите оружие и броню во вкладке «Герой» или откройте сундук.', 'Upgrade your gear in the Hero tab or open a chest.')}</p>` : ''}
    <div class="col">${next ? `<button class="btn y" data-a="next">${L('Следующий уровень', 'Next level')}</button>` : ''}
    <div class="row" style="margin:0"><button class="btn" data-a="again">${r.mode === 'arena' ? L('Ещё бой', 'Fight again') : L('Заново', 'Retry')}</button><button class="btn d" data-a="home">${L('В меню', 'Menu')}</button></div></div>`);
  if (r.mode === 'level' && r.win) selLv = Math.min(LEVELS - 1, Math.max(selLv, r.lv + (next ? 1 : 0)));
  lastResult = r;
}
let lastResult = null;
function setPause(p) {
  if (mode !== 'battle' || !B || B.state === 'done') return;
  paused = p;
  if (p) modal(`<h3 class="sh">${L('Пауза', 'Paused')}</h3><div class="col"><button class="btn g" data-a="resume">${L('Продолжить', 'Resume')}</button>
    <button class="btn d" data-a="sound">${S.sound ? L('Звук: вкл', 'Sound: on') : L('Звук: выкл', 'Sound: off')}</button>
    <button class="btn r" data-a="quit">${L('Выйти из боя', 'Leave battle')}</button></div>`);
  else closeModal();
}

// ---------- Действия ----------
const acts = {
  tab(v) { tab = v; render(); },
  sound() { S.sound = !S.sound; setSound(S.sound); unlock(); store(S); if (paused) setPause(true); else render(); },
  lv(v) { selLv = +v; render(); },
  loc(v) { const loc = Math.max(0, Math.min(3, Math.floor(selLv / 5) + +v)); selLv = Math.min(loc * 5 + 4, Math.max(loc * 5, Math.min(cleared(), loc * 5 + 4))); render(); },
  play() { if (selLv <= cleared()) playLevel(selLv); },
  arena() { findRival(); },
  item(v) { itemModal(+v); },
  equip(v) { const it = getItem(S, +v); S.eq[it.slot] = it.id; store(S); closeModal(); gfx.showLobby(heroStats(S)); render(); sfx.up(); return true; },
  upg(v) { const it = getItem(S, +v), c = upgradeCost(it); if (S.gold < c || it.lvl >= MAX_ITEM_LVL) return sfx.deny(); S.gold -= c; it.lvl++; store(S); sfx.coin(); itemModal(it.id); render(); return true; },
  sell(v) { const it = getItem(S, +v); if (isEq(it)) return; S.gold += sellValue(it); S.items = S.items.filter(i => i !== it); store(S); sfx.coin(); closeModal(); render(); return true; },
  chest(v) { const c = CHESTS.find(x => x.id === v), t = maxLoc(S), cost = chestCost(c, t); if (S.gold < cost) return sfx.deny(); S.gold -= cost; openChest(c.odds, t, c.color); return true; },
  free() { if (Date.now() < S.freeAt) return; S.freeAt = Date.now() + FREE_CHEST_MS; openChest(CHESTS[0].odds, maxLoc(S)); return true; },
  close() { closeModal(); },
  resume() { setPause(false); },
  quit() { closeModal(); showMenu(); },
  home() { closeModal(); showMenu(); },
  again() { closeModal(); if (lastResult.mode === 'arena') { showMenu(); tab = 'arena'; render(); findRival(); } else playLevel(lastResult.lv); },
  next() { closeModal(); playLevel(lastResult.lv + 1); },
  none() {},
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el || el.disabled) return;
  unlock(); if (!acts[el.dataset.a](el.dataset.v)) sfx.click();
});
$('bPause').addEventListener('click', () => { unlock(); setPause(true); });

// ---------- Управление в бою ----------
let joyId = null, jx = 0, jy = 0;
const stick = $('stick'), joy = $('joy'), knob = joy.firstElementChild;
stick.addEventListener('pointerdown', e => {
  if (joyId !== null || paused) return; unlock();
  joyId = e.pointerId; jx = e.clientX; jy = e.clientY; joy.style.display = 'block'; joy.style.left = jx + 'px'; joy.style.top = jy + 'px'; knob.style.transform = '';
  try { stick.setPointerCapture(e.pointerId); } catch (err) {}
});
stick.addEventListener('pointermove', e => {
  if (e.pointerId !== joyId) return;
  let dx = e.clientX - jx, dy = e.clientY - jy; const d = Math.hypot(dx, dy), m = 46;
  if (d > m) { dx *= m / d; dy *= m / d; }
  knob.style.transform = `translate(${dx}px,${dy}px)`; input.mx = dx / m; input.mz = dy / m;
});
const joyEnd = e => { if (e.pointerId !== joyId) return; joyId = null; joy.style.display = 'none'; input.mx = input.mz = 0; };
stick.addEventListener('pointerup', joyEnd); stick.addEventListener('pointercancel', joyEnd);
$('bDash').addEventListener('pointerdown', e => { e.preventDefault(); unlock(); input.dash = true; });
$('bSup').addEventListener('pointerdown', e => { e.preventDefault(); unlock(); input.sup = true; });
const keys = {};
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (mode !== 'battle') return;
  if (e.code === 'Space') { input.dash = true; e.preventDefault(); }
  if (e.code === 'KeyE' || e.code === 'Enter') input.sup = true;
  if (e.code === 'Escape' || e.code === 'KeyP') setPause(!paused);
});
addEventListener('keyup', e => { keys[e.code] = false; });
function readKeys() {
  if (joyId !== null) return;
  const x = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0), z = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
  input.mx = x; input.mz = z;
}
document.addEventListener('contextmenu', e => e.preventDefault());

// ---------- Экранные индикаторы ----------
const hudC = $('hud'), hud = hudC.getContext('2d');
let dpr = 1;
function resize() {
  dpr = Math.min(devicePixelRatio || 1, 2); hudC.width = innerWidth * dpr; hudC.height = innerHeight * dpr; hud.setTransform(dpr, 0, 0, dpr, 0, 0);
  gfx.resize(); if (mode === 'menu') gfx.showLobby(heroStats(S));
}
addEventListener('resize', resize);
function drawHud() {
  const W = innerWidth, H = innerHeight; hud.clearRect(0, 0, W, H);
  hud.textAlign = 'center'; hud.textBaseline = 'middle'; hud.lineJoin = 'round';
  for (const e of B.ents) {
    if (!e.alive) continue;
    const [x, y] = gfx.project(e.x, 2.05 * e.h + 0.25, e.z);
    if (e.enemy && (x < -10 || x > W + 10 || y < 60 || y > H + 40)) { // стрелка к врагу за экраном
      const [gx, gy] = gfx.project(e.x, 0.5, e.z), cx = Math.max(18, Math.min(W - 18, gx)), cy = Math.max(110, Math.min(H - 190, gy)), a = Math.atan2(gy - cy, gx - cx);
      hud.save(); hud.translate(cx, cy); hud.rotate(a); hud.fillStyle = e.boss ? '#ffd23d' : '#ff5a5a'; hud.strokeStyle = '#140d33'; hud.lineWidth = 2.5;
      hud.beginPath(); hud.moveTo(11, 0); hud.lineTo(-7, -9); hud.lineTo(-7, 9); hud.closePath(); hud.fill(); hud.stroke(); hud.restore(); continue;
    }
    if (e === B.hero || e.boss || e === B.rival) { if (e !== B.hero) continue; }
    const w = e === B.hero ? 54 : 22 + e.r * 28, h = e === B.hero ? 8 : 6, p = Math.max(0, e.hp / e.maxHp);
    hud.fillStyle = '#140d33'; hud.fillRect(x - w / 2 - 2, y - 2, w + 4, h + 4); hud.fillStyle = '#3a2a4a'; hud.fillRect(x - w / 2, y, w, h);
    hud.fillStyle = e === B.hero ? '#6dff6a' : '#ff5a5a'; hud.fillRect(x - w / 2, y, w * p, h);
    if (e.stun > 0) { hud.font = '900 13px sans-serif'; hud.fillStyle = '#ffd23d'; hud.fillText('✦✦✦', x, y - 9); }
  }
  for (const t of B.texts) {
    const [x, y] = gfx.project(t.x, t.y, t.z); hud.globalAlpha = Math.min(1, t.life * 3);
    hud.font = `900 ${t.size}px "Arial Rounded MT Bold",system-ui,sans-serif`; hud.lineWidth = 4; hud.strokeStyle = '#140d33'; hud.strokeText(t.s, x, y); hud.fillStyle = t.color; hud.fillText(t.s, x, y);
  }
  hud.globalAlpha = 1;
  if (B.bannerT > 0) {
    const k = Math.min(1, (1.6 - B.bannerT) * 6), a = Math.min(1, B.bannerT * 3);
    hud.globalAlpha = a; hud.font = `900 ${Math.round(Math.min(44, W / (B.banner.length * 0.62)) * (0.6 + 0.4 * k))}px "Arial Rounded MT Bold",system-ui,sans-serif`;
    hud.lineWidth = 8; hud.strokeStyle = '#140d33'; hud.strokeText(B.banner, W / 2, H * 0.3); hud.fillStyle = '#ffd23d'; hud.fillText(B.banner, W / 2, H * 0.3); hud.globalAlpha = 1;
  }
  const h = B.hero;
  $('hpBar').style.width = Math.max(0, h.hp / h.maxHp * 100) + '%'; $('hpTxt').textContent = Math.max(0, Math.ceil(h.hp)) + ' / ' + Math.round(h.maxHp);
  $('wave').textContent = B.mode === 'arena' ? '⏱ ' + Math.ceil(B.time) : `${LOCS[B.loc].name} · ${L('уровень', 'level')} ${B.lv + 1} · ${L('волна', 'wave')} ${Math.max(1, B.wave + 1)}/${B.waves.length}`;
  const sup = $('bSup'), ds = $('bDash'), sp = h.sup / h.supMax;
  sup.style.setProperty('--p', sp); sup.classList.toggle('rdy', sp >= 1);
  ds.style.setProperty('--p', Math.max(0, h.dashCd / 2.6)); ds.classList.toggle('cd', h.dashCd > 0);
  const foe = B.rival || B.ents.find(e => e.boss && e.alive), fe = $('foe');
  if (foe) { fe.style.display = 'block'; $('foeName').textContent = foe.name; $('foeBar').style.width = Math.max(0, foe.hp / foe.maxHp * 100) + '%'; } else fe.style.display = 'none';
  $('vign').style.opacity = B.hurt * 0.8 + (h.alive && h.hp / h.maxHp < 0.25 ? 0.25 + 0.15 * Math.sin(performance.now() / 150) : 0);
}

// ---------- Цикл ----------
let shopTick = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
  if (mode === 'battle' && B) {
    if (!paused) for (let i = 0; i < dbg.speed && B; i++) { readKeys(); if (dbg.tick) dbg.tick(); update(dt); gfx.tickFx(dt); }
    if (B) drawHud();
  } else {
    if (!dbg.freeze) gfx.lobbyTick(dt);
    shopTick += dt; if (shopTick > 1) { shopTick = 0; if (tab === 'shop' && !$('modal').classList.contains('on')) render(); }
  }
  gfx.render();
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (mode === 'battle') setPause(true); store(S); suspend(); } });
// «Назад» на Android: 'handled' — остаёмся, 'exit' — можно закрывать приложение.
window.__back = () => {
  if (mode === 'battle') { if (B && B.state !== 'done') setPause(!paused); return 'handled'; }
  if ($('modal').classList.contains('on')) { closeModal(); return 'handled'; }
  if (tab !== 'home') { tab = 'home'; render(); return 'handled'; }
  store(S); return 'exit';
};
const dbg = { speed: 1, tick: null };
window.__rb = { dbg, gfx, findRival, upgradeCost, itemPower, chestCost, CHESTS, rollItem, maxLoc: () => maxLoc(S), get S() { return S; }, get B() { return B; }, input, playLevel, heroStats: () => heroStats(S), reset() { S = newSave(); store(S); showMenu(); }, begin, save: () => store(S), icon };

gfx.init($('gl')); resize(); showMenu(); requestAnimationFrame(frame);
