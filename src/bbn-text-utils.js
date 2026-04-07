// ═══════════════════════════════════════════════════════════════
//  BBN MULTIPLEX — TEXT UTILITIES
//  Translate, color helpers yahan hain.
//  Translate API ya text logic badlna ho to SIRF yeh file badlo.
// ═══════════════════════════════════════════════════════════════

// ── Translate via Google (free endpoint) ─────────────────────
//  lang: "hi" | "en" | any Google-supported code
//  Returns: translated string
export async function translateText(text, lang = "hi") {
  if (!text || !text.trim()) throw new Error("Text empty hai");
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`;
  const res  = await fetch(url);
  if (!res.ok) throw new Error("Network error");
  const data = await res.json();
  return data[0].map(x => x[0]).join("");
}

// ── Apply foreground color to selected text in a contentEditable div ──
//  elem: DOM element ref (contentEditable)
//  color: hex string e.g. "#CC0000"
//  Returns: "ok" | "no_selection"
export function applyTextColor(elem, color) {
  if (!elem) return "no_elem";
  const prev = elem.contentEditable;
  elem.contentEditable = "true";
  elem.focus();
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.toString().length === 0) {
    elem.contentEditable = prev;
    return "no_selection";
  }
  document.execCommand("foreColor", false, color);
  elem.contentEditable = "false";
  return "ok";
}

// ── Remove all color formatting from selected/all text ────────
export function removeTextColor(elem) {
  if (!elem) return;
  const prev = elem.contentEditable;
  elem.contentEditable = "true";
  elem.focus();
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0 && sel.toString().length > 0) {
    document.execCommand("removeFormat", false, null);
  } else {
    // No selection → strip all formatting
    elem.textContent = elem.innerText;
  }
  elem.contentEditable = "false";
  return elem.innerHTML;
}

// ── Mobile tap → select whole word ────────────────────────────
export function selectWordAtTap(elem) {
  if (!elem) return;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  const node  = range.startContainer;
  if (node.nodeType !== Node.TEXT_NODE) return;
  const text = node.textContent;
  let s = range.startOffset, e = range.startOffset;
  while (s > 0 && !/\s/.test(text[s - 1])) s--;
  while (e < text.length && !/\s/.test(text[e])) e++;
  const nr = document.createRange();
  nr.setStart(node, s);
  nr.setEnd(node, e);
  sel.removeAllRanges();
  sel.addRange(nr);
}
