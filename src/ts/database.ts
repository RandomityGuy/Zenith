import * as Database from "better-sqlite3";

export let db: Database.Database;

export function initDatabase() {
    db = new Database("src/db/leaderboards.db", {});
    db.pragma('journal_mode = WAL');
}

export function closeDatabase() {
    db.close();
}