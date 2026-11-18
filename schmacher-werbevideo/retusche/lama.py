# Retusche-Helfer: Objekte entfernen (LaMa-ONNX) und Tore per Perspektive einsetzen.
# Modell: HF_HUB_DISABLE_XET=1 python3 -c "from huggingface_hub import hf_hub_download as d; d('Carve/LaMa-ONNX','lama_fp32.onnx',local_dir='MODELDIR')"
import os, numpy as np, cv2, onnxruntime as ort
MODEL = os.environ.get('LAMA', '/tmp/claude-0/-home-user-ain/09223e52-9035-58eb-a5f3-e4ee5904e6fe/scratchpad/models/lama_fp32.onnx')
_s = None
def _sess():
    global _s
    if _s is None: _s = ort.InferenceSession(MODEL, providers=['CPUExecutionProvider'])
    return _s

def inpaint(img, mask, pad=0.6, feather=6):
    """img: BGR uint8, mask: uint8 (255 = entfernen). Arbeitet auf einem quadratischen Ausschnitt um die Maske."""
    ys, xs = np.where(mask > 0)
    if len(xs) == 0: return img
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    s = int(max(x1 - x0, y1 - y0) * (1 + pad)); s = max(s, 256)
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    H, W = img.shape[:2]; s = min(s, max(H, W))
    ax0 = int(np.clip(cx - s // 2, 0, max(0, W - s))); ay0 = int(np.clip(cy - s // 2, 0, max(0, H - s)))
    ax1, ay1 = min(W, ax0 + s), min(H, ay0 + s)
    crop, mc = img[ay0:ay1, ax0:ax1], mask[ay0:ay1, ax0:ax1]
    ci = cv2.resize(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB), (512, 512), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    mi = (cv2.resize(mc, (512, 512), interpolation=cv2.INTER_NEAREST) > 127).astype(np.float32)
    out = _sess().run(None, {'image': ci.transpose(2, 0, 1)[None], 'mask': mi[None, None]})[0][0].transpose(1, 2, 0)
    if out.max() <= 1.5: out = out * 255
    out = cv2.cvtColor(np.clip(out, 0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR)
    out = cv2.resize(out, (ax1 - ax0, ay1 - ay0), interpolation=cv2.INTER_CUBIC)
    a = cv2.GaussianBlur((cv2.dilate(mc, np.ones((feather, feather), np.uint8)) > 0).astype(np.float32), (0, 0), feather / 2)[..., None]
    res = img.copy(); res[ay0:ay1, ax0:ax1] = (crop * (1 - a) + out * a).astype(np.uint8)
    return res

def poly_mask(shape, polys, grow=4):
    m = np.zeros(shape[:2], np.uint8)
    for p in polys: cv2.fillPoly(m, [np.array(p, np.int32)], 255)
    return cv2.dilate(m, np.ones((grow * 2 + 1, grow * 2 + 1), np.uint8)) if grow else m

def sectional_door(w=900, h=1000, color=(58, 54, 52), panels=5, window=False):
    """Anthrazit-Sektionaltor als Bild (BGR) mit Paneel-Fugen und feiner Längsrillung."""
    d = np.full((h, w, 3), color, np.uint8)
    for k in range(1, panels):
        y = int(h * k / panels); d[y - 3:y + 3] = (32, 30, 29); d[y + 3:y + 6] = (78, 74, 72)
    for y in range(0, h, 14): d[y:y + 1] = np.clip(d[y:y + 1].astype(int) + 10, 0, 255)
    g = np.linspace(1.12, 0.86, h)[:, None, None]  # Licht von oben
    d = np.clip(d * g, 0, 255).astype(np.uint8)
    return d

def warp_into(img, src, quad, feather=1.5):
    """src-Bild perspektivisch in das Viereck quad (TL, TR, BR, BL) einsetzen."""
    h, w = src.shape[:2]
    M = cv2.getPerspectiveTransform(np.float32([[0, 0], [w, 0], [w, h], [0, h]]), np.float32(quad))
    W, H = img.shape[1], img.shape[0]
    wp = cv2.warpPerspective(src, M, (W, H), flags=cv2.INTER_CUBIC)
    m = cv2.warpPerspective(np.full((h, w), 255, np.uint8), M, (W, H))
    a = cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), feather)[..., None]
    return (img * (1 - a) + wp * a).astype(np.uint8)
