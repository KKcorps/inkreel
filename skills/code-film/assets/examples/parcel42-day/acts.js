// ================= the acts ========================================
// A day in the life of parcel 42, and the ledger that keeps it. Lived scenes
// print on the riso press. Ledger plates are drawn by LEDGER straight onto the
// sheet through the engine's raw hook. 56 beats, 14 bars, 37.3 s at 24 fps. The ending
// starts on bar 12.
const SCENES = [];
const plate = (name, frames, cam, fn, opts = {}) => SCENES.push({ name, frames, cam, fn, ...opts });
const DEFCAM = () => [500, 500, 1000];
// the plate() lines stay literal: check.py and score.py read the act list from them
const L = name => [(W, u) => (LIVED[name]?.cam || DEFCAM)(W, u),
  (S, u, W, cam, sh) => (LIVED[name]?.draw || placeholder(name))(S, u, W, cam, sh), { travel: 1, cutsAt: SECOND_SHOT[name] || [], ...(LIVED[name]?.opts || {}) }];
// the scenes that cut to a closer framing half way through
const SECOND_SHOT = { placed: [.5], packed: [.5], shipped: [.5], late: [.5], delivered: [.5] };
// a ledger act is drawn by LEDGER, straight onto the sheet, through the engine's raw hook
const R = () => [DEFCAM, () => {}, { raw: (ctx, u, f, size) => LEDGER.render(ctx, f, size), travel: 1 }];
plate('ask', beats(4), ...L('ask'));
plate('placed', beats(4), ...L('placed'));
plate('plate1', beats(4), ...R());
plate('packed', beats(4), ...L('packed'));
plate('plate2', beats(3), ...R());
plate('shipped', beats(4), ...L('shipped'));
plate('plate3', beats(3), ...R());
plate('late', beats(6), ...L('late'));
plate('plate4', beats(5), ...R());
plate('delivered', beats(4), ...L('delivered'));
plate('plate5', beats(3), ...R());
plate('query', beats(4), ...R());
plate('ending', beats(8), ...R());
