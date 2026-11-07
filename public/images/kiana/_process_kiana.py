from collections import Counter
from pathlib import Path

from PIL import Image

ASSETS = Path(
    r"C:\Users\angelica\.cursor\projects\c-Users-angelica-Documents-Cranhua-Frontend\assets"
)
OUT = Path(r"c:\Users\angelica\Documents\Cranhua-Frontend\public\images\kiana")

MAPPING = [
    ("Kiana_-_Expresion_1-58abf492-7a2a-47cf-89b8-49df5af66c45.png", "pensando.png"),
    ("Kiana_-_Expresion_2-dddecb7c-2ef8-4284-a24b-bcd6c6472ed0.png", "idle.png"),
    ("Kiana_-_Expresion_3-efa9b364-c239-43fc-81df-b95fc0b27841.png", "respondio.png"),
]


def remove_near_black(im: Image.Image, threshold: int = 28) -> Image.Image:
    """Make near-black pixels transparent; keep dark facial linework via flood from edges."""
    rgba = im.convert("RGBA")
    pixels = rgba.load()
    w, h = rgba.size

    near_black = [[False] * h for _ in range(w)]
    for x in range(w):
        for y in range(h):
            r, g, b, a = pixels[x, y]
            if a == 0:
                near_black[x][y] = True
            elif r <= threshold and g <= threshold and b <= threshold:
                near_black[x][y] = True

    bg = [[False] * h for _ in range(w)]
    stack = []
    for x in range(w):
        for y in (0, h - 1):
            if near_black[x][y]:
                stack.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if near_black[x][y]:
                stack.append((x, y))

    while stack:
        x, y = stack.pop()
        if x < 0 or y < 0 or x >= w or y >= h or bg[x][y] or not near_black[x][y]:
            continue
        bg[x][y] = True
        stack.extend(((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)))

    out = Image.new("RGBA", (w, h))
    out_px = out.load()
    for x in range(w):
        for y in range(h):
            r, g, b, a = pixels[x, y]
            if bg[x][y]:
                out_px[x, y] = (0, 0, 0, 0)
            else:
                out_px[x, y] = (r, g, b, a)
    return out


def inspect(path: Path) -> None:
    im = Image.open(path)
    print("---", path.name)
    print("format", im.format, "mode", im.mode, "size", im.size)
    print("n_frames", getattr(im, "n_frames", 1))
    rgba = im.convert("RGBA")
    px = list(rgba.getdata())
    corners = [
        rgba.getpixel((0, 0)),
        rgba.getpixel((rgba.width - 1, 0)),
        rgba.getpixel((0, rgba.height - 1)),
        rgba.getpixel((rgba.width - 1, rgba.height - 1)),
    ]
    print("corners", corners)
    near_black = sum(1 for r, g, b, a in px if a > 0 and r < 25 and g < 25 and b < 25)
    transparent = sum(1 for r, g, b, a in px if a == 0)
    print(
        "near_black_opaque",
        near_black,
        "transparent",
        transparent,
        "total",
        len(px),
    )
    print("top5", Counter(px).most_common(5))


def main() -> None:
    for src_name, dest_name in MAPPING:
        src = ASSETS / src_name
        inspect(src)
        im = Image.open(src)
        im.seek(0)
        processed = remove_near_black(im)
        dest = OUT / dest_name
        processed.save(dest, "PNG", optimize=True)
        inspect(dest)
        print("wrote", dest, "bytes", dest.stat().st_size)


if __name__ == "__main__":
    main()
