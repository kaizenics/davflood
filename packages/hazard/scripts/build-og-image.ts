import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { colors } from "../src/tokens";

/**
 * The card that shows when someone shares DavFlood into a group chat.
 *
 * In Davao, hazard information travels through Messenger far more than
 * through search, so this image is doing at least as much work as any title
 * tag. It is generated rather than drawn so it cannot drift from the palette:
 * the wave and the depth bands read from the same tokens the map paints with,
 * and a colour change in tokens.ts re-renders the card.
 *
 * Written with a hand-rolled PNG encoder because the alternative is a
 * headless browser or a canvas library, and neither is worth a dependency
 * that runs once. PNG is four chunks and a zlib stream — see writePng.
 *
 * Deliberately wordless. A generated bitmap has no font to set type in, and
 * a card with badly-spaced letters looks worse than a clean abstract one —
 * the title and description are supplied as text by the og: tags anyway, and
 * every preview client renders them beside the image.
 *
 * Run: pnpm -F @davflood/hazard build:og
 */

const WIDTH = 1200;
const HEIGHT = 630;

type Rgb = [number, number, number];

function hex(value: string): Rgb {
  const n = Number.parseInt(value.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  const k = Math.max(0, Math.min(1, t));
  return [
    Math.round(a[0] + (b[0] - a[0]) * k),
    Math.round(a[1] + (b[1] - a[1]) * k),
    Math.round(a[2] + (b[2] - a[2]) * k),
  ];
}

const ABYSS = hex(colors.abyss);
/** the panel surface — one step up from abyss, so the sky has depth */
const DEEP = hex(colors.surface);
const TIDE = hex(colors.tide);
const TIDE_DEEP = hex(colors.tideDeep);
const BANDS: Rgb[] = [hex(colors.hazLow), hex(colors.hazMed), hex(colors.hazHigh)];

/** The wave surface, in pixels from the top, at a given x. */
function surfaceAt(x: number): number {
  const t = (x / WIDTH) * Math.PI * 2;
  return (
    HEIGHT * 0.58 +
    Math.sin(t * 1.0 + 0.4) * 46 +
    Math.sin(t * 2.3 + 1.9) * 20 +
    Math.sin(t * 3.7 + 3.1) * 9
  );
}

function render(): Buffer {
  // one filter byte per row, then RGB triples
  const raw = Buffer.alloc(HEIGHT * (1 + WIDTH * 3));

  for (let y = 0; y < HEIGHT; y++) {
    const rowStart = y * (1 + WIDTH * 3);
    raw[rowStart] = 0; // filter: none

    for (let x = 0; x < WIDTH; x++) {
      const surface = surfaceAt(x);
      let px: Rgb;

      if (y < surface) {
        /* Sky: a slow vertical lift from abyss towards deep, so the card has
           depth without ever competing with the wave for attention. */
        px = mix(ABYSS, DEEP, (y / surface) * 0.55);

        // the horizon glow, tight to the surface
        const near = surface - y;
        if (near < 90) px = mix(px, TIDE_DEEP, (1 - near / 90) ** 3 * 0.5);
      } else {
        /* Water: tide at the surface falling away to tide-deep, which is the
           same "deeper is darker" logic the depth ramp uses. */
        const depth = (y - surface) / (HEIGHT - surface);
        px = mix(TIDE, TIDE_DEEP, depth ** 0.7);
        px = mix(px, ABYSS, depth ** 1.6 * 0.55);

        // the crest line — one bright pixel row, the thing that reads as water
        if (y - surface < 3) px = mix(px, [255, 255, 255], 0.35);
      }

      const i = rowStart + 1 + x * 3;
      raw[i] = px[0];
      raw[i + 1] = px[1];
      raw[i + 2] = px[2];
    }
  }

  /* The depth ramp along the bottom edge: low, medium, high, in the order and
     the proportions the legend uses. It is the one part of the card that
     carries information rather than mood. */
  const barHeight = 14;
  for (let y = HEIGHT - barHeight; y < HEIGHT; y++) {
    const rowStart = y * (1 + WIDTH * 3);
    for (let x = 0; x < WIDTH; x++) {
      const band = BANDS[Math.min(2, Math.floor((x / WIDTH) * 3))]!;
      const i = rowStart + 1 + x * 3;
      raw[i] = band[0];
      raw[i + 1] = band[1];
      raw[i + 2] = band[2];
    }
  }

  return raw;
}

/** CRC-32, the one piece of bookkeeping every PNG chunk needs. */
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = -1;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 255]! ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function writePng(raw: Buffer, path: string) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(WIDTH, 0);
  ihdr.writeUInt32BE(HEIGHT, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour RGB
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);

  writeFileSync(path, png);
  return png.length;
}

/* fileURLToPath, not URL.pathname: a repo checked out under a path with a
   space in it comes back percent-encoded from .pathname, and fs does not
   decode it. */
const out = fileURLToPath(
  new URL("../../../apps/web/public/og.png", import.meta.url),
);
const bytes = writePng(render(), out);
console.log(`og.png — ${WIDTH}×${HEIGHT}, ${(bytes / 1024).toFixed(1)} kB`);
