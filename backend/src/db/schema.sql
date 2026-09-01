-- Vehicle Service Operations Dashboard schema (SQLite)

CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'OPERATIONS' CHECK(role IN ('ADMIN','OPERATIONS','MECHANIC')),
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Customer (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  customerSince TEXT NOT NULL DEFAULT (datetime('now')),
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Vehicle (
  id TEXT PRIMARY KEY,
  customerId TEXT NOT NULL REFERENCES Customer(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  regNumber TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_vehicle_customer ON Vehicle(customerId);

CREATE TABLE IF NOT EXISTS Mechanic (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK(status IN ('AVAILABLE','ASSIGNED','ON_THE_WAY','BUSY','OFFLINE')),
  rating REAL NOT NULL DEFAULT 4.5,
  latitude REAL,
  longitude REAL,
  jobsCompleted INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_mechanic_status ON Mechanic(status);

CREATE TABLE IF NOT EXISTS ServiceCategory (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS Service (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  categoryId TEXT NOT NULL REFERENCES ServiceCategory(id),
  basePrice REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_service_category ON Service(categoryId);

CREATE TABLE IF NOT EXISTS Booking (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  customerId TEXT NOT NULL REFERENCES Customer(id),
  vehicleId TEXT NOT NULL REFERENCES Vehicle(id),
  serviceId TEXT NOT NULL REFERENCES Service(id),
  mechanicId TEXT REFERENCES Mechanic(id),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','ASSIGNED','ON_THE_WAY','IN_PROGRESS','COMPLETED','CANCELLED')),
  amount REAL NOT NULL,
  address TEXT NOT NULL,
  notes TEXT,
  scheduledAt TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_booking_status ON Booking(status);
CREATE INDEX IF NOT EXISTS idx_booking_scheduled ON Booking(scheduledAt);
CREATE INDEX IF NOT EXISTS idx_booking_customer ON Booking(customerId);
CREATE INDEX IF NOT EXISTS idx_booking_mechanic ON Booking(mechanicId);
CREATE INDEX IF NOT EXISTS idx_booking_service ON Booking(serviceId);

CREATE TABLE IF NOT EXISTS BookingStatusHistory (
  id TEXT PRIMARY KEY,
  bookingId TEXT NOT NULL REFERENCES Booking(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changedAt TEXT NOT NULL DEFAULT (datetime('now')),
  note TEXT
);
CREATE INDEX IF NOT EXISTS idx_bsh_booking ON BookingStatusHistory(bookingId);

CREATE TABLE IF NOT EXISTS Notification (
  id TEXT PRIMARY KEY,
  message TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  bookingId TEXT REFERENCES Booking(id) ON DELETE SET NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notification_read ON Notification(read);
