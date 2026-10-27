// ============================================================================
// bits: those switches are the validDocIds bitmap. Close on the board's brass
// plate as its name is said, then the whole board, and a pencilled 1 or 0 under
// every switch, one bit per row, matching which switches are up.
// ============================================================================
const BITS_PLATE = [965, 186, 2.9], BITS_BOARD = [965, 386, 2.08];
SCENE_DRAW.bits = (f, u, sc) => {
  const valid = word('bits', 'valid').s, bitmap = word('bits', 'bitmap').s, one = word('bits', 'one').s;
  const cam = f < bitmap - 4 ? drift(camMove(f, sc.start, sc.start + 14, [965, 230, 2.6], BITS_PLATE), f, .3)
    : drift(camMove(f, bitmap - 4, bitmap + 10, BITS_PLATE, BITS_BOARD), f, .3);
  const digits = [easeOut(seg(f, one - 1, one + 12)), easeOut(seg(f, one + 6, one + 18))];
  deskRoom(f, cam, {
    digits, extra: () => {
      // a glint runs along the brass plate as its name is said
      const g = seg(f, valid - 1, valid + 14);
      if (g > 0 && g < 1) {
        const b = DESK_BOARD, px = b.x + 20, pw = b.w - 40, gx = lerp(px - 40, px + pw + 40, ease(g));
        c.save(); c.beginPath(); c.rect(px, b.y + 18, pw, 56); c.clip(); c.globalCompositeOperation = 'screen';
        const gr = c.createLinearGradient(gx - 50, 0, gx + 50, 0); gr.addColorStop(0, 'rgba(255,240,190,0)'); gr.addColorStop(.5, 'rgba(255,240,190,.75)'); gr.addColorStop(1, 'rgba(255,240,190,0)');
        c.fillStyle = gr; c.fillRect(gx - 50, b.y + 18, 100, 56); c.restore();
      }
    },
  });
};
