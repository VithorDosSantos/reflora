import { pgTable, serial, varchar, timestamp, real, text, integer, primaryKey, foreignKey } from 'drizzle-orm/pg-core';

// Tabela user
export const userTable = pgTable('user', {
  userId: serial('user_id').primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).unique(),
  password: varchar('password', { length: 255 }),
  creationDate: timestamp('creation_date').defaultNow(),
});

// Tabela sensor
export const sensorTable = pgTable('sensor', {
  sensorId: serial('sensor_id').primaryKey(),
  userId: integer('user_id').references(() => userTable.userId),
  sensorName: varchar('sensor_name', { length: 255 }),
  location: varchar('location', { length: 255 }),
  installationDate: timestamp('installation_date'),
}, (table) => ({
  fkUser: foreignKey({
    columns: [table.userId],
    foreignColumns: [userTable.userId],
    name: 'fk_user',
  }),
}));

// Tabela sensor_data
export const sensorDataTable = pgTable('sensor_data', {
  sensorDataId: serial('sensor_data_id').primaryKey(),
  sensorId: integer('sensor_id').references(() => sensorTable.sensorId),
  ph: real('ph'),
  shadingIndex: real('shading_index'),
  airHumidity: real('air_humidity'),
  soilHumidity: real('soil_humidity'),
  soilNutrients: text('soil_nutrients'),
  temperature: real('temperature'),
  dateTime: timestamp('date_time').defaultNow(),
}, (table) => ({
  fkSensor: foreignKey({
    columns: [table.sensorId],
    foreignColumns: [sensorTable.sensorId],
    name: 'fk_sensor',
  }),
}));

// Tabela alert
export const alertTable = pgTable('alert', {
  alertId: serial('alert_id').primaryKey(),
  sensorId: integer('sensor_id').references(() => sensorTable.sensorId),
  message: text('message'),
  level: varchar('level', { length: 50 }),
  timestamp: timestamp('timestamp').defaultNow(),
}, (table) => ({
  fkSensorAlert: foreignKey({
    columns: [table.sensorId],
    foreignColumns: [sensorTable.sensorId],
    name: 'fk_sensor_alert',
  }),
}));