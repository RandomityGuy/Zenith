import Database from "better-sqlite3";
import { db } from "./database";
import * as bcrypt from "bcrypt";

export class Player {

    static userExistsQuery: Database.Statement;
    static userExists(username: string) {
        if (Player.userExistsQuery === null)
            Player.userExistsQuery = db.prepare(`SELECT id FROM users WHERE username=@username;`);
        
        return Player.userExistsQuery.get({ username: username }) !== undefined;
    }

    static registerUserQuery: Database.Statement;
    static registerUser(email: string, username: string, password: string) {

        if (email === "" || username === "" || password.length < 8) { // Disallow empty usernames, emails and less than 8 character passwords
            return {
                result: "false",
                error: "Bad Credentials"
            };
        }

        if (this.userExists(username)) {
            return {
                result: "false",
                error: "User already exists"
            };
        }

        if (Player.registerUserQuery === null)
            Player.registerUserQuery = db.prepare(`INSERT INTO users ("name", "username", "email", "password", "block", "sendEmail", "registerDate", "lastvisitDate", "activation", "params", "lastResetTime", "resetCount", "bluePoster", "hasColor", "colorValue", "titleFlair", "titlePrefix", "titleSuffix", "statusMsg", "profileBanner", "donations", "credits", "credits_spent", "otpKey", "otep", "requireReset", "webchatKey") VALUES (@username, @username, @email, @password, '0', '0', DATETIME('now','localtime'), DATETIME('now','localtime'), '', '', DATETIME('now','localtime'), '0', '0', '0', '000000', '0', '0', '0', '', '0', '0.0', '0', '0', '', '', '0', '');`)
        
        let hash = bcrypt.hashSync(password, 10);
        
        let result = Player.registerUserQuery.run([{ username: username, email: email, password: hash }]);
        if (result.changes === 0)
            return {
                result: "false",
                error: "Could not register"
            };
        else return {
            result: "success"
        };
    }
}