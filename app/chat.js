/* نبض آسان — سوال جواب (چیٹ بوٹ)
   یہ بوٹ صرف ایپ کے اپنے ڈیٹا (D) سے جواب دیتا ہے: عادات و علامات، تحریک/تحلیل/تسکین/تخدیر کے عوارضات،
   علاج و فارماکوپیا، غذائی چارٹ۔ ڈیٹا میں جو بات نہ ملے اس پر صاف کہتا ہے کہ نہیں ملی۔ اپنی طرف سے کوئی طبی بات نہیں گھڑتا۔ */
(function (G) {
'use strict';
let E = null, K = null;
const SECN = { habits: 'عادات و علامات', tahrik: 'تحریک کے عوارضات', tahlil: 'تحلیل کے عوارضات', taskeen: 'تسکین کے عوارضات', takhdeer: 'تخدیر کے عوارضات' };
const SECK = Object.keys(SECN);
const S = { msgs: [], draft: '', more: [] };

/* ---------- اردو کی نارملائزیشن ---------- */
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
const MAP = { 'ي': 'ی', 'ى': 'ی', 'ې': 'ی', 'ے': 'ی', 'ۓ': 'ی', 'ئ': 'ی', 'ك': 'ک', 'ڪ': 'ک', 'ة': 'ہ', 'ۃ': 'ہ', 'ۂ': 'ہ', 'ە': 'ہ', 'ھ': 'ہ', 'ء': '', 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ؤ': 'و', 'ۆ': 'و', 'ں': 'ن' };
function nz(s) {
  s = String(s == null ? '' : s);
  s = s.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '').replace(/\u0640+/g, ' ');
  s = s.replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 1776));
  s = s.replace(/[\u060C\u061B\u061F\u066A-\u066D\u06D4]/g, ' ');
  s = s.replace(/[^\u0600-\u06FFa-zA-Z0-9]/g, ' ');
  s = s.replace(/[\u0600-\u06FF]/g, c => (MAP[c] !== undefined ? MAP[c] : c));
  return s.replace(/\s+/g, ' ').trim();
}
function stem(w) {
  if (w.length > 5 && /یان$/.test(w)) return w.slice(0, -3);
  if (w.length > 4 && /(ون|ین)$/.test(w)) return w.slice(0, -2);
  if (w.length > 3 && /(نا|تا|تی|نی)$/.test(w)) return w.slice(0, -2);
  if (w.length > 3 && /[یہ]$/.test(w)) return w.slice(0, -1);
  return w;
}
const toks = s => nz(s).split(' ').filter(Boolean).map(stem);
const W = list => new Set(list.split(/\s+/).filter(Boolean).flatMap(toks));

const STOP = W('میرا میری میرے مجھے مجھ ہم ہمارا ہے ہیں ہوں ہو ہوتا ہوتی ہوتے ہوا ہوئی ہوئے کا کی کے کو سے میں پر نے اور یا کیا کیوں کس کون کیسے کب کہاں کوئی بھی تو ہی ایک اس اب جب تک بتائیں بتاو بتائیے بتا بتانا براہ مہربانی پلیز جی سلام السلام علیکم لیے لئے والا والی والے رہا رہی رہے رہتا رہتی رہتے ہوگیا ہوگئی گیا گئی گئے لگا لگی لگے لگتا لگتی آتا آتی آتے آنا ہونا کرنا کرتا کرتی کریں کرو کروں سکتا سکتی سکتے چاہیے چاہئے وہ یہ یہی ان کچھ ساتھ بارے متعلق مسئلہ شکایت تکلیف رہتی ہر کر کی ہوں دیں دیجیے');
const WEAK = W('نہیں نہ نا');
const I_TREAT = W('علاج دوا دوائی ادویہ نسخہ نسخے معالجہ دوائیں');
const I_DIET = W('غذا خوراک کھانا کھانے کھائیں کھاؤں پرہیز پرہیزی چارٹ');
const I_WHY = W('وجہ وجوہات سبب اسباب کیوں');
const I_PAREZ = W('پرہیز پرہیزی');
const TYPEW = W('علامات علامت عوارض عوارضات عادات پہچان نشانی نشانیاں قسم اقسام نبض بارے تفصیل');
const I_AM = W('امالہ');
const I_ZD = W('ضد');

/* ---------- عام بول چال سے ڈیٹا کی اصطلاحات (صرف تلاش کے لیے؛ جواب ہمیشہ ڈیٹا کا اپنا متن ہے) ---------- */
const GROUPS = [
  ['بال گرنا|بال جھڑنا|بالوں کا جھڑنا|بالوں کا گرنا|گنجا پن|گنج|بال اڑنا', ['بال گرنا']],
  ['بال سفید|سفید بال|بالوں کا سفید|بال قبل ازوقت', ['بال سفید']],
  ['نیند نہیں|نیند کم|نیند کی کمی|بے خوابی|نیند نہ|نیند اڑ|رات کو نیند|سو نہیں', ['نیند کمی']],
  ['نیند زیادہ|کثرت نیند|نیند بہت|بہت سوتا|زیادہ سوتا|سستی نیند', ['کثرت نیند']],
  ['شوگر|ذیابیطس|ذیابطس|ڈائبیٹیز|ڈایابیٹس|بلڈ شوگر', ['شوگر']],
  ['بلڈ پریشر|فشار خون|فشارالدم|فشار الدم|خون کا دباؤ|ہائی بی پی|لو بی پی|بی پی', ['خون دباو', 'بلڈ پریشر', 'فشارالدم']],
  ['کولیسٹرول|کولسٹرول|چربی', ['کولیسٹرول', 'چربی']],
  ['ٹرائی گلیسرائیڈ|ٹرائیگلیسرائیڈ|ٹرائی گلیسرائیڈز', ['ٹرائیگلیسرائیڈ', 'ٹرائی گلیسرائیڈ']],
  ['ہارٹ اٹیک|دل کا دورہ|دل کا حملہ|دل کی بیماری', ['ہارٹ اٹیک', 'دل حملہ']],
  ['دل|قلب|دل ڈوبنا|دل کمزور|دل گھبرانا|دل کی دھڑکن', ['دل', 'قلب']],
  ['جوڑوں|جوڑ|گھٹنے|گھٹنوں|گنٹھیا|ارتھرائٹس|جوڑوں کا درد|گٹھیا', ['جوڑ', 'المفاصل', 'مفاصل', 'گنٹھیا']],
  ['سر درد|سر میں درد|آدھے سر|میگرین|مائیگرین|درد شقیقہ|شقیقہ', ['سر درد', 'شقیقہ']],
  ['قبض|پیٹ صاف نہیں|پیٹ صاف', ['قبض']],
  ['اسہال|دست|پتلے پاخانے|پتلا پاخانہ|ڈائریا|پیچش|پیچس|لوز موشن', ['اسہال', 'پیچس', 'پاخانے']],
  ['گیس|ریاح|پیٹ پھولنا|پیٹ میں گیس|اپھارہ|تبخیر|معدے میں گیس', ['گیس', 'ریاح', 'تبخیر']],
  ['بواسیر|مسے|پائلز|بواسیری', ['بواسیر']],
  ['کھانسی|کھانسنا', ['کھانسی']],
  ['دمہ|سانس|سانس پھولنا|استھما|استھیما|سانس کی تکلیف', ['دمہ', 'سانس', 'استھیما']],
  ['نزلہ|زکام|فلو|ناک بند|ناک بہنا', ['نزلہ', 'زکام']],
  ['بخار|ملیریا|تپ', ['بخار', 'ملیریا']],
  ['پتھری|پتھریاں|پتھر|گردے کی پتھری|پتے کی پتھری', ['پتھر']],
  ['یرقان|جانڈس|پیلیا', ['یرقان']],
  ['خون کی کمی|انیمیا|خون کم|خون نہیں|خون کی کمی ہے', ['خون کمی']],
  ['کمزوری|کمزور|ضعف|طاقت نہیں|نقاہت', ['ضعف', 'کمزور']],
  ['بھولنا|یادداشت|یاداشت|نسیان|بھول جاتا|بھول جاتی', ['نسیان']],
  ['نظر کمزور|بینائی|نظر|موتیا|آنکھ کمزور|آنکھوں کی کمزوری', ['ضعف بصر', 'موتیا', 'بصر']],
  ['کان بجنا|کانوں میں آواز|بہرہ|اونچا سنائی|کم سنائی|سنائی نہیں|سماعت', ['کان بجنا', 'بہرہ', 'سنائی']],
  ['پیشاب|بار بار پیشاب|پیشاب کی جلن|پیشاب بند|پیشاب میں', ['پیشاب', 'بول']],
  ['حیض|ماہواری|ایام|پیریڈ|حیض بند|ماہواری کی بے ترتیبی|ماہواری کا درد', ['حیض', 'طمث', 'استحاضہ']],
  ['مردانہ کمزوری|نامردی|جماع|جنسی کمزوری|شہوت|احتلام|جریان|سرعت انزال|باہ', ['باہ', 'شہوت', 'جماع', 'انزال', 'احتلام', 'جریان']],
  ['خارش|دانے|جلد کا مسئلہ|چھپاکی|ایگزیما|پھنسیاں|پھنسی|پھوڑے', ['خارش', 'ایگزیما', 'چھپاکی', 'پھنسی', 'پھوڑا']],
  ['معدہ|ہاضمہ|بدہضمی|ہضم|تیزابیت|معدے', ['معدہ', 'ہضم']],
  ['موٹاپا|موٹا|وزن زیادہ|وزن بڑھ|توند|پیٹ نکلنا', ['فربہ', 'توند', 'موٹا']],
  ['دبلا|دبلاپن|وزن کم|وزن نہیں بڑھتا', ['دبلا', 'دبلی']],
  ['غصہ|چڑچڑا|چڑچڑاپن', ['غصہ', 'چڑچڑا']],
  ['چکر|سر چکرانا|چکر آنا', ['چکر']],
  ['گھبراہٹ|بے چینی', ['گھبراہٹ']],
  ['پسینہ|پسینے', ['پسینہ']],
  ['منہ کا ذائقہ|ذائقہ|منہ کڑوا|منہ پھیکا', ['ذائقہ']],
  ['پتہ|پتے', ['پتہ']],
  ['رسولی|رسولیاں|گلٹی|گلٹیاں|ٹیومر', ['رسولی', 'گلٹی']],
  ['نکسیر|ناک سے خون', ['نکسیر']]
].map(([tr, pats]) => ({
  trig: tr.split('|').map(t => [...new Set(toks(t))]).filter(a => a.length),
  pats: pats.map(p => [...new Set(toks(p))])
}));

/* ---------- ڈیٹا کی تیاری ---------- */
function prep(text) {
  const chunks = String(text || '').replace(/\s+ـ+(?=\s|$)/g, ' ').split(/\s+/).filter(c => c && !/^[ـ\.\-–—،,]+$/.test(c));
  const words = [], ci = [];
  chunks.forEach((c, k) => toks(c).forEach(w => { words.push(w); ci.push(k); }));
  return { chunks, words, ci };
}
function build() {
  const { D, T, FM, MEDS } = E;
  K = { ents: [], food: [], df: new Map() };
  SECK.forEach(sec => T.forEach((t, ti) => {
    const x = D[sec] && D[sec][t]; if (!x) return;
    const p = prep(x); K.ents.push(Object.assign({ kind: 'sec', sec, ti, text: x }, p));
    new Set(p.words).forEach(w => K.df.set(w, (K.df.get(w) || 0) + 1));
  }));
  MEDS.forEach(m => T.forEach((tt, ti) => {
    const x = D.med[m] && D.med[m][tt]; if (!x) return;
    K.ents.push(Object.assign({ kind: 'med', m, tt, ti, text: x }, prep(x)));
  }));
  D.food.forEach((s, k) => {
    s.replace(/^\s*\d+\s*\.\s*/, '').split('ـ').map(v => v.trim()).filter(Boolean).forEach(it => K.food.push({ n: k + 1, item: it, w: new Set(toks(it)) }));
  });
  K.typeToks = T.map(t => toks(t));
}

/* ---------- تلاش ---------- */
function findHits(ent, pat) {
  const w = ent.words, n = pat.size, out = [], lim = n + 3;
  for (let i = 0; i < w.length; i++) {
    if (!pat.has(w[i])) continue;
    const found = new Set(), pos = []; let last = i;
    for (let j = i; j < Math.min(w.length, i + lim + 1); j++) if (pat.has(w[j])) { found.add(w[j]); pos.push(j); last = j; }
    if (found.size === n) { out.push({ s: i, e: last, pos }); i = last; }
  }
  return out;
}
function snip(ent, h) {
  const a = ent.ci[h.s], b = ent.ci[h.e], lo = Math.max(0, a - 6), hi = Math.min(ent.chunks.length - 1, b + 8);
  const mk = new Set(h.pos.map(p => ent.ci[p])), o = [];
  for (let k = lo; k <= hi; k++) { const c = esc(ent.chunks[k]); o.push(mk.has(k) ? '<mark>' + c + '</mark>' : c); }
  return (lo > 0 ? '… ' : '') + o.join(' ') + (hi < ent.chunks.length - 1 ? ' …' : '');
}
function analyse(q) {
  const all = nz(q).split(' ').filter(Boolean).map(stem), set = new Set(all);
  const has = s => all.some(w => s.has(w));
  const it = { treat: has(I_TREAT), diet: has(I_DIET), why: has(I_WHY), pareez: has(I_PAREZ), am: has(I_AM), zd: has(I_ZD) };
  let type = -1, typeTok = new Set();
  E.T.forEach((t, i) => { const tk = K.typeToks[i]; for (let k = 0; k + 1 < all.length; k++) if (all[k] === tk[0] && all[k + 1] === tk[1] && type < 0) { type = i; tk.forEach(x => typeTok.add(x)); } });
  const chart = (nz(q).match(/چارٹ\s*(?:نمبر\s*)?([1-8])/) || [])[1];
  const cont = all.filter(w => !STOP.has(w) && !I_TREAT.has(w) && !I_DIET.has(w) && !I_WHY.has(w) && !WEAK.has(w) && !I_AM.has(w) && !I_ZD.has(w) && !TYPEW.has(w) && !typeTok.has(w) && !/^\d+$/.test(w));
  const pats = [], seen = new Set(); let syn = false;
  const addP = (p, isSyn) => { const k = [...p].sort().join('|'); if (!p.size || seen.has(k)) return; seen.add(k); pats.push({ tok: p, syn: isSyn }); };
  GROUPS.forEach(g => { if (g.trig.some(t => t.every(x => set.has(x)))) { syn = true; g.pats.forEach(p => addP(new Set(p), true)); } });
  if (!syn && cont.length) addP(new Set(cont), false);
  let qual = [];
  if (syn) { const used = new Set(); GROUPS.forEach(g => g.trig.forEach(t => { if (t.every(x => set.has(x))) t.forEach(x => used.add(x)); })); const rest = cont.filter(x => !used.has(x)); qual = rest; if (rest.length >= 2) addP(new Set(rest), false); }
  return { all, cont, it, type, chart: chart ? +chart : 0, pats, syn, qual };
}
function runSearch(a, pats, secOnly) {
  const by = new Map(), meds = [];
  K.ents.forEach(ent => {
    if (a.type >= 0 && ent.kind === 'sec' && ent.ti !== a.type) return;
    if (secOnly && ent.kind !== 'sec') return;
    let hits = [];
    pats.forEach(p => findHits(ent, p.tok).forEach(h => hits.push(Object.assign(h, { syn: p.syn }))));
    if (!hits.length) return;
    hits.sort((x, y) => x.s - y.s);
    const merged = []; hits.forEach(h => { const l = merged[merged.length - 1]; if (l && h.s - l.e <= 6) { l.e = Math.max(l.e, h.e); l.pos = l.pos.concat(h.pos); l.syn = l.syn || h.syn; } else merged.push(h); });
    merged.forEach(h => { const ps = new Set(h.pos.map(p => ent.words[p])), lo = Math.max(0, h.s - 5), hi = Math.min(ent.words.length, h.e + 6), near = new Set(ent.words.slice(lo, hi)); h.bonus = (a.qual || []).filter(x => !ps.has(x) && near.has(x)).length; });
    if (ent.kind === 'sec') {
      const r = by.get(ent.ti) || { ti: ent.ti, score: 0, hits: [] };
      merged.forEach(h => { r.score += (h.syn ? 3 : 2) + h.bonus * 2; r.hits.push({ sec: ent.sec, sn: snip(ent, h), bonus: h.bonus }); });
      by.set(ent.ti, r);
    } else meds.push({ ent, sn: snip(ent, merged[0]), score: merged.length });
  });
  return { types: [...by.values()].sort((x, y) => y.score - x.score || x.ti - y.ti), meds: meds.sort((x, y) => y.score - x.score).slice(0, 6) };
}
function foodSearch(a) {
  if (!a.cont.length) return [];
  const need = a.cont, by = new Map();
  K.food.forEach(f => { if (need.every(x => f.w.has(x))) { (by.get(f.n) || by.set(f.n, []).get(f.n)).push(f.item); } });
  return [...by.entries()].map(([n, items]) => ({ n, items }));
}

/* ---------- جواب کے ٹکڑے ---------- */
function medParts(t) {
  const s = String(t).replace(/\s+ـ+(?=\s|$)/g, '').replace(/ـ+/g, '').trim(), p = s.split(/(افعال|نفع\s*خاص|دیگر)\s*[:.]\s*/), o = [];
  if (p[0].trim()) o.push(['ترکیب و طریقہ استعمال', p[0]]);
  for (let k = 1; k < p.length; k += 2) o.push([p[k], p[k + 1] || '']);
  return o.map(([h, x]) => `<h4>${esc(h)}</h4><p>${esc(x.trim())}</p>`).join('');
}
function treatBlock(ti, mode, open) {
  const { D, T, MEDS } = E, tt = T[(ti + (mode === 'am' ? 2 : 4)) % 8];
  const ms = MEDS.filter(m => D.med[m] && D.med[m][tt]);
  const title = (mode === 'am' ? 'علاج بالامالہ' : 'علاج بالضد') + ' — نسخے کی قسم: ' + tt;
  if (!ms.length) return `<details><summary><span>${title}</span></summary><div class="med"><p class="sub">اس قسم کے لیے ڈیٹا میں کوئی نسخہ درج نہیں۔</p></div></details>`;
  return `<details${open ? ' open' : ''}><summary><span>${title}</span></summary><div class="med">` +
    ms.map(m => `<details><summary><span>${esc(m)}</span></summary><div class="med">${medParts(D.med[m][tt])}</div></details>`).join('') + '</div></details>';
}
function foodItems(n) { return E.D.food[n - 1].replace(/^\s*\d+\s*\.\s*/, '').split('ـ').map(s => s.trim()).filter(Boolean); }
function dietBlock(ti, open) {
  const ch = E.FM[ti];
  return `<details${open ? ' open' : ''}><summary><span>غذا — اس قسم کے لیے تجویز کردہ چارٹ ${ch.join('، ')}</span></summary><div class="med">` +
    ch.map(n => `<h4>چارٹ ${n}</h4><div class="fc">${foodItems(n).map(s => `<span>${esc(s)}</span>`).join('')}</div>`).join('') + '</div></details>';
}
function parezBlock(ti, open) {
  const av = [1, 2, 3, 4, 5, 6, 7, 8].filter(n => !E.FM[ti].includes(n));
  return `<details${open ? ' open' : ''}><summary><span>پرہیز — ان چارٹس کی غذائیں نہ کھائیں: چارٹ ${av.join('، ')}</span></summary><div class="med"><p class="cb-n">اس قسم کے لیے تجویز کردہ چارٹ ${E.FM[ti].join('، ')} ہیں؛ ان کے علاوہ باقی چارٹ کی غذائیں پرہیز ہیں۔</p>` +
    av.map(n => `<h4>چارٹ ${n}</h4><div class="fc">${foodItems(n).map(s => `<span>${esc(s)}</span>`).join('')}</div>`).join('') + '</div></details>';
}
function infoBlock(ti) {
  const { D, T } = E;
  return SECK.map((sec, k) => D[sec] && D[sec][T[ti]] ? `<details${k === 0 ? ' open' : ''}><summary><span>${SECN[sec]}</span></summary><div class="med"><p class="txt">${esc(D[sec][T[ti]])}</p></div></details>` : '').join('');
}
function typeCard(ti, info, o, ctx) {
  const t = E.T[ti]; o = o || {};
  let h = `<div class="cb-t"><div class="cb-th"><b>${esc(t)}</b>` + (ctx && ctx.ok && ctx.i === ti ? '<span class="cb-bd">موجودہ مریض کی قسم</span>' : '') + '</div>';
  if (info) {
    const secs = [...new Set(info.hits.map(x => SECN[x.sec]))];
    h += `<p class="cb-n">یہ بات اس قسم کے «${secs.join('، ')}» میں درج ہے:</p>`;
    const seenS = new Set(), pick = [];
    info.hits.sort((x, y) => (y.bonus || 0) - (x.bonus || 0));
    info.hits.forEach(x => { if (!seenS.has(x.sec) && pick.length < 2) { seenS.add(x.sec); pick.push(x); } });
    info.hits.forEach(x => { if (pick.length < 2 && !pick.includes(x)) pick.push(x); });
    h += pick.map(x => `<p class="cb-q"><i>${SECN[x.sec]}</i>${x.sn}</p>`).join('');
  }
  h += treatBlock(ti, 'am', !!o.treat) + treatBlock(ti, 'zd', false) + dietBlock(ti, !!o.diet) + parezBlock(ti, !!o.pareez);
  h += `<div class="bar"><button class="btn o cb-sm" type="button" data-c="i:${ti}">اس قسم کی علامات و عوارض</button></div></div>`;
  return h;
}
const NOTE = '<p class="cb-n">یہ جواب صرف ایپ کے ڈیٹا سے ہے۔ حتمی تشخیص اور نسخہ معالج نبض دیکھ کر خود کرے۔</p>';
const CHIPS = ['بال گرتے ہیں', 'قبض', 'نیند کی کمی', 'شوگر', 'بلڈ پریشر', 'جوڑوں کا درد', 'سر درد', 'گیس', 'کھانسی', 'پتھری', 'خون کی کمی', 'چارٹ 3'];
const chipsHTML = list => '<div class="cb-ch">' + list.map(c => `<button class="btn o cb-sm" type="button" data-c="q:${esc(c)}">${esc(c)}</button>`).join('') + '</div>';

function chartAnswer(n) {
  const { T, FM } = E, ty = T.filter((t, i) => FM[i].includes(n));
  return `<p><b>غذائی چارٹ ${n}</b></p><div class="fc">${foodItems(n).map(s => `<span>${esc(s)}</span>`).join('')}</div><p class="cb-n">یہ چارٹ ان اقسام کے لیے تجویز کیا گیا ہے: ${ty.map(esc).join('، ')}</p><p class="cb-n">ان اقسام کے لیے اس چارٹ کی غذائیں پرہیز ہیں: ${T.filter((t, i) => !FM[i].includes(n)).map(esc).join('، ')}</p>` + NOTE;
}
function foodAnswer(fh) {
  const { T, FM } = E;
  return '<p><b>غذائی چارٹس میں ملا:</b></p>' + fh.map(f => {
    const ty = T.filter((t, i) => FM[i].includes(f.n));
    return `<div class="cb-t"><p style="margin:0"><b>چارٹ ${f.n}</b>: ${f.items.map(esc).join('، ')}</p><p class="cb-n">یہ چارٹ ان اقسام کے لیے تجویز ہے: ${ty.map(esc).join('، ')}</p><p class="cb-n">ان اقسام کے لیے پرہیز ہے: ${T.filter((t, i) => !FM[i].includes(f.n)).map(esc).join('، ')}</p></div>`;
  }).join('');
}
function medAnswer(ms) {
  const { T, D } = E;
  return '<p><b>علاج و فارماکوپیا کے نسخوں میں ذکر:</b></p>' + ms.map(x => {
    const k = x.ent.ti, am = T[(k + 6) % 8], zd = T[(k + 4) % 8];
    return `<details><summary><span>${esc(x.ent.tt)} — ${esc(x.ent.m)}</span></summary><div class="med"><p class="cb-q">${x.sn}</p>${medParts(x.ent.text)}<p class="cb-n">یہ نسخہ «${esc(am)}» والی قسم کے علاج بالامالہ میں اور «${esc(zd)}» والی قسم کے علاج بالضد میں آتا ہے۔</p></div></details>`;
  }).join('');
}
function help() {
  return '<p>السلام علیکم! میں صرف اسی ایپ کے ڈیٹا سے جواب دیتا ہوں: علامات، عوارض، علاج و نسخے اور غذائی چارٹ۔</p><p class="cb-n">اپنی علامت یا سوال لکھیں، مثلاً «بال گرتے ہیں»، «قبض کا علاج»، «کدو کس چارٹ میں ہے»، «قبض کا پرہیز»، «عضلاتی مخاطی کی علامات»۔</p>' + chipsHTML(CHIPS);
}
function notFound() {
  return '<p>یہ بات ایپ کے ڈیٹا میں مجھے نہیں ملی، اس لیے میں اس کا جواب نہیں دے سکتا۔ اپنی طرف سے کوئی بات نہیں بتاتا۔</p><p class="cb-n">علامت دوسرے الفاظ میں لکھ کر دیکھیں، یا ان میں سے کوئی چنیں:</p>' + chipsHTML(CHIPS);
}

/* ---------- سوال کا جواب ---------- */
function ask(q, ctx) {
  if (!E) throw new Error('init');
  if (!K) build();
  const raw = nz(q);
  if (!raw) return help();
  if (/^(السلام|سلام|ہیلو|hi|hello|مدد|help)( علیکم)?$/i.test(raw)) return help();
  let a = analyse(q); const { T } = E;
  if (a.chart) return chartAnswer(a.chart);
  const wantFood = a.all.some(w => I_DIET.has(w) && !I_PAREZ.has(w)), wantTreat = a.it.treat || a.it.am || a.it.zd, wantDiet = wantFood || a.it.pareez;
  const op = { treat: wantTreat, diet: wantFood, pareez: a.it.pareez };
  const tail = (a.it.pareez ? '<p class="cb-n">پرہیز کا اصول: ہر قسم کے لیے تجویز کردہ چارٹ کے علاوہ باقی چارٹ کی غذائیں پرہیز ہیں۔</p>' : '') +
    (a.it.why ? '<p class="cb-n">ڈیٹا میں وجوہات کی الگ فہرست نہیں۔ جس قسم اور مرحلے کے عوارض میں یہ بات درج ہے، وہی دکھایا گیا ہے۔</p>' : '') + NOTE;
  const cur = ctx && ctx.cur;
  // صرف قسم نبض کا نام لکھا ہو
  if (a.type >= 0 && !a.cont.length) {
    return `<p><b>${esc(T[a.type])}</b> — ایپ کے ڈیٹا کے مطابق:</p>` + infoBlock(a.type) + treatBlock(a.type, 'am', op.treat) + treatBlock(a.type, 'zd', false) + dietBlock(a.type, op.diet) + parezBlock(a.type, op.pareez) + tail;
  }
  if (!a.cont.length && !a.pats.length) {
    return wantDiet || wantTreat ? '<p>کس علامت یا مرض کے بارے میں بتاؤں؟ اسے لکھ دیں، مثلاً «قبض کا علاج» یا «بال گرنے کی غذا»۔</p>' + chipsHTML(CHIPS) : help();
  }
  let res = runSearch(a, a.pats), fh = a.syn ? [] : foodSearch(a), note = '';
  if (!res.types.length && !res.meds.length && !fh.length) {
    const rare = [...new Set(a.cont)].filter(x => x.length >= 3 && (K.df.get(x) || 0) >= 1 && (K.df.get(x) || 0) <= 10);
    if (rare.length > 1 || (rare.length === 1 && a.cont.length > 1)) {
      res = runSearch(a, rare.map(x => ({ tok: new Set([x]), syn: false })), true);
      if (res.types.length || res.meds.length) note = '<p class="cb-n">پورا جملہ ڈیٹا میں نہیں ملا؛ ان میں سے الگ الگ الفاظ سے ملتی باتیں دکھائی گئی ہیں۔</p>';
    }
  }
  if (a.type >= 0 && !res.types.length) {
    const b = Object.assign({}, a, { type: -1 }), r2 = runSearch(b, a.pats, true);
    if (!r2.types.length) return notFound();
    note = `<p class="cb-n">«${esc(T[a.type])}» کے عوارض میں یہ بات ڈیٹا میں نہیں ملی۔ البتہ ان اقسام میں ملی:</p>`;
    res = r2; fh = []; a = b;
  }
  if (!res.types.length && !res.meds.length && !fh.length) return notFound();
  let h = '';
  if (res.types.length) {
    const top = res.types.slice(0, 3), rest = res.types.slice(3);
    h += `<p>«${esc(q.trim())}» کے بارے میں ایپ کے ڈیٹا میں یہ اقسام نبض ملیں: <b>${res.types.map(r => esc(T[r.ti])).join('، ')}</b></p>` + note;
    if (cur && cur.ok && !cur.health && !res.types.some(r => r.ti === cur.i)) h += `<p class="cb-n">موجودہ مریض کی قسم «${esc(T[cur.i])}» کے عوارض میں یہ بات نہیں ملی۔</p>`;
    h += top.map(r => typeCard(r.ti, r, op, cur)).join('');
    S.more = rest.map(r => typeCard(r.ti, r, op, cur));
    if (rest.length) h += `<div class="bar"><button class="btn o cb-sm" type="button" data-c="more">باقی ${rest.length} اقسام دکھائیں</button></div>`;
  } else S.more = [];
  if (fh.length && a.it.diet) h = foodAnswer(fh) + h; else if (fh.length) h += foodAnswer(fh);
  if (res.meds.length) h += medAnswer(res.meds);
  if (res.types.length > 5 && a.cont.length === 1) h += '<p class="cb-n">یہ لفظ بہت سی اقسام میں آتا ہے۔ جگہ یا نوعیت بھی لکھیں (مثلاً «کمر کا درد») تو جواب زیادہ درست ملے گا۔</p>';
  return h + tail;
}
function act(code, ctx) {
  const [c, v] = [code.split(':')[0], code.slice(code.indexOf(':') + 1)];
  if (!K) build();
  if (c === 'more') { const m = S.more.join(''); S.more = []; return { u: 'باقی اقسام', b: m || '<p class="cb-n">اور کوئی قسم نہیں۔</p>' }; }
  if (c === 'i') { const ti = +v; return { u: E.T[ti] + ' — علامات و عوارض', b: `<p><b>${esc(E.T[ti])}</b></p>` + infoBlock(ti) + NOTE }; }
  if (c === 'q') return { u: v, b: ask(v, ctx) };
  return null;
}

/* ---------- صفحہ ---------- */
function css() {
  if (typeof document === 'undefined' || document.getElementById('cbcss')) return;
  const s = document.createElement('style'); s.id = 'cbcss';
  s.textContent = '.cb-log{display:flex;flex-direction:column;gap:8px;max-height:58vh;overflow-y:auto;padding:4px 2px;position:relative;margin:6px 0}' +
    '.cb-m{border-radius:14px;padding:2px 13px;max-width:100%;line-height:2;font-size:18px}.cb-m p{margin:2px 0}' +
    '.cb-b{background:var(--soft)}.cb-u{background:var(--pine);color:var(--on);align-self:flex-start;max-width:88%}' +
    '.cb-t{border-top:1px solid var(--line);padding:4px 0;margin-top:6px}.cb-th b{color:var(--pine);font-size:21px;font-weight:400}' +
    '.cb-bd{background:var(--gold);color:var(--on);border-radius:99px;padding:0 10px;font-size:14px;margin-inline-start:8px}' +
    '.cb-q{margin:2px 0;font-size:17px;text-align:justify}.cb-q i{font-style:normal;color:var(--gold);font-size:15px;margin-inline-end:6px}' +
    '.cb-b mark{background:rgba(224,178,90,.5);color:inherit;border-radius:4px;padding:0 2px}' +
    '.cb-n{color:var(--mute);font-size:15px;line-height:1.9;margin:4px 0}' +
    '.cb-ch{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0}.cb-sm{font-size:15px;line-height:2;padding:0 10px}' +
    '.cb-row{display:flex;gap:6px;align-items:center;margin-top:6px}.cb-row .in{margin:0;flex:1}';
  document.head.appendChild(s);
}
function curCtx() { try { return { cur: typeof cur !== 'undefined' ? cur : null }; } catch (e) { return { cur: null }; } }
function show(el) {
  if (!E) E = { D: D, T: T, FM: FM, MEDS: MEDS };
  css();
  if (!S.msgs.length) S.msgs.push({ r: 'b', h: help() });
  el.innerHTML = '<h2>سوال جواب</h2><p class="sub">علامت یا مرض لکھیں۔ جواب صرف اسی ایپ کے ڈیٹا سے آئے گا؛ ڈیٹا میں نہ ہو تو بوٹ صاف بتا دے گا۔</p>' +
    '<div class="cb-log" id="cbl">' + S.msgs.map(m => `<div class="cb-m ${m.r === 'u' ? 'cb-u' : 'cb-b'}">${m.h}</div>`).join('') + '</div>' +
    '<div class="cb-row"><input class="in" id="cbi" placeholder="مثلاً: میرے بال گرتے ہیں" aria-label="سوال لکھیں" enterkeyhint="send" autocomplete="off" maxlength="200"><button class="btn" id="cbs" type="button">بھیجیں</button></div>' +
    '<div class="bar"><button class="btn o cb-sm" type="button" data-c="clr">گفتگو صاف کریں</button></div>';
  const log = el.querySelector('#cbl'), inp = el.querySelector('#cbi');
  inp.value = S.draft; log.scrollTop = log.scrollHeight;
  const push = (u, b) => {
    if (u) S.msgs.push({ r: 'u', h: esc(u) });
    S.msgs.push({ r: 'b', h: b }); if (S.msgs.length > 40) S.msgs.splice(0, S.msgs.length - 40);
    S.draft = ''; show(el);
    const l = document.getElementById('cbl'), bs = l.querySelectorAll('.cb-b'), last = bs[bs.length - 1];
    if (last) l.scrollTop = Math.max(0, last.offsetTop - 6);
  };
  const send = t => { t = (t || '').trim(); if (!t) return; let b; try { b = ask(t, curCtx()); } catch (e) { b = '<p>معذرت، جواب تیار نہیں ہو سکا۔</p>'; } push(t, b); };
  el.querySelector('#cbs').onclick = () => send(inp.value);
  inp.oninput = () => { S.draft = inp.value; };
  inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); send(inp.value); } };
  el.onclick = e => {
    const t = e.target.closest('[data-c]'); if (!t) return;
    const code = t.dataset.c;
    if (code === 'clr') { S.msgs = []; S.more = []; S.draft = ''; show(el); return; }
    const r = act(code, curCtx()); if (r) push(r.u, r.b);
  };
}
G.NabzChat = { init(env) { E = env; K = null; S.msgs = []; S.more = []; }, ask, act, show, nz, stem };
})(typeof window !== 'undefined' ? window : globalThis);
