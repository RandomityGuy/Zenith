import Database from "better-sqlite3";
import * as bcrypt from "bcrypt";
import { WebchatInfo, WebchatResponse } from "./webchat";
import { Storage } from "./storage"
import * as fs from "fs-extra"
import * as path from "path"
import { Util } from "./util";

export class Player {

	static userExists(username: string) {
		return Storage.query(`SELECT id FROM users WHERE username=@username;`).get({ username: username }) !== undefined;
	}

	static getUsername(userId: number) {
		let data = Storage.query(`SELECT username FROM users WHERE id=@userId`).get({ userId: userId });
		if (data === undefined)
			return null;
		return data.username;
	}

	static getUserId(username: string) {
		let data = Storage.query(`SELECT id FROM users WHERE username=@username`).get({ username: username });
		if (data === undefined)
			return null;
		return data.id;
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
		let result = query.run({ username: username, email: email, password: hash, token: Player.strRandom(20) });
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
		
			let result = Storage.query(`SELECT id, name, accessLevel, colorValue, webchatKey, block, password FROM users WHERE username=@username;`).get({ username: username });
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

	static getBlockList(userid: number) {
		let blockist = Storage.query(`SELECT name, username FROM user_blocks A, users B WHERE user_id=@userid AND block_id=B.id;`).all({ userid: userid });
		return blockist;
	}

	// Helper function to just authenticate a username and token, gives back a username if successful else null
	static authenticate(username: string, key: string) {
		if (this.userExists(username)) {
			let result = Storage.query(`SELECT id FROM users WHERE username=@username AND webchatKey=@key;`).get({ username: username, key: key });
			if (result === undefined)
				return null;
			return result.id;
		}
		return null;
	}

	static getTopPlayers() {	
		let formatRating = (category: string) => {
			let ratingQuery = Storage.query(`SELECT U.name, U.username, ${category} AS rating FROM user_ratings AS R, users AS U WHERE U.id = R.user_id AND U.block = 0 ORDER BY ${category} DESC;`);
			let ratings = ratingQuery.all({ category: category });
			let result = {
				display: ratings.map(x => x.name),
				rating: ratings.map(x => Number.parseInt(x.rating)),
				username: ratings.map(x => x.username)
			}
			return result;
		}

		let result = {
			rating_mbg: formatRating("rating_mbg"),
			rating_mbp: formatRating("rating_mbp"),
			rating_mbu: formatRating("rating_mbu"),
			rating_pq: formatRating("rating_pq"),
			rating_mp: formatRating("rating_mp"),
			rating_general: formatRating("rating_general"),
			rating_custom: formatRating("rating_custom"),
		}
		return result;
	}

	static getPlayerAchievements(username: string) {
		let userId = Player.getUserId(username);
		let achievementList = Storage.query(`SELECT achievement_id FROM user_achievements WHERE user_id = @userId;`).all({ userId: userId }).map(x => x.achievement_id);
		let obj = {
			username: username,
			achievements: achievementList
		};
		return obj;
	}

	static getPlayerProfileInfo(username: string) {
		let userId = Player.getUserId(username);
		let initialData = Storage.query("SELECT accessLevel AS access, registerDate, colorValue AS color, donations, id, statusMsg AS status, titleFlair, titlePrefix, titleSuffix, username, name FROM users WHERE id = @userId;").get({ userId: userId });

		let registerDate = new Date(Date.parse(initialData.registerDate));
		let today = new Date();

		let span = new Date(today.getTime() - registerDate.getTime());

		let accountAge = `${span.getFullYear() - 1970} Years ${span.getMonth()} Months ${span.getDate()} Days ${span.getHours()} Hours ${span.getMinutes()} Minutes ${span.getSeconds()} Seconds`;
		let friends = Player.getFriendsList(userId);

		let lastLevel = Storage.query("SELECT missions.name FROM user_scores, missions WHERE user_id = @userId AND missions.id = user_scores.mission_id ORDER BY timestamp DESC LIMIT 1;").get({ userId: userId });
		if (lastLevel === undefined)
			lastLevel = "No Level Played!";
		else
			lastLevel = lastLevel.name;
		let mpAverage = Storage.query("SELECT ROUND(AVG(score)) AS averageMP FROM match_scores, user_scores WHERE match_scores.user_id = @userId AND match_scores.score_id = user_scores.id AND score_type = 'score';").get({ userId: userId });
		if (mpAverage === undefined)
			mpAverage = "No Recorded Matches";
		else
			mpAverage = mpAverage.averageMP;
		let mpBestData = Storage.query("SELECT MAX(score * player_count), score, player_count, missions.name FROM match_scores, user_scores, matches, missions WHERE match_scores.user_id = @userId AND match_scores.score_id = user_scores.id AND score_type = 'score' AND match_scores.match_id = matches.id AND missions.id = matches.mission_id;").get({ userId: userId });
		let mpBest = "No Recorded Matches";
		if (mpBestData !== undefined) {
			mpBest = `${mpBestData.score} points on ${mpBestData.name} against ${mpBestData.player_count - 1} players.`;
		}

		let mpGameData = Storage.query("SELECT placement FROM matches, match_scores WHERE matches.id = match_scores.match_id AND matches.team_count = 0 AND user_id = @userId AND matches.player_count > 1 AND placement").all({ userId: userId });
		let mpTeamGameData = Storage.query("SELECT placement FROM matches, match_scores WHERE matches.id = match_scores.match_id AND matches.team_count > 1 AND user_id = @userId AND matches.player_count > 1 AND placement").all({ userId: userId });

		if (mpGameData === undefined) // Yeah bruh
			mpGameData = [];
		if (mpTeamGameData === undefined)
			mpTeamGameData = [];

		let mpGames = new Map<number, number>();
		let mpTeamGames = new Map<number, number>();
		for (let i = 0; i < 4; i++) {
			mpGames.set(i + 1, mpGameData.filter(x => x.placement === (i + 1)).length);
			mpTeamGames.set(i + 1, mpTeamGameData.filter(x => x.placement === (i+1)).length);
		}
		mpGames.set(5, mpGameData.filter(x => x.placement > 4).length);
		mpTeamGames.set(5, mpTeamGameData.filter(x => x.placement > 4).length);

		let mpGems = Storage.query("SELECT SUM(gems_1_point) AS red, SUM(gems_2_point) AS yellow, SUM(gems_5_point) AS blue, SUM(gems_10_point) AS platinum FROM match_scores, user_scores WHERE user_scores.id = match_scores.score_id AND user_scores.user_id = @userId").get({ userId: userId });
		if (mpGems === undefined) {
			mpGems = {
				red: 0,
				yellow: 0,
				blue: 0,
				platinum: 0
			}
		}
		let rating = Storage.query("SELECT * FROM user_ratings WHERE user_id = @userId").get({ userId: userId });
		let ranking = Storage.query(`SELECT * FROM (SELECT 
									rank() OVER (ORDER BY rating_general DESC) AS 'rating_general', 
									rank() OVER (ORDER BY rating_custom DESC) AS 'rating_custom', 
									rank() OVER (ORDER BY rating_mbg DESC) AS 'rating_mbg',
									rank() OVER (ORDER BY rating_mbp DESC) AS 'rating_mbp',
									rank() OVER (ORDER BY rating_mbu DESC) AS 'rating_mbu',
									rank() OVER (ORDER BY rating_pq DESC) AS 'rating_pq',
									rank() OVER (ORDER BY rating_mp DESC) AS 'rating_mp',
									rank() OVER (ORDER BY rating_egg DESC) AS 'rating_egg',
									rank() OVER (ORDER BY rating_achievement DESC) AS 'rating_achievement',
									rank() OVER (ORDER BY rating_quota_bonus DESC) AS 'rating_quota_bonus',
									user_id
									FROM user_ratings)
									WHERE user_id = @userId;`).get({ userId: userId });
		let flair: string;
		let flairId = initialData.titleFlair !== null ? Number.parseInt(initialData.titleFlair) : 0;
		if (Storage.settings.chat_flairs.length > flairId) {
			flair = Storage.settings.chat_flairs[flairId];
		}
		let obj = {
			access: initialData.access,
			accountAge: accountAge,
			color: initialData.color,
			display: initialData.name,
			donations: initialData.donations,
			friends: friends,
			id: userId,
			lastLevel: lastLevel,
			mp_average: mpAverage,
			mp_best: mpBest,
			mp_games: Object.fromEntries(mpGames),
			mp_team_games: Object.fromEntries(mpTeamGames),
			mp_gems: mpGems,
			ranking: ranking,
			rating: rating,
			registerDate: initialData.registerDate,
			status: initialData.status,
			titles: {
				flair: flair,
				prefix: initialData.titlePrefix === null ? "" : initialData.titlePrefix,
				suffix: initialData.titleSuffix === null ? "" : initialData.titleSuffix
			},
			totalTime: 0, // Yeah bruh fix this
			username: username
		};

		return obj;
	}

	static getPlayerAvatar(username: string) {
		let userId = Player.getUserId(username);
		if (fs.existsSync(path.join(__dirname, 'storage', 'avatars', `${userId}.png`))) {
			return Util.responseAsFile(path.join(__dirname, 'storage', 'avatars', `${userId}.png`));
		} else
			return Util.responseAsFile(path.join(__dirname, 'storage', 'avatars', `nophoto.png`));
	}

	static deGarbledeguck(pwd: string) {
		if (pwd.substr(0, 3) !== "gdg")
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
		return Array.from(finish).reverse().join('');
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