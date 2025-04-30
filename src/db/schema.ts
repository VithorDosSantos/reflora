import { pgTable, serial, varchar, timestamp, text, real, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const alertLevelEnum = pgEnum('alert_level', ['INFO', 'WARNING', 'CRITICAL']);

export const userTable = pgTable('user', {
  userId: serial('user_id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  creationDate: timestamp('creation_date').defaultNow().notNull(),
});

export const sensorTable = pgTable('sensor', {
  sensorId: integer('sensor_id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => userTable.userId, { onDelete: 'cascade' }),
  sensorName: varchar('sensor_name', { length: 255 }).notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  installationDate: timestamp('installation_date').defaultNow().notNull(),
});

export const sensorDataTable = pgTable('sensor_data', {
  sensorDataId: varchar('sensor_data_id').primaryKey(),
  sensorId: integer('sensor_id')
    .notNull()
    .references(() => sensorTable.sensorId, { onDelete: 'cascade' }),
  pH: real('pH').notNull(),
  shadingIndex: real('shading_index').notNull(),
  airHumidity: real('air_humidity').notNull(),
  soilNutrients: text('soil_nutrients').notNull(),
  temperature: real('temperature').notNull(),
  dateTime: timestamp('date_time').defaultNow().notNull(),
});

export const sensorAlertTable = pgTable('alert', {
  alertId: serial('alert_id').primaryKey(),
  sensorId: integer('sensor_id')
    .notNull()
    .references(() => sensorTable.sensorId, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  level: alertLevelEnum('level').notNull().default('INFO'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

export const userRelations = relations(userTable, ({ many }) => ({
  sensors: many(sensorTable),
}));

export const sensorRelations = relations(sensorTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [sensorTable.userId],
    references: [userTable.userId],
  }),
  sensorData: many(sensorDataTable),
  alerts: many(sensorAlertTable),
}));

export const sensorDataRelations = relations(sensorDataTable, ({ one }) => ({
  sensor: one(sensorTable, {
    fields: [sensorDataTable.sensorId],
    references: [sensorTable.sensorId],
  }),
}));

export const alertRelations = relations(sensorAlertTable, ({ one }) => ({
  sensor: one(sensorTable, {
    fields: [sensorAlertTable.sensorId],
    references: [sensorTable.sensorId],
  }),
}));

export type User = typeof userTable.$inferSelect;
export type Sensor = typeof sensorTable.$inferSelect;
export type SensorData = typeof sensorDataTable.$inferSelect;
export type SensorAlert = typeof sensorAlertTable.$inferSelect;