/**
 * ChatIn MongoDB Backup & Restore Script (Req #20)
 * ---------------------------------------------------
 * Exports all MongoDB collections to timestamped JSON files.
 * Schedule via cron for automated backups.
 *
 * Usage:
 *   node backend/scripts/backup-db.js backup    → exports to backups/backup-<timestamp>/
 *   node backend/scripts/backup-db.js restore <path>  → restores from backup folder
 *
 * Cron example (daily at 3am):
 *   0 3 * * * node /path/to/backend/scripts/backup-db.js backup >> /var/log/chatin-backup.log 2>&1
 */

import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import "dotenv/config";

const MONGO_URI = process.env.MONGO_URI;
const BACKUP_DIR = path.join(process.cwd(), "backups");
const COLLECTIONS = ["users", "messages", "rooms"];

if (!MONGO_URI) {
  console.error("❌ MONGO_URI not set. Cannot perform backup.");
  process.exit(1);
}

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outDir = path.join(BACKUP_DIR, `backup-${timestamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`\n📦 Starting ChatIn DB Backup at ${timestamp}`);
  console.log(`   Target: ${outDir}\n`);

  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  for (const col of COLLECTIONS) {
    try {
      const docs = await db.collection(col).find({}).toArray();
      const outFile = path.join(outDir, `${col}.json`);
      fs.writeFileSync(outFile, JSON.stringify(docs, null, 2));
      console.log(`   ✅ ${col}: ${docs.length} documents → ${outFile}`);
    } catch (err) {
      console.error(`   ❌ Failed to backup ${col}: ${err.message}`);
    }
  }

  // Write metadata
  const meta = {
    timestamp,
    collections: COLLECTIONS,
    mongoUri: MONGO_URI.replace(/\/\/.*@/, "//***@"), // mask credentials
  };
  fs.writeFileSync(path.join(outDir, "backup-meta.json"), JSON.stringify(meta, null, 2));

  await mongoose.disconnect();
  console.log(`\n🎉 Backup complete: ${outDir}\n`);
}

async function restore(backupPath) {
  if (!backupPath || !fs.existsSync(backupPath)) {
    console.error("❌ Backup path does not exist:", backupPath);
    process.exit(1);
  }

  console.log(`\n♻️  Starting ChatIn DB Restore from: ${backupPath}\n`);
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  for (const col of COLLECTIONS) {
    const file = path.join(backupPath, `${col}.json`);
    if (!fs.existsSync(file)) {
      console.warn(`   ⚠️  No backup file found for: ${col}`);
      continue;
    }
    try {
      const docs = JSON.parse(fs.readFileSync(file, "utf8"));
      if (docs.length > 0) {
        // Drop then insert to restore exact state
        await db.collection(col).deleteMany({});
        await db.collection(col).insertMany(docs);
        console.log(`   ✅ ${col}: restored ${docs.length} documents`);
      } else {
        console.log(`   ℹ️  ${col}: empty backup, skipped`);
      }
    } catch (err) {
      console.error(`   ❌ Failed to restore ${col}: ${err.message}`);
    }
  }

  await mongoose.disconnect();
  console.log("\n🎉 Restore complete.\n");
}

const [,, command, arg] = process.argv;

if (command === "backup") {
  backup().catch(console.error);
} else if (command === "restore") {
  restore(arg).catch(console.error);
} else {
  console.log("Usage:");
  console.log("  node backend/scripts/backup-db.js backup");
  console.log("  node backend/scripts/backup-db.js restore <backup-folder-path>");
  process.exit(0);
}
