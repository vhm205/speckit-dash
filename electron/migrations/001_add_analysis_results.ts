/**
 * Database Migration: Add Analysis Results Table
 * Creates the analysis_results table for storing AI analysis outputs
 * Also enhances the entities table with source tracking columns
 */

import Database from "better-sqlite3";

/**
 * Run the migration to add analysis_results table and enhance entities table
 */
export function runMigration(db: Database.Database): void {
  console.log("Running migration: 001_add_analysis_results");

  // Create analysis_results table
  db.exec(`
    CREATE TABLE IF NOT EXISTS analysis_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id TEXT NOT NULL UNIQUE,
      feature_id INTEGER NOT NULL,
      analysis_type TEXT NOT NULL CHECK(analysis_type IN ('summary', 'consistency', 'gaps')),
      content TEXT NOT NULL,
      token_count INTEGER,
      duration INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
    );
  `);

  // Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_analysis_results_feature 
    ON analysis_results(feature_id);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_analysis_results_type 
    ON analysis_results(analysis_type);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_analysis_results_request_id 
    ON analysis_results(request_id);
  `);

  // Check if source_file column exists in entities table
  const entityColumns = db.pragma("table_info(entities)") as Array<
    { name: string }
  >;
  const hasSourceFile = entityColumns.some((col) => col.name === "source_file");

  if (!hasSourceFile) {
    // Add source_file and line_number columns to entities table
    db.exec(`ALTER TABLE entities ADD COLUMN source_file TEXT;`);
    db.exec(`ALTER TABLE entities ADD COLUMN line_number INTEGER;`);
    console.log("Added source_file and line_number columns to entities table");
  }

  console.log("Migration 001_add_analysis_results completed successfully");
}

/**
 * Check if migration has already been applied
 */
export function isMigrationApplied(db: Database.Database): boolean {
  try {
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='analysis_results'
    `).all() as Array<{ name: string }>;
    return tables.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get migration metadata
 */
export const migrationMetadata = {
  id: "001_add_analysis_results",
  description:
    "Add analysis_results table for AI analysis storage and enhance entities table",
  createdAt: "2025-12-29",
};
