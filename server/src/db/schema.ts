import { relations } from "drizzle-orm";
import { int, sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

const id = {
  id: int({ mode: "number" }).primaryKey({ autoIncrement: true }),
}
const timestamps = {
  createdAt: int({ mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}



export const photos = sqliteTable("photos", {
  ...id,
  description: text().notNull().default(""),
  collectionId: integer().references(() => collections.id, { onDelete: 'set null' }),
  width: integer().notNull().default(0),
  height: integer().notNull().default(0),
  blurhash: text().notNull().default(""),
  ...timestamps,
});

export const photos$r = relations(photos, ({ many, one }) => ({
  resources: many(photoResources),
  tags: many(photoTags),
  collection: one(collections, { fields: [photos.collectionId], references: [collections.id] }),
}));



export const tags = sqliteTable("tags", {
  ...id,
  name: text().notNull().unique(),
  ...timestamps,
})

export const tags$r = relations(tags, ({ many }) => ({
  photos: many(photoTags),
}));



export const photoTags = sqliteTable("photo_tags", {
  photoId: integer().notNull().references(() => photos.id, { onDelete: 'cascade' }),
  tagId: integer().notNull().references(() => tags.id, { onDelete: 'set null' }),
},
  (t) => [
    primaryKey({ columns: [t.photoId, t.tagId] }),
  ]
);

export const photoTags$r = relations(photoTags, ({ one }) => ({
  photo: one(photos, { fields: [photoTags.photoId], references: [photos.id] }),
  tag: one(tags, { fields: [photoTags.tagId], references: [tags.id] }),
}));



export const collections = sqliteTable("collections", {
  ...id,
  name: text().notNull().unique(),
  description: text().notNull().default(""),
  ...timestamps,
});

export const collections$r = relations(collections, ({ many }) => ({
  photos: many(photos),
}));



export const photoResources = sqliteTable("photo_resources", {
  ...id,
  photoId: integer().notNull().references(() => photos.id, { onDelete: 'cascade' }),
  type: text().notNull(),
  fileId: text().notNull(),
  size: integer().notNull(),
  height: integer().notNull(),
  width: integer().notNull(),
  isOriginal: integer({ mode: 'boolean' }).notNull().default(false),
  ...timestamps,
})

export const photoResources$r = relations(photoResources, ({ one }) => ({
  photo: one(photos, { fields: [photoResources.photoId], references: [photos.id] }),
}));



export const passkeys = sqliteTable("passkeys", {
  ...id,
  friendlyName: text().notNull().default(""),
  keyId: text().notNull().unique(),
  userName: text().notNull(),
  publicKey: text().notNull(),
  counter: integer().notNull().default(0),
  transports: text().notNull().default(""),
  deviceType: text().notNull().default(""),
  backedUp: integer({ mode: 'boolean' }).notNull().default(false),
  ...timestamps,
})

