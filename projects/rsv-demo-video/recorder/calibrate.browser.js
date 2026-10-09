// Finds the first magenta frame in a take. Plain browser JavaScript on purpose: it runs in the page as-is,
// and TypeScript compiled by tsx would carry helpers (__name) the page doesn't have.
//
// The video is served at /video.webm by the recorder (see calibrate() in record.ts).
window.__demoFindSync = async (limit) => {
  const v = document.getElementById("v");
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  v.src = "/video.webm";
  await new Promise((resolve) => v.addEventListener("loadeddata", resolve, { once: true }));

  const isMagenta = async (t) => {
    v.currentTime = t;
    await new Promise((resolve) => v.addEventListener("seeked", resolve, { once: true }));
    // Sampled at the centre, away from the pointer drawn in the corner.
    ctx.drawImage(v, v.videoWidth / 2 - 2, v.videoHeight / 2 - 2, 4, 4, 0, 0, 4, 4);
    const px = ctx.getImageData(1, 1, 1, 1).data;
    return px[0] > 200 && px[1] < 70 && px[2] > 200;
  };

  for (let t = 0; t < limit; t += 0.1) {
    if (!(await isMagenta(t))) continue;
    // Step back frame by frame to the first one it is on.
    let first = t;
    for (let back = t - 1 / 30; back >= Math.max(0, t - 0.2); back -= 1 / 30) {
      if (!(await isMagenta(back))) break;
      first = back;
    }
    return first;
  }
  return null;
};
