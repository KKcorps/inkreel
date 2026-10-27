#!/usr/bin/env python3
"""Did the film do what its intent card said? Run it on the finished MP4.

  python3 verify.py piece.mp4 [piece.intent.md]

Reads the Measured lines of the intent card (assets/intent.md is the template),
measures the film with lookcheck.py and soundcheck.py, and says for each line
whether the film matches. It also checks two defects no intent wants: a mix too
quiet or too loud, and clipping. Then it prints the watch-test questions, which
only you can answer.

A miss means the film or the card is wrong. Fix one, and say which. The bands
come from 29 films people loved (reference/gallery.md), and they overlap on
purpose. Exits 1 on any miss or defect.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent

# cuts a second, real time. calm films cut 0.14 to 0.23, the flipbook 2.0
PACE = {"calm": (0.0, 0.3), "steady": (0.25, 0.75), "brisk": (0.7, 1.7), "frantic": (1.5, 99)}
LOUD = (-28.0, -8.0)      # whole-file RMS dBFS. good mixes sat at -11 to -25, a film called too quiet at -33
CLIP = 0.1                # percent of samples at full scale


def measure(tool, mp4):
    out = subprocess.run([sys.executable, str(HERE / tool), str(mp4), "--json"], capture_output=True, text=True).stdout
    return json.loads(out.strip().splitlines()[-1]) if out.strip() else {}


def card_of(path):
    fields = {}
    for line in Path(path).read_text().splitlines():
        m = re.match(r"\s*(length|pace|sound|beat)\s*:\s*([\w.]+)", line)
        if m:
            fields[m.group(1)] = m.group(2).lower()
    return fields


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    mp4 = Path(sys.argv[1])
    card_path = Path(sys.argv[2]) if len(sys.argv) > 2 else mp4.with_name(mp4.stem + ".intent.md")
    card = card_of(card_path) if card_path.exists() else {}
    L, S = measure("lookcheck.py", mp4), measure("soundcheck.py", mp4)
    if "error" in L or not L:
        print(f"cannot measure the picture: {L.get('error', 'no output')}")
        return 1
    rows, miss = [], 0

    def row(ok, what, got, want):
        nonlocal miss
        miss += 0 if ok else 1
        rows.append(f"  {'ok  ' if ok else 'MISS'}  {what:9s} {got:22s} wanted {want}")

    if not card:
        print(f"no intent card at {card_path}. copy assets/intent.md and fill it in first.")
    if "length" in card:
        want = float(re.sub(r"[^\d.]", "", card["length"]) or 0)
        got = L["seconds"]
        row(abs(got - want) <= max(3.0, 0.15 * want), "length", f"{got:.1f}s", f"{want:.0f}s, within 15%")
    if "pace" in card and card["pace"] in PACE:
        lo, hi = PACE[card["pace"]]
        row(lo <= L["cuts"] <= hi, "pace", f"{L['cuts']:.2f} cuts/s", f"{card['pace']}, {lo} to {hi}")
    silent = S.get("silent", True)
    if "sound" in card:
        s = card["sound"]
        if s == "silent":
            row(silent, "sound", "silent" if silent else "has sound", "silent")
        elif silent:
            row(False, "sound", "silent", s)
        elif s == "follows":
            row(S.get("sync", 0) >= 60, "sound", f"sync {S.get('sync')}%", "follows: 60% of picture moments carry a sound")
        elif s == "leads":
            row(S.get("groove", 0) >= 60, "sound", f"groove {S.get('groove')}%", "leads: a steady track, groove 60% or more")
        elif s == "music":
            # a composed piece the picture moves with: a steady beat, more than drums,
            # and the big picture moments landing on sound. no number here can tell
            # a tune from beeps. the beeping ledger film had 26 distinct notes. the
            # tune sheet score.py prints, and his ear, are the real check
            ok = S.get("groove", 0) >= 60 and S.get("notes", 0) >= 8 and S.get("events", 0) >= 40
            row(ok, "sound", f"groove {S.get('groove')}% notes {S.get('notes')} events {S.get('events')}%",
                "music: groove 60%+, 8+ notes, 40%+ of big moments on a sound. read the tune sheet too")
        else:
            row(True, "sound", "has sound", s)
    if card.get("beat") == "locked":
        row(not silent and S.get("groove", 0) >= 75, "beat", f"groove {S.get('groove', 0)}%", "locked: 75% or more")
    if not silent and "loudness" in S:
        row(LOUD[0] <= S["loudness"] <= LOUD[1], "loudness", f"{S['loudness']:+.1f} dBFS", f"{LOUD[0]:.0f} to {LOUD[1]:.0f}")
        row(S.get("clip", 0) <= CLIP, "clipping", f"{S.get('clip', 0):.3f}%", f"{CLIP}% or less")

    print(f"{mp4.name} against {card_path.name if card else 'no card'}")
    print("\n".join(rows) if rows else "  nothing measurable declared")
    print(f"\n  look {L['look']}s  cuts {L['cuts']}/s  layout {L['layout']}  hues {L['hues']}  camera {L['camera']}"
          + ("" if silent else f"  sync {S.get('sync')}%  groove {S.get('groove')}%"))
    print("""
The watch test. Answer each in writing, in the delivery note.
  1. Retell it as a newcomer, in two sentences. Does that match the takeaway line?
  2. Name every tile of the contact sheet with a noun. Which tile is not a picture of anything?
  3. Watch it once with the sound off. Does it still read?
  4. Watch the film it learns from, then this. Where is this one weaker?
  5. Does the last frame end it, and does it answer the first?""")
    return 1 if miss or not card else 0


if __name__ == "__main__":
    sys.exit(main())
