import * as Database from "better-sqlite3";
import * as fs from 'fs-extra'
import * as path from 'path'
import * as https from 'https'
import * as http from 'http'
import * as url from 'url'

export class Storage {

    static settings: { 
        online: true,
        halloween_event: true,
        winter_event: true,
        welcome: string,
        chat_help_info: string,
        chat_help_cmdlist: string,
        history_count: number,
        default_name: string,
        april20_uid: number,
        show_wr_messages: boolean,
        april20_chance: number,
        show_egg_wr_messages: boolean,
        wr_player_count: number,
        chat_colors: { key: string, value: string }[],
        chat_statuses: string[],
        chat_flairs: string[],

        PQServer: string,
        webchatServer: string,
        mpMasterServer: string,

        webchatWebhook: string,
        errorWebhook: string,

        gameVersion: number
    }

    static queryCache: Map<string, Database.Statement>;
    
    static db: Database.Database;

    static gameVersionList: [];

    static initStorage() {
        // Connect to the database
        Storage.db = new Database(path.join(__dirname,'db', 'leaderboards.db'), {});
        Storage.db.pragma('journal_mode = WAL');

        // Load the settings file
        let file = fs.readFileSync(path.join(__dirname,'storage', 'settings.json'), 'utf-8')
        Storage.settings = JSON.parse(file);
        
        // Load the game version list file
        file = fs.readFileSync(path.join(__dirname,'storage', 'versions.json'), 'utf-8')
        Storage.gameVersionList = JSON.parse(file);

        Storage.queryCache = new Map<string, Database.Statement>();
    }

    // Used to create queries for the sqlite database, with caching
    static query(queryString: string) {
        if (Storage.queryCache.has(queryString))
            return Storage.queryCache.get(queryString);
        
        let q = Storage.db.prepare(queryString);
        Storage.queryCache.set(queryString, q);
        return q;
    }
    
    static dispose() {
        Storage.db.close();
    }

    static log(username: string, content: string, type: "log" | "error" = "log") {
        const data = JSON.stringify({
            username: username,
            content: content
        })

        let webhookurl = type === "log" ? new url.URL(Storage.settings.webchatWebhook) : new url.URL(Storage.settings.errorWebhook)

        const options = {
            hostname: webhookurl.hostname,
            port: 80,
            path: webhookurl.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        }

        const req = webhookurl.protocol === "https:" ? https.request(options) : http.request(options);

        req.on('error', error => {
            console.error(error)
        })

        req.write(data)
        req.end()
    }
}