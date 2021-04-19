import { AchievementSP } from "./achievement_sp";
import { Mission } from "./mission";
import { Player } from "./player";
import { Score } from "./score";
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

        // Do the rating thingy
        let lastScore = Storage.query("SELECT * FROM user_eggs WHERE user_id = @userId AND mission_id = @missionId").get({ userId: userId, missionId: missionId });
        if (lastScore === undefined) {
            // First time
            // Give the egg rating cause bruh
            let missionGame = Storage.query('SELECT game_id FROM missions WHERE id = @missionId').get({ missionId: missionId });

            let bonusRating = 0;
            // PQ
            if (missionGame.game_id === 4) {
                bonusRating = 25000;
            }
            if ([1, 2, 3, 5].includes(missionGame.game_id)) { // Non PQ Non MP
                bonusRating = 12500;
            }

            if (bonusRating !== 0) {
                Storage.query(`UPDATE user_ratings SET rating_egg=rating_egg + @rating WHERE user_id=@userId`).run({ rating: bonusRating, userId: userId });
                Storage.query(`UPDATE user_ratings SET rating_general=rating_general + @rating WHERE user_id=@userId`).run({ rating: bonusRating, userId: userId });
            }
        }

        // Insert our score
        let res = Storage.query(`INSERT INTO user_eggs(user_id,mission_id,time,timestamp) VALUES(@userId,@missionId,@time,DATETIME('now','localtime'));`).run({ userId: userId, missionId: missionId, time: time });

        // Do the achievement check
        let userName = Player.getUsername(userId);
        let topScores = Score.getPersonalTopScoreList(userId);
        let achievementList = Player.getPlayerAchievements(userName);
        AchievementSP.updateSinglePlayerAchievements(userId, achievementList.achievements, topScores);


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