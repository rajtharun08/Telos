-- Seed data mirroring src/data/mockData.js from the frontend.
--
-- Geography model: the current user u-001 ("Aliya Rahman") lives at a base
-- point. Every item is placed at base + the documented {x,y} km offset from
-- mockData, converted to degrees (1 deg lat ~= 111.32 km; 1 deg lng ~= 88.0 km
-- at this latitude). This makes ST_Distance(item.geom, u-001.home_geom) ~= the
-- frontend's distanceKm, and ST_DWithin radial discovery behaves correctly.
--
-- Base point for u-001 (Maple Heights, fictional): lng -122.4000, lat 37.7700.

-- ---------------------------------------------------------------------------
-- Users (currentUser + neighbors). Passwords are seeded by DevDataInitializer
-- so the BCrypt hashes are generated with the app's PasswordEncoder.
-- ---------------------------------------------------------------------------
INSERT INTO app_user (id, name, email, neighborhood, joined, rating, reviews, verified, kyc_status, home_geom) VALUES
  ('u-001','Aliya Rahman','aliya.rahman@telos.app','Maple Heights','2025-09-14',4.9,38,TRUE,'VERIFIED',
     ST_SetSRID(ST_MakePoint(-122.4000, 37.7700),4326)::geography),
  ('u-101','Daniel Wong','daniel.wong@telos.app','Maple Heights','2025-03-02',4.8,52,TRUE,'VERIFIED',
     ST_SetSRID(ST_MakePoint(-122.3955, 37.7646),4326)::geography),
  ('u-102','Priya Nair','priya.nair@telos.app','Maple Heights','2025-06-19',5.0,21,TRUE,'VERIFIED',
     ST_SetSRID(ST_MakePoint(-122.4125, 37.7781),4326)::geography),
  ('u-103','Marcus Bell','marcus.bell@telos.app','Riverside','2024-11-30',4.6,67,TRUE,'VERIFIED',
     ST_SetSRID(ST_MakePoint(-122.3807, 37.7826),4326)::geography),
  ('u-104','Sofia Marin','sofia.marin@telos.app','Maple Heights','2026-01-08',4.7,14,FALSE,'PENDING',
     ST_SetSRID(ST_MakePoint(-122.4034, 37.7736),4326)::geography),
  ('u-105','Liam Carter','liam.carter@telos.app','Oak Park','2025-02-22',4.9,43,TRUE,'VERIFIED',
     ST_SetSRID(ST_MakePoint(-122.4227, 37.7538),4326)::geography);

-- u-001 (the demo current user) is also the admin so the AdminQueue page works.
UPDATE app_user SET admin = TRUE WHERE id = 'u-001';

-- ---------------------------------------------------------------------------
-- Items. geom = base point + offset(km). Offsets are visible inline so the
-- mapping back to mockData stays auditable.
-- ---------------------------------------------------------------------------
INSERT INTO item (id, title, category, owner_id, mode, state, price, deposit, geom, vicinity, description, rating, reviews, image) VALUES
  ('it-01','Bosch 18V Cordless Drill Kit','tools','u-101','RENT','AVAILABLE',9,60,
     ST_SetSRID(ST_MakePoint(-122.4000+(0.4/88.0), 37.7700+(-0.6/111.32)),4326)::geography,
     'Maple Heights · NW','Professional-grade 18V drill with two batteries, charger, and a 40-piece bit set. Great for furniture assembly and light renovation.',4.9,12,'linear-gradient(135deg,#f59e0b,#b45309)'),
  ('it-02','DJI Mini 3 Drone','electronics','u-102','RENT','AVAILABLE',24,200,
     ST_SetSRID(ST_MakePoint(-122.4000+(-1.1/88.0), 37.7700+(0.9/111.32)),4326)::geography,
     'Maple Heights · E','4K camera drone, under 249g. Includes 3 batteries, ND filters, and the Fly More case. Perfect for weekend shoots.',5.0,8,'linear-gradient(135deg,#6366f1,#3730a3)'),
  ('it-03','Pressure Washer 2000PSI','outdoor','u-103','RENT','AVAILABLE',14,80,
     ST_SetSRID(ST_MakePoint(-122.4000+(1.7/88.0), 37.7700+(1.4/111.32)),4326)::geography,
     'Riverside · S','Electric pressure washer with 3 nozzle tips. Cleans driveways, decks, and siding in a fraction of the time.',4.7,19,'linear-gradient(135deg,#0ea5e9,#0369a1)'),
  ('it-04','Stand Mixer (Pro 600)','kitchen','u-104','BORROW','AVAILABLE',0,50,
     ST_SetSRID(ST_MakePoint(-122.4000+(-0.3/88.0), 37.7700+(0.4/111.32)),4326)::geography,
     'Maple Heights · Central','6-quart stand mixer with dough hook, whisk, and flat beater. Borrow it for your weekend baking marathon.',4.6,5,'linear-gradient(135deg,#ec4899,#9d174d)'),
  ('it-05','Camping Tent (4-Person)','outdoor','u-105','BORROW','AVAILABLE',0,40,
     ST_SetSRID(ST_MakePoint(-122.4000+(-2.0/88.0), 37.7700+(-1.8/111.32)),4326)::geography,
     'Oak Park · W','Weatherproof 4-person dome tent with rainfly and footprint. Sets up in under 10 minutes.',4.9,27,'linear-gradient(135deg,#10b981,#065f46)'),
  ('it-06','PlayStation 5 + 2 Controllers','electronics','u-101','RENT','AVAILABLE',18,250,
     ST_SetSRID(ST_MakePoint(-122.4000+(0.5/88.0), 37.7700+(-0.5/111.32)),4326)::geography,
     'Maple Heights · NW','Disc edition PS5 with two DualSense controllers and three popular titles. Ideal for a weekend tournament.',4.8,31,'linear-gradient(135deg,#64748b,#1e293b)'),
  ('it-07','Mountain Bike (27.5")','sports','u-103','BUY','AVAILABLE',320,0,
     ST_SetSRID(ST_MakePoint(-122.4000+(1.2/88.0), 37.7700+(-1.5/111.32)),4326)::geography,
     'Riverside · SE','Lightly used hardtail mountain bike, size M. Hydraulic disc brakes, recently serviced. Selling to upgrade.',4.5,9,'linear-gradient(135deg,#f43f5e,#9f1239)'),
  ('it-08','Projector 1080p + Screen','electronics','u-102','RENT','AVAILABLE',12,70,
     ST_SetSRID(ST_MakePoint(-122.4000+(-1.0/88.0), 37.7700+(1.0/111.32)),4326)::geography,
     'Maple Heights · E','Full HD projector with a 100" pull-down screen. Movie night, presentations, or the big game.',4.9,16,'linear-gradient(135deg,#8b5cf6,#5b21b6)'),
  ('it-09','Carpentry Hand Tool Set','tools','u-105','BORROW','AVAILABLE',0,30,
     ST_SetSRID(ST_MakePoint(-122.4000+(-1.9/88.0), 37.7700+(-1.9/111.32)),4326)::geography,
     'Oak Park · W','Complete hand tool set: hammers, chisels, hand saw, square, and clamps. Everything for a small woodworking project.',4.8,11,'linear-gradient(135deg,#d97706,#78350f)'),
  ('it-10','Espresso Machine (Barista)','kitchen','u-104','RENT','AVAILABLE',8,90,
     ST_SetSRID(ST_MakePoint(-122.4000+(-0.4/88.0), 37.7700+(0.3/111.32)),4326)::geography,
     'Maple Heights · Central','15-bar espresso machine with steam wand and built-in grinder. Pull cafe-quality shots at home.',4.7,6,'linear-gradient(135deg,#0d9488,#134e4a)'),
  ('it-11','Folding Banquet Tables (x4)','party','u-103','BORROW','AVAILABLE',0,25,
     ST_SetSRID(ST_MakePoint(-122.4000+(1.5/88.0), 37.7700+(1.6/111.32)),4326)::geography,
     'Riverside · S','Four 6-ft folding tables, perfect for parties, garage sales, or community events.',4.6,4,'linear-gradient(135deg,#f97316,#9a3412)'),
  ('it-12','Baby Jogger Stroller','baby','u-102','BUY','AVAILABLE',140,0,
     ST_SetSRID(ST_MakePoint(-122.4000+(-0.9/88.0), 37.7700+(0.8/111.32)),4326)::geography,
     'Maple Heights · E','All-terrain jogging stroller, excellent condition. Smooth suspension and easy one-hand fold.',5.0,7,'linear-gradient(135deg,#14b8a6,#115e59)');

INSERT INTO item_spec (item_id, spec) VALUES
  ('it-01','2 x 2.0Ah batteries'),('it-01','40-piece bit set'),('it-01','Hard carry case'),
  ('it-02','4K/30fps camera'),('it-02','3 batteries (~90 min)'),('it-02','ND filter set'),
  ('it-03','2000 PSI'),('it-03','3 quick-connect tips'),('it-03','8m hose'),
  ('it-04','6 qt bowl'),('it-04','3 attachments'),('it-04','575W motor'),
  ('it-05','Sleeps 4'),('it-05','Waterproof 3000mm'),('it-05','4.2 kg packed'),
  ('it-06','Disc edition'),('it-06','2 controllers'),('it-06','3 games included'),
  ('it-07','Size M frame'),('it-07','Hydraulic disc brakes'),('it-07','21 speed'),
  ('it-08','1080p native'),('it-08','100" screen'),('it-08','HDMI + USB-C'),
  ('it-09','28 pieces'),('it-09','Roll-up tool bag'),('it-09','Beginner friendly'),
  ('it-10','15 bar pump'),('it-10','Built-in grinder'),('it-10','Steam wand'),
  ('it-11','4 x 6ft tables'),('it-11','Seats ~32'),('it-11','Easy fold'),
  ('it-12','All-terrain'),('it-12','One-hand fold'),('it-12','UV canopy');

-- ---------------------------------------------------------------------------
-- Transactions. mockData "role" is from u-001's perspective; we store explicit
-- borrower_id / lender_id (role is re-derived per viewer at read time).
-- ---------------------------------------------------------------------------
INSERT INTO tx (id, item_id, item_title, borrower_id, lender_id, mode, state, fee, deposit, days, late_fee, created_at, due_at, returned_at, coords_unlocked) VALUES
  ('tx-1001','it-02','DJI Mini 3 Drone','u-001','u-102','RENT','ACTIVE',72,200,3,NULL,'2026-06-22T10:00:00Z','2026-06-29T18:00:00Z',NULL,TRUE),
  ('tx-1002','it-04','Stand Mixer (Pro 600)','u-001','u-104','BORROW','APPROVED',0,50,2,NULL,'2026-06-25T14:30:00Z','2026-06-28T12:00:00Z',NULL,TRUE),
  ('tx-1003','it-01','Bosch 18V Cordless Drill Kit','u-103','u-001','RENT','REQUESTED',27,60,3,NULL,'2026-06-26T09:15:00Z','2026-06-30T18:00:00Z',NULL,FALSE),
  ('tx-1004','it-08','Projector 1080p + Screen','u-001','u-102','RENT','RETURNED',36,70,3,NULL,'2026-06-10T19:00:00Z','2026-06-13T19:00:00Z','2026-06-13T17:42:00Z',TRUE),
  ('tx-1005','it-06','PlayStation 5 + 2 Controllers','u-105','u-001','RENT','OVERDUE',54,250,3,32,'2026-06-18T12:00:00Z','2026-06-24T12:00:00Z',NULL,TRUE),
  ('tx-1006','it-05','Camping Tent (4-Person)','u-001','u-105','BORROW','DECLINED',0,40,4,NULL,'2026-06-05T08:00:00Z',NULL,NULL,FALSE);

-- ---------------------------------------------------------------------------
-- Wallet + ledger for u-001
-- ---------------------------------------------------------------------------
INSERT INTO wallet (user_id, available, locked, earned, pending_clear, version) VALUES
  ('u-001',412.5,250.0,318.75,90.0,0),
  ('u-101',150.0,0,0,0,0),
  ('u-102',150.0,0,0,0,0),
  ('u-103',150.0,0,0,0,0),
  ('u-104',150.0,0,0,0,0),
  ('u-105',150.0,0,0,0,0);

INSERT INTO ledger_entry (id, user_id, type, label, amount, at, status, tx_id) VALUES
  ('l-1','u-001','ESCROW_LOCK','Escrow locked · DJI Mini 3 Drone',-272,'2026-06-22T10:00:00Z','LOCKED','tx-1001'),
  ('l-2','u-001','PAYOUT','Rental income · Projector 1080p',36,'2026-06-13T18:00:00Z','CLEARED','tx-1004'),
  ('l-3','u-001','DEPOSIT_RELEASE','Deposit returned · Projector 1080p',70,'2026-06-13T18:00:00Z','CLEARED','tx-1004'),
  ('l-4','u-001','TOPUP','Wallet top-up · receipt #4821',90,'2026-06-26T11:20:00Z','PENDING',NULL),
  ('l-5','u-001','PENALTY','Late fee credit · PlayStation 5',32,'2026-06-25T00:00:00Z','CLEARED','tx-1005'),
  ('l-6','u-001','ESCROW_LOCK','Escrow locked · Stand Mixer deposit',-50,'2026-06-25T14:30:00Z','LOCKED','tx-1002');

-- ---------------------------------------------------------------------------
-- Notifications for u-001
-- ---------------------------------------------------------------------------
INSERT INTO notification (id, user_id, type, text, at, unread) VALUES
  ('n-1','u-001','REQUEST','Marcus Bell requested your Bosch Drill Kit','2026-06-26T09:15:00Z',TRUE),
  ('n-2','u-001','APPROVED','Your Stand Mixer borrow was approved','2026-06-25T14:32:00Z',TRUE),
  ('n-3','u-001','OVERDUE','PlayStation 5 rental is overdue — late fees accruing','2026-06-24T12:05:00Z',TRUE),
  ('n-4','u-001','RETURNED','Projector return confirmed, escrow released','2026-06-13T18:00:00Z',FALSE);

-- ---------------------------------------------------------------------------
-- Admin verification queue
-- ---------------------------------------------------------------------------
INSERT INTO verification (id, kind, user_id, submitted_at, amount, doc, status, ledger_id) VALUES
  ('vq-1','KYC','u-104','2026-06-26T08:10:00Z',NULL,'Government ID + selfie','PENDING',NULL),
  ('vq-2','RECEIPT','u-001','2026-06-26T11:20:00Z',90,'Bank transfer receipt #4821','PENDING','l-4'),
  ('vq-3','RECEIPT','u-105','2026-06-25T16:40:00Z',250,'High-value top-up receipt','PENDING',NULL),
  ('vq-4','KYC','u-103','2026-06-24T13:05:00Z',NULL,'Address proof','APPROVED',NULL),
  ('vq-5','RECEIPT','u-102','2026-06-23T10:00:00Z',120,'Card top-up receipt','REJECTED',NULL);
