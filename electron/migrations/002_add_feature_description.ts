/**
 * Database Migration: Add Feature Description Column
 * Adds description column to features table for AI-generated summaries
 */

import Database from "better-sqlite3";

/**
 * Run the migration to add description column to features
 */
export function runMigration(db: Database.Database): void {
    console.log("Running migration: 002_add_feature_description");

    // Check if description column exists in features table
    const featureColumns = db.pragma("table_info(features)") as Array<
        { name: string }
    >;
    const hasDescription = featureColumns.some((col) => col.name === "description");

    if (!hasDescription) {
        // Add description column to features table
        db.exec(`ALTER TABLE features ADD COLUMN description TEXT;`);
        console.log("Added description column to features table");
    }

    console.log("Migration 002_add_feature_description completed successfully");
}

/**
 * Check if migration has already been applied
 */
export function isMigrationApplied(db: Database.Database): boolean {
    try {
        const columns = db.pragma("table_info(features)") as Array<
            { name: string }
        >;
        return columns.some((col) => col.name === "description");
    } catch {
        return false;
    }
}

/**
 * Get migration metadata
 */
export const migrationMetadata = {
    id: "002_add_feature_description",
    description: "Add description column to features table for AI-generated summaries",
    createdAt: "2025-12-29",
};
