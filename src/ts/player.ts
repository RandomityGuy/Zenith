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
			Player.registerUserQuery = db.prepare(`INSERT INTO users ("name", "username", "email", "password", "block", "sendEmail", "registerDate", "lastvisitDate", "activation", "params", "lastResetTime", "resetCount", "bluePoster", "hasColor", "colorValue", "titleFlair", "titlePrefix", "titleSuffix", "statusMsg", "profileBanner", "donations", "credits", "credits_spent", "otpKey", "otep", "requireReset", "webchatKey") VALUES (@username, @username, @email, @password, '0', '0', DATETIME('now','localtime'), DATETIME('now','localtime'), '', '', DATETIME('now','localtime'), '0', '0', '0', '000000', '0', '0', '0', '', '0', '0.0', '0', '0', '', '', '0', @token);`)
		
		let hash = bcrypt.hashSync(password, 10);
		
		let result = Player.registerUserQuery.run([{ username: username, email: email, password: hash, token: Player.strRandom(20) }]);
		if (result.changes === 0)
			return {
				result: "false",
				error: "Could not register"
			};
		else return {
			result: "success"
		};
	}

	static checkLogin() {
		
	}

	static deGarbledeguck(pwd: string) {
		if (pwd.substr(0, 3) !== pwd)
			return pwd;
		
		let finish = "";
		for (let i = 3; i < pwd.length; i += 2) {
			let hex = pwd.substr(i, 2);
			let digits = "0123456789ABCDEF";
			let firstDigit = digits.indexOf(hex[0]);
			let secondDigit = digits.indexOf(hex[1]);
			let val = (firstDigit * 16) + secondDigit;
			let chr = String.fromCharCode(128 - val);
			finish += chr;
		}
		return finish;
	}

	static strRandom(length: number) {
		var result           = '';
		var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		var charactersLength = characters.length;
		for (var i = 0; i < length; i++ ) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}
		return result;
	}
}