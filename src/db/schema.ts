import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

// Every table enables RLS with no policies: the app connects as the table owner
// (bypasses RLS), while Supabase's public Data API roles (anon/authenticated) see nothing.
export const assets = pgTable("assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  type: text("type").notNull().default("image"),
  mime: text("mime"),
  sizeBytes: integer("size_bytes"),
  width: integer("width"),
  height: integer("height"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}).enableRLS();

export const scenes = pgTable("scenes", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  template: text("template").notNull().default("retail-promo"),
  // Copy
  eyebrow: text("eyebrow"),
  headline: text("headline"),
  subheadline: text("subheadline"),
  productName: text("product_name"),
  description: text("description"),
  originalPrice: text("original_price"),
  promoPrice: text("promo_price"),
  discountBadge: text("discount_badge"),
  ctaText: text("cta_text"),
  tickerText: text("ticker_text"),
  // Media
  imageUrl: text("image_url"),
  imageFit: text("image_fit").default("cover"),
  imagePosition: text("image_position").default("center"),
  videoUrl: text("video_url"),
  bgImageUrl: text("bg_image_url"),
  theme: text("theme").default("none"),
  // Style
  bgFrom: text("bg_from").default("#0b1020"),
  bgTo: text("bg_to").default("#1e2a5a"),
  bgAngle: integer("bg_angle").default(135),
  accentColor: text("accent_color").default("#ff3b30"),
  textColor: text("text_color").default("#ffffff"),
  mutedColor: text("muted_color").default("#c7cede"),
  cardColor: text("card_color").default("#141b33"),
  // Second colour of the value-store templates (the "sale yellow"); empty = template default
  highlightColor: text("highlight_color"),
  // Motion
  animationPreset: text("animation_preset").default("launch"),
  durationSec: integer("duration_sec").default(10),
  transition: text("transition").default("fade"),
  staggerMs: integer("stagger_ms").default(120),
  kenBurns: text("ken_burns").default("zoom-in"),
  overlayOpacity: integer("overlay_opacity").default(45),
  layoutVariant: text("layout_variant").default("A"),
  // Structured items for menu / grid templates
  items: jsonb("items").$type<MenuItem[] | null>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}).enableRLS();

export type MenuItem = {
  name: string;
  price?: string;
  desc?: string;
  tag?: string;
  image?: string;
};

export const playlists = pgTable("playlists", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  loop: boolean("loop").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}).enableRLS();

export const playlistItems = pgTable("playlist_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  playlistId: uuid("playlist_id").notNull(),
  sceneId: uuid("scene_id").notNull(),
  position: integer("position").notNull().default(0),
  durationOverride: integer("duration_override"),
  transitionOverride: text("transition_override"),
}, (t) => [
  index("idx_playlist_items_playlist").on(t.playlistId, t.position),
]).enableRLS();

export const displays = pgTable("displays", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  location: text("location"),
  playlistId: uuid("playlist_id"),
  resolution: text("resolution").default("1920x1080"),
  orientation: text("orientation").default("landscape"),
  status: text("status").default("offline"),
  lastSeen: timestamp("last_seen", { withTimezone: true }),
  pairingCode: text("pairing_code"),
  settings: jsonb("settings").$type<Record<string, unknown> | null>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}).enableRLS();

export const schedules = pgTable("schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  playlistId: uuid("playlist_id").notNull(),
  displayId: uuid("display_id"),
  days: text("days").default("1,2,3,4,5,6,0"),
  startTime: text("start_time").default("09:00"),
  endTime: text("end_time").default("21:00"),
  priority: integer("priority").default(0),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("idx_schedules_enabled").on(t.enabled, t.priority.desc().nullsFirst()),
]).enableRLS();

// Key/value app settings — "brand" holds the business details (see src/lib/brand.ts)
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}).enableRLS();

export type SceneRow = typeof scenes.$inferSelect;
export type PlaylistRow = typeof playlists.$inferSelect;
export type AssetRow = typeof assets.$inferSelect;
export type DisplayRow = typeof displays.$inferSelect;
export type ScheduleRow = typeof schedules.$inferSelect;
