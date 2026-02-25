import { pgTable, uuid, varchar, text, timestamp, decimal, pgEnum, uniqueIndex, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const genderEnum = pgEnum('gender', ['MALE', 'FEMALE']);
export const roleEnum = pgEnum('role', ['USER', 'ADMIN']);
export const priceRangeEnum = pgEnum('price_range', ['LOW', 'MID', 'HIGH']);
export const hotelStatusEnum = pgEnum('hotel_status', ['PENDING', 'APPROVED', 'REJECTED']);

// Users Table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  firebaseUid: varchar('firebase_uid', { length: 255 }).notNull().unique(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull().unique(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  gender: genderEnum('gender'),
  birthDate: varchar('birth_date', { length: 100 }),
  role: roleEnum('role').notNull().default('USER'),
  adminPassword: varchar('admin_password', { length: 255 }), // ✅ Mot de passe admin
  warningCount: integer('warning_count').notNull().default(0), // ✅ Nombre d'avertissements
  resetCount: integer('reset_count').notNull().default(0), // ✅ Nombre de réinitialisations
  isSuspended: integer('is_suspended').notNull().default(0), // ✅ 0 = false, 1 = true
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => {
  return {
    phoneNumberIdx: index('phone_number_idx').on(table.phoneNumber),
    usernameIdx: index('username_idx').on(table.username),
    firebaseUidIdx: index('firebase_uid_idx').on(table.firebaseUid)
  };
});

// Hotels Table
export const hotels = pgTable('hotels', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  address: text('address'),
  latitude: decimal('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),
  priceRange: priceRangeEnum('price_range'),
  minPrice: integer('min_price'),
  status: hotelStatusEnum('status').notNull().default('PENDING'),
  rejectionCount: integer('rejection_count').notNull().default(0), // ✅ Compteur de rejets
  rejectionReason: text('rejection_reason'),
  locked: integer('locked').notNull().default(0), // ✅ Verrouillé après 3 rejets
  phoneContact: varchar('phone_contact', { length: 20 }),
  emailContact: varchar('email_contact', { length: 255 }),
  websiteLink: text('website_link'),
  whatsappLink: text('whatsapp_link'),
  images: text('images').array(),
  videos: text('videos').array(),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => {
  return {
    statusIdx: index('status_idx').on(table.status),
    createdByIdx: index('created_by_idx').on(table.createdBy),
    locationIdx: index('location_idx').on(table.latitude, table.longitude),
    nameIdx: index('name_idx').on(table.name)
  };
});

// Reviews Table
export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelId: uuid('hotel_id').notNull().references(() => hotels.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 1 to 5
  comment: text('comment'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => {
  return {
    uniqueUserHotel: uniqueIndex('unique_user_hotel').on(table.userId, table.hotelId),
    hotelIdIdx: index('hotel_id_idx').on(table.hotelId),
    userIdIdx: index('user_id_idx').on(table.userId)
  };
});

// Admin Notifications Table
export const adminNotifications = pgTable('admin_notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { length: 50 }).notNull(), // 'HOTEL_ADDED', 'HOTEL_UPDATED'
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  isRead: integer('is_read').notNull().default(0), // 0 = false, 1 = true
  createdAt: timestamp('created_at').notNull().defaultNow()
}, (table) => {
  return {
    isReadIdx: index('is_read_idx').on(table.isRead),
    createdAtIdx: index('created_at_idx').on(table.createdAt)
  };
});

// ✅ NOUVEAU: Notifications Utilisateur
export const notificationTypeEnum = pgEnum('notification_type', ['REJECTION', 'WARNING', 'SUSPENSION', 'INFO']);

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  message: text('message').notNull(),
  isRead: integer('is_read').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, (table) => {
  return {
    userIdIdx: index('notification_user_id_idx').on(table.userId),
    isReadIdx: index('notification_is_read_idx').on(table.isRead)
  };
});

// ✅ NOUVEAU: Logs Admin (Audit Trail)
export const adminLogs = pgTable('admin_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  adminId: uuid('admin_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 100 }).notNull(),
  targetUserId: uuid('target_user_id').references(() => users.id, { onDelete: 'set null' }),
  targetHotelId: uuid('target_hotel_id').references(() => hotels.id, { onDelete: 'set null' }),
  details: text('details'),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, (table) => {
  return {
    adminIdIdx: index('admin_log_admin_id_idx').on(table.adminId),
    createdAtIdx: index('admin_log_created_at_idx').on(table.createdAt)
  };
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  hotels: many(hotels),
  reviews: many(reviews)
}));

export const hotelsRelations = relations(hotels, ({ one, many }) => ({
  creator: one(users, {
    fields: [hotels.createdBy],
    references: [users.id]
  }),
  reviews: many(reviews),
  notifications: many(adminNotifications)
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  hotel: one(hotels, {
    fields: [reviews.hotelId],
    references: [hotels.id]
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id]
  })
}));

export const adminNotificationsRelations = relations(adminNotifications, ({ one }) => ({
  hotel: one(hotels, {
    fields: [adminNotifications.hotelId],
    references: [hotels.id]
  }),
  user: one(users, {
    fields: [adminNotifications.userId],
    references: [users.id]
  })
}));

// ✅ Relations Notifications
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id]
  })
}));

// ✅ Relations Admin Logs
export const adminLogsRelations = relations(adminLogs, ({ one }) => ({
  admin: one(users, {
    fields: [adminLogs.adminId],
    references: [users.id]
  }),
  targetUser: one(users, {
    fields: [adminLogs.targetUserId],
    references: [users.id]
  }),
  targetHotel: one(hotels, {
    fields: [adminLogs.targetHotelId],
    references: [hotels.id]
  })
}));