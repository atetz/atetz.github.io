#!/usr/bin/env node
// Turns a live blog post into clipboard-ready HTML with [[IMAGE n: alt]] placeholders.
// Usage (from the repo root): node .claude/skills/linkedin-article/scripts/extract.mjs <post-name>
// Writes .linkedin/<post-name>/article.html and images.tsv, prints a JSON summary.
// Never rewrites text: it only removes site widgets and swaps images, diagrams and tables for placeholders.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseDocument } from "htmlparser2";
import * as du from "domutils";
import serializer from "dom-serializer";
const render = serializer.render || serializer.default || serializer;
import { Element, Text } from "domhandler";

const SITE = "https://data-integration.dev";
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../../..");
const name = process.argv[2];
if (!name) fail("usage: extract.mjs <post-name>   (file name in _src/posts without .md)");

function fail(message, extra = {}) {
  console.log(JSON.stringify({ ok: false, message, ...extra }, null, 2));
  process.exit(1);
}

// --- inputs -----------------------------------------------------------------
const mdPath = join(root, "_src/posts", `${name}.md`);
if (!existsSync(mdPath)) fail(`no such post: _src/posts/${name}.md`);
const md = readFileSync(mdPath, "utf8");
const fm = (md.match(/^---\n([\s\S]*?)\n---/) || [, ""])[1];
const field = (key) => (fm.match(new RegExp(`^${key}:\\s*(.+)$`, "m")) || [, ""])[1].trim();
const title = field("title");

const wording = readFileSync(join(here, "../wording.md"), "utf8");
const word = (key) => (wording.match(new RegExp(`^${key}:\\s*(.+)$`, "m")) || [, ""])[1].trim();
const attribution = word("attribution");
const disclosure = word("ai_disclosure");
if (!attribution || !disclosure) fail("wording.md must define attribution: and ai_disclosure:");

// --- live page --------------------------------------------------------------
const url = `${SITE}/posts/${name}/`;
const res = await fetch(url);
if (res.status !== 200) fail(`not live: ${url} returned ${res.status}`, { live: false });
const doc = parseDocument(await res.text());
const section = du.findOne((e) => e.name === "section" && e.parent?.attribs?.id === "main", doc.children);
if (!section) fail(`no post body found at ${url} (expected div#main > section)`);

const squash = (s) => s.replace(/\s+/g, " ").trim();
const liveTitle = squash(du.textContent(du.findOne((e) => e.name === "h2", section.children) || []));
if (liveTitle !== squash(title)) {
  fail("live title differs from front matter: the latest edit is not deployed", { live: false, liveTitle, title });
}

// --- transform --------------------------------------------------------------
const differences = [];
const note = (text) => differences.includes(text) || differences.push(text);
const all = (test) => du.findAll((e) => test(e), section.children);
const cls = (e) => (e.attribs?.class || "").split(/\s+/);

for (const e of all((e) => ["script", "style", "link", "hgroup"].includes(e.name))) du.removeElement(e);
for (const e of all((e) => cls(e).includes("contactButton") || e.attribs?.id === "contactButton")) {
  du.removeElement(e);
  note("Contact/schedule button left out");
}
for (const e of all((e) => e.name === "small" && squash(du.textContent(e)) === "Click to open")) du.removeElement(e);

const images = [];
function placeholder(node, kind, alt) {
  const n = images.length + 1;
  const label = `[[IMAGE ${n}: ${squash(alt) || kind}]]`;
  images.push({ n, kind, alt: squash(alt), file: "" });
  const inParagraph = node.parent?.name === "p";
  du.replaceElement(node, inParagraph ? new Text(label) : new Element("p", {}, [new Text(label)]));
}

// Walk in document order so placeholder numbers follow the reading order.
let diagrams = 0;
let tables = 0;
for (const e of all((e) => ["img", "table"].includes(e.name) || (e.name === "pre" && cls(e).includes("mermaid")))) {
  if (e.name === "img") {
    const wrapper = ["picture", "a"].includes(e.parent?.name) ? e.parent : e;
    placeholder(wrapper, "file", e.attribs.alt || "");
  } else if (e.name === "table") {
    placeholder(e, "table", `table ${++tables}`);
    note("Tables shown as images (LinkedIn has no tables)");
  } else {
    placeholder(e, "mermaid", `diagram ${++diagrams}`);
    note("Mermaid diagrams shown as images");
  }
}

for (const e of all((e) => e.name === "details")) {
  for (const s of du.findAll((c) => c.name === "summary", e.children)) s.name = "p";
  e.name = "div";
  e.attribs = {};
  note("Collapsible sections shown as always-visible text");
}
for (const e of all((e) => e.name === "pre")) {
  const code = new Element("code", {}, [new Text(du.textContent(e))]);
  e.attribs = {};
  e.children = [code];
  code.parent = e;
  note("Code blocks keep their text but lose syntax highlighting");
}
for (const e of all((e) => e.name === "a" && e.attribs.href)) {
  if (e.attribs.href.startsWith("/")) {
    e.attribs = { href: SITE + e.attribs.href.replace(/index\.html$/, "") };
    note("Internal links rewritten to full data-integration.dev addresses");
  } else e.attribs = { href: e.attribs.href };
}
if (du.findOne((e) => /^h[1-6]$/.test(e.name), section.children)) note("Heading levels flatten to LinkedIn's heading style");

const bodyText = squash(du.textContent(section));
const norm = (s) => s.toLowerCase().replace(/\.$/, "");
const hasDisclosure = norm(bodyText).includes(norm(disclosure));

// --- match placeholders to source files, in order ----------------------------
const refs = [...md.matchAll(/\{%-?\s*(?:image|galleryImg)\s+"([^"]+)"|<img[^>]*?\ssrc="([^"]+)"|!\[[^\]]*\]\(([^)\s]+)/g)]
  .map((m) => m[1] || m[2] || m[3]);
const fileImages = images.filter((i) => i.kind === "file");
const mappingOk = refs.length === fileImages.length;
const outDir = join(root, ".linkedin", name);
fileImages.forEach((img, i) => {
  if (mappingOk) img.file = join("_src", refs[i]);
});
for (const img of images) {
  if (img.kind !== "file") img.file = join(".linkedin", name, `${img.alt.replace(" ", "-")}.png`);
}
const missing = images.filter((i) => i.kind === "file" && i.file && !existsSync(join(root, i.file))).map((i) => i.file);

// --- output -----------------------------------------------------------------
const pageUrl = url.replace(/\/$/, "");
const top = `<p><em>${attribution.replace("{url}", `<a href="${url}">${pageUrl.replace("https://", "")}</a>`)}</em></p><hr>`;
const html = `<meta charset="utf-8">${top}${render(section.children, { encodeEntities: "utf8" })}`;
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "article.html"), html);
writeFileSync(
  join(outDir, "images.tsv"),
  "n\tkind\talt\tfile\n" + images.map((i) => [i.n, i.kind, i.alt, i.file].join("\t")).join("\n") + "\n",
);

console.log(
  JSON.stringify(
    {
      ok: true,
      post: `_src/posts/${name}.md`,
      title,
      url,
      live: true,
      linkedin: field("linkedin"),
      linkedin_draft: field("linkedin_draft"),
      ai_disclosure_found: hasDisclosure,
      article_html: join(".linkedin", name, "article.html"),
      images_tsv: join(".linkedin", name, "images.tsv"),
      words: bodyText.split(" ").length,
      // Everything wave 1 pastes (attribution line, text, placeholders) with all whitespace removed.
      // Compare with the same count over the editor's text after wave 1.
      fingerprint_chars: (attribution.replace("{url}", pageUrl.replace("https://", "")) + bodyText).replace(/\s/g, "").length,
      images: { total: images.length, file: fileImages.length, mermaid: diagrams, table: tables },
      cover: mappingOk && fileImages[0] ? fileImages[0].file : "",
      mapping_ok: mappingOk,
      mapping_note: mappingOk ? "" : `${fileImages.length} images on the live page, ${refs.length} image references in the markdown`,
      missing_files: missing,
      differences,
    },
    null,
    2,
  ),
);
