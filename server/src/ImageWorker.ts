import { encode } from 'blurhash';
import { db, t } from './db';
import { eq } from 'drizzle-orm';

import { JimpMime, Jimp } from 'jimp';
import { cfEnv } from '.';

interface ImageWorkerMessage {
  photoId: number;
  rawBytes: Buffer;
}

export async function saveImage(
  imageId: number,
  type: string,
  blob: Blob,
  width: number,
  height: number,
  size: number,
  isOriginal: boolean
) {
  const bucket: R2Bucket = cfEnv.getStore()!.CF_R2_BUCKET;
  const uniqueId = `prod/${imageId}/${Date.now()}.${Math.random().toString(36).substring(2).slice(0, 10)}`; // config1

  await bucket.put(uniqueId, blob, {
    httpMetadata: {
      contentType: type,
      cacheControl: 'public, max-age=604800, immutable',
    },
  });

  await db().insert(t.photoResources).values({
    photoId: imageId,
    fileId: uniqueId,
    type,
    width,
    height,
    size,
    isOriginal,
  });

  if (isOriginal) {
    await db()
      .update(t.photos)
      .set({ width, height })
      .where(eq(t.photos.id, imageId));
  }
}

async function saveImageWrapper(
  imageId: number,
  fmt: string,
  buf: Buffer,
  w: number,
  h: number,
  original: boolean = false
) {
  await saveImage(
    imageId,
    `image/${fmt}`,
    new Blob([buf]),
    w,
    h,
    buf.byteLength,
    original
  );
}

function extractBMPImageData(bmpData: Uint8ClampedArray): Uint8ClampedArray {
  // Ensure the input is at least big enough for a BMP header
  if (bmpData.length < 54) {
    throw new Error('Invalid BMP file: Too small to contain a header');
  }

  // Read the offset where pixel data starts (bytes 10-13)
  const dataOffset =
    bmpData[10] |
    (bmpData[11] << 8) |
    (bmpData[12] << 16) |
    (bmpData[13] << 24);

  // Read image dimensions (width and height from bytes 18-25)
  const width =
    bmpData[18] |
    (bmpData[19] << 8) |
    (bmpData[20] << 16) |
    (bmpData[21] << 24);
  let height =
    bmpData[22] |
    (bmpData[23] << 8) |
    (bmpData[24] << 16) |
    (bmpData[25] << 24);

  // BMP height can be negative (top-down storage)
  const topDown = height < 0;
  height = Math.abs(height);

  // Read bit depth (bytes per pixel from bytes 28-29)
  const bitsPerPixel = bmpData[28] | (bmpData[29] << 8);
  const bytesPerPixel = bitsPerPixel / 8;

  if (bytesPerPixel !== 3 && bytesPerPixel !== 4) {
    throw new Error(
      'Unsupported BMP format: Only 24-bit and 32-bit BMPs are supported'
    );
  }

  const rowSize = width * bytesPerPixel;
  const rowPadding = (4 - (rowSize % 4)) % 4;
  const rawData = new Uint8ClampedArray(width * height * bytesPerPixel);

  let srcOffset = dataOffset;

  for (let y = 0; y < height; y++) {
    const destOffset = (topDown ? y : height - 1 - y) * width * bytesPerPixel;
    for (let x = 0; x < width * bytesPerPixel; x++) {
      rawData[destOffset + x] = bmpData[srcOffset++];
    }
    srcOffset += rowPadding; // Skip padding bytes
  }

  return rawData;
}

function addAlphaChannel(rgbData: Uint8ClampedArray): Uint8ClampedArray {
  if (rgbData.length % 3 !== 0) {
    throw new Error('Invalid RGB data: Length must be a multiple of 3');
  }

  const rgbaData = new Uint8ClampedArray((rgbData.length / 3) * 4);

  for (let i = 0, j = 0; i < rgbData.length; i += 3, j += 4) {
    rgbaData[j] = rgbData[i + 2]; // R
    rgbaData[j + 1] = rgbData[i + 1]; // G
    rgbaData[j + 2] = rgbData[i]; // B
    rgbaData[j + 3] = 0; // A (set to 0)
  }

  return rgbaData;
}

export async function processImage(data: ImageWorkerMessage) {
  const img = await Jimp.fromBuffer(data.rawBytes);

  const thumbnail = img.resize({ w: 200 }).clone();

  console.log(thumbnail.width, thumbnail.height);
  console.log(thumbnail.width * thumbnail.height);

  const ab = addAlphaChannel(
    extractBMPImageData(
      new Uint8ClampedArray(await thumbnail.getBuffer(JimpMime.bmp))
    )
  ); // .slice(0, thumbnail.width * thumbnail.height);

  const blurhash = encode(ab, thumbnail.width, thumbnail.height, 4, 3);

  await db()
    .update(t.photos)
    .set({ blurhash })
    .where(eq(t.photos.id, data.photoId));

  const original = await Jimp.fromBuffer(data.rawBytes);
  await saveImageWrapper(
    data.photoId,
    'jpg',
    await original.getBuffer('image/jpeg'),
    original.bitmap.width,
    original.bitmap.height,
    true
  );

  for (let i = 2; i < 8; i++) {
    const size = Math.pow(2, i) * 60;
    if (size >= original.bitmap.width) {
      break;
    }
    console.log(`Generating ${data.photoId}, width=${size}`);
    const a = original.clone();
    a.resize({ w: size });
    await saveImageWrapper(
      data.photoId,
      'jpg',
      await a.getBuffer(JimpMime.jpeg),
      a.width,
      a.height
    );
  }
}
