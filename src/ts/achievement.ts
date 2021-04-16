import { Player } from "./player";
import { Score } from "./score";
import { Storage } from "./storage";
export class Achievement {

	// Gets the list of all achievements
	static getAchievementList() {
		let categoriesDict = new Map<string, any>();
		let categoryNames: string[] = [];
		let categories = Storage.query("SELECT * FROM achievement_categories;").all();
		categories.forEach(x => {
			categoriesDict.set(x.title, x);
			categoryNames.push(x.title);
		});
		// Yeah hardcoded... :pensive:
		let achievementDict = new Map<string, any[]>();
		achievementDict.set("Single Player", Storage.query(`SELECT bitmap_extent, 'Single Player' AS category, description, id, "index", rating, title FROM achievement_names WHERE category_id IN (1,4);`).all());
		achievementDict.set("Multiplayer", Storage.query(`SELECT bitmap_extent, 'Multiplayer' AS category, description, id, "index", rating, title FROM achievement_names WHERE category_id = 2`).all());
		achievementDict.set("Event", Storage.query(`SELECT bitmap_extent, 'Event' AS category, description, id, "index", rating, title FROM achievement_names WHERE category_id = 3`).all());

		let obj = {
			achievements: Object.fromEntries(achievementDict),
			categories: Object.fromEntries(categoriesDict),
			categoryNames: categoryNames
		};

		return obj;
	}

	// Record a manual achievement for a given user id
	static recordAchievement(userId: number, achievementId: number) {
		let achievementData = Storage.query("SELECT manual FROM achievement_names WHERE id = @achievementId;").get({ achievementId: achievementId });
		if (achievementData === undefined) {
			return "NOACH";
		} else {
			if (!achievementData.manual) {
				return "AUTOMATIC";
			} else {
				if (this.grantAchievement(userId, achievementId)) {
					return "GRANTED";
				} else {
					return "FAILURE";
				}
			}
		}
	}

	// The difference between this and above is this one actually handles "automatic" and the ratings
	static grantAchievement(userId: number, achievementId: number) {
		// Check if we already have the achievement
		let presenceCheck = Storage.query("SELECT 1 FROM user_achievements WHERE user_id=@userId AND achievement_id=@achievementId;").get({ userId: userId, achievementId: achievementId });
		if (presenceCheck === undefined) {
			// Do the ratings calc
			let achievementData = Storage.query("SELECT rating FROM achievement_names WHERE id = @achievementId;").get({ achievementId: achievementId });
			// Grant the achievement
			Storage.query("REPLACE INTO user_achievements(user_id, achievement_id, timestamp) VALUES(@userId, @achievementId, DATETIME('now','localtime'));").run({ userId: userId, achievementId: achievementId });

			if (achievementData.rating > 0) {
				Storage.query(`UPDATE user_ratings SET rating_general=rating_general + @rating, rating_achievement=rating_achievement + @rating WHERE user_id=@userId`).run({ rating: achievementData.rating, userId: userId });
			}

			return true;
		}
		return false;
	}

}