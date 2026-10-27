#!/usr/bin/env python3
"""Gate for a riso animation page. Run it after every change.

  python3 check.py path/to/piece.html [chain.txt] [score.wav]

BLOCK findings must be zero before showing anything to the user.
Exits 1 while any BLOCK stands.
"""
import math
import re
import struct
import subprocess
import sys
import tempfile
from pathlib import Path

def _find_chrome():
    """$CHROME if set, else the usual macOS and Linux locations"""
    import os, shutil
    if os.environ.get("CHROME"):
        return os.environ["CHROME"]
    for p in ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
              "/Applications/Chromium.app/Contents/MacOS/Chromium"]:
        if os.path.exists(p):
            return p
    for name in ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]:
        if shutil.which(name):
            return shutil.which(name)
    return "google-chrome"


CHROME = _find_chrome()
block, review = [], []


def run(cmd, timeout=300):
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)


def _bands(path):
    """Average octave band energies across the file, in dB below the loudest band."""
    import cmath
    raw = subprocess.run(["ffmpeg", "-i", path, "-f", "s16le", "-ac", "1", "-ar", "48000", "-"],
                         capture_output=True).stdout
    if len(raw) < 4096:
        return None
    x = struct.unpack("<%dh" % (len(raw) // 2), raw)
    n = 4096

    def fft(a):
        N = len(a)
        if N == 1:
            return a
        e = fft(a[0::2])
        o = fft(a[1::2])
        t = [cmath.exp(-2j * math.pi * k / N) * o[k] for k in range(N // 2)]
        return [e[k] + t[k] for k in range(N // 2)] + [e[k] - t[k] for k in range(N // 2)]

    acc = [0.0] * (n // 2)
    hops = 0
    for off in range(0, len(x) - n, n * 4):
        X = fft([complex(v, 0) for v in x[off:off + n]])
        for k in range(n // 2):
            acc[k] += abs(X[k]) ** 2
        hops += 1
    if not hops:
        return None
    out = {}
    for lo, hi in [(60, 250), (250, 1000), (1000, 2000), (2000, 4000), (4000, 8000), (8000, 16000)]:
        i0, i1 = int(lo * n / 48000), int(hi * n / 48000)
        out[(lo, hi)] = math.sqrt(sum(acc[i0:i1]) / max(1, (i1 - i0) * hops))
    ref = max(out.values())
    return {k: 20 * math.log10(max(v / ref, 1e-9)) for k, v in out.items()}


def title_of(url):
    r = run([CHROME, "--headless=new", "--disable-gpu",
             "--virtual-time-budget=240000", "--dump-dom", url])
    m = re.search(r"<title>([^<]*)</title>", r.stdout)
    return m.group(1) if m else ""


def main():
    if len(sys.argv) < 2:
        print("usage: check.py piece.html [chain.txt]")
        return 2
    path = Path(sys.argv[1]).resolve()
    src = path.read_text()
    # plate() calls read from code only. a commented-out act is not an act
    code = "\n".join(l for l in src.splitlines() if not l.lstrip().startswith("//"))

    # 1. an unclosed script tag makes the page silently do nothing
    if "</script>" not in src:
        block.append("no </script> tag, so the page may never run")

    # 2. real syntax check, because the browser will not tell you
    if "<script>" in src and "</script>" in src:
        js = src[src.index("<script>") + 8:src.rindex("</script>")]
        with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False) as f:
            f.write(js)
            tmp = f.name
        r = run(["node", "--check", tmp])
        if r.returncode != 0:
            block.append("javascript does not parse\n    " + r.stderr.strip().splitlines()[-1])

    # 3. the handler that turns a silent failure into a readable one
    if "addEventListener('error'" not in src:
        block.append("no window error handler, so a runtime throw looks like a blank page")

    # 4. the modes the workflow depends on. A STILL has no acts, so it has
    #    nothing to play, capture or bench, and asking it for them is noise.
    # a film need not use the engine. the page contract is only: window.__frames
    # and window.__render(f) in ?capture=1, const FPS, and an error handler.
    engine = bool(re.search(r"plate\(\s*['\"]\w+['\"]", code))
    own_film = not engine and "__frames" in code and "__render" in code
    still = not engine and not own_film
    if still:
        print("  modes  still, not a timeline: play/bench/capture not required")
    elif own_film:
        print("  modes  a film without the engine: only the capture contract is checked")
        if not re.search(r"const FPS\s*=\s*\d+", code):
            block.append("no const FPS in the page, so the build cannot know the frame rate")
    else:
        for mode, why in [("grid", "contact sheet QA"), ("bench", "frame cost"),
                          ("capture", "GIF export"), ("play", "playback")]:
            if f"'{mode}'" not in src and f'"{mode}"' not in src:
                block.append(f"no {mode} mode, needed for {why}")

    # 5. acts are whole beats and the loop is whole bars, so cuts land on the
    #    kit and the score's grid is the page's grid. BEAT frames a beat, at the page's FPS.
    bm = re.search(r"const BEAT\s*=\s*(\d+)", src)
    BEAT = int(bm.group(1)) if bm else 16
    BAR = 4 * BEAT
    if BEAT % 4:
        block.append(f"BEAT is {BEAT} frames, not a multiple of 4, so a sixteenth is not whole frames.")
    total, names = 0, []
    for m in re.finditer(r"plate\(\s*['\"](\w+)['\"]\s*,\s*(beats\((\d+)\)|(\d+))", code):
        n = int(m.group(3)) * BEAT if m.group(3) else int(m.group(4))
        total += n
        if m.group(1) in names:
            block.append(f"two acts are named {m.group(1)!r}. score.py keys acts by name, so the second one gets no cut.")
        names.append(m.group(1))
        if n % BEAT:
            block.append(f"act {m.group(1)!r} is {n} frames, not whole beats of {BEAT}. "
                         "Its cut lands off the kit. Use beats(n). See reference/sound.md.")
    if total and total % BAR:
        block.append(f"the loop is {total} frames, not whole bars of {BAR}, so it cannot seam on the beat.")
    elif total:
        fm = re.search(r"const FPS\s*=\s*(\d+)", src)
        fps = int(fm.group(1)) if fm else 24
        print(f"  grid   {total} frames, {total // BEAT} beats, {total // BAR} bars, {60 * fps / BEAT:.1f} BPM at {fps} fps, {total / fps:.1f}s")

    # 6. text sized by eye overflows the sheet. size by measured width.
    for m in re.finditer(r"hand\(S,\s*(['\"])(.*?)\1[^)]*?size:", src, re.S):
        review.append(f"hand() sized with size: not fit: -> {m.group(2)[:40]!r}")

    # 7. does it actually render, and how fast
    url = path.as_uri()
    if own_film:
        t = title_of(url + "?capture=1&w=300")
        if "ready" not in t:
            block.append(f"capture mode did not finish. title was {t!r}. set it to 'capture ready N' once window.__frames is set")
        else:
            print(f"  render {t}")
        still = True     # nothing else to check. fall through to the verdict
    elif still:
        t = title_of(url)
        if "ready" not in t:
            block.append(f"the page did not finish. title was {t!r}")
        else:
            print(f"  render {t}")
    if still:
        print()
        for b in block:
            print("BLOCK   " + b)
        for r in review:
            print("REVIEW  " + r)
        if not block and not review:
            print("clean")
        return 1 if block else 0
    t = title_of(url + "?grid=1")
    if "ready" not in t:
        block.append(f"grid mode did not finish. title was {t!r}")
    else:
        print(f"  grid   {t}")
        # score.py and build.sh read the acts with the same regex as step 5. if the
        # page renders a different length, they are working from the wrong act list
        m = re.search(r"of (\d+) ready", t)
        if m and total and int(m.group(1)) != total:
            block.append(f"the page renders {m.group(1)} frames but its plate() calls read as {total}. "
                         "write every act as plate('name', beats(n), ...) with a literal n.")
    t = title_of(url + "?bench=12&w=900")
    if "ready" not in t:
        block.append(f"bench mode did not finish. title was {t!r}")
    else:
        print(f"  bench  {t}")
        ms = re.search(r"(\d+)ms", t)
        if ms and int(ms.group(1)) > 200:
            review.append(f"{ms.group(1)}ms a frame at 900px is under 5fps. batch your mark/cut calls.")

    # 8. the caption chain, if one was handed over
    if len(sys.argv) > 2 and not sys.argv[2].endswith((".txt", ".md")):
        block.append(f"{sys.argv[2]} is not a caption chain. pass the chain as a .txt file.")
    elif len(sys.argv) > 2:
        text = Path(sys.argv[2]).read_text().lower()
        n = {w: len(re.findall(r"\b" + w + r"\b", text))
             for w in ["and", "so", "but", "except", "because", "only"]}
        logic = n["so"] + n["but"] + n["except"] + n["because"] + n["only"]
        ratio = logic / max(n["and"], 1)
        print(f"  chain  and {n['and']}, logic {logic}, ratio {ratio:.2f}")
        if ratio < 1.0:
            review.append(f"caption chain ratio {ratio:.2f}. Mostly joined by 'and', so it may read as a "
                          "list, not an argument. See reference/story.md.")

    # 9. the score, if one was handed over. mean and peak cannot see hiss,
    #    so measure the octave rolloff over the whole file instead.
    wav = next((a for a in sys.argv[2:] if a.endswith(".wav")), None)
    if wav:
        b = _bands(wav)
        if b:
            roll = b[(250, 1000)] - b[(4000, 8000)]
            top = b[(60, 250)] - b[(8000, 16000)]
            print(f"  score  rolloff {roll:.1f} dB, top {top:.1f} dB down")
            # calibrated against a real failure on this build: a score with the
            # ceiling removed measured 15.4 and audibly hissed. A good one is 20.6.
            if roll < 18.0:
                block.append(f"score rolloff only {roll:.1f} dB from 250-1k to 4-8k. "
                             "That is hiss. Four poles on the bed and a ceiling "
                             "over the mix. See reference/sound.md.")
            # calibrated on the fly reference, which measures 47 and is the
            # target. the first build measured 52 because it had no top end.
            if top < 40.0:
                review.append(f"score has {top:.1f} dB between the low band and 8-16k. "
                              "Check the ceiling is on.")

    print()
    for b in block:
        print("BLOCK   " + b)
    for r in review:
        print("REVIEW  " + r)
    if not block and not review:
        print("clean")
    return 1 if block else 0


if __name__ == "__main__":
    sys.exit(main())
