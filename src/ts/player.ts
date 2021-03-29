import Database from "better-sqlite3";
import * as bcrypt from "bcrypt";
import { WebchatInfo, WebchatResponse } from "./webchat";
import { Storage } from "./storage"

export class Player {

	static userExists(username: string) {
		return Storage.query(`SELECT id FROM users WHERE username=@username;`).get({ username: username }) !== undefined;
	}

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
		
		let hash = bcrypt.hashSync(password, 10);
		let query = Storage.query(`INSERT INTO users ("name", "username", "email", "password", "block", "sendEmail", "registerDate", "lastvisitDate", "activation", "params", "lastResetTime", "resetCount", "bluePoster", "hasColor", "colorValue", "titleFlair", "titlePrefix", "titleSuffix", "statusMsg", "profileBanner", "donations", "credits", "credits_spent", "otpKey", "otep", "requireReset", "webchatKey") VALUES (@username, @username, @email, @password, '0', '0', DATETIME('now','localtime'), DATETIME('now','localtime'), '', '', DATETIME('now','localtime'), '0', '0', '0', '000000', '0', '0', '0', '', '0', '0.0', '0', '0', '', '', '0', @token);`);
		let result = query.run([{ username: username, email: email, password: hash, token: Player.strRandom(20) }]);
		if (result.changes === 0)
			return {
				result: "false",
				error: "Could not register"
			};
		else return {
			result: "success"
		};
	}

	static checkLogin(username: string, password: string, ip: string) {
		password = this.deGarbledeguck(password);

		if (Player.userExists(username)) {
		
			let result = Storage.query(`SELECT id, name, accessLevel, colorValue, webchatKey block FROM users WHERE username=@username;`).get({ username: username });
			
			if (result.block) {
				// Yeah the account is banned
				return { success: false, reason: "banned" }
			}

			if (bcrypt.compareSync(password, result.password)) {
				// Authentication success
				// Now we generate the required output data

				let settingswb = new WebchatResponse();

				// We'll generate the settings data first because thats big
				// The "info" part of settings
				let info = new WebchatInfo();
				info.access(result.accessLevel);
				info.displayName(result.name);
				info.servertime(new Date().getTime());
				info.welcome(Storage.settings.welcome);
				info.defaultHSName(Storage.settings.default_name);
				info.address(ip);
				info.help(Storage.settings.chat_help_info, Storage.settings.chat_help_cmdlist);
				info.privelege(result.accessLevel);

				settingswb.info(info);

				// The friend list
				let friendlist = Player.getFriendsList(result.id);
				friendlist.forEach(x => {
					settingswb.addFriend(x.username, x.name);
				})

				// The block list
				let blocklist = Player.getBlockList(result.id);
				blocklist.forEach(x => {
					settingswb.addBlock(x.username, x.name);
				})

				// The list of available chat colours
				Storage.settings.chat_colors.forEach(x => {
					settingswb.color(x.key, x.value)
				})

				// The list of available chat flairs
				Storage.settings.chat_flairs.forEach(x => {
					settingswb.flair(x);
				})

				// End the thing
				settingswb.logged();

				// Generate the response
				let response = {
					access: result.accessLevel,
					color: result.colorValue,
					display: result.name,
					id: result.id,
					key: result.webchatKey,
					success: true,
					username: username,
					settings: settingswb.getResult()
				};
				return response;

			} else {
				// Authentication failure
				return { success: false, reason: "password" }
			}
		} else {
			// Our user doesnt even exist so bruh
			return { success: false, reason: "username" }
		}
	}

	static getFriendsList(userid: number) {		
		let friendlist = Storage.query(`SELECT name, username FROM user_friends A, users B WHERE user_id=@userid AND friend_id=B.id;`).all({ userid: userid });
		return friendlist;
	}

	static getBlockListQuery: Database.Statement;
	static getBlockList(userid: number) {	
		let blockist = Storage.query(`SELECT name, username FROM user_blocks A, users B WHERE user_id=@userid AND block_id=B.id;`).all({ userid: userid });
		return blockist;
	}

	// Helper function to just authenticate a username and token, gives back a username if successful else false
	static authenticateQuery: Database.Statement;
	static authenticate(username: string, key: string) {		
		if (this.userExists(username)) {
			let result = Storage.query(`SELECT id FROM users WHERE username=@username AND webchatKey=@key;`).get({ username: username, key: key });
			if (result === undefined)
				return false;
			return result.id;
		}
		return false;
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