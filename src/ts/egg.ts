import { Storage } from "./storage";

export class Egg {
	static getEasterEggs(userId: number) {
		let eggData = Storage.query(`SELECT * FROM user_eggs WHERE user_id = @userId GROUP BY mission_id HAVING MIN("time");`).all({ userId: userId });

		let eggDict = new Map<number, number>();
		eggData.forEach(x => {
			eggDict.set(x.mission_id, x.time);
		})

		let jobj = Object.fromEntries(eggDict);
		return jobj;
	}
}