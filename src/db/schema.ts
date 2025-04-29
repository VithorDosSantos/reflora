import { pgTable, serial, varchar, timestamp, text, real, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const alertLevelEnum = pgEnum('alert_level', ['INFO', 'WARNING', 'CRITICAL']);

export const user = pgTable('user', {
  userId: serial('user_id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  creationDate: timestamp('creation_date').defaultNow().notNull(),
});

export const sensor = pgTable('sensor', {
  sensorId: serial('sensor_id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => user.userId, { onDelete: 'cascade' }),
  sensorName: varchar('sensor_name', { length: 255 }).notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  installationDate: timestamp('installation_date').defaultNow().notNull(),
});

export const sensorData = pgTable('sensor_data', {
  sensorDataId: serial('sensor_data_id').primaryKey(),
  sensorId: integer('sensor_id')
    .notNull()
    .references(() => sensor.sensorId, { onDelete: 'cascade' }),
  pH: real('pH').notNull(),
  shadingIndex: real('shading_index').notNull(),
  airHumidity: real('air_humidity').notNull(),
  soilNutrients: text('soil_nutrients').notNull(),
  temperature: real('temperature').notNull(),
  dateTime: timestamp('date_time').defaultNow().notNull(),
});

export const sensorAlert = pgTable('alert', {
  alertId: serial('alert_id').primaryKey(),
  sensorId: integer('sensor_id')
    .notNull()
    .references(() => sensor.sensorId, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  level: alertLevelEnum('level').notNull().default('INFO'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

export const userRelations = relations(user, ({ many }) => ({
  sensors: many(sensor),
}));

export const sensorRelations = relations(sensor, ({ one, many }) => ({
  user: one(user, {
    fields: [sensor.userId],
    references: [user.userId],
  }),
  sensorData: many(sensorData),
  alerts: many(sensorAlert),
}));

export const sensorDataRelations = relations(sensorData, ({ one }) => ({
  sensor: one(sensor, {
    fields: [sensorData.sensorId],
    references: [sensor.sensorId],
  }),
}));

export const alertRelations = relations(sensorAlert, ({ one }) => ({
  sensor: one(sensor, {
    fields: [sensorAlert.sensorId],
    references: [sensor.sensorId],
  }),
}));