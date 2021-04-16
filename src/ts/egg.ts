import { AchievementSP } from "./achievement_sp";
import { Storage } from "./storage";

export class Egg {
	
	// Gets the list of all easter eggs by a player
	static getEasterEggs(userId: number) {
		let eggData = Storage.query(`SELECT * FROM user_eggs WHERE user_id = @userId GROUP BY mission_id HAVING MIN("time");`).all({ userId: userId });

		let eggDict = new Map<number, number>();
		eggData.forEach(x => {
			eggDict.set(x.mission_id, x.time);
		})

		let jobj = Object.fromEntries(eggDict);
		return jobj;
	}

	// Insert the egg record into the database
	static recordEgg(userId: number, missionId: number, time: number) {
		// First lets get the lowest score
		let minTime = Storage.query('SELECT MIN("time") AS minTime FROM user_eggs WHERE mission_id = @missionId;').get({ missionId: missionId });
		if (minTime === undefined) {
			minTime = Infinity
		} else {
			minTime = minTime.minTime;
		}

		// Do the achievement check
		AchievementSP.updateSinglePlayerAchievements(userId);

		// Insert our score
		let res = Storage.query(`INSERT INTO user_eggs(user_id,mission_id,time,timestamp) VALUES(@userId,@missionId,@time,DATETIME('now','localtime'));`).run({ userId: userId, missionId: missionId, time: time });
		if (res.changes === 0) {
			return "FAILURE";
		} else {
			if (minTime > time)
				return "RECORDING";
			else
				return "SUCCESS";
		}
	}
}