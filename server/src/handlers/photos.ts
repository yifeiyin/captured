import { router, P } from './trpc';

import { z } from "zod";
import { db, t } from '../db'
import { eq, isNull, inArray, and } from 'drizzle-orm'
import { processImage } from '../ImageWorker';


export const photos = router({
  list: P.public
    .input(z.object({
      collectionName: z.string().nullable().optional(),
      tagName: z.string().nullable().optional(),
    }).optional())
    .query(async (opt) => {
      let collectionFilter = undefined;

      const collectionName = opt.input?.collectionName;
      const tagName = opt.input?.tagName;

      if (collectionName === null) {
        collectionFilter = isNull(t.photos.collectionId);

      } else if (collectionName) {
        const collectionId = (await db().query.collections.findFirst({ where: eq(t.collections.name, collectionName) }))?.id;
        if (!collectionId) return [];
        collectionFilter = eq(t.photos.collectionId, collectionId);

      } else if (tagName) {
        const tagId = (await db().query.tags.findFirst({ where: eq(t.tags.name, tagName) }))?.id;
        if (!tagId) return [];
        const photoList = (await db().query.photoTags.findMany({ where: eq(t.photoTags.tagId, tagId) })).map(x => x.photoId);
        collectionFilter = inArray(t.photos.id, photoList);

      } else {
      }

      const entries = await db().query.photos.findMany({
        where: collectionFilter,
        with: { tags: true, resources: true, collection: true },
      });

      return entries.map(entry => ({
        ...entry,
        resources: entry.resources.filter(x => !x.isOriginal),
      }));
    }),

  get: P.public.input(z.number()).query(async (opts) => {
    const entry = await db().query.photos.findFirst({ where: eq(t.photos.id, opts.input), with: { tags: true, resources: true, collection: true } });
    if (!entry) {
      throw new Error('Not found');
    }

    return {
      ...entry,
      resources: entry.resources.filter(x => !x.isOriginal),
    };
  }),

  update: P.auth.input(z.object({
    id: z.number(),
    description: z.string(),
    collection: z.number().nullable(),
  })).mutation(async (opts) => {
    await db().update(t.photos).set({ description: opts.input.description, collectionId: opts.input.collection }).where(eq(t.photos.id, opts.input.id));
    return { message: 'OK' };
  }),


  getTags: P.public.input(z.number()).query(async (opts) => {
    const photoId = opts.input;
    const allTags = await db().query.tags.findMany();
    const photoTags = await db().query.photoTags.findMany({ where: eq(t.photoTags.photoId, photoId) });
    return allTags.map(tag => ({
      ...tag,
      selected: photoTags.some(x => x.tagId === tag.id),
    }));
  }),

  updateTags: P.auth.input(z.object({
    photoId: z.number(),
    tagId: z.number(),
    selected: z.boolean(),
  })).mutation(async (opts) => {
    const { photoId, tagId, selected } = opts.input;
    if (selected) {
      await db().insert(t.photoTags).values({ photoId, tagId });
    } else {
      await db().delete(t.photoTags).where(and(eq(t.photoTags.photoId, photoId), eq(t.photoTags.tagId, tagId)));
    }
    return { message: 'OK' };
  }),

  upload: P.auth.input(z.array(z.object({
    filename: z.string(),
    type: z.string(),
    mtime: z.number(),
    size: z.number(),
    bytes: z.string(),
  }))).mutation(async (opts) => {
    await Promise.all(opts.input.map(async (img) => {
      const rawBytes = Buffer.from(img.bytes, 'base64');
      const photo = (await db().insert(t.photos).values({ description: '' }).returning())[0];

      await processImage({ photoId: photo.id, rawBytes });
    }));

    return { message: 'OK!' };
  }),

  delete: P.auth.input(z.number()).mutation(async (opts) => {
    await db().delete(t.photos).where(eq(t.photos.id, opts.input));
    return { message: 'OK' };
  }),
})
