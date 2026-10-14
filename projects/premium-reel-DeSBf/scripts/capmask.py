"""Caption mask for this reel (imported by clean_captions.py; run directly to QA on sample times).
Captions are white sans words with a soft dark shadow, centred around y 940-1260, often over his
WHITE T-shirt, so plain "near-white" masking would eat the shirt. Instead: a white top-hat (bright, thin
strokes standing above their local surroundings) inside the band, glued into word boxes and grown to take
the shadow. The opening title box (white plate, black type, first ~6 s) is masked as a fixed rectangle."""
import numpy as np, cv2
W, H = 1080, 1920
Y0, Y1, X0, X1 = 900, 1290, 60, 1020          # caption search band
BOX = (80, 1060, 1000, 1250)                   # title plate x0,y0,x1,y1 (with margin)

def title_box(f):
    x0, y0, x1, y1 = BOX
    r = f[y0 + 20:y1 - 20, x0 + 30:x1 - 30].astype(np.int16)
    mn = r.min(2); mx = r.max(2)
    dark = ((mx < 70)).mean()                   # black type
    white = ((mn > 200) & (mx - mn < 30)).mean()
    return dark > 0.04 and white > 0.25

def text_mask(f, box_on=None):
    band = f[Y0:Y1, X0:X1]
    g = cv2.cvtColor(band, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(band, cv2.COLOR_BGR2HSV)
    th = cv2.morphologyEx(g, cv2.MORPH_TOPHAT, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (45, 45)))
    m = (((g > 228) & (th > 22)) | ((g > 150) & (th > 50))) & (hsv[..., 1] < 40)  # second term: words fading in/out
    m = m.astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    box = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_RECT, (31, 13)))
    num, lab, stats, _ = cv2.connectedComponentsWithStats(box)
    keep = np.zeros_like(m)
    for i in range(1, num):
        x, y, w, h, area = stats[i]
        fill = (m[lab == i] > 0).mean()
        if h >= 30 and w >= 40 and fill > 0.12:  # a word, not a specular glint
            keep[lab == i] = 255
    full = np.zeros((H, W), np.uint8)
    full[Y0:Y1, X0:X1] = keep
    full = cv2.dilate(full, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31)))
    if box_on if box_on is not None else title_box(f):
        x0, y0, x1, y1 = BOX
        full[y0:y1, x0:x1] = 255
    return full

if __name__ == "__main__":
    import sys
    src, out = sys.argv[1], sys.argv[2]
    ts = [float(t) for t in sys.argv[3:]]
    cap = cv2.VideoCapture(src); tiles = []
    for t in ts:
        cap.set(cv2.CAP_PROP_POS_FRAMES, round(t * 24)); ok, f = cap.read()
        m = text_mask(f)
        o = f.copy(); o[m > 0] = (o[m > 0] * 0.4 + np.array([0, 0, 255]) * 0.6).astype(np.uint8)
        tiles.append(cv2.resize(o[760:1400], (540, 320)))
    rows = [np.hstack(tiles[i:i + 3] + [np.zeros_like(tiles[0])] * (3 - len(tiles[i:i + 3]))) for i in range(0, len(tiles), 3)]
    cv2.imwrite(out, np.vstack(rows))
