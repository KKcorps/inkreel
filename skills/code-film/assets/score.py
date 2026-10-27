#!/usr/bin/env python3
"""Generate the soundtrack from the same act timeline the picture uses.

Nothing here is a sample. Every value is computed, the way every pixel is.

The page and the score share one grid. Every act is a whole number of beats,
16 frames at the page's frame rate, and the loop is whole bars, so every cut lands
on a kick. Inside an act the page puts its events on sixteenths and eighths,
and the score puts its hits on the same frames by construction.

Two layers still. The music layer, kit and chords and bass, runs on one tempo
for the whole loop and thins where the picture is still. The picture layer,
accents and hits and the swell, marks what the frame does. Nothing in the
picture layer is a kick or a chord, so nothing can break the beat.

  python3 score.py piece.html out.wav [motion.txt]    acts read from the page's plate() calls
  python3 score.py out.wav [motion.txt]               acts from the ACTS list below

motion.txt is one number per frame, how much the picture changed, measured from
the captured frames (see export.md, or let build.sh do it). It sets each act's
energy and puts a tick on every motion peak nobody scored. If your page is not
on the grid yet, `run_over`, `knocks` and `span` place hits where the picture
actually moves.

Two parts. Everything above "the moments" is the engine and works for any act
list. "The moments" is this piece's, written from its act sheet. Copy this file
to piece.score.py next to piece.html and rewrite that section for yours.
build.sh picks up the sibling when it exists. Until you rewrite it, an act name
that does not exist is skipped and you still get a track that lands on every
cut.
"""
import math
import re
import struct
import sys
import wave

SR = 48000
FPS = 24

_args = sys.argv[1:]
PAGE = _args.pop(0) if _args and _args[0].endswith((".html", ".htm")) else None
OUT = _args.pop(0) if _args else "score.wav"
if not OUT.endswith(".wav"):
    sys.exit(f"the output must be a .wav, not {OUT}")
MOTION_PATH = _args.pop(0) if _args else None

# the act list. read from the page when one is given, so there is one source.
# beats(n) there is n * BEAT frames here, with BEAT taken from the page too.
ACTS = [("title", 32), ("empty", 32), ("arrive", 32), ("collide", 64), ("loop", 32),
        ("accumulate", 64), ("read", 64), ("snapshot", 64), ("crash", 32),
        ("restore", 32), ("delete", 32), ("expire", 32), ("compact", 64),
        ("ghost", 64), ("close", 64)]
_beat_frames = 16
if PAGE:
    _src = "\n".join(l for l in open(PAGE).read().splitlines() if not l.lstrip().startswith("//"))
    _m = re.search(r"const BEAT\s*=\s*(\d+)", _src)
    _beat_frames = int(_m.group(1)) if _m else 16
    _m = re.search(r"const FPS\s*=\s*(\d+)", _src)
    FPS = int(_m.group(1)) if _m else FPS                 # the page's export frame rate sets the pace
    ACTS = [(n, int(b) * _beat_frames if b else int(fr))
            for n, b, fr in re.findall(r"plate\(\s*['\"](\w+)['\"]\s*,\s*(?:beats\((\d+)\)|(\d+))", _src)]
    if not ACTS:
        sys.exit(f"no plate() calls found in {PAGE}")

# where everything stops and where the kick comes back, both on bar lines.
# (act that starts the silence, act whose first frame brings the kit back).
# None for a piece with no drop. For example ("crash", "delete").
SILENCE = None

# how much the picture moves in each act. 0 is a hard rest, 1 is a moving act,
# above 1 is the climax. The kit, the pad and the hits follow it. With motion.txt
# the numbers come from the picture. Put an act here only to override that for a
# story reason, like the crash being silent.
ENERGY = {}
if SILENCE:
    ENERGY.setdefault(SILENCE[0], 0.0)       # the drop is silent
BEAT_TARGET = 0.6          # seconds. only used if no tempo fits the frame rate

# the sound of this piece. every piece so far took the first option of each
# and they all sounded alike. pick these at the act sheet, from the story.
KEY = 0                    # semitones up from C. -5 to +6 keeps the bass in range
HARMONY = "lofi"           # a name in PROGS below, or your own list in the same shape
SWING = 0.16               # 0 is straight eighths. 0.16 is the lofi lean
KIT = "backbeat"           # "backbeat", "halftime" (slower, heavier) or "four" (driving)
END_RUN = "down"           # the outro bar's run. "down" settles, "up" lifts, None for none
END_KIT = True             # kick and open hat on the final hit. False lands on the chord alone

# the tune. this is what makes it music and not sound effects, so write it
# first. notes are scale degrees of KEY: 0 is the tonic, 2 the third, 4 the
# fifth, 7 the octave, -3 the sixth below. a note is (degree, beats), or
# (degree, beats, sharp) where sharp is +1 or -1 semitone. a degree of None is
# a rest. SECTIONS places phrases over acts: (act, beat, phrase, voice, octave, amp).
# voices: "string" (plucked, Karplus-Strong), "bell" and "epiano" (FM),
# "marimba", "keys". read the tune sheet this file prints, because you cannot hear it.
SCALE = "major"            # "major", "minor" or "dorian". the tune's notes, not the chords
# the demo worlds' tune, as the worked example. replace it for your piece.
# a two bar motif someone could hum (G E G A G E D C), its answer that climbs
# (G E G C B A G), a busier middle on the marimba, and a tail that leaves the
# tonic for the final hit, which the cadence plays.
TUNE = {
    "a":    [(4, 1), (2, .5), (4, .5), (5, 1), (4, 1), (2, 1), (1, 1), (0, 2)],
    "a2":   [(4, 1), (2, .5), (4, .5), (7, 1), (6, 1), (5, 1), (4, 2), (None, 1)],
    "b":    [(7, .5), (6, .5), (5, .5), (4, .5), (5, .5), (4, .5), (2, 1), (4, .5), (5, .5), (7, 1), (5, 1), (4, 1)],
    "tail": [(4, 1), (2, 1), (1, 2)],
}
SECTIONS = [("title", 0, "a", "string", 0, .8), ("night", 2, "a2", "epiano", 0, .75),
            ("plan", 0, "b", "marimba", 0, .65), ("close", 0, "tail", "bell", 0, .7)]
KIT_LEVEL = {"title": 0}   # {act: 0 to 1}. 0 takes the kit out of an act and gives the tune room
COMP = 0.7                 # the chords the keys comp under the tune. lower it when the tune is busy
# sound design on top of the music. left on, all three made the first pieces
# sound like a beep on every motion. turn one on only for a reason.
ACT_TICKS = False          # a bright tick on the first frame of every act
MOTION_TICKS = False       # a tick on every motion peak nobody scored
SWELL = False              # a tremolo whose level is the frame's motion

TOTAL = sum(f for _, f in ACTS)
DUR = TOTAL / FPS
N = int(SR * DUR)
T = lambda fr: fr / FPS

fstart, _n = {}, 0
for _name, _fr in ACTS:
    fstart[_name] = _n
    _n += _fr

# one number per frame boundary, how much the picture changed. index k is the
# change from frame k to k+1, so it sits at time (k+1)/FPS.
MOTION = []
if MOTION_PATH:
    MOTION = [float(m) for m in re.findall(r"YAVG=([\d.]+)", open(MOTION_PATH).read())]
if MOTION:
    _means = {}
    for _name, _fr in ACTS:
        _a, _b = fstart[_name] + 1, fstart[_name] + _fr - 1     # skip the cut itself
        _seg = MOTION[_a:_b] or [0.0]
        _means[_name] = sum(_seg) / len(_seg)
    _ref = max(_means.values()) or 1.0
    for _name, _m in _means.items():
        ENERGY.setdefault(_name, round(min(1.2, 0.3 + 0.9 * math.sqrt(_m / _ref)), 2))

# one tempo for the whole loop. a whole number of bars, so it seams. Prefer a
# tempo between 80 and 100 BPM whose sixteenth note is a whole number of
# frames, because then the picture's own cadences ride the grid instead of
# flamming against the hats. A page built with beats(n) of 16 frames lands
# here at 67.5 BPM at 18 fps, 90 at 24. Fall back to the tempo whose beats sit closest to
# the cuts.
_starts = [T(fstart[n]) for n, _ in ACTS[1:]]


def _bpm(bars):
    return 60 / (DUR / bars / 4)


def _sixteenth_frames(bars):
    return FPS * DUR / (16 * bars)


def _cut_fit(bars):
    beat = DUR / bars / 4
    return sum(min(abs(t - k * beat) for k in range(4 * bars + 1)) for t in _starts) / max(1, len(_starts))


_whole = [b for b in range(2, 80) if 80 <= _bpm(b) <= 100
          and abs(_sixteenth_frames(b) - round(_sixteenth_frames(b))) < 0.1]
_cands = _whole or [b for b in range(2, 80) if 76 <= _bpm(b) <= 124] or [max(2, round(DUR / (4 * BEAT_TARGET)))]
BARS = min(_cands, key=_cut_fit)
if TOTAL % (4 * _beat_frames) == 0:
    BARS = TOTAL // (4 * _beat_frames)                    # a page built on the grid IS the grid, whatever the BPM comes out as
BAR = DUR / BARS
BEAT = BAR / 4
BPM = 60 / BEAT
S16 = BEAT / 4
UNIT = max(1, round(_sixteenth_frames(BARS)))   # frames per sixteenth. the page's grid unit


def beat_in(name, b):
    """Time of beat b inside an act. Fractions are eighths and sixteenths.
    An act this piece does not have returns a time before the piece, and every
    synth ignores that, so a copied moments section fails quietly."""
    if name not in fstart:
        return -10.0
    return T(fstart[name]) + b * BEAT


def on_grid(t):
    """Snap to the sixteenth only when it costs at most one frame. Sync first, pocket second."""
    g = round(t / S16) * S16
    return g if abs(g - t) <= 1.0 / FPS else t


# ---- where the picture moves inside an act, for a page that is not on the grid
# An act spends its first beat writing its caption. The mechanism moves later.
# If the page was not built on the grid, use these instead of beat_in, so the
# runs start where the rows land and not where the act starts.
ACT_FRAMES = dict(ACTS)
P50 = sorted(MOTION)[len(MOTION) // 2] if MOTION else 0.0


def _act_vals(name):
    return MOTION[fstart[name] + 1: fstart[name] + ACT_FRAMES[name] - 1]   # skip both cuts


def span(name):
    """(first, last) frame offsets where the act's mechanism moves. None when the picture is flat."""
    v = _act_vals(name)
    if not v or max(v) < 2 * P50:
        return None
    thr = max(0.35 * max(v), P50)
    idx = [i + 1 for i, x in enumerate(v) if x >= thr]
    return idx[0], idx[-1]


def knocks(name, spacing=None):
    """Frame offsets of isolated spikes in the act. The picture's own discrete events."""
    spacing = spacing or UNIT                      # a sixteenth of the page's grid
    v = _act_vals(name)
    out = []
    for i in range(2, len(v) - 2):
        around = (v[i - 2] + v[i - 1] + v[i + 1] + v[i + 2]) / 4
        if v[i] >= v[i - 1] and v[i] > v[i + 1] and v[i] >= 2 * P50 and v[i] >= 3 * around:
            if out and i + 1 - out[-1] < spacing:
                continue
            out.append(i + 1)
    return out


def run_over(name, step=UNIT, fallback=(0, None)):
    """Times for a run across the act's moving span, or across the fallback
    offsets when the picture is flat there. First hit on its frame, snapped to
    the sixteenth if that costs at most one frame, then every step frames."""
    s = span(name)
    if s is None:
        first = fallback[0]
        last = ACT_FRAMES[name] - 2 if fallback[1] is None else fallback[1]
    else:
        first, last = s
    t0 = on_grid(T(fstart[name] + first))
    n = max(1, int((last - first) // step) + 1)
    return [t0 + k * step / FPS for k in range(n)]


if SILENCE and SILENCE[0] in fstart and SILENCE[1] in fstart:
    CRASH_IN = T(fstart[SILENCE[0]])       # everything stops, on the bar line
    CRASH_OUT = T(fstart[SILENCE[1]])      # and the kick comes back on the next bar line
else:
    CRASH_IN = CRASH_OUT = -1.0


def playing(t):
    return not (CRASH_IN <= t < CRASH_OUT)


def act_at(t):
    f = t * FPS
    n = 0
    for name, fr in ACTS:
        if f < n + fr:
            return name, (f - n) / fr
        n += fr
    return ACTS[-1][0], 1.0


def energy(name):
    return ENERGY.get(name, 1.0)


def energy_at(t):
    return energy(act_at(t)[0])


def hit_gain(t):
    """Hits follow the act's energy a little. A busy scene hits harder, a quiet one softer."""
    return 0.55 + 0.45 * energy_at(t)


def rng(seed):
    a = seed & 0xFFFFFFFF

    def nxt():
        nonlocal a
        a = (a * 1664525 + 1013904223) & 0xFFFFFFFF
        return a / 0xFFFFFFFF
    return nxt


midi = lambda n: 440.0 * (2 ** ((n - 69) / 12.0))

# progressions in C, voiced as ninths. root, then the upper structure. one
# chord per bar, cycling. the harmony moves on the grid, never on a cut.
# PROG[0] is home and the final hit lands on it. PROG[-1] leads home and the
# outro bar plays it, so the last chord picks the ending: a V is the full
# cadence, a IV the softer amen, a bVII a bright lift.
PROGS = {
    "lofi":   [(36, [52, 55, 59, 62]), (33, [48, 52, 55, 59]), (29, [45, 48, 52, 55]), (31, [47, 50, 53, 57])],   # Cmaj9 Am9 Fmaj9 G9. I vi IV V
    "minor":  [(33, [48, 52, 55, 59]), (29, [45, 48, 52, 55]), (38, [48, 52, 53, 57]), (28, [50, 56, 59, 62])],   # Am9 Fmaj9 Dm9 E7. i VI iv V, darker
    "plagal": [(36, [52, 55, 59, 62]), (28, [50, 55, 59, 62]), (33, [48, 52, 55, 59]), (29, [45, 48, 52, 55])],   # Cmaj9 Em7 Am9 Fmaj9. ends IV to I, softer
    "dorian": [(38, [48, 52, 53, 57]), (31, [47, 52, 53, 57])],                                                   # Dm9 G13. two chords, floating
    "lift":   [(36, [52, 55, 59, 62]), (29, [45, 48, 52, 55]), (33, [48, 52, 55, 59]), (34, [50, 53, 57, 62])],   # Cmaj9 Fmaj9 Am9 Bbmaj7. ends bVII to I
}
PROG = [(r + KEY, [n + KEY for n in up]) for r, up in (PROGS[HARMONY] if isinstance(HARMONY, str) else HARMONY)]


# The ending. By default the last act. The bar before it is PROG[-1], every
# bar inside it is PROG[0], the kit plays one final hit on its first frame
# and stops, the pad holds and fades. A loop that seams is not an ending, and a
# piece that stopped on the V with the kit still going read as cut off midway.
# ENDING = None makes a seamless loop instead.
ENDING = ACTS[-1][0]
END_T = T(fstart[ENDING]) if ENDING in fstart else None
# an ending of two bars or more gets an outro: its first bar is PROG[-1] with
# the full kit and a run on the chord (END_RUN), and the final hit lands on the
# second bar's first beat. a one bar ending hits on its first frame. a hit, a
# fade and a lone pluck after it read as bolted onto the theme, not the theme ending.
END_HIT = (END_T + BAR) if (END_T is not None and DUR - END_T >= 2 * BAR - 1e-6) else END_T
_bars_before = int(END_HIT / BAR + 0.5) if END_HIT is not None else BARS
PROG_ROT = (len(PROG) - 1 - (_bars_before - 1)) % len(PROG) if END_HIT is not None else 0


def ending(t):
    """Resolved. The final hit has landed and the kit has stopped."""
    return END_HIT is not None and t >= END_HIT - 1e-9


def outro(t):
    """The bar before the final hit, inside the ending act. The kit plays it full."""
    return END_T is not None and END_HIT is not None and END_T - 1e-9 <= t < END_HIT - 1e-9


def chord_at(t):
    if ending(t):
        return PROG[0]
    return PROG[(int(t / BAR) + PROG_ROT) % len(PROG)]


left = [0.0] * N
right = [0.0] * N
HITS = []       # times of designed hits, so motion ticks do not double them
KICKS = []      # times of kicks, for the duck


def add(i, l, r):
    if 0 <= i < N:
        left[i] += l
        right[i] += r


# wow and flutter. a slow drift in playback speed is the tape sound.
def wow(t):
    return 1.0 + 0.0022 * math.sin(2 * math.pi * 0.37 * t) + 0.0011 * math.sin(2 * math.pi * 2.9 * t)


# ---- the kit --------------------------------------------------------
def kick(t, amp=1.0):
    KICKS.append(t)
    click(t, amp * 0.6, seed=7)                        # the beater
    a = int(t * SR)
    ln = int(0.26 * SR)
    ph = 0.0
    for j in range(ln):
        e = math.exp(-j / (ln * 0.20))
        f = 58 + 90 * math.exp(-j / (SR * 0.014))      # a short pitch drop
        ph += 2 * math.pi * f / SR
        v = math.sin(ph) * e * 0.50 * amp
        add(a + j, v, v)


def snare(t, amp=1.0, seed=1):
    a = int(t * SR)
    ln = int(0.17 * SR)
    nr = rng(seed * 7919 + int(t * 1000))
    lp = [0.0, 0.0]
    ph = 0.0
    for j in range(ln):
        e = math.exp(-j / (ln * 0.22))
        v = nr() * 2 - 1
        for k in range(2):
            lp[k] += (v - lp[k]) * 0.42                # dull, not crisp
            v = lp[k]
        ph += 2 * math.pi * 187.0 / SR
        s = (v * 1.9 + math.sin(ph) * 0.5) * e * 0.30 * amp
        add(a + j, s * 0.95, s)


def hat(t, amp=1.0, seed=1, open_=False):
    if t < 0:
        return
    a = int(t * SR)
    ln = int((0.16 if open_ else 0.035) * SR)
    nr = rng(seed * 104729 + int(t * 1000))
    hp = 0.0
    for j in range(ln):
        e = math.exp(-j / (ln * 0.30))
        n = nr() * 2 - 1
        hp += (n - hp) * 0.55
        s = (n - hp) * e * 0.17 * amp
        add(a + j, s * 0.8, s)


def bass(t, note, dur, amp=1.0):
    a = int(t * SR)
    ln = int(dur * SR)
    ph = ph2 = 0.0
    base = midi(note)
    for j in range(ln):
        tt = t + j / SR
        e = min(1.0, j / (SR * 0.012)) * math.exp(-j / (ln * 0.55))
        f = base * wow(tt)
        ph += 2 * math.pi * f / SR
        ph2 += 2 * math.pi * f * 2 / SR
        v = (math.sin(ph) + 0.17 * math.sin(ph2)) * e * 0.22 * amp
        add(a + j, v, v)


def keys(t, notes, dur, amp=1.0, spread=0.55):
    click(t, amp * 0.3, seed=11)                       # the key click of an electric piano
    a = int(t * SR)
    ln = int(dur * SR)
    phs = [0.0] * (len(notes) * 2)
    for j in range(ln):
        tt = t + j / SR
        e = min(1.0, j / (SR * 0.028)) * math.exp(-j / (ln * 0.40))
        w = wow(tt)
        l = r = 0.0
        for k, nn in enumerate(notes):
            f = midi(nn) * w
            phs[k * 2] += 2 * math.pi * f / SR
            phs[k * 2 + 1] += 2 * math.pi * (f * 1.0018) / SR   # detune, the electric piano wobble
            v = (math.sin(phs[k * 2]) + math.sin(phs[k * 2 + 1])) * 0.5
            pan = 0.5 + (k / max(1, len(notes) - 1) - 0.5) * spread
            l += v * (1 - pan)
            r += v * pan
        g = e * 0.11 * amp / math.sqrt(len(notes))
        add(a + j, l * g, r * g)


# ---- the hits. these are the loud layer, and they mark what the frame does --
def click(t, amp=1.0, seed=3):
    """Eight milliseconds of noise above 2 kHz. The edge the ear times a hit by."""
    a = int(t * SR)
    ln = int(0.008 * SR)
    nr = rng(seed * 2654435761 + int(t * 1000))
    hp = 0.0
    for j in range(ln):
        e = math.exp(-j / (ln * 0.35))
        n = nr() * 2 - 1
        hp += (n - hp) * 0.25                          # one pole at about 2.2 kHz
        s = (n - hp) * e * 0.55 * amp
        add(a + j, s, s)


def pluck(t, note, amp=1.0, dur=0.30, bright=1.0):
    """A short tone with a click on the front. The workhorse for anything the picture does."""
    if t < 0:
        return
    HITS.append(t)
    amp *= hit_gain(t)
    click(t, amp * 0.9, seed=note)
    a = int(t * SR)
    ln = int(dur * SR)
    f0 = midi(note)
    parts = [(1.0, 1.0), (2.0, .45 * bright), (3.01, .18 * bright), (4.02, .08 * bright)]
    ph = [0.0] * len(parts)
    for j in range(ln):
        e = min(1.0, j / (SR * 0.002)) * math.exp(-j / (ln * 0.26))
        w = wow(t + j / SR)
        v = 0.0
        for k, (mult, am) in enumerate(parts):
            ph[k] += 2 * math.pi * f0 * mult * w / SR
            v += am * math.sin(ph[k])
        sv = v * e * 0.34 * amp
        add(a + j, sv * 0.93, sv)


def tom(t, f0, amp=1.0, dur=0.30):
    """A knock. Keep f0 above 160 Hz so it never reads as a second kick."""
    if t < 0:
        return
    HITS.append(t)
    amp *= hit_gain(t)
    click(t, amp * 0.9, seed=int(f0))
    a = int(t * SR)
    ln = int(dur * SR)
    ph = 0.0
    for j in range(ln):
        e = math.exp(-j / (ln * 0.24))
        f = f0 * (1 + 0.55 * math.exp(-j / (SR * 0.020)))
        ph += 2 * math.pi * f / SR
        v = math.sin(ph) * e * 0.36 * amp
        add(a + j, v, v)


def glide(t, n0, n1, dur, amp=1.0, bright=0.6):
    """A tone that slides from one note to another. Movement sounds like this."""
    if t < 0:
        return
    HITS.append(t)
    amp *= hit_gain(t)
    a = int(t * SR)
    ln = int(dur * SR)
    fa, fb = midi(n0), midi(n1)
    ph = ph2 = 0.0
    for j in range(ln):
        u = j / ln
        f = fa * (fb / fa) ** u * wow(t + j / SR)
        e = min(1.0, j / (SR * 0.005)) * math.exp(-j / (ln * 0.45))
        ph += 2 * math.pi * f / SR
        ph2 += 2 * math.pi * f * 2 / SR
        v = (math.sin(ph) + 0.3 * bright * math.sin(ph2)) * e * 0.30 * amp
        add(a + j, v * 0.9, v)


# ---- the music layer. one tempo, on the grid, never restarted -----------
swing = SWING
# the kit's pattern. kicks and snares by beat of the bar, the beat whose last
# sixteenth gets a ghost kick, and whether the hats lean on the off beat.
KITS = {
    "backbeat": dict(kick=(0, 2), snare=(1, 3), ghost=2, offbeat=False),
    "halftime": dict(kick=(0,), snare=(2,), ghost=3, offbeat=False),
    "four":     dict(kick=(0, 1, 2, 3), snare=(1, 3), ghost=None, offbeat=True),
}
kit = KITS[KIT]
for b in range(BARS):
    bt = b * BAR
    root, upper = chord_at(bt + 0.001)
    e0 = max(energy_at(bt + 0.01), 0.85) if outro(bt) else energy_at(bt + 0.01)
    if playing(bt) and not ending(bt):
        keys(bt, upper, BAR * 0.62, (0.6 + 0.4 * e0) * COMP)
        bass(bt, root, BEAT * 1.4, 0.6 + 0.4 * e0)
    if playing(bt + BEAT * 2.5) and not ending(bt + BEAT * 2.5):
        e = energy_at(bt + BEAT * 2.5)
        keys(bt + BEAT * 2.5, upper[:3], BAR * 0.34, (0.5 * e + 0.15) * COMP)
        bass(bt + BEAT * 2.5, root, BEAT * 1.1, 0.5 + 0.3 * e)
    if playing(bt + BEAT * 3.5) and not ending(bt + BEAT * 3.5):
        bass(bt + BEAT * 3.5, root + 7, BEAT * 0.5, 0.4 + 0.2 * energy_at(bt + BEAT * 3.5))
    for beat in range(4):
        t0 = bt + beat * BEAT
        if not playing(t0) or ending(t0):
            continue
        e = max(energy_at(t0), 0.85) if outro(t0) else energy_at(t0)
        kl = 1.0 if outro(t0) else KIT_LEVEL.get(act_at(t0)[0], 1.0)
        if kl <= 0:
            continue
        e *= kl
        if beat in kit["kick"]:
            kick(t0, (0.75 if beat == 0 else 0.62) * (0.45 + 0.55 * e))   # the heartbeat never stops, quieter where nothing moves
        if beat == kit["ghost"] and e >= 0.6:
            kick(t0 + BEAT * 0.75, 0.32 * e)
        if beat in kit["snare"] and e >= 0.6:
            snare(t0, 0.55 + 0.45 * e, seed=b + beat)      # the snare only where the picture moves
        for eighth in range(2):
            ht = t0 + eighth * BEAT * 0.5 + (swing * BEAT * 0.5 if eighth else 0)
            lean = (0.45, 0.9) if kit["offbeat"] else (0.9, 0.55)
            if playing(ht):
                hat(ht, lean[eighth] * (0.2 + 0.8 * min(1.0, e)), seed=b * 8 + beat * 2 + eighth,
                    open_=(eighth == 1 and e >= 0.6 and (beat == 3 or (kit["offbeat"] and beat == 1))))

# ---- the cadence. a run down the V through the outro bar, then the final hit ----
if END_RUN and END_T is not None and END_HIT is not None and END_HIT > END_T + 1e-6:
    root_v, up_v = chord_at(END_T + 0.001)
    for k in range(8):
        t = END_T + k * BEAT / 2
        if END_RUN == "up":
            pluck(t, up_v[k % len(up_v)] + (12 if k >= 4 else 0), .55 + .05 * k, .3, 1.0)
        else:
            pluck(t, up_v[(3 - k) % len(up_v)] + (12 if k < 4 else 0), .55 + .05 * k, .3, 1.0)
if END_HIT is not None and playing(END_HIT):
    root, upper = chord_at(END_HIT)
    if END_KIT:
        kick(END_HIT, 1.0)
        hat(END_HIT, 0.9, seed=999, open_=True)
    keys(END_HIT, upper, min(3.0, DUR - END_HIT) * 0.95, 1.0)      # struck once, and left to ring
    bass(END_HIT, root, BEAT * 3, 1.0)
    pluck(END_HIT, root + 24, .9, 1.2, .8)                          # the motif note, long, on the downbeat

# ---- the accents. one bright tick on the first frame of every act --------
# every act starts on a kick beat by construction, so the cut lands on the kit.
# the tick is what says "cut" on top of it.
for name, fr in (ACTS if ACT_TICKS else []):
    if SILENCE and name == SILENCE[0]:
        continue                                   # the drop is the accent
    t0 = T(fstart[name])
    e = energy(name)
    root, up = chord_at(t0)
    pluck(t0, up[0] + 24, 0.30 + 0.25 * e, 0.14, 1.5)
    if e >= 0.8:
        hat(t0, 0.9, seed=fstart[name], open_=True)

# ---- a warm pad underneath, following the act's energy ----------------
G = [0.0] * N
for name, fr in ACTS:
    a, b = int(T(fstart[name]) * SR), int(T(fstart[name] + fr) * SR)
    for i in range(a, min(b, N)):
        G[i] = energy(name)
alpha = 1 - math.exp(-1 / (SR * 0.02))    # a 20ms one pole, so the change lands inside two frames
g = G[0]
for i in range(N):
    g += (G[i] - g) * alpha
    G[i] = g
phase = [0.0] * 4
lp = 0.0
for i in range(N):
    t = i / SR
    root, upper = chord_at(t)
    v = 0.0
    for k, (nn, amp) in enumerate([(root + 12, .5), (upper[0], .34), (upper[2], .22), (upper[3], .14)]):
        f = midi(nn) * wow(t)
        phase[k] += 2 * math.pi * f / SR
        v += amp * math.sin(phase[k])
    env = G[i] if playing(t) else max(0.0, 1.0 - (t - CRASH_IN) * 2.4) * G[i]
    name, u = act_at(t)
    if ending(t):
        env *= max(0.0, 1.0 - (t - END_HIT) / max(0.5, DUR - END_HIT))
    v *= 0.07 * env
    lp += (v - lp) * 0.20
    left[i] += lp
    right[i] += lp

# ---- the swell. a tremolo on the chord whose level IS the picture's motion --
# This is the layer that makes the sound breathe with the frame. Nothing moves,
# nothing sounds. A sweep or a ripple across the whole frame swells it.
if MOTION and SWELL:
    srt = sorted(MOTION)
    p90 = srt[int(0.90 * (len(srt) - 1))] or 1.0
    lvl = 0.0
    alpha = 1 - math.exp(-1 / (SR * 0.04))
    phs = [0.0] * 3
    for i in range(N):
        t = i / SR
        k = min(len(MOTION) - 1, max(0, int(t * FPS) - 1))
        target = min(1.3, MOTION[k] / p90) ** 1.2 if playing(t) else 0.0
        lvl += (target - lvl) * alpha
        if lvl < 0.01:
            continue
        root, upper = chord_at(t)
        v = 0.0
        for j, nn in enumerate(upper[1:4]):
            f = midi(nn + 12) * wow(t) * (1 + 0.0012 * j)
            phs[j] += 2 * math.pi * f / SR
            v += math.sin(phs[j])
        trem = 0.65 + 0.35 * math.sin(2 * math.pi * 8.0 * t)
        v *= 0.19 * lvl * trem / 3
        left[i] += v * 0.9
        right[i] += v

# ---- vinyl. discrete pops, not a hiss bed ----------------------------
nr = rng(20260916)
i = 0
while i < N:
    i += int(SR * (0.045 + nr() * 0.210))
    if i >= N:
        break
    ln = int(SR * (0.0008 + nr() * 0.0026))
    a = (nr() * 2 - 1) * 0.038
    pan = nr()
    for j in range(ln):
        e = math.exp(-j / max(1, ln * 0.35))
        add(i + j, a * e * (1 - pan), a * e * pan)

# ---- the voices the tune can use. every one is computed, none is a sample --
SCALES = {"major": [0, 2, 4, 5, 7, 9, 11], "minor": [0, 2, 3, 5, 7, 8, 10], "dorian": [0, 2, 3, 5, 7, 9, 10]}
NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def degree(d, octave=0, sharp=0):
    """a scale degree of KEY as a midi note. degree 0 at octave 0 is the tonic above middle C"""
    sc = SCALES[SCALE]
    return 60 + KEY + 12 * (octave + d // 7) + sc[d % 7] + sharp


def string(t, note, dur, amp=1.0, bright=0.55):
    """a plucked string, Karplus-Strong: a burst of noise in a tuned delay that loses its top"""
    if t < 0:
        return
    f = midi(note)
    L = SR / f - 0.5                       # the averaging filter adds half a sample
    size = int(L) + 3
    r = rng(int(note * 131 + t * 1000))
    # a triangle pluck a third of the way along the string, plus a little noise.
    # noise alone gives every harmonic a random level, and the octave can win
    buf, lp, p = [0.0] * size, 0.0, 0.3
    for i in range(size):
        x = i / size
        lp += ((r() * 2 - 1) - lp) * bright
        buf[i] = (x / p if x < p else (1 - x) / (1 - p)) - 0.5 + 0.25 * lp
    a = int(t * SR)
    ln = int(min(dur + 0.6, 4.0) * SR)
    decay = 0.9965 if f < 600 else 0.993
    prev = 0.0
    for w in range(ln):
        rd = (w - L) % size
        i0 = int(rd)
        frac = rd - i0
        y = buf[i0 % size] * (1 - frac) + buf[(i0 + 1) % size] * frac
        buf[w % size] = decay * 0.5 * (y + prev)
        prev = y
        e = 1.0 if w < dur * SR else math.exp(-(w - dur * SR) / (SR * 0.12))
        v = y * 0.42 * amp * e
        add(a + w, v * 0.9, v)


def fm(t, note, dur, amp=1.0, ratio=1.0, index=1.8, decay=1.4, tine=0.0):
    """two-operator FM. ratio 1 and a small index is an electric piano, 3.5 and more is a bell"""
    if t < 0:
        return
    f = midi(note)
    a = int(t * SR)
    ln = int(min(dur + decay, 5.0) * SR)
    pc = pm = pt = 0.0
    for j in range(ln):
        u = j / SR
        env = min(1.0, j / (SR * 0.004)) * math.exp(-u / decay)
        if u > dur:
            env *= math.exp(-(u - dur) / 0.25)
        ix = index * math.exp(-u / 0.35)
        w = wow(t + u)
        pm += 2 * math.pi * f * ratio * w / SR
        pc += 2 * math.pi * f * w / SR
        v = math.sin(pc + ix * math.sin(pm))
        if tine:
            pt += 2 * math.pi * f * 7.02 * w / SR
            v += tine * math.sin(pt) * math.exp(-u / 0.05)
        v *= 0.3 * amp * env
        add(a + j, v * 0.95, v)


def marimba(t, note, dur, amp=1.0):
    """a bar struck with a soft mallet: the fundamental, a quick fourth partial and a knock"""
    if t < 0:
        return
    f = midi(note)
    a = int(t * SR)
    ln = int(min(max(dur, 0.35) + 0.4, 2.0) * SR)
    p1 = p4 = 0.0
    for j in range(ln):
        u = j / SR
        p1 += 2 * math.pi * f / SR
        p4 += 2 * math.pi * f * 3.93 / SR
        v = math.sin(p1) * math.exp(-u / 0.42) + 0.35 * math.sin(p4) * math.exp(-u / 0.05)
        v *= min(1.0, j / (SR * 0.002)) * 0.36 * amp
        add(a + j, v * 0.92, v)


VOICE = {
    "string": lambda t, n, d, a: string(t, n, d, a),
    "bell": lambda t, n, d, a: fm(t, n, d, a, ratio=3.5, index=1.1, decay=1.6),
    "epiano": lambda t, n, d, a: fm(t, n, d, a, ratio=1.0, index=1.6, decay=1.2, tine=0.25),
    "marimba": lambda t, n, d, a: marimba(t, n, d, a),
    "keys": lambda t, n, d, a: keys(t, [n], d, a),
}
SHEET_LINES = []


def play_tune():
    """lay every phrase of SECTIONS down, and write the tune sheet as it goes"""
    for act, b0, name, voice, octave, amp in SECTIONS:
        if act not in fstart or name not in TUNE:
            continue
        t = beat_in(act, b0)
        line, beats = [], 0.0
        for note in TUNE[name]:
            d, dur = note[0], note[1]
            sharp = note[2] if len(note) > 2 else 0
            if d is not None and playing(t) and not ending(t):
                n = degree(d, octave, sharp)
                VOICE[voice](t, n, dur * BEAT, amp)
                HITS.append(t)
                line.append(f"{NAMES[n % 12]}{n // 12 - 1}:{dur:g}")
            else:
                line.append(f"-:{dur:g}")
            t += dur * BEAT
            beats += dur
        SHEET_LINES.append(f"  {act:>10s} +{b0:<4g} {voice:7s} {name:8s} {beats:g} beats  " + " ".join(line))


play_tune()


# ---- the moments. THIS PIECE'S. rewrite from your act sheet ---------------
# The page puts every event on the grid, so the score names the same beats.
# beat_in(act, 1.5) is the eighth after beat two of that act. Every hit takes
# its note from the bar's chord. Give each moment a shape. Things arriving run
# up, things settling run down, things moving glide, collisions knock. One
# block per act, in the order of the act sheet. These are the demo worlds'.

# lake: the boat crosses. a gentle rising line on the eighths
for k in range(4):
    t = beat_in("lake", k / 2)
    root, up = chord_at(t)
    pluck(t, up[k % len(up)] + 12, .6, .3, .9)

# storm: rain on every sixteenth, thinning, and one low knock when the lightning comes
for k in range(8):
    t = beat_in("storm", k / 4)
    hat(t, .9 - k * .05, seed=300 + k)
    HITS.append(t)
tom(beat_in("storm", 1.25), 170, .9, .35)

# night: four beats, one slow falling line, and a high tick where the moon is
for k in range(4):
    t = beat_in("night", k)
    root, up = chord_at(t)
    pluck(t, up[(3 - k) % len(up)], .5, .5, .6)
t = beat_in("night", 1)
root, up = chord_at(t)
pluck(t, up[3] + 24, .45, .3, 1.6)

# record: a ring per eighth, a pluck per ring, climbing
for k in range(4):
    t = beat_in("record", k / 2)
    root, up = chord_at(t)
    pluck(t, up[k % len(up)] + 12, .75, .25, 1.2)

# wave: the water rises over a beat and a half, one long rising glide, and the lip breaks
t = beat_in("wave", 0)
root, up = chord_at(t)
glide(t + 0.05, root + 24, root + 36, BEAT * 1.4, .5, .3)
tom(beat_in("wave", 1.5), 180, .9, .3)

# plan: the blueprint ticks on the eighths, one bright pluck on the marked tooth
for k in range(4):
    t = beat_in("plan", k / 2)
    hat(t, .7, seed=400 + k)
    HITS.append(t)
t = beat_in("plan", 0)
root, up = chord_at(t)
pluck(t, up[0] + 24, .6, .2, 1.5)

# gear: a knock on every turn, and a falling pluck as it settles
for b in (0, 1):
    tom(beat_in("gear", b), 160, .85, .3)
t = beat_in("gear", 1.5)
root, up = chord_at(t)
pluck(t, up[1], .6, .4, .8)

# ---- ticks on the picture's own motion peaks --------------------------
# Every local peak in motion.txt that no designed hit already covers gets a
# tick, climbing the bar's chord, louder for bigger motion. This is how events
# you did not think of still sound.
TICKS = 0
if MOTION and MOTION_TICKS:
    motion = MOTION
    srt = sorted(motion)
    p70 = srt[int(0.70 * (len(srt) - 1))]
    mx = srt[-1]
    peaks = [k for k in range(1, len(motion) - 1)
             if motion[k] >= motion[k - 1] and motion[k] > motion[k + 1] and motion[k] >= p70]
    kept = []
    for k in peaks:
        if kept and k - kept[-1] < 3:
            if motion[k] > motion[kept[-1]]:
                kept[-1] = k
            continue
        kept.append(k)
    count = {}
    for k in kept:
        t = (k + 1) / FPS
        if not playing(t) or ending(t):
            continue
        if any(abs(t - h) < 2.5 / FPS for h in HITS):
            continue
        name, _ = act_at(t)
        root, up = chord_at(t)
        n = count.get(name, 0)
        count[name] = n + 1
        note = up[n % len(up)] + 12 * ((n // len(up)) % 2) + 12
        amp = 0.35 + 0.5 * min(1.0, (motion[k] - p70) / (mx - p70 + 1e-9))
        pluck(on_grid(t), note, amp, .14, 1.4)
        TICKS += 1

# ---- duck on the kick. the pump is what makes the parts sit together.
duck = [1.0] * N
for t0 in KICKS:
    a = int(t0 * SR)
    ln = int(0.26 * SR)
    for j in range(ln):
        g = 0.78 + 0.22 * (j / ln) ** 0.55
        if 0 <= a + j < N and g < duck[a + j]:
            duck[a + j] = g
for i in range(N):
    left[i] *= duck[i]
    right[i] *= duck[i]

# ---- tape: soft saturation, then the ceiling ---------------------------
for i in range(N):
    left[i] = math.tanh(left[i] * 1.9)
    right[i] = math.tanh(right[i] * 1.9)

a1 = 0.69                                  # about 9 kHz, two poles. the clicks need the air.
fl = [0.0, 0.0]
fr_ = [0.0, 0.0]
for i in range(N):
    v = left[i]
    for k in range(2):
        fl[k] += (v - fl[k]) * a1
        v = fl[k]
    left[i] = v
    v = right[i]
    for k in range(2):
        fr_[k] += (v - fr_[k]) * a1
        v = fr_[k]
    right[i] = v

# a short fade in so the first accent survives, and a release after the final
# hit. a seamless loop gets only a click guard, or the seam would dip to silence
fade_in, fade_out = (int(SR * 0.04), int(SR * 1.0)) if END_T is not None else (int(SR * 0.005), int(SR * 0.005))
for i in range(fade_in):
    left[i] *= i / fade_in
    right[i] *= i / fade_in
for i in range(fade_out):
    k = i / fade_out
    left[N - 1 - i] *= k
    right[N - 1 - i] *= k

peak = max(1e-6, max(max(abs(x) for x in left), max(abs(x) for x in right)))
gain = 0.86 / peak
out = bytearray()
for i in range(N):
    l = int(max(-1, min(1, left[i] * gain)) * 32767)
    r = int(max(-1, min(1, right[i] * gain)) * 32767)
    out += struct.pack("<hh", l, r)

with wave.open(OUT, "w") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(bytes(out))

quiet = [n for n, _ in ACTS if energy(n) < 0.6]
off = [n for n, f in ACTS if f % round(BEAT * FPS)]
print(("acts from " + PAGE + ": " if PAGE else "acts: ") + " ".join(f"{n}={fr}" for n, fr in ACTS))
print("energy " + " ".join(f"{n}={energy(n):.2f}" for n, _ in ACTS))
print(f"{DUR:.2f}s, {BARS} bars at {BPM:.1f} BPM, sixteenth = {_sixteenth_frames(BARS):.2f} frames (UNIT {UNIT}), "
      f"cuts sit {_cut_fit(BARS) * FPS:.1f} frames from a beat on average" + (f", acts off the beat: {off}" if off else ""))
print(f"kit thins in {quiet}, drop {CRASH_IN:.2f}s to {CRASH_OUT:.2f}s")
print(f"sound: {HARMONY if isinstance(HARMONY, str) else 'own'} in {KEY:+d}, kit {KIT}, swing {SWING}, run {END_RUN}, kit on the hit {END_KIT}")
print(f"ending: {ENDING} from {END_T:.2f}s, outro on PROG[-1], final hit at {END_HIT:.2f}s on PROG[0], {FPS} fps" if END_T is not None else "ending: none, a seamless loop")
if MOTION:
    print("moving spans " + " ".join(f"{n}={span(n)}" for n, _ in ACTS if span(n)))
print(f"{len(HITS)} designed hits, {TICKS} motion ticks")
if SHEET_LINES:
    print("tune sheet, as note:beats. check the shape: a motif that comes back, a range under an octave and a half, phrases ending on chord tones, the last on the tonic")
    print("\n".join(SHEET_LINES))
