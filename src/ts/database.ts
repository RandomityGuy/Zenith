import Database from "better-sqlite3";

export const db = new Database("src/db/leaderboards.db", {});
db.pragma('journal_mode = WAL');