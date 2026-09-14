/* Mimi & Wellen's Oʻahu trip companion — vanilla JS port of the Claude Design prototype. */
(function () {
'use strict';

// ---------- palette ----------
const INK = '#33304A', MUTED = 'rgba(51,48,74,.55)', TEAL = '#2E7D75', TEAL_D = '#1D6B63',
      CORAL = '#E0655F', SUN = '#F8D66B', CREAM = '#FDF7E7', SAGE = '#C6DEDA';

const NOTE_TONE = {
  cream: { bg: CREAM, tagInk: TEAL_D, bodyInk: 'rgba(51,48,74,.75)' },
  teal: { bg: TEAL, tagInk: 'rgba(253,247,231,.8)', bodyInk: CREAM },
  sun: { bg: SUN, tagInk: '#8A5B1E', bodyInk: '#4A3A18' },
  coral: { bg: CORAL, tagInk: 'rgba(253,247,231,.85)', bodyInk: CREAM }
};

const NAMES_STYLE = [
  { bg: CREAM, ink: INK, localInk: TEAL_D, body: 'rgba(51,48,74,.75)', btnBg: SAGE, btnInk: TEAL_D },
  { bg: SUN, ink: '#4A3A18', localInk: '#8A5B1E', body: '#4A3A18', btnBg: CREAM, btnInk: '#8A5B1E' },
  { bg: CREAM, ink: INK, localInk: TEAL_D, body: 'rgba(51,48,74,.75)', btnBg: SAGE, btnInk: TEAL_D }
];
const CONTACT_STYLE = [
  { bg: CORAL, ink: CREAM, muted: 'rgba(253,247,231,.75)', link: CREAM },
];
const MORE_STYLE = [
  { bg: CREAM, ink: INK, sub2: MUTED, arrow: TEAL_D, icon: 'ph-duotone ph-airplane-tilt', sub: 'AA 693 out, the overnight home, and what the Hyatt owes you', key: 'flights' },
  { bg: CREAM, ink: INK, sub2: MUTED, arrow: TEAL_D, icon: 'ph-duotone ph-wallet', sub: 'Prepaid, on-island estimate, confirmation numbers', key: 'budget' },
  { bg: TEAL, ink: CREAM, sub2: 'rgba(253,247,231,.75)', arrow: SUN, icon: 'ph-duotone ph-hand-heart', sub: 'Language, etiquette, and what these places actually are', key: 'culture' },
  { bg: CREAM, ink: INK, sub2: MUTED, arrow: TEAL_D, icon: 'ph-duotone ph-phone', sub: 'Hotel, insurance, Ocean Safety, emergency', key: 'contacts' }
];

const TRIP_DATES = ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16'];
function computeCurrentDayIndex() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const idx = TRIP_DATES.findIndex(d => d === todayStr);
  if (idx !== -1) return idx;
  return todayStr < TRIP_DATES[0] ? 0 : TRIP_DATES.length - 1;
}

// ---------- state ----------
const state = {
  tab: 'now', detail: null, sub: null, mapPlace: 1,
  editingSchedule: {}, noteOpen: {}, postEditing: {},
  drafts: {}, editDrafts: {}, prepDraft: {}, showRefs: false
};
const cache = { trip: null, schedules: {}, prep: null };
const currentDayIndex = computeCurrentDayIndex();

let leafletMap = null, leafletMarkers = null;
const root = document.getElementById('app');

// ---------- utils ----------
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
async function api(path, opts) {
  const res = await fetch('/api' + path, opts);
  if (!res.ok) throw new Error('Request failed: ' + path);
  return res.status === 204 ? null : res.json();
}

// ---------- seashell decorations (verbatim per-tab clusters) ----------
const SEASHELLS = {
  now: `<div style="display:flex;align-items:flex-end;justify-content:center;gap:16px;padding:30px 24px 4px;opacity:.85">
<svg width="34" height="34" viewBox="0 0 40 40" style="transform:rotate(-8deg)"><path d="M20 36 L9 30 C2 22 5 10 12 6 C16 3 24 3 28 6 C35 10 38 22 31 30 Z" fill="#F3B5A3"></path><g stroke="#E0907C" stroke-width="1.6" stroke-linecap="round"><line x1="20" y1="34" x2="20" y2="9"></line><line x1="20" y1="34" x2="12" y2="12"></line><line x1="20" y1="34" x2="28" y2="12"></line><line x1="20" y1="34" x2="7" y2="22"></line><line x1="20" y1="34" x2="33" y2="22"></line></g><rect x="16" y="34" width="8" height="4" rx="2" fill="#E0907C"></rect></svg>
<svg width="26" height="26" viewBox="0 0 40 40" style="transform:rotate(12deg)"><path d="M20 4 C27 13 34 24 30 32 C26 38 14 38 10 32 C6 24 13 13 20 4 Z" fill="#E8D5B5"></path><g stroke="#C7AA82" stroke-width="1.5" fill="none"><path d="M13 18 C18 21 24 21 28 18"></path><path d="M11 26 C17 30 24 30 29 26"></path></g></svg>
<svg width="28" height="28" viewBox="0 0 40 40" style="transform:rotate(-14deg)"><path d="M6 16 C6 28 13 34 20 34 C27 34 34 28 34 16 Z" fill="#C3DCE6"></path><g stroke="#93BDCE" stroke-width="1.5" fill="none"><path d="M11 22 C16 26 24 26 29 22"></path><path d="M13 27 C17 30 23 30 27 27"></path></g></svg>
</div>`,
  days: `<div style="display:flex;align-items:flex-end;justify-content:center;gap:18px;padding:14px 0 4px;opacity:.85">
<svg width="26" height="26" viewBox="0 0 40 40" style="transform:rotate(10deg)"><path d="M20 4 C27 13 34 24 30 32 C26 38 14 38 10 32 C6 24 13 13 20 4 Z" fill="#CFE3D3"></path><g stroke="#9BC3A6" stroke-width="1.5" fill="none"><path d="M13 18 C18 21 24 21 28 18"></path><path d="M11 26 C17 30 24 30 29 26"></path></g></svg>
<svg width="32" height="32" viewBox="0 0 40 40" style="transform:rotate(6deg)"><path d="M20 36 L9 30 C2 22 5 10 12 6 C16 3 24 3 28 6 C35 10 38 22 31 30 Z" fill="#F5D9A6"></path><g stroke="#E0B26C" stroke-width="1.6" stroke-linecap="round"><line x1="20" y1="34" x2="20" y2="9"></line><line x1="20" y1="34" x2="12" y2="12"></line><line x1="20" y1="34" x2="28" y2="12"></line><line x1="20" y1="34" x2="7" y2="22"></line><line x1="20" y1="34" x2="33" y2="22"></line></g><rect x="16" y="34" width="8" height="4" rx="2" fill="#E0B26C"></rect></svg>
<svg width="24" height="24" viewBox="0 0 40 40" style="transform:rotate(-18deg)"><path d="M6 16 C6 28 13 34 20 34 C27 34 34 28 34 16 Z" fill="#F6D2D6"></path><g stroke="#DFA6AE" stroke-width="1.5" fill="none"><path d="M11 22 C16 26 24 26 29 22"></path><path d="M13 27 C17 30 23 30 27 27"></path></g></svg>
</div>`,
  map: `<div style="display:flex;align-items:flex-end;justify-content:center;gap:15px;padding:26px 0 4px;opacity:.85">
<svg width="28" height="28" viewBox="0 0 40 40" style="transform:rotate(-12deg)"><path d="M6 16 C6 28 13 34 20 34 C27 34 34 28 34 16 Z" fill="#C3DCE6"></path><g stroke="#93BDCE" stroke-width="1.5" fill="none"><path d="M11 22 C16 26 24 26 29 22"></path><path d="M13 27 C17 30 23 30 27 27"></path></g></svg>
<svg width="33" height="33" viewBox="0 0 40 40" style="transform:rotate(4deg)"><path d="M20 36 L9 30 C2 22 5 10 12 6 C16 3 24 3 28 6 C35 10 38 22 31 30 Z" fill="#F3B5A3"></path><g stroke="#E0907C" stroke-width="1.6" stroke-linecap="round"><line x1="20" y1="34" x2="20" y2="9"></line><line x1="20" y1="34" x2="12" y2="12"></line><line x1="20" y1="34" x2="28" y2="12"></line><line x1="20" y1="34" x2="7" y2="22"></line><line x1="20" y1="34" x2="33" y2="22"></line></g><rect x="16" y="34" width="8" height="4" rx="2" fill="#E0907C"></rect></svg>
<svg width="25" height="25" viewBox="0 0 40 40" style="transform:rotate(16deg)"><path d="M20 4 C27 13 34 24 30 32 C26 38 14 38 10 32 C6 24 13 13 20 4 Z" fill="#E8D5B5"></path><g stroke="#C7AA82" stroke-width="1.5" fill="none"><path d="M13 18 C18 21 24 21 28 18"></path><path d="M11 26 C17 30 24 30 29 26"></path></g></svg>
</div>`,
  prep: `<div style="display:flex;align-items:flex-end;justify-content:center;gap:17px;padding:26px 0 4px;opacity:.85">
<svg width="25" height="25" viewBox="0 0 40 40" style="transform:rotate(-15deg)"><path d="M20 4 C27 13 34 24 30 32 C26 38 14 38 10 32 C6 24 13 13 20 4 Z" fill="#D9CFE8"></path><g stroke="#AFA0CC" stroke-width="1.5" fill="none"><path d="M13 18 C18 21 24 21 28 18"></path><path d="M11 26 C17 30 24 30 29 26"></path></g></svg>
<svg width="30" height="30" viewBox="0 0 40 40" style="transform:rotate(8deg)"><path d="M6 16 C6 28 13 34 20 34 C27 34 34 28 34 16 Z" fill="#E8D5B5"></path><g stroke="#C7AA82" stroke-width="1.5" fill="none"><path d="M11 22 C16 26 24 26 29 22"></path><path d="M13 27 C17 30 23 30 27 27"></path></g></svg>
<svg width="32" height="32" viewBox="0 0 40 40" style="transform:rotate(-5deg)"><path d="M20 36 L9 30 C2 22 5 10 12 6 C16 3 24 3 28 6 C35 10 38 22 31 30 Z" fill="#C3DCE6"></path><g stroke="#93BDCE" stroke-width="1.6" stroke-linecap="round"><line x1="20" y1="34" x2="20" y2="9"></line><line x1="20" y1="34" x2="12" y2="12"></line><line x1="20" y1="34" x2="28" y2="12"></line><line x1="20" y1="34" x2="7" y2="22"></line><line x1="20" y1="34" x2="33" y2="22"></line></g><rect x="16" y="34" width="8" height="4" rx="2" fill="#93BDCE"></rect></svg>
</div>`,
  more: `<div style="display:flex;align-items:flex-end;justify-content:center;gap:16px;padding:28px 0 4px;opacity:.85">
<svg width="31" height="31" viewBox="0 0 40 40" style="transform:rotate(9deg)"><path d="M20 36 L9 30 C2 22 5 10 12 6 C16 3 24 3 28 6 C35 10 38 22 31 30 Z" fill="#F6D2D6"></path><g stroke="#DFA6AE" stroke-width="1.6" stroke-linecap="round"><line x1="20" y1="34" x2="20" y2="9"></line><line x1="20" y1="34" x2="12" y2="12"></line><line x1="20" y1="34" x2="28" y2="12"></line><line x1="20" y1="34" x2="7" y2="22"></line><line x1="20" y1="34" x2="33" y2="22"></line></g><rect x="16" y="34" width="8" height="4" rx="2" fill="#DFA6AE"></rect></svg>
<svg width="27" height="27" viewBox="0 0 40 40" style="transform:rotate(-11deg)"><path d="M20 4 C27 13 34 24 30 32 C26 38 14 38 10 32 C6 24 13 13 20 4 Z" fill="#CFE3D3"></path><g stroke="#9BC3A6" stroke-width="1.5" fill="none"><path d="M13 18 C18 21 24 21 28 18"></path><path d="M11 26 C17 30 24 30 29 26"></path></g></svg>
<svg width="27" height="27" viewBox="0 0 40 40" style="transform:rotate(14deg)"><path d="M6 16 C6 28 13 34 20 34 C27 34 34 28 34 16 Z" fill="#F5D9A6"></path><g stroke="#E0B26C" stroke-width="1.5" fill="none"><path d="M11 22 C16 26 24 26 29 22"></path><path d="M13 27 C17 30 23 30 27 27"></path></g></svg>
</div>`
};

// ---------- hibiscus SVG generator ----------
function hibiscus({ size, leafRotate = 0, petalRotate = -15, detailed = false }) {
  const petals = [0, 72, 144, 216, 288].map(r =>
    `<path d="M48,52 C34,46 28,28 40,14 C44,8 52,8 56,14 C68,28 62,46 48,52 Z" fill="#EA5A3D" transform="rotate(${r} 48 52)"></path>`).join('');
  const leaf = `<g transform="rotate(${leafRotate} 65 45)">` +
    `<path d="M64,42 C78,28 92,22 97,17 C90,30 83,42 70,49 Z" fill="#2E8B72"></path>` +
    (detailed ? `<path d="M64,42 L96,18" stroke="#1D6B63" stroke-width="1.4" fill="none"></path>` : '') +
    `<path d="M66,56 C81,60 93,67 99,74 C86,70 73,68 61,63 Z" fill="#2E8B72"></path>` +
    (detailed ? `<path d="M66,56 L98,73" stroke="#1D6B63" stroke-width="1.4" fill="none"></path>` : '') +
    `</g>`;
  const spokes = detailed ? `<g stroke="#B23A2A" stroke-width="1.6" stroke-linecap="round"><line x1="48" y1="48" x2="48" y2="34"></line><line x1="51" y1="49" x2="60" y2="38"></line><line x1="53" y1="52" x2="65" y2="50"></line><line x1="51" y1="55" x2="59" y2="65"></line><line x1="45" y1="55" x2="41" y2="66"></line><line x1="43" y1="52" x2="31" y2="53"></line><line x1="45" y1="49" x2="37" y2="40"></line></g>` : '';
  const stamens = detailed
    ? `<circle cx="14" cy="54" r="2.2" fill="#F5C242"></circle><circle cx="14" cy="54" r=".8" fill="#8A5B1E"></circle><circle cx="14" cy="60" r="2.2" fill="#F5C242"></circle><circle cx="14" cy="60" r=".8" fill="#8A5B1E"></circle><circle cx="18" cy="63" r="2.2" fill="#F5C242"></circle><circle cx="18" cy="63" r=".8" fill="#8A5B1E"></circle>`
    : `<circle cx="14" cy="57" r="2.4" fill="#F5C242"></circle>`;
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}">${leaf}<g transform="rotate(${petalRotate} 48 52)">${petals}</g>${spokes}<circle cx="48" cy="52" r="4" fill="#B23A2A"></circle><path d="M48,52 C36,58 26,60 18,58" stroke="#E8A33D" stroke-width="2.2" fill="none" stroke-linecap="round"></path>${stamens}</svg>`;
}
function hibiscusDeco(cls, style, size, leafRotate, petalRotate, detailed) {
  return `<div class="${cls}" style="${style}">${hibiscus({ size, leafRotate, petalRotate, detailed })}</div>`;
}
function tabHeaderHibiscus(variant) {
  // two swaying hibiscus flanking each tab's big title, positions/angles vary per tab.
  const V = {
    days: [
      hibiscusDeco('hibiscus-r', 'position:absolute;right:6px;top:56px;width:46px;height:46px;z-index:0;opacity:.9', 46, -10, -15),
      hibiscusDeco('hibiscus-l', 'position:absolute;left:8px;top:60px;width:32px;height:32px;z-index:0;opacity:.85', 32, 18, 26)
    ],
    map: [
      hibiscusDeco('hibiscus-l', 'position:absolute;left:6px;top:56px;width:44px;height:44px;z-index:0;opacity:.9', 44, 0, -15),
      hibiscusDeco('hibiscus-r', 'position:absolute;right:10px;top:62px;width:32px;height:32px;z-index:0;opacity:.85', 32, -20, -30)
    ],
    prep: [
      hibiscusDeco('hibiscus-r', 'position:absolute;right:6px;top:56px;width:44px;height:44px;z-index:0;opacity:.9', 44, -16, -15),
      hibiscusDeco('hibiscus-l', 'position:absolute;left:8px;top:60px;width:32px;height:32px;z-index:0;opacity:.85', 32, 24, -40)
    ],
    more: [
      hibiscusDeco('hibiscus-l', 'position:absolute;left:6px;top:56px;width:44px;height:44px;z-index:0;opacity:.9', 44, 0, -15),
      hibiscusDeco('hibiscus-r', 'position:absolute;right:8px;top:60px;width:32px;height:32px;z-index:0;opacity:.85', 32, -18, 40)
    ]
  };
  return V[variant].join('');
}

// ---------- schedule row rendering (shared by Now tab + Day detail) ----------
function scheduleRowHtml(dayKey, row, idx, total, editing, variant) {
  const posts = row.posts || [];
  const noteColor = (posts.length || state.noteOpen[row.id]) ? CORAL : 'rgba(51,48,74,.35)';
  const timeColor = variant === 'detail' ? (row.hi ? CORAL : TEAL_D) : TEAL_D;
  const whatColor = variant === 'detail' ? (row.hi ? INK : 'rgba(51,48,74,.72)') : INK;
  const whatSize = variant === 'detail' ? (row.hi ? '18px' : '15px') : '15.5px';
  const pad = variant === 'detail' ? 10 : 8;
  const upColor = idx > 0 ? 'rgba(51,48,74,.5)' : 'rgba(51,48,74,.18)';
  const downColor = idx < total - 1 ? 'rgba(51,48,74,.5)' : 'rgba(51,48,74,.18)';

  let html = `<div style="padding:13px 0;border-bottom:1.5px dashed rgba(51,48,74,.2)">
<div style="display:flex;gap:10px;align-items:flex-start">`;
  if (editing) {
    html += `<div style="display:flex;flex-direction:column;gap:2px;flex:none;padding-top:1px">
<div data-action="row-up|${row.id}|${dayKey}" style="cursor:pointer;color:${upColor}"><i class="ph-bold ph-caret-up" style="font-size:13px"></i></div>
<div data-action="row-down|${row.id}|${dayKey}" style="cursor:pointer;color:${downColor}"><i class="ph-bold ph-caret-down" style="font-size:13px"></i></div>
</div>`;
  }
  html += `<input value="${esc(row.time)}" placeholder="time" data-field="time" data-row="${row.id}" data-day="${dayKey}" style="width:52px;flex:none;border:none;background:transparent;font-family:'Quicksand',sans-serif;font-weight:700;font-size:12.5px;color:${timeColor};padding:0"/>
<div style="flex:1;min-width:0">
<input value="${esc(row.what)}" placeholder="What" data-field="what" data-row="${row.id}" data-day="${dayKey}" style="width:100%;box-sizing:border-box;border:none;background:transparent;font-family:'Quicksand',sans-serif;font-weight:700;font-size:${whatSize};line-height:1.25;color:${whatColor};padding:0"/>
<input value="${esc(row.where)}" placeholder="Where" data-field="where" data-row="${row.id}" data-day="${dayKey}" style="width:100%;box-sizing:border-box;border:none;background:transparent;font-size:12.5px;color:rgba(51,48,74,.5);margin-top:2px;padding:0"/>
</div>
${row.link ? `<a href="${esc(row.link)}" target="_blank" rel="noreferrer" title="Booking details" style="cursor:pointer;flex:none;color:${TEAL_D};padding-top:1px;display:flex"><i class="ph-bold ph-arrow-square-out" style="font-size:16px"></i></a>` : ''}
<div data-action="note-toggle|${row.id}|${dayKey}" style="cursor:pointer;flex:none;color:${noteColor};padding-top:1px"><i class="ph-bold ph-plus-circle" style="font-size:16px"></i></div>`;
  if (editing) {
    html += `<div data-action="row-remove|${row.id}|${dayKey}" style="cursor:pointer;flex:none;color:rgba(51,48,74,.32);padding-top:1px"><i class="ph-bold ph-trash" style="font-size:16px"></i></div>`;
  }
  html += `</div>`;

  if (posts.length) {
    html += `<div style="margin-top:8px;margin-left:62px;display:flex;flex-direction:column;gap:6px">`;
    posts.forEach(post => { html += postCardHtml(dayKey, row.id, post, pad); });
    html += `</div>`;
  }

  if (state.noteOpen[row.id] && posts.length < 3) {
    const draft = state.drafts[row.id] || { text: '' };
    html += `<div style="margin-top:8px;margin-left:62px;background:#FFFFFF;border-radius:8px;padding:${pad}px;box-shadow:0 1px 4px rgba(51,48,74,.08);display:flex;align-items:stretch;gap:8px">
${photoSlotHtml({ mode: 'draft', rowId: row.id, previewUrl: draft.previewUrl, radius: 8 })}
<textarea placeholder="Write a note..." data-draft-text="${row.id}" style="flex:1 1 66.6667%;width:100%;min-width:0;box-sizing:border-box;border:1px solid rgba(51,48,74,.12);border-radius:6px;padding:7px 9px;font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;color:#33304A;min-height:56px;resize:vertical;background:#fff">${esc(draft.text)}</textarea>
</div>
<div data-action="post-add|${row.id}|${dayKey}" style="cursor:pointer;margin-top:6px;margin-left:62px;text-align:center;background:#2E7D75;color:#FDF7E7;border-radius:6px;padding:8px 0;font-family:'Quicksand',sans-serif;font-weight:700;font-size:12.5px">Save post</div>`;
  }

  html += `</div>`;
  return html;
}

function photoSlotHtml({ mode, rowId, postId, previewUrl, existingUrl, radius }) {
  const inputAttrs = mode === 'draft'
    ? `data-draft-file="${rowId}"`
    : `data-edit-file="${postId}"`;
  const src = previewUrl || existingUrl;
  const inner = src
    ? `<img src="${esc(src)}" alt="">`
    : `<div class="empty"><i class="ph-duotone ph-camera"></i></div>`;
  return `<div class="post-photo" style="flex:0 0 33.3333%;min-height:80px;border-radius:${radius}px">
${inner}
<input type="file" accept="image/*" ${inputAttrs}>
<div class="replace-tag">${src ? 'Replace' : 'Add photo'}</div>
</div>`;
}

function postCardHtml(dayKey, rowId, post, pad) {
  if (!state.postEditing[post.id]) {
    return `<div style="background:#FDF7E7;border-radius:8px;padding:${pad}px;display:flex;align-items:stretch;gap:${pad}px">
<div style="flex:0 0 33.3333%;display:flex;min-height:80px;border-radius:6px;overflow:hidden">${post.imagePath ? `<img src="${esc(post.imagePath)}" alt="" style="width:100%;height:100%;object-fit:cover">` : `<div class="post-photo empty" style="width:100%"><i class="ph-duotone ph-camera" style="opacity:.6"></i></div>`}</div>
<div style="flex:1 1 66.6667%;display:flex;flex-direction:column;justify-content:space-between;min-width:0">
<div style="font-size:12px;line-height:1.4;color:rgba(51,48,74,.72);word-break:break-word;overflow-wrap:anywhere">${esc(post.text)}</div>
<div style="display:flex;gap:10px;margin-top:6px">
<div data-action="post-edit-start|${post.id}" style="cursor:pointer;display:flex;align-items:center;gap:4px;color:#1D6B63;font-size:11px;font-family:'Quicksand',sans-serif;font-weight:700"><i class="ph-bold ph-pencil-simple" style="font-size:12px"></i>Edit</div>
<div data-action="post-remove|${post.id}|${rowId}|${dayKey}" style="cursor:pointer;display:flex;align-items:center;gap:4px;color:rgba(51,48,74,.45);font-size:11px;font-family:'Quicksand',sans-serif;font-weight:700"><i class="ph-bold ph-trash" style="font-size:12px"></i>Delete</div>
</div>
</div>
</div>`;
  }
  const draft = state.editDrafts[post.id] || { text: post.text };
  return `<div style="background:#FFFFFF;border-radius:8px;padding:${pad}px;box-shadow:0 1px 4px rgba(51,48,74,.08);display:flex;align-items:stretch;gap:${pad}px">
${photoSlotHtml({ mode: 'edit', postId: post.id, previewUrl: draft.previewUrl, existingUrl: post.imagePath, radius: 6 })}
<div style="flex:1 1 66.6667%;display:flex;flex-direction:column;gap:6px;min-width:0">
<textarea data-edit-text="${post.id}" style="flex:1;width:100%;min-width:0;box-sizing:border-box;border:1px solid rgba(51,48,74,.12);border-radius:6px;padding:6px 8px;font-family:'Plus Jakarta Sans',sans-serif;font-size:11.5px;color:#33304A;min-height:44px;resize:vertical;background:#fff">${esc(draft.text)}</textarea>
<div style="display:flex;gap:6px">
<div data-action="post-edit-save|${post.id}|${rowId}|${dayKey}" style="cursor:pointer;flex:1;text-align:center;background:#2E7D75;color:#FDF7E7;border-radius:6px;padding:6px 0;font-family:'Quicksand',sans-serif;font-weight:700;font-size:11px">Save</div>
<div data-action="post-edit-cancel|${post.id}" style="cursor:pointer;flex:1;text-align:center;background:#F3F2F2;color:#8A5B1E;border-radius:6px;padding:6px 0;font-family:'Quicksand',sans-serif;font-weight:700;font-size:11px">Cancel</div>
</div>
</div>
</div>`;
}

function scheduleSectionHtml(dayKey, variant) {
  const rows = cache.schedules[dayKey] || [];
  const editing = !!state.editingSchedule[dayKey];
  const heading = variant === 'now'
    ? `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px">
<div style="display:flex;align-items:center;gap:7px;font-family:'Quicksand',sans-serif;font-weight:700;font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:rgba(51,48,74,.45)"><i class="ph-bold ph-list-dashes" style="font-size:13px"></i><span>Today's schedule</span></div>
<div data-action="schedule-edit-toggle|${dayKey}" style="cursor:pointer;display:flex;align-items:center;gap:5px;font-family:'Quicksand',sans-serif;font-weight:700;font-size:12px;color:#1D6B63"><i class="ph-bold ph-pencil-simple" style="font-size:13px"></i>${editing ? 'Done' : 'Edit'}</div>
</div>`
    : `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px">
<div style="font-family:'Quicksand',sans-serif;font-weight:700;font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:rgba(51,48,74,.45)">Schedule</div>
<div data-action="schedule-edit-toggle|${dayKey}" style="cursor:pointer;display:flex;align-items:center;gap:5px;font-family:'Quicksand',sans-serif;font-weight:700;font-size:12px;color:#1D6B63"><i class="ph-bold ph-pencil-simple" style="font-size:13px"></i>${editing ? 'Done' : 'Edit'}</div>
</div>`;
  let html = heading;
  rows.forEach((row, i) => { html += scheduleRowHtml(dayKey, row, i, rows.length, editing, variant); });
  if (editing) {
    html += `<div data-action="schedule-add|${dayKey}" style="cursor:pointer;display:flex;align-items:center;gap:8px;padding:13px 0;color:#1D6B63;font-family:'Quicksand',sans-serif;font-weight:700;font-size:13.5px"><i class="ph-bold ph-plus-circle" style="font-size:17px"></i>Add schedule item</div>`;
  }
  return html;
}

// ---------- Now tab ----------
function renderNow() {
  const day = cache.trip.days[currentDayIndex];
  const dayNum = String(currentDayIndex + 1);
  return `<div style="background:#FDF7E7;padding-bottom:calc(98px + env(safe-area-inset-bottom))">
<div style="position:relative">
<div style="position:absolute;inset:0;overflow:hidden;z-index:0;background:#FDF7E7">
<div style="position:absolute;left:0;right:0;top:0;height:482px;overflow:hidden;background:linear-gradient(180deg,#8FCBE0 0%,#BEE0E8 28%,#C6DEDA 55%,#C6DEDA 96%,#FDF7E7 100%)">
<div style="position:absolute;left:0;right:0;top:0;height:242px;overflow:hidden">
<div style="position:absolute;left:50%;top:66px;transform:translateX(-50%);width:400px;height:400px;border-radius:50%;background:radial-gradient(circle at 50% 62%,#FBE9A8,#F8D66B 60%,#F2BE4E)"></div>
<div style="position:absolute;left:32px;top:106px;font:600 15px 'Quicksand',sans-serif;color:#FDF7E7;animation:twinkle 3.4s ease-in-out infinite">+</div>
<div style="position:absolute;left:74px;top:152px;font:600 11px 'Quicksand',sans-serif;color:#FDF7E7;animation:twinkle 4.2s ease-in-out .6s infinite">+</div>
<div style="position:absolute;right:42px;top:126px;font:600 13px 'Quicksand',sans-serif;color:#FDF7E7;animation:twinkle 3.8s ease-in-out 1.2s infinite">+</div>
<div style="position:absolute;right:86px;top:92px;font:600 10px 'Quicksand',sans-serif;color:#FDF7E7;animation:twinkle 4.6s ease-in-out .3s infinite">+</div>
</div>
<div style="position:absolute;left:-26px;top:238px;width:96px;height:34px;border-radius:20px;background:#FDF7E7;opacity:.92"></div>
<div style="position:absolute;left:14px;top:222px;width:52px;height:38px;border-radius:50%;background:#FDF7E7;opacity:.92"></div>
<div style="position:absolute;right:-18px;top:244px;width:88px;height:30px;border-radius:18px;background:#FDF7E7;opacity:.9"></div>
<div style="position:absolute;right:16px;top:230px;width:44px;height:32px;border-radius:50%;background:#FDF7E7;opacity:.9"></div>
<div style="position:absolute;left:0;right:0;top:242px;height:240px;background:linear-gradient(180deg,#8FCBE0 0%,rgba(143,203,224,.55) 62%,rgba(198,222,218,.25) 86%,rgba(198,222,218,0) 100%)"></div>
<div style="position:absolute;left:0;right:0;top:242px;height:240px;background:repeating-linear-gradient(180deg,rgba(253,247,231,.34) 0 2px,transparent 2px 10px)"></div>
<div style="position:absolute;left:0;right:0;top:461px;height:7px;overflow:hidden;background-image:repeating-radial-gradient(circle at 10px 0,rgba(255,255,255,.9) 0 4px,transparent 4px 20px);animation:wave-drift 3.2s linear infinite"></div>
${hibiscusDeco('hibiscus-l', 'position:absolute;left:-18px;top:42px;width:72px;height:72px;z-index:3', 72, 8, -15, true)}
${hibiscusDeco('hibiscus-r', 'position:absolute;right:-14px;top:52px;width:58px;height:58px;z-index:3', 58, -14, -15, true)}
${hibiscusDeco('hibiscus-r', 'position:absolute;right:20px;top:182px;width:34px;height:34px;z-index:2;opacity:.8', 34, 22, 30)}
</div>
</div>

<div style="height:278px"></div>

<div style="position:absolute;left:0;right:0;top:104px;z-index:4;display:flex;flex-direction:column;align-items:center;gap:9px">
<div style="display:flex;align-items:center;gap:9px;font-family:'Quicksand',sans-serif;font-weight:700;font-size:18px;letter-spacing:.01em;color:#33304A;margin-top:30px">
<i class="ph-duotone ph-hand-waving" style="font-size:27px"></i><span>Aloha, Mimi &amp; Wellen</span>
</div>
<div style="display:flex;align-items:center;gap:8px;margin-top:-4px">
<div style="width:18px;height:0;border-top:1.5px dashed rgba(51,48,74,.2)"></div>
<div style="font-family:'Quicksand',sans-serif;font-weight:700;font-size:14px;letter-spacing:.03em;text-transform:uppercase;color:#2E2B44;white-space:nowrap">DAY ${dayNum}/5 · ${esc(day.date)}</div>
<div style="width:18px;height:0;border-top:1.5px dashed rgba(51,48,74,.2)"></div>
</div>
<div style="display:flex;align-items:center;gap:12px;background:rgba(253,247,231,.85);border-radius:20px;padding:5px 14px;font-family:'Quicksand',sans-serif;font-weight:700;font-size:11px;color:#33304A;white-space:nowrap">
<span style="display:flex;align-items:center;gap:4px"><i class="ph-duotone ph-thermometer-simple" style="font-size:13px;color:#E0655F"></i>87°</span>
<span style="display:flex;align-items:center;gap:4px"><i class="ph-duotone ph-sun" style="font-size:13px;color:#E0655F"></i>UV 11</span>
<span style="display:flex;align-items:center;gap:4px"><i class="ph-duotone ph-sun-horizon" style="font-size:13px;color:#E0655F"></i>6:10 pm</span>
</div>
</div>

<div style="padding:0 24px;position:relative;z-index:1">
<div style="background:#FFFFFF;border-radius:8px 8px 0 0;padding:22px 22px 20px">
<div style="font-family:'Quicksand',sans-serif;font-weight:700;font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:rgba(51,48,74,.4)">It's time for</div>
<div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-top:4px">
<div style="font-family:'Quicksand',sans-serif;font-weight:700;font-size:33px;line-height:1.06;letter-spacing:-.02em;color:#33304A">${esc(day.title)}</div>
<div style="font-family:'Quicksand',sans-serif;font-weight:600;font-size:12.5px;letter-spacing:.06em;color:#1D6B63">${esc(day.local)}</div>
</div>
<div style="font-family:'Plus Jakarta Sans',sans-serif;font-style:italic;font-size:15px;color:rgba(51,48,74,.6);margin-top:6px">${esc(day.eng)}</div>
<div style="height:0;margin:14px 0 0;border-top:1.5px dashed rgba(51,48,74,.2)"></div>
<div style="display:flex;align-items:center;gap:5px;margin-top:10px;font-family:'Quicksand',sans-serif;font-weight:700;font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:#8A5B1E"><i class="ph-bold ph-warning" style="font-size:10px"></i><span>${esc(day.alert.tag)}</span></div>
<div style="font-size:10.5px;line-height:1.4;color:rgba(51,48,74,.6);margin-top:2px;text-wrap:pretty">${esc(day.alert.body)}</div>
</div>
</div>
<div style="padding:0 24px;position:relative;z-index:1">
<div class="day-photo-strip"><img src="${esc(day.photo.src)}" alt="${esc(day.photo.alt)}"></div>
</div>
</div>

<div style="padding:20px 42px 0">
${scheduleSectionHtml(currentDayIndex, 'now')}
</div>

<div style="padding:20px 24px 0">
<div data-action="day-open|${currentDayIndex}" style="cursor:pointer;background:#2E7D75;border-radius:8px;padding:11px 20px;display:flex;align-items:center;gap:11px">
<i class="ph-duotone ph-sun-dim" style="font-size:20px;color:#F8D66B"></i>
<div style="flex:1;font-family:'Quicksand',sans-serif;font-weight:700;font-size:15.5px;color:#FDF7E7">Open the full day</div>
<i class="ph-bold ph-arrow-right" style="font-size:17px;color:#F8D66B"></i>
</div>
</div>
${SEASHELLS.now}
</div>`;
}

// ---------- Days tab ----------
function renderDays() {
  let html = `<div style="padding:70px 24px calc(98px + env(safe-area-inset-bottom));position:relative">
${tabHeaderHibiscus('days')}
<div style="padding:0 18px">
<div style="font-family:'Quicksand',sans-serif;font-weight:700;font-size:38px;line-height:1;letter-spacing:-.02em;color:#33304A;position:relative;z-index:1">Five days</div>
<div style="font-size:14px;line-height:1.5;color:rgba(51,48,74,.88);margin-top:8px">One anchor each. Everything else is optional.</div>
</div>
<div style="height:18px"></div>`;
  cache.trip.days.forEach((d, i) => {
    const chip = i === currentDayIndex ? CORAL : CREAM;
    const chipInk = i === currentDayIndex ? CREAM : INK;
    html += `<div data-action="day-open|${i}" style="cursor:pointer;background:#FDF7E7;border-radius:8px;overflow:hidden;margin-bottom:14px">
<div style="position:relative;height:116px;overflow:hidden">
<img src="${esc(d.photo.src)}" alt="${esc(d.photo.alt)}" style="width:100%;height:100%;object-fit:cover;display:block">
<div style="position:absolute;inset:0;background:linear-gradient(110deg,rgba(51,48,74,.42),rgba(51,48,74,0) 62%)"></div>
<div style="position:absolute;left:16px;top:14px;width:30px;height:30px;border-radius:8px;background:${chip};display:flex;align-items:center;justify-content:center;font-family:'Quicksand',sans-serif;font-weight:700;font-size:15px;color:${chipInk}">${d.num}</div>
<div style="position:absolute;left:0;right:0;bottom:0;height:18px;background:repeating-linear-gradient(180deg,rgba(253,247,231,.5) 0 2px,transparent 2px 6px)"></div>
</div>
<div style="padding:15px 18px 17px">
<div style="display:flex;align-items:center;gap:6px;font-family:'Quicksand',sans-serif;font-weight:700;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:#E0655F"><i class="${d.icon}" style="font-size:13px"></i><span>${d.dow} · ${d.date}</span></div>
<div style="display:flex;align-items:baseline;gap:9px;flex-wrap:wrap;margin-top:8px">
<div style="font-family:'Quicksand',sans-serif;font-weight:700;font-size:24px;line-height:1.06;letter-spacing:-.02em;color:#33304A">${esc(d.title)}</div>
<div style="font-family:'Quicksand',sans-serif;font-weight:600;font-size:11.5px;letter-spacing:.06em;color:#1D6B63">${esc(d.local)}</div>
</div>
<div style="font-family:'Plus Jakarta Sans',sans-serif;font-style:italic;font-size:14px;color:rgba(51,48,74,.6);margin-top:4px">${esc(d.eng)}</div>
<div style="font-size:13px;line-height:1.5;color:rgba(51,48,74,.55);margin-top:8px;text-wrap:pretty">${esc(d.sub)}</div>
</div>
</div>`;
  });
  html += SEASHELLS.days + `</div>`;
  return html;
}

// ---------- Map tab ----------
function renderMap() {
  let rows = '';
  cache.trip.places.forEach((p, i) => {
    const selected = i === state.mapPlace;
    rows += `<div data-action="map-select|${i}" data-place-row="${i}" style="cursor:pointer;display:flex;gap:11px;align-items:center;padding:12px 0;border-bottom:1.5px dashed rgba(51,48,74,.2)">
<i class="${p.icon}" data-place-icon="${i}" style="flex:none;font-size:21px;color:${selected ? CORAL : TEAL_D}"></i>
<div style="flex:1;min-width:0">
<div style="display:flex;align-items:baseline;gap:7px;flex-wrap:wrap">
<div data-place-name="${i}" style="font-family:'Quicksand',sans-serif;font-weight:700;font-size:15px;line-height:1.2;color:${selected ? CORAL : INK}">${esc(p.name)}</div>
<div style="font-family:'Quicksand',sans-serif;font-weight:600;font-size:10.5px;letter-spacing:.05em;color:#1D6B63">${esc(p.local)}</div>
</div>
<div style="font-size:12px;color:rgba(51,48,74,.68);margin-top:3px">${esc(p.addr)} · ${esc(p.from)}</div>
</div>
<a href="${escUrl(mapsHref(p.name))}" target="_blank" rel="noreferrer" title="Directions in Google Maps" style="flex:none;display:flex;align-items:center;justify-content:center;width:30px;height:30px;background:#C6DEDA;border-radius:8px"><i class="ph-bold ph-navigation-arrow" style="font-size:14px"></i></a>
<a href="${esc(p.site)}" target="_blank" rel="noreferrer" title="Official website" style="flex:none;display:flex;align-items:center;justify-content:center;width:30px;height:30px;background:#C6DEDA;border-radius:8px"><i class="ph-bold ph-arrow-square-out" style="font-size:14px"></i></a>
</div>`;
  });
  return `<div style="padding:70px 24px calc(98px + env(safe-area-inset-bottom));position:relative">
${tabHeaderHibiscus('map')}
<div style="padding:0 16px">
<div style="font-family:'Quicksand',sans-serif;font-weight:700;font-size:38px;line-height:1;letter-spacing:-.02em;color:#33304A;position:relative;z-index:1">South shore</div>
<div style="font-size:14px;line-height:1.5;color:rgba(51,48,74,.88);margin-top:8px">Eight places. Tap one to move the map. Distances from 2424 Kalākaua Ave.</div>
</div>
<div style="margin:16px 0 12px;border-radius:8px;overflow:hidden;height:236px;background:#DCEBE7;position:relative">
<div id="leaflet-container" style="width:100%;height:100%"></div>
<div style="position:absolute;left:10px;bottom:10px;z-index:1000;background:rgba(253,247,231,.92);border-radius:8px;padding:5px 10px;font-family:'Quicksand',sans-serif;font-weight:700;font-size:10.5px;color:#33304A;display:flex;align-items:center;gap:5px;pointer-events:none"><i class="ph-duotone ph-map-pin" style="font-size:13px;color:#E0655F"></i>Tap a pin or a place below</div>
</div>
<div style="background:#FDF7E7;border-radius:8px;padding:4px 16px">${rows}</div>
<div style="font-size:12.5px;line-height:1.55;color:rgba(51,48,74,.88);margin-top:14px">No rental car. Everything is walking, the hotel shuttle, or a rideshare under $25.</div>
${SEASHELLS.map}
</div>`;
}
function mapsHref(name) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(name + ', Honolulu, HI'); }
function escUrl(u) { return esc(u); }

const MAP_TEAL = '#1D6B63', MAP_CORAL = '#E0655F';
function pinIcon(color, big) {
  const s = big ? 34 : 26;
  return L.divIcon({
    className: '',
    html: `<div style="width:${s}px;height:${s}px;transform:translate(-50%,-100%)"><svg viewBox="0 0 24 32" width="${s}" height="${s * 32 / 24}"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="${color}" stroke="#FDF7E7" stroke-width="1.5"/><circle cx="12" cy="12" r="5" fill="#FDF7E7"/></svg></div>`,
    iconSize: [s, s * 32 / 24], iconAnchor: [s / 2, s * 32 / 24]
  });
}
function initLeaflet() {
  const el = document.getElementById('leaflet-container');
  if (!el || !window.L) return;
  if (leafletMap) { leafletMap.remove(); leafletMap = null; leafletMarkers = null; }
  const places = cache.trip.places;
  const mp = places[state.mapPlace];
  leafletMap = L.map(el, { zoomControl: false, attributionControl: true }).setView([mp.lat, mp.lon], 13);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '© OpenStreetMap, © CARTO', maxZoom: 19 }).addTo(leafletMap);
  leafletMarkers = places.map((p, i) => {
    const m = L.marker([p.lat, p.lon], { icon: pinIcon(i === state.mapPlace ? MAP_CORAL : MAP_TEAL, i === state.mapPlace) })
      .addTo(leafletMap).bindPopup('<b>' + esc(p.name) + '</b><br>' + esc(p.addr));
    m.on('click', () => selectMapPlace(i));
    return m;
  });
  setTimeout(() => leafletMap && leafletMap.invalidateSize(), 50);
}
function selectMapPlace(i) {
  const prev = state.mapPlace;
  state.mapPlace = i;
  if (leafletMarkers) {
    leafletMarkers.forEach((m, idx) => m.setIcon(pinIcon(idx === i ? MAP_CORAL : MAP_TEAL, idx === i)));
    const mp = cache.trip.places[i];
    leafletMap.flyTo([mp.lat, mp.lon], 14, { duration: 0.6 });
  }
  [prev, i].forEach(idx => {
    const iconEl = document.querySelector(`[data-place-icon="${idx}"]`);
    const nameEl = document.querySelector(`[data-place-name="${idx}"]`);
    if (iconEl) iconEl.style.color = idx === i ? CORAL : TEAL_D;
    if (nameEl) nameEl.style.color = idx === i ? CORAL : INK;
  });
}

// ---------- Prep tab ----------
function renderPrep() {
  const groups = cache.prep;
  let total = 0, done = 0;
  groups.forEach(g => g.items.forEach(it => { total++; if (it.done) done++; }));
  const pct = total ? Math.round((done / total) * 100) + '%' : '0%';

  let groupsHtml = '';
  groups.forEach((g, gi) => {
    let itemsHtml = '';
    g.items.forEach(it => {
      itemsHtml += `<div style="display:flex;gap:8px;align-items:flex-start;padding:12px 0;border-bottom:1.5px dashed rgba(51,48,74,.2)">
<div data-action="prep-toggle|${it.id}" style="cursor:pointer;display:flex;gap:12px;align-items:flex-start;flex:1;min-width:0">
<div style="width:21px;height:21px;flex:none;margin-top:1px;border-radius:8px;border:2px solid ${it.done ? TEAL : 'rgba(51,48,74,.28)'};background:${it.done ? TEAL : 'transparent'};color:#FDF7E7;font-family:'Quicksand',sans-serif;font-weight:700;font-size:11px;line-height:18px;text-align:center">${it.done ? '✓' : ''}</div>
<div style="flex:1;font-size:14px;line-height:1.45;color:${it.done ? 'rgba(51,48,74,.4)' : INK};text-decoration:${it.done ? 'line-through' : 'none'};text-wrap:pretty">${esc(it.label)}</div>
</div>
<div data-action="prep-remove|${it.id}" style="cursor:pointer;flex:none;color:rgba(51,48,74,.3);padding-top:3px"><i class="ph-bold ph-x" style="font-size:14px"></i></div>
</div>`;
    });
    groupsHtml += `<div style="margin-top:14px;background:#FDF7E7;border-radius:8px;padding:18px 20px 6px">
<div style="display:flex;align-items:center;gap:7px;font-family:'Quicksand',sans-serif;font-weight:700;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:rgba(51,48,74,.45)"><i class="${g.icon}" style="font-size:14px"></i><span>${esc(g.title)}</span></div>
${itemsHtml}
<div style="display:flex;align-items:center;gap:8px;padding:12px 0">
<input value="${esc(state.prepDraft[gi] || '')}" placeholder="Add an item..." data-prep-draft="${gi}" style="flex:1;min-width:0;border:none;background:transparent;font-size:14px;color:#33304A;padding:0"/>
<div data-action="prep-add|${gi}" style="cursor:pointer;color:#2E7D75;flex:none"><i class="ph-bold ph-plus-circle" style="font-size:18px"></i></div>
</div>
</div>`;
  });

  let linksHtml = '';
  cache.trip.bookLinks.forEach(b => {
    linksHtml += `<a href="${esc(b.href)}" target="_blank" rel="noreferrer" style="display:inline-flex;align-items:center;gap:6px;background:rgba(253,247,231,.14);color:#FDF7E7;border-radius:8px;padding:9px 13px;font-family:'Quicksand',sans-serif;font-weight:700;font-size:12.5px">${esc(b.label)} <i class="ph-bold ph-arrow-square-out" style="font-size:13px"></i></a>`;
  });

  return `<div style="padding:70px 24px calc(98px + env(safe-area-inset-bottom));position:relative">
${tabHeaderHibiscus('prep')}
<div style="padding:0 20px"><div style="font-family:'Quicksand',sans-serif;font-weight:700;font-size:38px;line-height:1;letter-spacing:-.02em;color:#33304A;position:relative;z-index:1">Before you go</div></div>
<div style="display:flex;align-items:center;gap:12px;margin:18px 0 0">
<div style="flex:1;height:8px;border-radius:8px;background:rgba(253,247,231,.85);overflow:hidden"><div style="height:100%;border-radius:8px;background:#2E7D75;width:${pct}"></div></div>
<div style="font-family:'Quicksand',sans-serif;font-weight:700;font-size:12.5px;color:rgba(51,48,74,.88)">${done} / ${total}</div>
</div>
<div style="margin-top:18px;background:#E0655F;border-radius:8px;padding:18px 20px">
<div style="display:flex;align-items:center;gap:7px;font-family:'Quicksand',sans-serif;font-weight:700;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:rgba(253,247,231,.85)"><i class="ph-bold ph-ticket" style="font-size:13px"></i><span>Cannot be replaced</span></div>
<div style="font-size:13.5px;line-height:1.55;color:#FDF7E7;margin-top:6px;text-wrap:pretty">USS Arizona tickets release on Recreation.gov on a rolling 56-day window at 3:00 p.m. HST. October 14 is already open. This is the only item here that can sell out.</div>
<a href="https://www.recreation.gov/ticket/facility/233338" target="_blank" rel="noreferrer" style="display:inline-flex;align-items:center;gap:7px;margin-top:12px;background:#FDF7E7;color:#33304A;border-radius:8px;padding:9px 14px;font-family:'Quicksand',sans-serif;font-weight:700;font-size:12.5px">Recreation.gov <i class="ph-bold ph-arrow-square-out" style="font-size:14px"></i></a>
</div>
${groupsHtml}
<div style="margin-top:14px;background:#2E7D75;border-radius:8px;padding:18px 20px">
<div style="display:flex;align-items:center;gap:7px;font-family:'Quicksand',sans-serif;font-weight:700;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:rgba(253,247,231,.75)"><i class="ph-bold ph-link-simple" style="font-size:13px"></i><span>Book and confirm</span></div>
<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">${linksHtml}</div>
</div>
${SEASHELLS.prep}
</div>`;
}

// ---------- File tab ----------
function renderMore() {
  let items = '';
  MORE_STYLE.forEach((m, i) => {
    const title = ['Flights & stay', 'Money', 'Respect', 'Contacts'][i];
    items += `<div data-action="sub-open|${m.key}" style="cursor:pointer;background:${m.bg};border-radius:8px;padding:18px 20px;margin-bottom:11px;display:flex;align-items:center;gap:14px">
<i class="${m.icon}" style="flex:none;font-size:26px;color:${m.arrow}"></i>
<div style="flex:1;min-width:0">
<div style="font-family:'Quicksand',sans-serif;font-weight:700;font-size:22px;line-height:1.1;letter-spacing:-.015em;color:${m.ink}">${title}</div>
<div style="font-size:13px;line-height:1.5;color:${m.sub2};margin-top:4px;text-wrap:pretty">${m.sub}</div>
</div>
<i class="ph-bold ph-arrow-right" style="flex:none;font-size:16px;color:${m.arrow}"></i>
</div>`;
  });
  return `<div style="padding:70px 24px calc(98px + env(safe-area-inset-bottom));position:relative">
${tabHeaderHibiscus('more')}
<div style="padding:0 20px">
<div style="font-family:'Quicksand',sans-serif;font-weight:700;font-size:38px;line-height:1;letter-spacing:-.02em;color:#33304A;position:relative;z-index:1">The file</div>
<div style="font-size:14px;line-height:1.5;color:rgba(51,48,74,.88);margin-top:8px">Mimi &amp; Wellen · everything booked, paid for, and worth knowing.</div>
</div>
<div style="height:18px"></div>
${items}
${SEASHELLS.more}
</div>`;
}

// ---------- Day detail overlay ----------
function renderDetail() {
  const d = cache.trip.days[state.detail];
  const dayKey = state.detail;
  const editing = !!state.editingSchedule[dayKey];
  let sites = '';
  d.sites.forEach(s => { sites += `<a href="${esc(s.href)}" target="_blank" rel="noreferrer" style="display:inline-flex;align-items:center;gap:6px;background:#C6DEDA;color:#1D6B63;border-radius:8px;padding:9px 13px;font-family:'Quicksand',sans-serif;font-weight:700;font-size:12.5px">${esc(s.label)} <i class="ph-bold ph-arrow-square-out" style="font-size:13px"></i></a>`; });
  let notes = '';
  d.notes.forEach(n => {
    const tone = NOTE_TONE[n.tone] || NOTE_TONE.cream;
    notes += `<div style="background:${tone.bg};border-radius:8px;padding:16px 18px">
<div style="display:flex;align-items:center;gap:6px;font-family:'Quicksand',sans-serif;font-weight:700;font-size:8.5px;letter-spacing:.16em;text-transform:uppercase;color:${tone.tagInk}"><i class="${n.icon}" style="font-size:12px"></i><span>${esc(n.tag)}</span></div>
<div style="font-size:11.5px;line-height:1.55;color:${tone.bodyInk};margin-top:5px;text-wrap:pretty">${esc(n.body)}</div>
</div>`;
  });
  return `<div class="overlay scr" style="position:fixed;inset:0;z-index:20;background:#C6DEDA;overflow-y:auto;padding:0 0 calc(98px + env(safe-area-inset-bottom))">
<div style="position:relative;height:270px;overflow:hidden">
<img src="${esc(d.photo.src)}" alt="${esc(d.photo.alt)}" style="width:100%;height:100%;object-fit:cover;display:block">
<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(51,48,74,.44),rgba(51,48,74,.12) 45%,rgba(198,222,218,.35))"></div>
<div data-action="day-close" style="position:absolute;left:22px;top:calc(22px + env(safe-area-inset-top));cursor:pointer;background:rgba(253,247,231,.92);border-radius:8px;padding:8px 14px;display:flex;align-items:center;gap:7px;font-family:'Quicksand',sans-serif;font-weight:700;font-size:12.5px;color:#33304A"><i class="ph-bold ph-arrow-left" style="font-size:14px"></i><span>All days</span></div>
<div style="position:absolute;left:0;right:0;bottom:0;height:24px;background:repeating-linear-gradient(180deg,rgba(253,247,231,.55) 0 2px,transparent 2px 7px)"></div>
</div>

<div style="padding:0 24px;margin-top:-44px;position:relative">
<div style="background:#FDF7E7;border-radius:8px;padding:20px 20px 22px">
<div style="display:flex;align-items:center;gap:7px;font-family:'Quicksand',sans-serif;font-weight:700;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:#E0655F"><i class="${d.icon}" style="font-size:13px"></i><span>Day ${d.num} · ${d.dow} ${d.date}</span></div>
<div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-top:12px">
<div style="font-family:'Quicksand',sans-serif;font-weight:700;font-size:30px;line-height:1.06;letter-spacing:-.02em;color:#33304A">${esc(d.title)}</div>
<div style="font-family:'Quicksand',sans-serif;font-weight:600;font-size:12.5px;letter-spacing:.06em;color:#1D6B63">${esc(d.local)}</div>
</div>
<div style="font-family:'Plus Jakarta Sans',sans-serif;font-style:italic;font-size:15px;color:rgba(51,48,74,.6);margin-top:6px">${esc(d.eng)}</div>
<div style="font-size:14.5px;line-height:1.65;color:rgba(51,48,74,.78);margin-top:13px;text-wrap:pretty">${esc(d.intro)}</div>
<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:16px">${sites}</div>
</div>
</div>

<div style="padding:14px 42px 0">
${scheduleSectionHtml(dayKey, 'detail')}
</div>

<div style="padding:16px 24px 0;display:flex;flex-direction:column;gap:11px">${notes}</div>

<div style="padding:18px 24px 4px">
<div data-action="export-day|${dayKey}" style="cursor:pointer;background:#FDF7E7;border:1.5px dashed rgba(51,48,74,.28);border-radius:8px;padding:11px 20px;display:flex;align-items:center;gap:11px">
<i class="ph-duotone ph-image-square" style="font-size:20px;color:#E0655F"></i>
<div style="flex:1;font-family:'Quicksand',sans-serif;font-weight:700;font-size:14.5px;color:#33304A">Save Instagram post</div>
<i class="ph-bold ph-download-simple" style="font-size:16px;color:rgba(51,48,74,.5)"></i>
</div>
<div id="export-status-${dayKey}" style="font-size:11.5px;color:rgba(51,48,74,.5);text-align:center;margin-top:6px"></div>
</div>
</div>`;
}

// ---------- File sub-screens ----------
function renderSub() {
  let body = '';
  if (state.sub === 'flights') body = renderFlightsSub();
  else if (state.sub === 'budget') body = renderBudgetSub();
  else if (state.sub === 'culture') body = renderCultureSub();
  else if (state.sub === 'contacts') body = renderContactsSub();
  return `<div class="overlay scr" style="position:fixed;inset:0;z-index:20;background:#C6DEDA;overflow-y:auto;padding:62px 0 calc(98px + env(safe-area-inset-bottom))">
<div style="padding:0 24px">
<div data-action="sub-close" style="cursor:pointer;display:inline-flex;align-items:center;gap:7px;background:#FDF7E7;border-radius:8px;padding:8px 14px;font-family:'Quicksand',sans-serif;font-weight:700;font-size:12.5px;color:#33304A"><i class="ph-bold ph-arrow-left" style="font-size:14px"></i><span>The file</span></div>
</div>
${body}
</div>`;
}

function renderFlightsSub() {
  const t = cache.trip;
  let flights = '';
  t.flights.forEach((f, i) => {
    flights += `<div style="background:#FDF7E7;border-radius:8px;padding:16px 18px;margin-bottom:10px">
<div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
<div style="display:flex;align-items:center;gap:8px"><i class="${f.icon}" style="font-size:19px;color:#1D6B63"></i><div style="font-family:'Quicksand',sans-serif;font-weight:700;font-size:19px;letter-spacing:-.01em;color:${i === 0 ? TEAL_D : INK}">${esc(f.route)}</div></div>
<div style="font-family:'Quicksand',sans-serif;font-weight:600;font-size:12px;color:rgba(51,48,74,.5)">${esc(f.dur)}</div>
</div>
<div style="font-size:13px;margin-top:6px;color:rgba(51,48,74,.72)">${esc(f.times)}</div>
<div style="font-size:12px;margin-top:3px;color:rgba(51,48,74,.48)">${esc(f.code)}</div>
</div>`;
  });
  let perks = '';
  t.perks.forEach(p => { perks += `<div style="display:flex;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1.5px dashed rgba(51,48,74,.2);font-size:13.5px"><div style="color:rgba(51,48,74,.55)">${esc(p.k)}</div><div style="text-align:right;font-family:'Quicksand',sans-serif;font-weight:700;color:#33304A">${esc(p.v)}</div></div>`; });
  return `<div style="padding:18px 24px 0">
<div style="padding:0 18px">
<div style="font-family:'Quicksand',sans-serif;font-weight:700;font-size:34px;line-height:1.04;letter-spacing:-.02em;color:#33304A">Flights &amp; stay</div>
<div style="font-size:13.5px;color:rgba(51,48,74,.88);margin-top:6px">Mimi &amp; Wellen · American Airlines · seats 28D / 28E both directions</div>
</div>
<div style="height:14px"></div>
${flights}
<div style="background:#F8D66B;border-radius:8px;padding:16px 18px">
<div style="display:flex;align-items:center;gap:7px;font-family:'Quicksand',sans-serif;font-weight:700;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:#8A5B1E"><i class="ph-bold ph-moon-stars" style="font-size:13px"></i><span>The overnight home</span></div>
<div style="font-size:13.5px;line-height:1.6;color:#4A3A18;margin-top:6px;text-wrap:pretty">Four hours forty minutes of dawn layover at LAX. Warm layer, eye mask and earplugs go in the carry-on, not the checked bag.</div>
</div>
<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">
<a href="https://www.aa.com" target="_blank" rel="noreferrer" style="display:inline-flex;align-items:center;gap:6px;background:#FDF7E7;color:#33304A;border-radius:8px;padding:9px 13px;font-family:'Quicksand',sans-serif;font-weight:700;font-size:12.5px">American Airlines <i class="ph-bold ph-arrow-square-out" style="font-size:13px"></i></a>
<a href="https://www.airports.hawaii.gov/hnl" target="_blank" rel="noreferrer" style="display:inline-flex;align-items:center;gap:6px;background:#FDF7E7;color:#33304A;border-radius:8px;padding:9px 13px;font-family:'Quicksand',sans-serif;font-weight:700;font-size:12.5px">HNL airport <i class="ph-bold ph-arrow-square-out" style="font-size:13px"></i></a>
</div>
<div style="display:flex;align-items:baseline;gap:9px;flex-wrap:wrap;margin:26px 0 6px">
<div style="font-family:'Quicksand',sans-serif;font-weight:700;font-size:26px;line-height:1.1;letter-spacing:-.02em;color:#33304A">Hyatt Regency Waikiki</div>
<div style="font-family:'Quicksand',sans-serif;font-weight:600;font-size:11.5px;letter-spacing:.05em;color:#1D6B63">Waikīkī</div>
</div>
<div style="font-size:13.5px;color:rgba(51,48,74,.55)">2424 Kalākaua Ave · Kūhiō Beach is two minutes across the street</div>
<div style="display:flex;gap:8px;margin:14px 0 12px">
<a href="tel:+18089231234" style="flex:1;display:flex;align-items:center;justify-content:center;gap:7px;background:#2E7D75;color:#FDF7E7;border-radius:8px;padding:12px 0;font-family:'Quicksand',sans-serif;font-weight:700;font-size:13.5px"><i class="ph-bold ph-phone" style="font-size:15px"></i> Call</a>
<a href="https://www.google.com/maps/search/?api=1&query=2424+Kalakaua+Ave+Honolulu" target="_blank" rel="noreferrer" style="flex:1;display:flex;align-items:center;justify-content:center;gap:7px;background:#FDF7E7;color:#33304A;border-radius:8px;padding:12px 0;font-family:'Quicksand',sans-serif;font-weight:700;font-size:13.5px"><i class="ph-bold ph-navigation-arrow" style="font-size:15px"></i> Directions</a>
<a href="https://www.hyatt.com/hyatt-regency/en-US/hnlhr-hyatt-regency-waikiki-beach-resort-and-spa" target="_blank" rel="noreferrer" title="Official website" style="flex:none;display:flex;align-items:center;justify-content:center;width:44px;background:#FDF7E7;color:#33304A;border-radius:8px"><i class="ph-bold ph-arrow-square-out" style="font-size:15px"></i></a>
</div>
<div style="background:#FDF7E7;border-radius:8px;padding:6px 18px">${perks}</div>
<div style="font-size:13.5px;line-height:1.6;color:rgba(51,48,74,.88);margin-top:14px;text-wrap:pretty">A honeymoon request is on file for Mimi &amp; Wellen. Not guaranteed — mention it warmly at check-in and see what happens.</div>
</div>`;
}

function renderBudgetSub() {
  const t = cache.trip;
  let prepaid = '', ground = '', refs = '';
  t.prepaid.forEach(m => { prepaid += `<div style="display:flex;justify-content:space-between;gap:16px;padding:11px 0;border-bottom:1.5px dashed rgba(51,48,74,.2);font-size:13.5px"><div style="color:rgba(51,48,74,.6)">${esc(m.k)}</div><div style="font-family:'Quicksand',sans-serif;font-weight:700;color:#33304A">${esc(m.v)}</div></div>`; });
  t.ground.forEach(m => { ground += `<div style="display:flex;justify-content:space-between;gap:16px;padding:11px 0;border-bottom:1.5px dashed rgba(51,48,74,.2);font-size:13.5px"><div style="color:rgba(51,48,74,.6)">${esc(m.k)}</div><div style="font-family:'Quicksand',sans-serif;font-weight:700;color:#33304A">${esc(m.v)}</div></div>`; });
  t.refs.forEach(r => { refs += `<div style="display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1.5px dashed rgba(51,48,74,.2);font-size:13.5px"><div style="color:rgba(51,48,74,.55)">${esc(r.k)}</div><div style="font-family:'Quicksand',sans-serif;font-weight:700;letter-spacing:.04em;color:#33304A">${esc(r.v)}</div></div>`; });
  return `<div style="padding:18px 24px 0">
<div style="padding:0 18px">
<div style="font-family:'Quicksand',sans-serif;font-weight:700;font-size:34px;line-height:1.04;letter-spacing:-.02em;color:#33304A">Money</div>
<div style="font-size:13.5px;color:rgba(51,48,74,.88);margin-top:6px">Prepaid, then the ground estimate.</div>
</div>
<div style="background:#FDF7E7;border-radius:8px;padding:16px 18px 6px;margin-top:16px">
<div style="display:flex;align-items:center;gap:7px;font-family:'Quicksand',sans-serif;font-weight:700;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:rgba(51,48,74,.45)"><i class="ph-bold ph-receipt" style="font-size:13px"></i><span>Prepaid</span></div>
${prepaid}
<div style="display:flex;justify-content:space-between;gap:16px;padding:13px 0 15px;font-family:'Quicksand',sans-serif;font-weight:700;font-size:16px;color:#1D6B63"><div>Total prepaid</div><div>$3,798.13</div></div>
</div>
<div style="background:#FDF7E7;border-radius:8px;padding:16px 18px 6px;margin-top:11px">
<div style="display:flex;align-items:center;gap:7px;font-family:'Quicksand',sans-serif;font-weight:700;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:rgba(51,48,74,.45)"><i class="ph-bold ph-wallet" style="font-size:13px"></i><span>On the ground</span></div>
${ground}
<div style="display:flex;justify-content:space-between;gap:16px;padding:13px 0 15px;font-family:'Quicksand',sans-serif;font-weight:700;font-size:16px;color:#1D6B63"><div>Estimated on-island</div><div>$840–930</div></div>
</div>
<div style="background:#2E7D75;border-radius:8px;padding:20px;margin-top:11px">
<div style="display:flex;align-items:center;gap:7px;font-family:'Quicksand',sans-serif;font-weight:700;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:rgba(253,247,231,.75)"><i class="ph-bold ph-coins" style="font-size:13px"></i><span>All in</span></div>
<div style="font-family:'Quicksand',sans-serif;font-weight:700;font-size:40px;line-height:1;color:#F8D66B;margin-top:8px">≈ $4,680</div>
<div style="font-size:13px;line-height:1.6;color:rgba(253,247,231,.8);margin-top:10px;text-wrap:pretty">Offset by the $100 resort credit and a waived resort fee worth roughly $200 across four nights. Spend the credit — it does not refund.</div>
</div>
<div data-action="refs-toggle" style="cursor:pointer;margin-top:11px;background:#FDF7E7;border-radius:8px;padding:16px 18px">
<div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
<div style="display:flex;align-items:center;gap:7px;font-family:'Quicksand',sans-serif;font-weight:700;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:rgba(51,48,74,.5)"><i class="ph-bold ph-lock-simple" style="font-size:13px"></i><span>Confirmation numbers</span></div>
<div style="font-family:'Quicksand',sans-serif;font-weight:700;font-size:12px;color:#E0655F">${state.showRefs ? 'Hide' : 'Show'}</div>
</div>
${state.showRefs ? `<div style="margin-top:10px">${refs}<div style="font-size:12px;line-height:1.5;color:rgba(51,48,74,.5);margin-top:9px">Enough for someone else to alter or cancel a booking. Keep this screen to yourselves.</div></div>` : ''}
</div>
</div>`;
}

function renderCultureSub() {
  const t = cache.trip;
  let words = '', etiquette = '', names = '';
  t.words.forEach(w => { words += `<div style="display:flex;gap:14px;align-items:baseline;padding:11px 0;border-bottom:1.5px dashed rgba(51,48,74,.2)"><div style="width:96px;flex:none;font-family:'Quicksand',sans-serif;font-weight:700;font-size:16px;color:#1D6B63">${esc(w.haw)}</div><div style="flex:1;font-size:13px;line-height:1.45;color:rgba(51,48,74,.65)">${esc(w.en)}</div></div>`; });
  t.etiquette.forEach(e => { etiquette += `<div style="padding:12px 0;border-bottom:1.5px dashed rgba(51,48,74,.2)"><div style="font-family:'Quicksand',sans-serif;font-weight:700;font-size:15px;line-height:1.25;color:#33304A">${esc(e.t)}</div><div style="font-size:13px;line-height:1.5;color:rgba(51,48,74,.62);margin-top:4px;text-wrap:pretty">${esc(e.b)}</div></div>`; });
  t.names.forEach((n, i) => {
    const s = NAMES_STYLE[i] || NAMES_STYLE[0];
    names += `<div style="background:${s.bg};border-radius:8px;padding:18px 20px">
<div style="display:flex;align-items:baseline;gap:9px;flex-wrap:wrap"><div style="font-family:'Quicksand',sans-serif;font-weight:700;font-size:24px;line-height:1.05;letter-spacing:-.02em;color:${s.ink}">${esc(n.en)}</div><div style="font-family:'Quicksand',sans-serif;font-weight:600;font-size:12px;letter-spacing:.05em;color:${s.localInk}">${esc(n.haw)}</div></div>
<div style="font-size:13.5px;line-height:1.6;color:${s.body};margin-top:8px;text-wrap:pretty">${esc(n.b)}</div>
<a href="${esc(n.site)}" target="_blank" rel="noreferrer" style="display:inline-flex;align-items:center;gap:6px;margin-top:12px;background:${s.btnBg};color:${s.btnInk};border-radius:8px;padding:8px 12px;font-family:'Quicksand',sans-serif;font-weight:700;font-size:12px">${esc(n.siteLabel)} <i class="ph-bold ph-arrow-square-out" style="font-size:13px"></i></a>
</div>`;
  });
  return `<div style="padding:18px 24px 0">
<div style="padding:0 20px">
<div style="display:flex;align-items:baseline;gap:9px;flex-wrap:wrap"><div style="font-family:'Quicksand',sans-serif;font-weight:700;font-size:34px;line-height:1.04;letter-spacing:-.02em;color:#33304A">Respect</div><div style="font-family:'Quicksand',sans-serif;font-weight:600;font-size:12.5px;letter-spacing:.06em;color:#1D6B63">kuleana</div></div>
<div style="font-size:13.5px;color:rgba(51,48,74,.88);margin-top:6px">Responsibility, and the privilege that comes with it.</div>
<div style="font-size:14.5px;line-height:1.65;color:rgba(51,48,74,.88);margin-top:12px;text-wrap:pretty">Hawaiʻi is not a generic beach destination. It is a place with a living language, a sovereign history, and communities who are generous with visitors who arrive respectfully.</div>
</div>
<div style="background:#FDF7E7;border-radius:8px;padding:18px 20px 6px;margin-top:18px">
<div style="display:flex;align-items:center;gap:8px"><i class="ph-duotone ph-translate" style="font-size:20px;color:#1D6B63"></i><div style="font-family:'Quicksand',sans-serif;font-weight:700;font-size:21px;letter-spacing:-.015em;color:#33304A">The Hawaiian language</div></div>
<div style="font-size:13.5px;line-height:1.6;color:rgba(51,48,74,.7);margin-top:8px;text-wrap:pretty">Thirteen letters, two marks. The <em>ʻokina</em> (ʻ) is a consonant — a glottal stop, the catch in <em>uh-oh</em>. So <em>Hawaiʻi</em> is ha-vai-ee, not ha-why. The <em>kahakō</em> (ā) lengthens a vowel.</div>
<div style="height:6px"></div>
${words}
</div>
<div style="background:#FDF7E7;border-radius:8px;padding:18px 20px 6px;margin-top:11px">
<div style="display:flex;align-items:center;gap:8px"><i class="ph-duotone ph-hand-heart" style="font-size:20px;color:#1D6B63"></i><div style="font-family:'Quicksand',sans-serif;font-weight:700;font-size:21px;letter-spacing:-.015em;color:#33304A">Etiquette</div></div>
<div style="height:4px"></div>
${etiquette}
</div>
<div style="margin-top:11px;display:flex;flex-direction:column;gap:11px">${names}</div>
</div>`;
}

function renderContactsSub() {
  let rows = '';
  cache.trip.contacts.forEach((c, i) => {
    const s = i === 0 ? CONTACT_STYLE[0] : { bg: CREAM, ink: INK, muted: MUTED, link: TEAL_D };
    rows += `<div style="background:${s.bg};border-radius:8px;padding:14px 18px;margin-bottom:10px;display:flex;align-items:center;gap:13px">
<i class="${c.icon}" style="flex:none;font-size:22px;color:${s.link}"></i>
<div style="flex:1;min-width:0"><div style="font-family:'Quicksand',sans-serif;font-weight:700;font-size:15.5px;line-height:1.2;color:${s.ink}">${esc(c.who)}</div><div style="font-size:12px;color:${s.muted};margin-top:3px">${esc(c.note)}</div></div>
<a href="${esc(c.href)}" style="flex:none;font-family:'Quicksand',sans-serif;font-weight:700;font-size:13.5px;white-space:nowrap;color:${s.link}">${esc(c.num)}</a>
</div>`;
  });
  return `<div style="padding:18px 24px 0">
<div style="padding:0 18px">
<div style="font-family:'Quicksand',sans-serif;font-weight:700;font-size:34px;line-height:1.04;letter-spacing:-.02em;color:#33304A">Contacts</div>
<div style="font-size:13.5px;line-height:1.5;color:rgba(51,48,74,.88);margin-top:6px">Tap to call. Hawaiʻi is UTC−10 — three hours behind Phoenix in October.</div>
</div>
<div style="height:16px"></div>
${rows}
<div style="font-size:13.5px;line-height:1.6;color:rgba(51,48,74,.88);margin-top:6px;text-wrap:pretty">Nearest urgent care: Straub has a Waikīkī clinic on Kalākaua Ave. The main Straub hospital and Queen's Medical Center are both downtown, about ten minutes by car.</div>
</div>`;
}

// ---------- nav ----------
function renderNav() {
  const tabs = [
    ['now', 'ph-duotone ph-sun', 'Now'], ['days', 'ph-duotone ph-calendar-dots', 'Days'],
    ['map', 'ph-duotone ph-map-trifold', 'Map'], ['prep', 'ph-duotone ph-check-square-offset', 'Prep'],
    ['more', 'ph-duotone ph-folder-open', 'File']
  ];
  let html = `<div class="nav-bar" style="position:fixed;left:0;right:0;bottom:0;z-index:30;min-height:76px;padding:16px 24px calc(14px + env(safe-area-inset-bottom));box-sizing:border-box;display:flex;align-items:stretch;gap:2px;background:#FDF7E7;border-top:1.5px solid rgba(51,48,74,.08);max-width:600px;margin:0 auto">`;
  tabs.forEach(([key, icon, label]) => {
    const active = state.tab === key && state.detail == null && state.sub == null;
    html += `<div data-action="tab|${key}" style="flex:1;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border-radius:8px;color:${active ? TEAL_D : 'rgba(51,48,74,.55)'}"><i class="${icon}" style="font-size:18px"></i><div style="font-family:'Quicksand',sans-serif;font-weight:700;font-size:9.5px">${label}</div></div>`;
  });
  html += `</div>`;
  return html;
}

// ---------- root render ----------
function render() {
  let tabContent;
  if (state.tab === 'now') tabContent = renderNow();
  else if (state.tab === 'days') tabContent = renderDays();
  else if (state.tab === 'map') tabContent = renderMap();
  else if (state.tab === 'prep') tabContent = renderPrep();
  else tabContent = renderMore();

  const overlays = (state.detail != null ? renderDetail() : '') + (state.sub != null ? renderSub() : '');

  root.innerHTML = `<div class="app-shell">
<div class="scr" style="flex:1">${tabContent}</div>
${overlays}
${renderNav()}
</div>`;

  if (state.tab === 'map' && state.detail == null && state.sub == null) initLeaflet();
}

// ---------- mutations ----------
async function ensureSchedule(dayKey) {
  if (cache.schedules[dayKey]) return;
  cache.schedules[dayKey] = await api('/schedule/' + dayKey);
}

async function toggleEditSchedule(dayKey) {
  state.editingSchedule[dayKey] = !state.editingSchedule[dayKey];
  render();
}
async function addScheduleItem(dayKey) {
  const item = await api('/schedule/' + dayKey, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ time: '', what: 'New item', where: '' }) });
  cache.schedules[dayKey].push(item);
  render();
}
async function removeScheduleRow(rowId, dayKey) {
  await api('/schedule-items/' + rowId, { method: 'DELETE' });
  cache.schedules[dayKey] = cache.schedules[dayKey].filter(r => r.id != rowId);
  render();
}
async function moveScheduleRow(rowId, dayKey, dir) {
  const rows = cache.schedules[dayKey];
  const idx = rows.findIndex(r => r.id == rowId);
  const newIdx = idx + dir;
  if (idx === -1 || newIdx < 0 || newIdx >= rows.length) return;
  const tmp = rows[idx]; rows[idx] = rows[newIdx]; rows[newIdx] = tmp;
  render();
  await api('/schedule/' + dayKey + '/reorder', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: rows.map(r => r.id) }) });
}
async function commitRowField(rowId, dayKey, field, value) {
  const row = (cache.schedules[dayKey] || []).find(r => r.id == rowId);
  if (row) row[field] = value;
  await api('/schedule-items/' + rowId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [field]: value }) });
}
function toggleNote(rowId, dayKey) {
  state.noteOpen[rowId] = !state.noteOpen[rowId];
  render();
}
async function addPost(rowId, dayKey) {
  const draft = state.drafts[rowId] || {};
  const fd = new FormData();
  fd.append('text', draft.text || '');
  if (draft.file) fd.append('image', draft.file);
  const post = await api('/schedule-items/' + rowId + '/posts', { method: 'POST', body: fd });
  const row = cache.schedules[dayKey].find(r => r.id == rowId);
  row.posts = row.posts || [];
  row.posts.push(post);
  delete state.drafts[rowId];
  state.noteOpen[rowId] = false;
  render();
}
async function removePost(postId, rowId, dayKey) {
  await api('/posts/' + postId, { method: 'DELETE' });
  const row = cache.schedules[dayKey].find(r => r.id == rowId);
  row.posts = row.posts.filter(p => p.id != postId);
  render();
}
function startEditPost(postId) {
  const row = findRowByPost(postId);
  const post = row.posts.find(p => p.id == postId);
  state.editDrafts[postId] = { text: post.text };
  state.postEditing[postId] = true;
  render();
}
function cancelEditPost(postId) {
  state.postEditing[postId] = false;
  delete state.editDrafts[postId];
  render();
}
async function saveEditPost(postId, rowId, dayKey) {
  const draft = state.editDrafts[postId] || {};
  const fd = new FormData();
  fd.append('text', draft.text || '');
  if (draft.file) fd.append('image', draft.file);
  const updated = await api('/posts/' + postId, { method: 'PUT', body: fd });
  const row = cache.schedules[dayKey].find(r => r.id == rowId);
  const post = row.posts.find(p => p.id == postId);
  post.text = updated.text; post.imagePath = updated.imagePath;
  state.postEditing[postId] = false;
  delete state.editDrafts[postId];
  render();
}
function findRowByPost(postId) {
  for (const dayKey in cache.schedules) {
    for (const row of cache.schedules[dayKey]) {
      if ((row.posts || []).some(p => p.id == postId)) return row;
    }
  }
  return null;
}

async function togglePrepItem(id) {
  const item = findPrepItem(id);
  if (!item) return;
  item.done = !item.done;
  render();
  await api('/prep-items/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ done: item.done }) });
}
async function removePrepItem(id) {
  await api('/prep-items/' + id, { method: 'DELETE' });
  cache.prep.forEach(g => { g.items = g.items.filter(it => it.id != id); });
  render();
}
async function addPrepItem(groupIndex) {
  const label = (state.prepDraft[groupIndex] || '').trim();
  if (!label) return;
  const item = await api('/prep/' + groupIndex + '/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label }) });
  cache.prep[groupIndex].items.push(item);
  state.prepDraft[groupIndex] = '';
  render();
}
function findPrepItem(id) {
  for (const g of cache.prep) { const it = g.items.find(x => x.id == id); if (it) return it; }
  return null;
}

// ---------- event wiring ----------
root.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const [verb, a, b, c] = el.getAttribute('data-action').split('|');
  switch (verb) {
    case 'tab': state.tab = a; state.detail = null; state.sub = null; render(); break;
    case 'day-open': {
      const idx = Number(a);
      state.detail = idx;
      render();
      ensureSchedule(idx).then(render);
      break;
    }
    case 'day-close': state.detail = null; render(); break;
    case 'sub-open': state.sub = a; render(); break;
    case 'sub-close': state.sub = null; render(); break;
    case 'map-select': selectMapPlace(Number(a)); break;
    case 'schedule-edit-toggle': toggleEditSchedule(a); break;
    case 'schedule-add': addScheduleItem(a); break;
    case 'row-remove': removeScheduleRow(a, b); break;
    case 'row-up': moveScheduleRow(a, b, -1); break;
    case 'row-down': moveScheduleRow(a, b, 1); break;
    case 'note-toggle': toggleNote(a, b); break;
    case 'post-add': addPost(a, b); break;
    case 'post-remove': removePost(a, b, c); break;
    case 'post-edit-start': startEditPost(a); break;
    case 'post-edit-cancel': cancelEditPost(a); break;
    case 'post-edit-save': saveEditPost(a, b, c); break;
    case 'prep-toggle': togglePrepItem(a); break;
    case 'prep-remove': removePrepItem(a); break;
    case 'prep-add': addPrepItem(Number(a)); break;
    case 'refs-toggle': state.showRefs = !state.showRefs; render(); break;
    case 'export-day': exportDayAsInstagramPost(Number(a)); break;
  }
});

// text fields: keep local state in sync while typing (no re-render), commit to API on blur
root.addEventListener('input', (e) => {
  const t = e.target;
  if (t.matches('[data-field]')) {
    const rowId = t.dataset.row, dayKey = t.dataset.day, field = t.dataset.field;
    const row = (cache.schedules[dayKey] || []).find(r => r.id == rowId);
    if (row) row[field] = t.value;
  } else if (t.matches('[data-draft-text]')) {
    const rowId = t.dataset.draftText;
    state.drafts[rowId] = Object.assign({}, state.drafts[rowId], { text: t.value });
  } else if (t.matches('[data-edit-text]')) {
    const postId = t.dataset.editText;
    state.editDrafts[postId] = Object.assign({}, state.editDrafts[postId], { text: t.value });
  } else if (t.matches('[data-prep-draft]')) {
    state.prepDraft[t.dataset.prepDraft] = t.value;
  }
});
root.addEventListener('change', (e) => {
  const t = e.target;
  if (t.matches('[data-field]')) {
    commitRowField(t.dataset.row, t.dataset.day, t.dataset.field, t.value);
  } else if (t.matches('[data-draft-file]')) {
    const rowId = t.dataset.draftFile;
    const file = t.files[0];
    if (file) {
      state.drafts[rowId] = Object.assign({}, state.drafts[rowId], { file, previewUrl: URL.createObjectURL(file) });
      render();
    }
  } else if (t.matches('[data-edit-file]')) {
    const postId = t.dataset.editFile;
    const file = t.files[0];
    if (file) {
      state.editDrafts[postId] = Object.assign({}, state.editDrafts[postId], { file, previewUrl: URL.createObjectURL(file) });
      render();
    }
  }
});

// ---------- live refresh: pick up posts/checklist changes from the other person ----------
let refreshing = false;
async function refreshLiveData() {
  if (refreshing || !cache.trip) return;
  // don't clobber an in-progress, uncommitted edit (e.g. mid-keystroke in a schedule field)
  const active = document.activeElement;
  if (active && root.contains(active) && /^(INPUT|TEXTAREA)$/.test(active.tagName)) return;
  refreshing = true;
  try {
    const dayKeys = new Set([currentDayIndex]);
    if (state.detail != null) dayKeys.add(state.detail);
    const [prep, ...schedules] = await Promise.all([
      api('/prep'),
      ...[...dayKeys].map((dk) => api('/schedule/' + dk))
    ]);
    cache.prep = prep;
    [...dayKeys].forEach((dk, i) => { cache.schedules[dk] = schedules[i]; });
    render();
  } catch (e) {
    // offline or the free host is waking up — just try again next cycle
  } finally {
    refreshing = false;
  }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshLiveData(); });
window.addEventListener('focus', refreshLiveData);
setInterval(refreshLiveData, 25000);

// ---------- Instagram post export (scrapbook-style, 1080x1350) ----------
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image failed to load: ' + src));
    img.src = src;
  });
}

function wrapCanvasText(ctx, text, maxWidth) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawImageCover(ctx, img, x, y, w, h) {
  const ir = img.width / img.height, tr = w / h;
  let sx, sy, sw, sh;
  if (ir > tr) { sh = img.height; sw = sh * tr; sx = (img.width - sw) / 2; sy = 0; }
  else { sw = img.width; sh = sw / tr; sx = 0; sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawStar(ctx, cx, cy, r, color, rotateDeg) {
  const spikes = 4, inner = r * 0.42;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotateDeg || 0) * Math.PI / 180);
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const rad = i % 2 === 0 ? r : inner;
    const ang = (Math.PI / spikes) * i - Math.PI / 2;
    const x = Math.cos(ang) * rad, y = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawPolaroid(ctx, { cx, cy, w, h, rotateDeg, img, caption }) {
  const pad = w * 0.06;
  const photoH = h * 0.76;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotateDeg * Math.PI / 180);

  ctx.save();
  ctx.shadowColor = 'rgba(51,48,74,.35)';
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#FFFFFF';
  roundRectPath(ctx, -w / 2, -h / 2, w, h, 6);
  ctx.fill();
  ctx.restore();

  const photoX = -w / 2 + pad, photoY = -h / 2 + pad, photoW = w - pad * 2, pH = photoH - pad;
  ctx.save();
  roundRectPath(ctx, photoX, photoY, photoW, pH, 3);
  ctx.clip();
  if (img) drawImageCover(ctx, img, photoX, photoY, photoW, pH);
  else { ctx.fillStyle = '#EDE7D6'; ctx.fillRect(photoX, photoY, photoW, pH); }
  ctx.restore();

  if (caption) {
    ctx.fillStyle = '#33304A';
    ctx.font = "600 32px 'Caveat', cursive";
    ctx.textAlign = 'center';
    const lines = wrapCanvasText(ctx, caption, w - pad * 2).slice(0, 2);
    const bandTop = photoY + pH, bandBottom = h / 2 - 4;
    const lineH = 34;
    const startY = (bandTop + bandBottom) / 2 - ((lines.length - 1) * lineH) / 2 + 10;
    lines.forEach((ln, i) => ctx.fillText(ln, 0, startY + i * lineH));
  }
  ctx.restore();
}

const POLAROID_LAYOUTS = {
  1: [{ cx: 540, cy: 770, w: 640, h: 780, rotateDeg: -2 }],
  2: [
    { cx: 335, cy: 730, w: 480, h: 600, rotateDeg: -6 },
    { cx: 745, cy: 790, w: 480, h: 600, rotateDeg: 5 }
  ],
  3: [
    { cx: 300, cy: 630, w: 460, h: 560, rotateDeg: -7 },
    { cx: 765, cy: 600, w: 440, h: 540, rotateDeg: 6 },
    { cx: 530, cy: 990, w: 460, h: 560, rotateDeg: -3 }
  ],
  4: [
    { cx: 300, cy: 580, w: 420, h: 520, rotateDeg: -7 },
    { cx: 765, cy: 555, w: 400, h: 500, rotateDeg: 6 },
    { cx: 300, cy: 1000, w: 420, h: 520, rotateDeg: 4 },
    { cx: 765, cy: 1020, w: 400, h: 500, rotateDeg: -5 }
  ]
};

async function exportDayAsInstagramPost(dayKey) {
  const statusEl = document.getElementById('export-status-' + dayKey);
  const setStatus = (msg) => { if (statusEl) statusEl.textContent = msg; };
  setStatus('Preparing image…');
  try {
    await ensureSchedule(dayKey);
    const day = cache.trip.days[dayKey];
    const rows = cache.schedules[dayKey] || [];
    const posts = [];
    rows.forEach(r => (r.posts || []).forEach(p => { if (p.imagePath) posts.push(p); }));

    const W = 1080, H = 1350;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#DCEBE7');
    grad.addColorStop(1, '#F3ECD8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    // Caveat is only ever used inside <canvas>, never in visible DOM text, so the
    // browser never triggers loading it from the stylesheet on its own — force it.
    if (document.fonts && document.fonts.load) {
      try { await Promise.all(['400', '600', '700'].map(w => document.fonts.load(`${w} 32px 'Caveat'`))); } catch (e) {}
    }

    drawStar(ctx, 90, 130, 26, SUN, -10);
    drawStar(ctx, 985, 175, 18, CORAL, 14);
    drawStar(ctx, 60, 1250, 20, TEAL, 8);
    drawStar(ctx, 1005, 1270, 16, SUN, -18);

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(51,48,74,.55)';
    ctx.font = "700 30px 'Quicksand', sans-serif";
    ctx.fillText(`DAY ${day.num}/5 · ${day.dow.toUpperCase()} ${day.date.toUpperCase()}`, W / 2, 110);

    ctx.fillStyle = '#33304A';
    ctx.font = "700 92px 'Quicksand', sans-serif";
    ctx.fillText(day.title, W / 2, 210);

    ctx.fillStyle = '#1D6B63';
    ctx.font = "600 34px 'Quicksand', sans-serif";
    ctx.fillText(day.local, W / 2, 258);

    let photoSources = posts.slice(0, 4).map(p => ({ src: p.imagePath, caption: p.text }));
    if (photoSources.length === 0) photoSources = [{ src: day.photo.src, caption: day.sub }];

    const loaded = await Promise.all(photoSources.map(async (p) => {
      try { return { img: await loadImage(p.src), caption: p.caption }; }
      catch (e) { return { img: null, caption: p.caption }; }
    }));

    const layout = POLAROID_LAYOUTS[Math.min(loaded.length, 4)] || POLAROID_LAYOUTS[1];
    loaded.forEach((item, i) => {
      const pos = layout[i];
      if (!pos) return;
      drawPolaroid(ctx, { cx: pos.cx, cy: pos.cy, w: pos.w, h: pos.h, rotateDeg: pos.rotateDeg, img: item.img, caption: item.caption });
    });

    ctx.fillStyle = 'rgba(51,48,74,.65)';
    ctx.font = "700 26px 'Quicksand', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('Mimi & Wellen · Oʻahu', W / 2, H - 46);

    canvas.toBlob((blob) => {
      if (!blob) { setStatus('Could not create the image — try again.'); return; }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'oahu-day-' + day.num + '-' + day.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.png';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setStatus('Saved — check your downloads.');
    }, 'image/png');
  } catch (err) {
    console.error(err);
    setStatus('Something went wrong creating the image.');
  }
}

// ---------- boot ----------
async function boot() {
  const [trip, prep] = await Promise.all([api('/trip'), api('/prep')]);
  cache.trip = trip;
  cache.prep = prep;
  await ensureSchedule(currentDayIndex);
  render();
}
boot().catch(err => { root.innerHTML = '<div style="padding:40px;font-family:sans-serif;color:#33304A">Could not load the trip. ' + esc(err.message) + '</div>'; console.error(err); });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // only reload on controllerchange if a SW was already controlling this page —
      // the first-ever install also fires controllerchange, and reloading then is pointless
      const hadController = !!navigator.serviceWorker.controller;
      const reg = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
      reg.update().catch(() => {});
      if (hadController) {
        navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
      }
    } catch (e) {}
  });
}

})();
