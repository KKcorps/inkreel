#!/usr/bin/env python3
"""A lesson film's sound, from the approved Parcel 42 lesson. Copy it to <piece>.score.py and change
the block marked THIS PIECE: the chord per line, the motif, the guess, the recap and the in-world sounds.

  ~/.cache/lesson-film/venv/bin/python <piece>.score.py <piece>

The Parcel 42 lesson's sound. The voice is the clock. A soft chord bed changes with each line
and drops 16 dB under every spoken word. The tune plays in the gaps: a three-note motif that
asks at the start and in the guess, and answers on the end hit. Six small in-world sounds mark
the six state changes, at the same frames the picture changes. The picture and the sound fade
out together after the end hit. Writes <piece>.music.wav and <piece>.mix.wav"""
import json, math, sys
import numpy as np, soundfile as sf

SR, FPS = 48000, 24
PIECE = sys.argv[1] if len(sys.argv) > 1 else "piece"
C = json.load(open(f"{PIECE}.cues.json"))
BEAT, HIT, DUR, LAG = C["beat"], C["hit"], C["total"], C.get("heard_lag", 0)
N = int(DUR * SR) + SR
L, R = np.zeros(N), np.zeros(N)
midi = lambda n: 440.0 * 2 ** ((n - 69) / 12)
lines = {l["id"]: l for l in C["lines"]}
def w(lid, word, n=0):
    """when the picture shows a word's event: its heard frame, in seconds"""
    hit = [x for x in lines[lid]["words"] if x["w"] == word][n]
    return round((hit["s"] + LAG) * FPS) / FPS
SHEET = []
NOTE = {n: i for i, n in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])}
def m(name):                      # "F#4" -> midi
    return 12 * (int(name[-1]) + 1) + NOTE[name[:-1]]

def put(t, v, pan=0.0):
    a = int(t * SR); b = min(N, a + len(v))
    if b <= a or a < 0: return
    L[a:b] += v[: b - a] * (1 - max(0, pan)); R[a:b] += v[: b - a] * (1 + min(0, pan))
def wow(u, t0): return 1 + 0.0022 * np.sin(2 * np.pi * .37 * (t0 + u)) + 0.0011 * np.sin(2 * np.pi * 2.9 * (t0 + u))
def fm(t, note, dur, amp=1.0, ratio=1.0, index=1.8, decay=1.4, tine=0.0, pan=0.0, name="epiano"):
    ln = int(min(dur + decay, 5.0) * SR); u = np.arange(ln) / SR; f = midi(note)
    env = np.minimum(1, u / .004) * np.exp(-u / decay) * np.where(u > dur, np.exp(-(u - dur) / .25), 1)
    wv = wow(u, t); pc = np.cumsum(2 * np.pi * f * wv / SR); pm = np.cumsum(2 * np.pi * f * ratio * wv / SR)
    v = np.sin(pc + index * np.exp(-u / .35) * np.sin(pm))
    if tine: v += tine * np.sin(np.cumsum(2 * np.pi * f * 7.02 * wv / SR)) * np.exp(-u / .05)
    put(t, v * .3 * amp * env, pan); SHEET.append((t, name, note))
bell = lambda t, n, d, a=1.0, pan=0.0: fm(t, n, d, a, ratio=3.5, index=1.1, decay=1.6, pan=pan, name="bell")
epiano = lambda t, n, d, a=1.0, pan=0.0: fm(t, n, d, a, ratio=1.0, index=1.6, decay=1.2, tine=.25, pan=pan, name="epiano")
def marimba(t, note, dur, amp=1.0, pan=0.0):
    ln = int(min(max(dur, .35) + .4, 2.0) * SR); u = np.arange(ln) / SR; f = midi(note)
    v = np.sin(2 * np.pi * f * u) * np.exp(-u / .42) + .35 * np.sin(2 * np.pi * f * 3.93 * u) * np.exp(-u / .05)
    put(t, v * np.minimum(1, u / .002) * .36 * amp, pan); SHEET.append((t, "marimba", note))
def lowpass(v, hz):
    y = np.empty_like(v); lp = 0.0; k = 1 - math.exp(-2 * math.pi * hz / SR)
    for i in range(len(v)): lp += (v[i] - lp) * k; y[i] = lp
    return y
def pad(t0, t1, notes, amp=1.0):
    ln = int((t1 - t0) * SR)
    if ln <= 0: return
    u = np.arange(ln) / SR
    env = np.minimum(1, u / .3) * np.clip((t1 - t0 - u) / .35, 0, 1)
    v = sum(a * np.sin(np.cumsum(2 * np.pi * midi(n) * wow(u, t0) / SR)) for n, a in zip(notes, [.5, .3, .22, .14]))
    put(t0, lowpass(v, 900) * .07 * amp * env); SHEET.append((t0, "pad", notes[0]))
def bass(t, note, dur, amp=1.0):
    ln = int(dur * SR); u = np.arange(ln) / SR; f = midi(note) * wow(u, t)
    e = np.minimum(1, u / .012) * np.exp(-u / (dur * .55)); ph = np.cumsum(2 * np.pi * f / SR)
    put(t, (np.sin(ph) + .17 * np.sin(2 * ph)) * e * .22 * amp); SHEET.append((t, "bass", note))
def noise(ln, seed):
    return np.random.default_rng(seed).standard_normal(ln)
# ---- the six in-world sounds --------------------------------------------------------------
def thump(t, amp=1.0):            # a letter landing on the desk: soft low paper thud
    ln = int(.16 * SR); u = np.arange(ln) / SR
    v = np.sin(2 * np.pi * (90 + 60 * np.exp(-u / .02)) * u) * np.exp(-u / .045) + .25 * lowpass(noise(ln, 7), 1200) * np.exp(-u / .03)
    put(t, v * .5 * amp)
def clink(t, amp=1.0, hi=1.0):    # the brass scale settling: two bright partials
    ln = int(.6 * SR); u = np.arange(ln) / SR
    v = (np.sin(2 * np.pi * 880 * hi * u) + .4 * np.sin(2 * np.pi * 1318 * hi * u)) * np.minimum(1, u / .004) * np.exp(-u / .14)
    put(t, v * .05 * amp, .2)
def click(t, amp=1.0, down=True): # a toggle switch: a short knock and a spring
    ln = int(.05 * SR); u = np.arange(ln) / SR; f = 1500 if down else 2100
    f = f * .6
    v = np.sin(2 * np.pi * f * u) * np.minimum(1, u / .002) * np.exp(-u / .008) + .3 * lowpass(noise(ln, 3 + down), 1800) * np.exp(-u / .005)
    put(t, v * .14 * amp, -.2 if down else .2)
def chime(t, amp=1.0):            # the telescope finds the lit window
    bell(t, m("A4"), .4, .45 * amp, .1); bell(t + .09, m("D5"), .6, .38 * amp, .15)
def tick(t, amp=1.0, hi=True):
    ln = int(.05 * SR); u = np.arange(ln) / SR; f = 1900 if hi else 1400
    f = f * .6
    v = np.sin(2 * np.pi * f * u) * np.minimum(1, u / .002) * np.exp(-u / .01) + .2 * np.sin(2 * np.pi * f * 2.7 * u) * np.exp(-u / .004)
    put(t, v * .12 * amp, .25 if hi else -.25)

# ============================== THIS PIECE ==============================
# A default that runs for any lesson. Change it for yours: the example's full version, with the
# snail's phrase and the recap's three bells, is examples/parcel42-lesson/lesson60.score.py.
D, Bm, G, A, Em = ["D3", "F#4", "A4", "D5"], ["B2", "D4", "F#4", "B4"], ["G2", "D4", "G4", "B4"], ["A2", "E4", "A4", "C#5"], ["E3", "E4", "G4", "B4"]
ids = [l["id"] for l in C["lines"]]
# the bed: one chord per line. by default the lines walk I vi IV V, and the last line sits on the V so the end lands home
CHORD = {lid: [D, Bm, G, A][i % 4] for i, lid in enumerate(ids)}
CHORD[ids[-1]] = A
# the in-world sounds, one per state change, on the words the picture changes on: (line, word, kind)
# kinds: thump (something lands), clink (a scale or a lock settles), click_down, click_up (a switch), chime (found it)
ACCENTS = []
MOTIF = [m("A4"), m("D5"), m("F#5")]
for i, lid in enumerate(ids):
    t0 = lines[lid]["start"] - .12
    t1 = (lines[ids[i + 1]]["start"] - .12) if i + 1 < len(ids) else HIT + .02
    pad(t0, t1 + .05, [m(n) for n in CHORD[lid]], 1.0)
bell(0.0, MOTIF[0], .25, .9, -.1); bell(BEAT / 2, MOTIF[1], .35, .9, .1)        # the pickup asks
for i, lid in enumerate(ids[:-1]):
    nxt = lines[ids[i + 1]]["start"]; gap = nxt - lines[lid]["end"]; end = lines[lid]["end"]
    if lines[lid]["text"].rstrip().endswith("?") and gap >= 2.0:
        # a guess: the chord moves to the V, the marimba climbs and stops short of home, a clock ticks.
        # the ticks start on the page's frame for the pause (line end, heard, plus two frames)
        pad(end, nxt + .15, [m(n) for n in A], 1.3)
        for k, n in enumerate([m("F#4"), m("A4"), m("B4"), m("C#5")]): marimba(end + .15 + k * BEAT / 2, n, .3, .8, -.15 + .1 * k)
        tt, k = (round((end + LAG) * FPS) + 2) / FPS, 0
        while tt < nxt - .15: tick(tt, .8, k % 2 == 0); tt += BEAT / 2; k += 1
    elif lines[lid]["text"].rstrip().endswith("?"):
        marimba(end + .08, m("F#4"), .3, .35, .1); marimba(end + .38, m("E4"), .4, .3, .1)   # the question hangs, low and soft
    # no fills in other breaths: a bright fill in every gap was "too painful". the bed rises back up by itself
# the end: a run falling down the V, the I struck once and left to ring, then the outro: the chord held
# and the motif said once more, slowly, falling home, while the picture and the sound fade
for i, n in enumerate(["A5", "F#5", "E5"]): epiano(HIT - (3 - i) * BEAT / 4, m(n), .12, .5, .15)
for n in ["D4", "F#4", "A4", "D5"]: epiano(HIT, m(n), 2.6, .55)
bell(HIT, m("D5"), 2.6, 1.0); bass(HIT, m("D2"), 3.2, 1.2)
pad(HIT + .1, DUR, [m(n) for n in D], 1.1)
for i, n in enumerate(["F#5", "D5", "A4", "D5"]):
    if HIT + 1.2 + i * BEAT * 1.5 < DUR - .5: bell(HIT + 1.2 + i * BEAT * 1.5, m(n), .8 if i < 3 else 2.4, .55 if i < 3 else .7, -.1 + .07 * i)
KIND = {"thump": thump, "clink": clink, "chime": chime, "click_down": lambda t: click(t, down=True), "click_up": lambda t: click(t, down=False)}
for lid, word_, kind in ACCENTS: KIND[kind](w(lid, word_))
# ============================ END THIS PIECE ============================

music = np.stack([L, R], 1)[: int(DUR * SR)]
# the duck: 16 dB down wherever a word is spoken, 60 ms ahead of it, 180 ms after
mask = np.zeros(len(music))
for l in C["lines"]:
    for x in l["words"]:
        a_, z = int((x["s"] - .06) * SR), int((x["e"] + .18) * SR); mask[max(0, a_):z] = 1
kk = 1 - math.exp(-1 / (SR * .03)); mm, env = 0.0, np.zeros_like(mask)
for i in range(len(mask)): mm += (mask[i] - mm) * kk; env[i] = mm
music *= (1 - (1 - 10 ** (-16 / 20)) * env)[:, None]
voice, vsr = sf.read(f"{PIECE}.voice.wav"); assert vsr == SR
voice = np.pad(voice[: len(music)], (0, max(0, len(music) - len(voice))))
voice *= .5 / (np.abs(voice).max() + 1e-9)
# the ceiling: no note and no in-world sound may peak within 10 dB of the voice's own peak. in v2 the fills,
# the clinks and the clicks peaked above the voice, and after mastering they were "too painful"
CEIL = .5 * 10 ** (-10 / 20)
# the peak over each 5 ms block and its neighbours, so the gain is down before a hit and never lets go at a
# zero crossing. the gain falls at once and rises back over about 120 ms
B = 240; n = len(music); nb = (n + B - 1) // B
blk = np.zeros((nb * B, 2)); blk[:n] = music
penv = np.abs(blk).max(1).reshape(nb, B).max(1)
penv = np.maximum(penv, np.maximum(np.r_[penv[1:], 0], np.r_[0, penv[:-1]]))
g = np.minimum(1, CEIL / (penv + 1e-9)); rel = math.exp(-B / (SR * .12)); gb, cur = np.empty_like(g), 1.0
for k in range(nb): cur = g[k] if g[k] < cur else cur * rel + g[k] * (1 - rel); gb[k] = cur
centres = (np.arange(nb) + .5) * B
gs = np.minimum(np.interp(np.arange(n), centres, gb), np.repeat(gb, B)[:n])
music *= gs[:, None]
mix = music * .9 + voice[:, None]
# the fade: from the same frame the picture starts to fade, down to silence at the last frame
FADE_AFTER = 96                   # frames after the end hit. must match FADE0 in core.js
f0, f1 = min(round(HIT * FPS) + FADE_AFTER, round(DUR * FPS) - 36) / FPS, DUR   # as FADE0 in core.js, short tails included
t = np.arange(len(mix)) / SR
fade = np.clip(1 - (t - f0) / (f1 - f0), 0, 1) ** 1.6
mix *= fade[:, None]
mix *= .89 / np.abs(mix).max()
sf.write(f"{PIECE}.music.wav", (music * fade[:, None]).astype(np.float32), SR)
sf.write(f"{PIECE}.mix.wav", mix.astype(np.float32), SR)
print(f"{len(SHEET)} notes; key D; bed I vi IV V per line; motif A D F#; end hit {HIT:.2f}s; fade {f0:.2f}s to {f1:.2f}s")
rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
print(f"music under speech {rms(music[env > .5]):.1f} dBFS, in the gaps {rms(music[env <= .5]):.1f} dBFS")
