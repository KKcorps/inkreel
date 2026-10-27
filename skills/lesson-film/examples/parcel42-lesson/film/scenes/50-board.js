// ============================================================================
// board: two switches flip. The switch board and the window onto the town are in
// one frame, so each switch and the window it drives are seen together. House 12
// on street 7 goes dark on "dark", the new house on street 8 lights on "lights",
// and then the book's line for 42 is struck and rewritten to point at the new house.
// ============================================================================
const BOARD_CAM = [1300, 334, 1.75];
SCENE_DRAW.board = (f, u, sc) => {
  const cutBook = word('swap', 'book').s;
  if (f < cutBook) {
    // a ring on 42's two switches as the narrator says "switches", so the eye knows where to look
    const ring = seg(f, word('flip', 'switches').s - 1, word('flip', 'switches').s + 14);
    const cam = drift(camMove(f, word('swap', 'the', 1).s - 4, AT.onNew + 2, BOARD_CAM, [1316, 336, 1.8]), f, .5);
    deskRoom(f, cam, { ring: ring > 0 && ring < 1 ? ring : 0 });
    return;
  }
  // the book: the old place struck in pencil, the new one written above it
  deskBookShot(f, drift(camMove(f, cutBook, cutBook + 10, [1150, 540, 1.24], [1176, 548, 1.3]), f, .5), [-.9, -.6]);
};
