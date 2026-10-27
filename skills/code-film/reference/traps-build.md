# Traps: the build

Read this before your first full build, and whenever a build does something
you did not expect. Every item is a way this has actually broken on a real
build. Work it as a checklist.

## Export traps

- [ ] **Frames fill the disk.** 896 frames at 1080 pixels took 2.1 GB, and five
      sets of 704 once took 10 GB and got a capture killed. Delete old frame
      folders as you go.

- [ ] **A headless still under about 500px is cropped.** Chrome will not open
      a window that narrow, so the canvas sits off centre in a wider viewport.
      Render at 600 and scale down to judge a 250px tile.
- [ ] **Never launch Chrome per frame.** 574 launches is twenty minutes, one CDP
      session is 44 seconds. Use `assets/capture.mjs`.
- [ ] **A full size GIF is unusable.** 574 frames at 480px came out at 26MB.
      Ship MP4 at 1080 at the page's frame rate instead. See `export.md`.
- [ ] **A headless window is not the viewport.** `--window-size=1080,1080` gives
      a 1080 by 993 viewport, so the canvas is clipped and h264 rejects the odd
      height. `capture.mjs` pins it with `Emulation.setDeviceMetricsOverride`.
- [ ] **A frame count is not a freshness check.** `build.sh` once reused 512
      frames of an older page because the count matched, and shipped the old
      picture with the new score. It now also requires the frames to be newer
      than the page. If you edit the page and the build says "reusing", stop.
- [ ] **Use `build.sh`.** Six commands by hand, in order, with the right
      paths, went wrong twice in one afternoon. One script runs the gate, the
      capture, the motion, the score, the encode and the soundcheck, and reuses
      frames when only the score changed.
- [ ] **Never chain the frame cleanup onto the encode.** Check the output file
      is non empty first. A `2>/dev/null` on the encode plus an unconditional
      `rm -rf frames` destroyed a three minute render and hid the reason.
- [ ] **Do not lift a block of code between two markers without checking what
      is inside it.** Porting the parallax into the template dragged a `const`
      along and the file stopped parsing. The gate caught it. Run the gate.
- [ ] **Every build is a new file.** v2, v3, v4 in Downloads let Kartik say
      which one broke and which one was better. Never overwrite the last one.
