#!/usr/bin/env python3
"""  python3 scriptcheck.py <piece>        run from the piece's folder. exits 1 while any BLOCK stands

Does the script hand the viewer every word before the film spends it, and does it say anything false?
Reads <piece>.lines.json, <piece>.ties.json and the text drawn by film/scenes/*.js.

  BLOCK  a term in lines.json "terms" that the voice never says
  BLOCK  a term said in the first line, which has to need no context
  BLOCK  a tied word that is missing from its line, or appears twice without an index
  BLOCK  a term with no thing in "things", or said before its thing is. "your query" came eleven lines before
         the telescope, so for eleven lines it was a bare word
  REVIEW a sentence that puts a thing in the world next to a word of the real system. "the flowers are closed"
         is a real state on a world noun. The world says "the flower has stopped growing"
  REVIEW every absolute word (never, every, only...), to read against the whole film. "Pinot never knocks
         the old house down" was false once the film's own compaction scene knocked them down
  REVIEW words drawn on screen that the voice never says. "segment 7" sat on street signs for a whole film
         and nobody ever said "segment"
  REVIEW capitalised names in the first two lines, which may not be introduced yet

"terms" maps what the screen shows to how the voice says it: {"validDocIds": "valid doc ids", "segment": "segment"}.
"data" lists words drawn on screen that are data, not terms, and need no saying: statuses, labels, names.
"things" maps each term to its thing in the world, one word or a list: {"segment": "street", "query": ["telescope"]}.
"tech" lists the real system's own verbs and states that the world must not say: ["closed", "flushed", "overwrite"].
The naming line, the first sentence that says a term, may say the term and its thing together. No other may."""
import json, re, sys
from pathlib import Path

piece = sys.argv[1] if len(sys.argv) > 1 else "piece"
cfg = json.load(open(f"{piece}.lines.json"))
lines = cfg["lines"]
terms = {k.lower(): v.lower() for k, v in cfg.get("terms", {}).items()}
data = {w.lower() for w in cfg.get("data", [])}
things = {k.lower(): [t.lower() for t in (v if isinstance(v, list) else [v])] for k, v in cfg.get("things", {}).items()}
tech = [w.lower() for w in cfg.get("tech", [])]
ties = json.load(open(f"{piece}.ties.json")) if Path(f"{piece}.ties.json").exists() else []
norm = lambda s: re.sub(r"\s+", " ", re.sub(r"[^a-z0-9' ]", " ", s.lower())).strip()
spoken = norm(" ".join(l["text"] for l in lines))
said = set(spoken.split())
block, review = [], []

# terms: said at least once, and never in the first line
for shown, say in terms.items():
    # a term may be said with an ending: "upserts" says "upsert"
    if not re.search(rf"(?<![a-z0-9']){re.escape(norm(say))}", spoken):
        block.append(f"'{shown}' is a term the film uses, but the voice never says '{say}'")
    elif re.search(rf"(?<![a-z0-9']){re.escape(norm(say))}", norm(lines[0]["text"])):
        block.append(f"'{say}' is said in the first line. The first line has to need no context")

# every term is handed over through its thing: the thing is on stage by the line that first says the term
has = lambda text, w: re.search(rf"(?<![a-z0-9']){re.escape(norm(w))}", norm(text)) is not None
named = {}   # the first sentence that says each term, where the term and its thing may meet
sents = [(l["id"], s) for l in lines for s in re.split(r"(?<=[.?!])\s+", l["text"]) if s.strip()]
for shown, say in terms.items():
    if shown not in things:
        block.append(f"'{shown}' has no thing in the world. Add it to \"things\", or cut the term"); continue
    first = next((i for i, (_, s) in enumerate(sents) if has(s, say)), None)
    if first is None: continue
    named[shown] = first
    seen = " ".join(s for _, s in sents[:first + 1])
    if not any(has(seen, t) for t in things[shown]):
        block.append(f"'{say}' is said in {sents[first][0]} before its thing ({', '.join(things[shown])}) is: \"{sents[first][1]}\". "
                     f"Show and say the thing first, then name it")

# one world per sentence: a thing in the world never takes a word of the real system, except in a naming sentence
for i, (lid, s) in enumerate(sents):
    if i in named.values(): continue
    world = sorted({t for ts in things.values() for t in ts if has(s, t)})
    if not world: continue
    real = [w for w in tech if has(s, w)]
    real += [terms[k] for k in terms if has(s, terms[k])]
    if real:
        review.append(f"{lid:8s} mixes the world ({', '.join(world)}) with the real system ({', '.join(real)}): \"{s}\". "
                      f"Say what the world does, in the world's own verb")

# ties: present once, or indexed
for t in ties:
    lid, w = t[0], t[1]; idx = t[2] if len(t) > 2 else None
    line = next((l for l in lines if l["id"] == lid), None)
    if not line: block.append(f"tie {lid}:{w} names a line that does not exist"); continue
    n = len(re.findall(rf"(?<![a-z0-9']){re.escape(norm(w))}(?![a-z0-9'])", norm(line["text"])))
    if n == 0: block.append(f"tie {lid}:{w} is not in its line: \"{line['text']}\"")
    elif n > 1 and idx is None: block.append(f"tie {lid}:{w} appears {n} times in its line, so it ties to the first. give it an index")

# absolute words, to read against the whole film
ABS = ["never", "always", "every", "everything", "all", "only", "nothing", "none", "ever", "forever", "no one", "everyone"]
for l in lines:
    t = norm(l["text"])
    hits = [a for a in ABS if re.search(rf"\b{a}\b", t)]
    if hits: review.append(f"{l['id']:8s} {', '.join(hits):16s} \"{l['text']}\"")

# words on screen that are never said
shown_text = {}
for p in sorted(Path("film/scenes").glob("*.js")):
    src = p.read_text()
    for m in re.finditer(r"(?:\bhand|\bhandPart|\bfillText|\bstamp)\(\s*'([^']+)'|\bsign\([^,]+,[^,]+,\s*'([^']+)'", src):
        shown_text.setdefault(m.group(1) or m.group(2), set()).add(p.name)
for text, files in sorted(shown_text.items()):
    if text.lower() in terms: continue
    words = [w for w in re.findall(r"[a-z]+", text.lower()) if len(w) > 2 and w not in data]
    miss = [w for w in words if w not in said and not any(w in norm(v).split() for v in terms.values())]
    if miss: review.append(f"on screen, never said: '{text}' ({', '.join(miss)}) in {', '.join(sorted(files))}")

# names in the first two lines that may not be introduced. a name is a capitalised word that never appears
# in lowercase anywhere in the script, so "Every" at a sentence start is not one and "Pinot" is
COMMON = set("i a an the this that those these it its it's that's there where what when why how who which then so but and or "
             "if at in on to of for with inside right now next every nothing one suppose here".split())
lower_words = set(re.findall(r"\b[a-z][a-z'-]*\b", " ".join(l["text"] for l in lines)))
seen_names = set()
for l in lines[:2]:
    for w in re.findall(r"\b[A-Z][A-Za-z'-]*\b", l["text"]):
        if w.lower() not in lower_words and w.lower() not in COMMON and w not in seen_names:
            seen_names.add(w)
            review.append(f"{l['id']:8s} names '{w}' in the opening. Is it introduced, or does the viewer already know it?")

# the connective ratio, as code-film's check.py counts it
n = {w: len(re.findall(rf"\b{w}\b", spoken)) for w in ["and", "so", "but", "except", "because", "only"]}
logic = n["so"] + n["but"] + n["except"] + n["because"] + n["only"]
print(f"  {len(lines)} lines, {len(said)} distinct words, connective ratio {logic / max(n['and'], 1):.2f} (and {n['and']}, logic {logic})")
for b in block: print("BLOCK   " + b)
for r in review: print("REVIEW  " + r)
if not block and not review: print("clean")
sys.exit(1 if block else 0)
