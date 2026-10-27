#!/usr/bin/env python3
"""How do the sound and the picture relate? Run it on the muxed MP4.

  python3 soundcheck.py piece.mp4           a readable report
  python3 soundcheck.py piece.mp4 --json    the numbers, for verify.py

Measures the finished file the way a viewer hears it: whether sounds land on
the picture's events, whether a beat holds one tempo, the tonal balance, the
loudness and clipping. These are measurements, not a verdict. A swell that
carries a montage has low sync on purpose, and a silent film is a choice.
verify.py compares them with the piece's intent card, and reference/gallery.md
has what the good films measured. Needs ffmpeg and numpy. Exits 0 unless the
file cannot be read.
"""
import json
import math
import subprocess
import sys

import numpy as np

SR = 48000
SIDE = 120

WINDOW = 0.085     # seconds. a sound this close to a picture event counts as on it
# what the gallery films measured, 25 Sep 2026. a spread, not a target
GALLERY = {
    "sync": "7 to 92 %", "events": "31 to 100 %", "breath": "-0.04 to 0.63", "rest": "-8 to +2 dB",
    "mids": "-25 to +6 dB", "laptop": "-9 to -1 dB", "edge": "-28 to -14 dB", "groove": "32 to 100 %",
    "notes": "16 to 32", "density": "3.5 to 6.2 /s", "loudness": "-24 to -9 dBFS",
}


def sh(cmd):
    return subprocess.run(cmd, capture_output=True).stdout


def fps_of(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=r_frame_rate", "-of", "csv=p=0", path], capture_output=True, text=True).stdout
    try:
        a, b = out.strip().split("/")
        return float(a) / float(b)
    except ValueError:
        return 24.0


def load(path):
    raw = sh(["ffmpeg", "-v", "error", "-i", path, "-vn", "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"])
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768.0
    fr = sh(["ffmpeg", "-v", "error", "-i", path, "-vf", f"scale={SIDE}:{SIDE},format=gray",
             "-f", "rawvideo", "-pix_fmt", "gray", "-"])
    n = len(fr) // (SIDE * SIDE)
    frames = np.frombuffer(fr[:n * SIDE * SIDE], dtype=np.uint8).reshape(n, SIDE, SIDE).astype(np.float32)
    motion = np.abs(np.diff(frames, axis=0)).mean(axis=(1, 2))
    return x, motion


def stft(x, n=2048, hop=480):
    if len(x) < n:
        return np.zeros((n // 2 + 1, 1)), np.array([0.0])
    win = np.hanning(n)
    fr = np.lib.stride_tricks.sliding_window_view(x, n)[::hop] * win
    S = np.abs(np.fft.rfft(fr, axis=1)).T
    t = (np.arange(S.shape[1]) * hop + n / 2) / SR
    return S, t


def onsets(x):
    S, t = stft(x)
    lm = np.log1p(S * 100)
    flux = np.maximum(lm[:, 1:] - lm[:, :-1], 0).sum(0)
    flux /= flux.max() + 1e-9
    tf = t[1:]
    k = 31
    pad = np.pad(flux, k // 2, mode="edge")
    med = np.median(np.lib.stride_tricks.sliding_window_view(pad, k), axis=1)
    thr = med + 0.08
    on, strength = [], []
    last = -1e9
    for i in range(1, len(flux) - 1):
        if flux[i] >= thr[i] and flux[i] >= flux[i - 1] and flux[i] > flux[i + 1] and tf[i] - last >= 0.08:
            on.append(tf[i])
            strength.append(flux[i])
            last = tf[i]
    return np.array(on), np.array(strength), S, t


def peaks(v, height, spacing):
    out = []
    for i in range(1, len(v) - 1):
        if v[i] >= height and v[i] >= v[i - 1] and v[i] > v[i + 1]:
            if out and i - out[-1] < spacing:
                if v[i] > v[out[-1]]:
                    out[-1] = i
                continue
            out.append(i)
    return np.array(out, dtype=int)


def grid_share(times, per, width=0.12):
    """Share of events inside +-width of one period from a grid line, best phase."""
    if len(times) < 3:
        return 0.0
    ph = np.sort((times % per) / per)
    best = 0
    for c in ph:
        d = np.abs(ph - c)
        d = np.minimum(d, 1 - d)
        best = max(best, int((d <= width).sum()))
    return 100.0 * best / len(times)


def best_grid(times, lo=0.30, hi=1.0):
    best = (0.0, lo)
    for per in np.arange(lo, hi, 0.004):
        s = grid_share(times, per)
        if s > best[0]:
            best = (s, per)
    return best


def low_flux(S):
    """Onset strength of the low band, 40 to 160 Hz, at 10 ms. The kit's own clock."""
    f = np.fft.rfftfreq(2048, 1 / SR)
    low = np.log1p(100 * S[(f >= 40) & (f < 160)].sum(0))
    return np.maximum(np.diff(low), 0)


def dominant_lag(d, lo=0.4, hi=1.6, hop=0.01):
    d = d - d.mean()
    a = np.correlate(d, d, "full")[len(d) - 1:]
    a = a / (a[0] + 1e-12)
    i0, i1 = int(lo / hop), int(hi / hop)
    k = int(np.argmax(a[i0:i1])) + i0
    return k * hop, float(a[k])


def groove_of(S, hop=0.01):
    """Does the kit keep one tempo across the file? In each 4 s window, is the
    global period (or its half or double) still a strong periodicity, at least
    seven tenths of the window's strongest? A syncopated bass passes. A pulse
    that restarts at a new tempo every act does not."""
    d = low_flux(S)
    if (d > 0).sum() < 12:
        return 0.0, 0.0, 0
    lag, _ = dominant_lag(d)
    W, H = 400, 100
    lo, hi = int(0.4 / hop), int(1.6 / hop)
    agree = []
    for s in range(0, len(d) - W, H):
        seg = d[s:s + W]
        if (seg > 0).sum() < 6:
            continue
        z = seg - seg.mean()
        a = np.correlate(z, z, "full")[len(z) - 1:]
        a = a / (a[0] + 1e-12)
        best = a[lo:hi].max()
        at_global = 0.0
        for m in (0.5, 1.0, 2.0):
            k = int(round(lag * m / hop))
            k0, k1 = max(lo, int(k * 0.94)), min(hi, int(k * 1.06) + 1)
            if k1 > k0:
                at_global = max(at_global, a[k0:k1].max())
        agree.append(at_global >= 0.7 * best and at_global > 0.05)
    return (100.0 * np.mean(agree) if agree else 0.0), lag, len(agree)


def band_db(x, lo, hi):
    S, _ = stft(x, 8192, 8192)
    f = np.fft.rfftfreq(8192, 1 / SR)
    P = (S ** 2).mean(1)
    m = (f >= lo) & (f < hi)
    return 10 * math.log10(P[m].sum() + 1e-15)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    as_json = "--json" in sys.argv
    if not args:
        print(__doc__)
        return 2
    path = args[0]
    fps = fps_of(path)
    x, motion = load(path)
    if len(motion) < 2:
        print(json.dumps({"error": "no video frames"}) if as_json else "no video frames")
        return 1
    dur = len(x) / SR
    rms = float(np.sqrt(np.mean(x ** 2))) if len(x) else 0.0
    loudness = 20 * math.log10(rms + 1e-12)
    if len(x) == 0 or loudness < -60:
        out = {"silent": True, "seconds": round(len(motion) / fps, 1)}
        print(json.dumps(out) if as_json else f"{path}  no audio track, or silent. a silent film is a choice")
        return 0
    clip = float((np.abs(x) > 0.999).mean() * 100)
    tm = (np.arange(len(motion)) + 1) / fps
    on, strength, S, ts = onsets(x)
    if len(on) < 4:
        out = {"silent": False, "seconds": round(dur, 1), "loudness": round(loudness, 1), "clip": round(clip, 3), "events_found": len(on)}
        print(json.dumps(out) if as_json else f"{path}  only {len(on)} sound events. a drone or a pad with no hits")
        return 0

    # the window is time, not frames. two frames at 60 fps is a third of what
    # the ear forgives, and a tightly cut 60 fps film read as out of sync
    def near(times, targets):
        return np.array([np.min(np.abs(targets - t)) for t in times]) <= WINDOW

    # 1. does every visual event have a sound. motion peaks in the top quarter.
    mp = peaks(motion, np.percentile(motion, 75), 3)
    sync = 100 * near(tm[mp], on).mean() if len(mp) else 0
    # 2. the big events. top 8 percent, a cut or a burst.
    bp = peaks(motion, np.percentile(motion, 92), 12)
    events = 100 * near(tm[bp], on).mean() if len(bp) else 0
    # 3. does loudness breathe with motion, second by second
    env = np.sqrt(np.convolve(x ** 2, np.ones(int(SR * 0.04)) / (SR * 0.04), "same"))
    db = 20 * np.log10(env + 1e-9)
    secs = int(min(dur, tm[-1]))
    ma = np.array([motion[int(s * fps):int((s + 1) * fps)].mean() for s in range(secs)])
    da = np.array([db[int(s * SR):int((s + 1) * SR)].mean() for s in range(secs)])
    breath = np.corrcoef(ma, da)[0, 1] if secs > 3 else 0
    still = da[ma <= np.percentile(ma, 25)].mean()
    moving = da[ma >= np.percentile(ma, 75)].mean()
    rest = still - moving
    # 4. tonal balance. mids against the sub, and what a laptop speaker keeps.
    sub = band_db(x, 30, 120)
    mids = band_db(x, 500, 1000) - sub
    total = band_db(x, 20, SR / 2)
    laptop = band_db(x, 250, SR / 2) - total
    # 5. the edge on each hit. 2 to 8 kHz against everything, 50ms after onset.
    f = np.fft.rfftfreq(4096, 1 / SR)
    edges, pitches = [], []
    for o in on:
        i0 = int(o * SR)
        seg = x[i0:i0 + int(0.05 * SR)]
        if len(seg) < 2048:
            continue
        sp = np.abs(np.fft.rfft(seg * np.hanning(len(seg)), n=4096)) ** 2
        hi = sp[(f >= 2000) & (f < 8000)].sum()
        edges.append(10 * math.log10((hi + 1e-15) / (sp.sum() + 1e-15)))
        m = (f > 150) & (f < 3000)
        if sp[m].max() > 1e-6:
            pitches.append(f[m][sp[m].argmax()])
    edge = float(np.median(edges)) if edges else -99
    semis = set(int(round(12 * math.log2(p / 440))) for p in pitches)
    notes = len(semis)
    octaves = (math.log2(max(pitches) / min(pitches))) if len(pitches) > 1 else 0
    # 6. two clocks, measured separately. the kit must sit on ONE grid for the
    #    whole file, or the beat breaks. everything else may live on frames.
    groove, klag, nwin = groove_of(S)
    clock, period = best_grid(on, 0.10, 1.0)
    density = len(on) / dur

    out = {"silent": False, "seconds": round(dur, 1), "sync": round(sync), "events": round(events),
           "breath": round(float(breath), 2) if secs >= 16 else None, "rest": round(float(rest), 1) if secs >= 16 else None,
           "mids": round(mids, 1), "laptop": round(laptop, 1), "edge": round(edge, 1), "groove": round(groove),
           "notes": notes, "density": round(density, 1), "loudness": round(loudness, 1), "clip": round(clip, 3)}
    if as_json:
        print(json.dumps(out))
        return 0
    print(f"{path}  {dur:.1f}s  {fps:.0f}fps  {len(on)} sound events  {len(mp)} motion peaks  {len(bp)} big events")
    rows = [("sync", f"{sync:.0f}%", "picture moments with a sound on them"),
            ("events", f"{events:.0f}%", "cuts and bursts with a sound on them"),
            ("breath", f"{breath:.2f}" if secs >= 16 else "n/a", "loudness following motion, second by second"),
            ("rest", f"{rest:+.1f}dB" if secs >= 16 else "n/a", "still seconds against moving seconds"),
            ("groove", f"{groove:.0f}%", "a beat holding one tempo. low with no kit, or with drift"),
            ("mids", f"{mids:+.1f}dB", "500 to 1000 Hz against the sub"),
            ("laptop", f"{laptop:+.1f}dB", "what a laptop speaker keeps"),
            ("edge", f"{edge:+.1f}dB", "high edge on each hit, which is how the ear times it"),
            ("notes", f"{notes}", "distinct pitches"),
            ("density", f"{density:.1f}/s", "sound events a second"),
            ("loudness", f"{loudness:+.1f}dBFS", "whole-file RMS. quieter than -30 is a mistake")]
    for k, v, what in rows:
        print(f"  {k:8s} {v:>9}   gallery {GALLERY[k]:14s} {what}")
    print(f"         kit period {klag:.2f}s over {nwin} windows; events {clock:.0f}% on a {period:.2f}s grid; "
          f"pitch range {octaves:.1f} octaves; clipped samples {clip:.3f}%")
    return 0


if __name__ == "__main__":
    sys.exit(main())
