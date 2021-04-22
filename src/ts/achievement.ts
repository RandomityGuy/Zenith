import { Player } from "./player";
import { Score } from "./score";
import { Storage } from "./storage";
export class Achievement {

    // Gets the list of all achievements
    static getAchievementList(userId: number) {
        let categoriesDict = new Map<string, any>();
        let categoryNames: string[] = [];
        let categories = Storage.query("SELECT * FROM achievement_categories;").all();
        categories.forEach(x => {
            categoriesDict.set(x.title, x);
            categoryNames.push(x.title);
        });
        // Yeah hardcoded... :pensive:
        let achievementDict = new Map<string, any[]>();
        achievementDict.set("Single Player", Storage.query(`
        SELECT  bitmap_extent, 'Single Player' AS category, description, id, "index", rating, title 
        FROM (
        	SELECT bitmap_extent, 'Single Player' AS category, description, id, "index", rating, title, sort
        	FROM achievement_names 
        	WHERE category_id IN (1,4) AND mask = 0
        	UNION
        	SELECT achievement_names.bitmap_extent, 'Single Player' AS category, achievement_names.description, achievement_names.id, "index", achievement_names.rating, achievement_names.title, sort
        	FROM user_achievements, achievement_names
        	WHERE user_achievements.achievement_id = achievement_names.id AND mask = 1 AND user_id=@userId AND achievement_names.category_id IN (1,4)
        )
        ORDER BY sort`).all({ userId: userId }));
        achievementDict.set("Multiplayer", Storage.query(`
        SELECT  bitmap_extent, 'Multiplayer' AS category, description, id, "index", rating, title 
        FROM (
        	SELECT bitmap_extent, 'Multiplayer' AS category, description, id, "index", rating, title, sort
        	FROM achievement_names 
        	WHERE category_id = 2 AND mask = 0
        	UNION
        	SELECT achievement_names.bitmap_extent, 'Multiplayer' AS category, achievement_names.description, achievement_names.id, "index", achievement_names.rating, achievement_names.title, sort
        	FROM user_achievements, achievement_names
        	WHERE user_achievements.achievement_id = achievement_names.id AND mask = 1 AND user_id=@userId AND achievement_names.category_id = 2
        )
        ORDER BY sort`).all({ userId: userId }));
        achievementDict.set("Event", Storage.query(`
        SELECT  bitmap_extent, 'Event' AS category, description, id, "index", rating, title 
        FROM (
        	SELECT bitmap_extent, 'Event' AS category, description, id, "index", rating, title, sort
        	FROM achievement_names 
        	WHERE category_id = 3 AND mask = 0
        	UNION
        	SELECT achievement_names.bitmap_extent, 'Event' AS category, achievement_names.description, achievement_names.id, "index", achievement_names.rating, achievement_names.title, sort
        	FROM user_achievements, achievement_names
        	WHERE user_achievements.achievement_id = achievement_names.id AND mask = 1 AND user_id=@userId AND achievement_names.category_id = 3
        )
        ORDER BY sort`).all({ userId: userId }));

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

    // Award a player a title or flair
    static grantTitleFlair(userId: number, titleFlairId: number) {
        Storage.query('REPLACE INTO user_title_flairs VALUES(@userId, @titleFlairId)').run({ userId: userId, titleFlairId: titleFlairId });
    }

    // Check for title and flair unlocks
    static checkTitleFlairUnlocks(userId: number, playerAchievements: any[], topScores: any) {
        let currentAchievements = new Set(playerAchievements);
        let currentTitleFlairs = new Set(Player.getTitleFlairs(userId, "any"));

        function bestModifiers(missionId: number, modifiers: number) {
            let score = Storage.query("SELECT * FROM user_scores WHERE user_id = @userId AND mission_id = @missionId AND user_scores.disabled = 0 AND (modifiers & @modifiers = @modifiers) ORDER BY sort;").get({ userId: userId, missionId: missionId, modifiers: modifiers });
            if (score === undefined) {
                return 6000000;
            }
            return score.score;
        }

        function best(missionId: number) {
            if (topScores[missionId] === undefined) {
                return 6000000
            }
            return topScores[missionId].score;
        }

        function levelBased(levelId: number, score: number, titleFlair: number) {
            if (best(levelId) <= score) {
                Achievement.grantTitleFlair(userId, titleFlair);
            }
        }

        // Double diamond
        if (!currentTitleFlairs.has(109) && bestModifiers(17, Score.modifierFlags.doubleDiamond | Score.modifierFlags.noTimeTravels) < 70000) {
            Achievement.grantTitleFlair(userId, 109);
        }

        // Spacestation
        if (!currentTitleFlairs.has(62))
            levelBased(106, 360000, 62);
        
        // Great Divide
        if (!currentTitleFlairs.has(105))
        levelBased(202, 18500, 105);

        // All the PQ achievement based
        if (!currentTitleFlairs.has(213) && currentAchievements.has(125))
            Achievement.grantTitleFlair(userId, 213);
        if (!currentTitleFlairs.has(214) && currentAchievements.has(127))
            Achievement.grantTitleFlair(userId, 214);
        if (!currentTitleFlairs.has(215) && currentAchievements.has(128))
            Achievement.grantTitleFlair(userId, 215);
        if (!currentTitleFlairs.has(216) && currentAchievements.has(130))
            Achievement.grantTitleFlair(userId, 216);
        if (!currentTitleFlairs.has(218) && currentAchievements.has(136) && currentAchievements.has(137))
            Achievement.grantTitleFlair(userId, 218);
        if (!currentTitleFlairs.has(231) && currentAchievements.has(133))
            Achievement.grantTitleFlair(userId, 231);
        if (!currentTitleFlairs.has(225) && currentAchievements.has(140))
            Achievement.grantTitleFlair(userId, 225);
        if (!currentTitleFlairs.has(226) && currentAchievements.has(146))
            Achievement.grantTitleFlair(userId, 226);
        if (!currentTitleFlairs.has(227) && currentAchievements.has(142) && currentAchievements.has(150))
            Achievement.grantTitleFlair(userId, 227);
        if (!currentTitleFlairs.has(228) && currentAchievements.has(138))
            Achievement.grantTitleFlair(userId, 228);
        if (!currentTitleFlairs.has(212) && currentAchievements.has(130))
            Achievement.grantTitleFlair(userId, 212);

        if (playerAchievements.every(x => [125, 126, 127, 128, 131, 132, 133, 134, 135, 136, 137, 138, 140, 141, 142, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155].includes(x))) {
            
            if (!currentTitleFlairs.has(229))
                Achievement.grantTitleFlair(userId, 229);

            if (!currentTitleFlairs.has(230)) {
                let q = Storage.query(`
                SELECT COUNT(*) AS eggcount FROM (
                SELECT user_eggs.mission_id FROM user_eggs
                JOIN missions ON user_eggs.mission_id = missions.id
                JOIN mission_rating_info ON missions.id = mission_rating_info.mission_id
                WHERE user_id = @userId
                  AND has_egg
                  AND mission.game_id = 4
                  AND disabled = 0
                  AND normally_hidden = 0
                GROUP BY user_eggs.mission_id
            ) AS egg_missions`).get({ userId: userId });
            
                if (q.eggcount === 53) {
                    q = Storage.query(`
                    SELECT
                    -- Count of all challenge scores/times except PHP knows what the bit flags are
                    SUM(CASE WHEN modifiers & @modifiers != 0 THEN 1 ELSE 0 END) AS ultimate_count
                FROM (
                    -- Need to get first score id with this score as otherwise this will return
                    -- 2 rows if someone gets the same time twice.
                    SELECT
                        bests.mission_id, MIN(user_scores.id) AS first
                    FROM (
                        -- Select all scores
                        SELECT user_scores.mission_id, MIN(sort) AS minSort
                        FROM user_scores
                        JOIN missions ON user_scores.mission_id = missions.id
                        JOIN mission_rating_info ON missions.id = mission_rating_info.mission_id
                        WHERE user_id = @userId
                        AND game_id = 4
                        AND mission_rating_info.disabled = 0
                        AND mission_rating_info.normally_hidden = 0
                        GROUP BY mission_id
                    ) AS bests
                    -- Join the scores table so we can get the id of the score
                    JOIN user_scores
                      ON user_scores.mission_id = bests.mission_id
                     AND user_scores.sort = bests.minSort
                    GROUP BY mission_id
                ) AS uniques
                -- Join the scores table again so we can get score info
                JOIN user_scores ON user_scores.id = first
                JOIN missions ON uniques.mission_id = missions.id
                JOIN mission_rating_info ON missions.id = mission_rating_info.mission_id`).get({ modifiers: 4352, userId: userId }); // Modifiers are UltimateTime | UltimateScore.

                    if (q.ultimate_count === 138) {
                        Achievement.grantTitleFlair(userId, 230);
                    }
                }
            }
        }

        // Colored name
        
        // Check if they already have color
        let colortest = Storage.query('SELECT hasColor FROM users WHERE id=@userId').get({ userId: userId }).hasColor;

        if (colortest === 0) {
            let q = Storage.query(`
        SELECT COUNT(*) AS cnt FROM missions
          JOIN mission_games ON missions.game_id = mission_games.id
        WHERE
          game_id != 5 -- Custom levels
          AND difficulty_id != 16 -- PQ Bonus
          AND game_type = 'Single Player' -- Ignore MP
          AND missions.id NOT IN (
            SELECT DISTINCT missions.id FROM missions
              JOIN user_scores ON missions.id = user_scores.mission_id
              JOIN mission_rating_info ON missions.id = mission_rating_info.mission_id
              JOIN mission_games ON missions.game_id = mission_games.id
            WHERE user_id = @userId
                  AND game_type = 'Single Player' -- Ignore MP
                  AND is_custom = 0 -- Duh
                  AND game_id != 5 -- Custom levels
                  AND difficulty_id != 16 -- PQ Bonus
                  AND ((
                    score_type = 'time' AND (score < platinum_time -- Beat platinum time
                    OR platinum_time = 0 OR platinum_time IS NULL)
                  ) OR (
                    score_type = 'score' AND (score >= platinum_score -- Reached platinum score
                    OR platinum_score = 0 OR platinum_score IS NULL)
                  ))
          )`).get({ userId: userId });
        
            if (q.cnt === 0) {
                Storage.query('UPDATE users SET hasColor=1 WHERE id=@userId').run({ userId: userId });
            }
        }

    }

}