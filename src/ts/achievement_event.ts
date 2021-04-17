import { Achievement } from "./achievement";
import { Player } from "./player";
import { Score } from "./score";
import { Storage } from "./storage";

export class AchievementEvent {

	static hasEventTrigger(userId: number, triggerId: number) {
		let q = Storage.query("SELECT COUNT(*) AS triggerCount FROM user_event_triggers WHERE trigger = @triggerId AND user_id = @userId").get({ userId: userId, triggerId: triggerId });
		return q.triggerCount > 0;
	}

	static hasEventTriggerRange(userId: number, from: number, to: number) {
		let q = Storage.query(`
		SELECT COUNT(*) AS triggerCount FROM user_event_triggers
		WHERE trigger >= @from AND trigger <= @to AND user_id = @userId`).get({ from: from, to: to, userId: userId });

		// The range is inclusive
		return (q.triggerCount >= (to - from + 1));
	}

	static eventTriggerRangeCount(userId: number, from: number, to: number) {
		let q = Storage.query(`
		SELECT COUNT(*) AS triggerCount FROM user_event_triggers
		WHERE trigger >= @from AND trigger <= @to AND user_id = @userId`).get({ from: from, to: to, userId: userId });

		// The range is inclusive
		return q.triggerCount;
	}

	static async updateEventAchievements(userId: number, playerAchievements: any[], topScores: any[]) {
		this.updateWinterAchievements(userId, playerAchievements, topScores);
		this.updateHalloweenAchievements(userId, playerAchievements, topScores);
	}

	static async updateHalloweenAchievements(userId: number, playerAchievements: any[], topScores: any) {
		if (!Storage.settings.halloween_event)
			return;
		
		let currentAchievements = new Set(playerAchievements);
		
		if (!currentAchievements.has(2000)) {
			Achievement.grantAchievement(userId, 2000);
		}

		if (!currentAchievements.has(2001) || !currentAchievements.has(2002) || !currentAchievements.has(2018)) {

			let q = Storage.query(`
		SELECT COUNT(*) AS matchcount FROM matches
		  JOIN match_scores ON matches.id = match_scores.match_id
		  JOIN user_scores ON match_scores.score_id = user_scores.id
		  JOIN missions ON user_scores.mission_id = missions.id
		WHERE match_scores.user_id = @userId
		      AND missions.game_id = 18
		      AND match_scores.placement = 1
			  AND player_count > 1
			  AND extra_modes LIKE '%ghosts%'`).get({ userId: userId });
		
			// Win 1 ghost hunt round
			if (q.matchcount > 0) {
				Achievement.grantAchievement(userId, 2001);
			}
			// Win 10 ghost hunt rounds
			if (q.matchcount >= 10) {
				Achievement.grantAchievement(userId, 2002);
			}
			// Win 100 ghost hunt rounds
			if (q.matchcount >= 100) {
				Achievement.grantAchievement(userId, 2018);
			}
		}
		if (!currentAchievements.has(2019)) {
			let q = Storage.query(`
		SELECT COUNT(*) AS matchcount FROM matches
		  JOIN match_scores ON matches.id = match_scores.match_id
		  JOIN user_scores ON match_scores.score_id = user_scores.id
		  JOIN missions ON user_scores.mission_id = missions.id
		WHERE match_scores.user_id = @userId
		      AND missions.game_id = 18
			  AND player_count > 1
			  AND extra_modes LIKE '%ghosts%'`).get({ userId: userId });
		
			// Play 250 ghost hunt rounds
			if (q.matchcount >= 250) {
				Achievement.grantAchievement(userId, 2019);
			}
		}
		if (!currentAchievements.has(2003)) {
			let q = Storage.query(`
			SELECT COUNT(*) AS matchcount FROM missions
			JOIN mission_games ON missions.game_id = mission_games.id
			WHERE missions.id NOT IN (
			SELECT missions.i'
			FROM matches
				JOIN match_scores ON matches.id = match_scores.match_id
				JOIN missions ON matches.mission_id = missions.id
				JOIN mission_games ON missions.game_id = mission_games.id
			WHERE rating_column = 'rating_mp'
					AND is_custom = 0
					AND game_id = 18
					AND user_id = @userId
					AND player_count > 1
					AND placement = 1
			) AND rating_column = 'rating_mp'
			AND is_custom = 0`).get({ userId: userId });
			// Play 1 game of each halloween multiplayer levels
			if (q.matchcount === 0) {
				Achievement.grantAchievement(userId, 2003);
			}
		}
		if (!currentAchievements.has(2004)) {
			let q2 = Storage.query(`
		SELECT * FROM user_scores
		  JOIN missions ON user_scores.mission_id = missions.id
		  JOIN mission_rating_info ON missions.id = mission_rating_info.mission_id
		WHERE game_id = 18
		  AND user_scores.score_type = 'score'
		  AND user_scores.score >= mission_rating_info.platinum_score
		  AND user_id = @userId
		GROUP BY user_scores.mission_id`).all({ userId: userId });

			// Play and beat PS on atleast 5 halloween MP levels
			if (q2.length >= 5) {
				Achievement.grantAchievement(userId, 2004);
			}
		}
		if (!currentAchievements.has(2005)) {
			let q2 = Storage.query(`
		SELECT * FROM user_scores
		  JOIN missions ON user_scores.mission_id = missions.id
		  JOIN mission_rating_info ON missions.id = mission_rating_info.mission_id
		WHERE game_id = 18
		  AND user_scores.score_type = 'score'
		  AND user_scores.score >= mission_rating_info.ultimate_score
		  AND user_id = @userId
		GROUP BY user_scores.mission_id`).all({ userId: userId });

			// Play and beat US on atleast 5 halloween MP levels
			if (q2.length >= 5) {
				Achievement.grantAchievement(userId, 2005);
			}
		}

		if (!currentAchievements.has(2008)) {
			// Collect 16 total candy corns on halloween MP levels
			let q = Storage.query(`
		SELECT COUNT(*) AS candies FROM (
			SELECT mission_id FROM user_eggs
			JOIN missions ON user_eggs.mission_id = missions.id
			JOIN mission_games ON missions.game_id = mission_games.id
			WHERE user_id = @userId
			AND game_type = 'Multiplayer' AND is_custom = 0
			AND game_id = 18
		    GROUP BY mission_id
		) AS egg_missions`).get({ userId: userId });

			if (q.candies === 16) {
				Achievement.grantAchievement(userId, 2008);
			}
		}
		
		if (!currentAchievements.has(2009)) {
			let q = Storage.query(`
		SELECT SUM(gem_count) AS gemcount FROM matches
		JOIN match_scores ON matches.id = match_scores.match_id
		JOIN user_scores ON match_scores.score_id = user_scores.id
		JOIN missions ON user_scores.mission_id = missions.id
		
		WHERE game_id = 18
		AND user_scores.user_id = @userId
		AND player_count > 1
		AND is_custom = 0`).get({ userId: userId });

			if (q.gemcount >= 2000) {
				Achievement.grantAchievement(userId, 2009);
			}
		}

		// Trigger based
		if (!currentAchievements.has(2006) && AchievementEvent.hasEventTrigger(userId, 9001)) {
			Achievement.grantAchievement(userId, 2006);
		}
		if (!currentAchievements.has(2015) && AchievementEvent.hasEventTrigger(userId, 1750)) {
			Achievement.grantAchievement(userId, 2015);
		}
		if (!currentAchievements.has(2020) && AchievementEvent.hasEventTrigger(userId, 9002)) {
			Achievement.grantAchievement(userId, 2020);
		}

		// Trigger Range based
		if (!currentAchievements.has(2007) && AchievementEvent.hasEventTriggerRange(userId, 8080, 8092)) {
			Achievement.grantAchievement(userId, 2007);
		}
		if (!currentAchievements.has(2011) && AchievementEvent.hasEventTriggerRange(userId, 1500, 1515)) {
			Achievement.grantAchievement(userId, 2011);
		}
		if (!currentAchievements.has(2012) && AchievementEvent.hasEventTriggerRange(userId, 1700, 1730)) {
			Achievement.grantAchievement(userId, 2012);
		}
		if (!currentAchievements.has(2013) && AchievementEvent.hasEventTriggerRange(userId, 1650, 1660)) {
			Achievement.grantAchievement(userId, 2013);
		}
		if (!currentAchievements.has(2014) && AchievementEvent.hasEventTriggerRange(userId, 1600, 1611)) {
			Achievement.grantAchievement(userId, 2014);
		}
		if (!currentAchievements.has(2017) && AchievementEvent.hasEventTriggerRange(userId, 1800, 1802)) {
			Achievement.grantAchievement(userId, 2017);
		}

		// Achievement..based
		if (!currentAchievements.has(2010)) {
			if (playerAchievements.every(x => [2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009].includes(x))) {
				Achievement.grantAchievement(userId, 2010);
			}
		}
		if (!currentAchievements.has(2016)) {
			if (playerAchievements.every(x => [2011, 2012, 2013, 2014, 2015].includes(x))) {
				Achievement.grantAchievement(userId, 2016);
			}
		}
		if (!currentAchievements.has(2021)) {
			if (playerAchievements.every(x => [2010, 2016, 2017, 2018, 2019, 2020].includes(x))) {
				Achievement.grantAchievement(userId, 2021);
			}
		}
	}

	static async updateWinterAchievements(userId: number, playerAchievements: any[], topScores: any) {
		if (!Storage.settings.winter_event)
			return;
		
		let currentAchievements = new Set(playerAchievements);

		if (!currentAchievements.has(3000)) {
			Achievement.grantAchievement(userId, 3000);
		}


		// Collect 35 total easter eggs on halloween MP levels
		if (!currentAchievements.has(3004)) {
			let q = Storage.query(`
		SELECT COUNT(*) AS eggs FROM (
			SELECT mission_id FROM user_eggs
			JOIN missions ON user_eggs.mission_id = missions.id
			JOIN mission_games ON missions.game_id = mission_games.id
			WHERE user_id = @userId
			AND game_type = 'Multiplayer' AND is_custom = 0
			AND game_id = 19
		    GROUP BY mission_id
		) AS egg_missions`).get({ userId: userId });

			if (q.eggs === 35) {
				Achievement.grantAchievement(userId, 3004);
			}
		}

		if (!currentAchievements.has(3002)) {
			// Win a match against 3 players on skate battle royale
			let q = Storage.query(`
		SELECT COUNT(*) AS wins FROM match_scores
		  JOIN user_scores ON match_scores.score_id = user_scores.id
		  JOIN missions ON user_scores.mission_id = missions.id
		  JOIN matches ON match_scores.match_id = matches.id
		WHERE game_id = 19
		  AND match_scores.user_id = @userId
		  AND player_count > 3
		  AND placement = 1
		  AND matches.mission_id = 6030`).get({ userId: userId });
		
			if (q.wins > 0) {
				Achievement.grantAchievement(userId, 3002);
			}
		}

		if (!currentAchievements.has(3003)) {
			// Win teams match on spires
			let q = Storage.query(`
		SELECT COUNT(*) AS wins FROM match_scores
		  JOIN user_scores ON match_scores.score_id = user_scores.id
		  JOIN missions ON user_scores.mission_id = missions.id
		  JOIN matches ON match_scores.match_id = matches.id
		WHERE game_id = 19
		  AND match_scores.user_id = @userId
		  AND player_count > 1
		  AND (team_id IS NOT NULL AND team_id != -1)
		  AND placement = 1
		  AND matches.mission_id = 6053`).get({ userId: userId });
		
			if (q.wins > 0) {
				Achievement.grantAchievement(userId, 3003);
			}
		}

		if (!currentAchievements.has(3015)) {
			// Win snowball only teams match on snow brawl
			let q = Storage.query(`
		SELECT COUNT(*) AS wins FROM match_scores
		  JOIN user_scores ON match_scores.score_id = user_scores.id
		  JOIN missions ON user_scores.mission_id = missions.id
		  JOIN matches ON match_scores.match_id = matches.id
		WHERE game_id = 19
		  AND match_scores.user_id = @userId
		  AND player_count > 1
		  AND team_id IS NOT NULL
		  AND team_count >= 2
		  AND extra_modes LIKE '%snowballsOnly%'
		  AND placement = 1
		  AND matches.mission_id = 6041`).get({ userId: userId });
		
			if (q.wins > 0) {
				Achievement.grantAchievement(userId, 3015);
			}
		}

		if (!currentAchievements.has(3020)) {
			// Win snowball only match on wintry village
			let q = Storage.query(`
		SELECT COUNT(*) AS wins FROM match_scores
		  JOIN user_scores ON match_scores.score_id = user_scores.id
		  JOIN missions ON user_scores.mission_id = missions.id
		  JOIN matches ON match_scores.match_id = matches.id
		WHERE game_id = 19
		  AND match_scores.user_id = @userId
		  AND player_count > 1
		  AND extra_modes LIKE '%snowballsOnly%'
		  AND placement = 1
		  AND matches.mission_id = 6051`).get({ userId: userId });
		
			if (q.wins > 0) {
				Achievement.grantAchievement(userId, 3020);
			}
		}

		if (!currentAchievements.has(3005)) {
			// 5 UTs, versus
			let q2 = Storage.query(`
		SELECT * FROM match_scores
		  JOIN user_scores ON match_scores.score_id = user_scores.id
		  JOIN missions ON user_scores.mission_id = missions.id
		  JOIN mission_rating_info ON missions.id = mission_rating_info.mission_id
		  JOIN matches ON match_scores.match_id = matches.id
		WHERE game_id = 19
		  AND user_scores.score_type = 'score'
		  AND user_scores.score >= mission_rating_info.versus_ultimate_score
		  AND match_scores.user_id = @userId
		  AND player_count > 1
		GROUP BY user_scores.mission_id`).all({ userId: userId });
			if (q2.length >= 5) {
				Achievement.grantAchievement(userId, 3005);
			}
		}

		if (!currentAchievements.has(3013)) {
			// 20 PTs
			let q2 = Storage.query(`
		SELECT * FROM user_scores
		  JOIN missions ON user_scores.mission_id = missions.id
		  JOIN mission_rating_info ON missions.id = mission_rating_info.mission_id
		WHERE game_id = 19
		  AND user_scores.score_type = 'score'
		  AND user_scores.score >= mission_rating_info.platinum_score
		  AND user_id = @userId
		GROUP BY user_scores.mission_id`).all({ userId: userId });
			if (q2.length >= 20) {
				Achievement.grantAchievement(userId, 3013);
			}
		}

		if (!currentAchievements.has(3014)) {
			// 20 UTs
			let q2 = Storage.query(`
		SELECT * FROM user_scores
		  JOIN missions ON user_scores.mission_id = missions.id
		  JOIN mission_rating_info ON missions.id = mission_rating_info.mission_id
		WHERE game_id = 19
		  AND user_scores.score_type = 'score'
		  AND user_scores.score >= mission_rating_info.ultimate_score
		  AND user_id = @userId
		GROUP BY user_scores.mission_id`).all({ userId: userId });
			if (q2.length >= 20) {
				Achievement.grantAchievement(userId, 3014);
			}
		}

		if (!currentAchievements.has(3006)) {
			// Win FFA by atleast 100 pts
			let q = Storage.query(`
		SELECT COUNT(*) AS wins FROM match_scores AS score
		  JOIN matches ON score.match_id = matches.id
		  JOIN missions ON matches.mission_id = missions.id
		  JOIN user_scores ON score.score_id = user_scores.id
		-- All scores where:
		WHERE score.user_id = @userId
		  AND is_custom = 0
		  AND game_id = 19
		  AND player_count > 1
		-- The next highest person's score 
		  AND (
		    SELECT MAX(user_scores.score) FROM match_scores
		      JOIN user_scores ON match_scores.score_id = user_scores.id
		      WHERE match_scores.match_id = score.match_id
		      AND match_scores.user_id != @userId -- Because you can't use the same param twice
		-- Is less than your score sub 100
		) < (user_scores.score - 100)`).get({ userId: userId });

			if (q.wins > 0) {
				Achievement.grantAchievement(userId, 3006);
			}
		}

		// Snowball related
		
		if (!currentAchievements.has(3007)) {
			// Launch 3k snowballs
			let q = Storage.query(`
		SELECT SUM(snowballs) AS snowballs FROM user_event_snowballs
		JOIN user_scores ON user_event_snowballs.score_id = user_scores.id
		WHERE user_id = @userId`).get({ userId: userId });
			if (q.snowballs >= 3000) {
				Achievement.grantAchievement(userId, 3007);
			}
		}

		if (!currentAchievements.has(3008)) {
			// Hit others 500 times with snowballs
			let q = Storage.query(`
		SELECT SUM(hits) AS snowballs FROM user_event_snowballs
		JOIN user_scores ON user_event_snowballs.score_id = user_scores.id
		WHERE user_id = @userId`).get({ userId: userId });
			if (q.snowballs >= 500) {
				Achievement.grantAchievement(userId, 3008);
			}
		}

		// Win 10, 25, 100 rounds of snowball matches

		if (!currentAchievements.has(3030) || !currentAchievements.has(3031) || !currentAchievements.has(3032)) {
			let q2 = Storage.query(`
		SELECT * AS wins FROM match_scores
		  JOIN user_scores ON match_scores.score_id = user_scores.id
		  JOIN missions ON user_scores.mission_id = missions.id
		  JOIN matches ON match_scores.match_id = matches.id
		WHERE game_id = 19
		  AND match_scores.user_id = @userId
		  AND player_count > 1
		  AND extra_modes LIKE '%snowballsOnly%'
		  AND placement = 1
		GROUP BY matches.mission_id`).all({ userId: userId });
		
			if (q2.length >= 10) {
				Achievement.grantAchievement(userId, 3030);
			}
			if (q2.length >= 25) {
				Achievement.grantAchievement(userId, 3031);
			}
			if (q2.length >= 100) {
				Achievement.grantAchievement(userId, 3032);
			}
		}

		// Trigger Based
		if (!currentAchievements.has(3025) && AchievementEvent.hasEventTrigger(userId, 1105)) {
			Achievement.grantAchievement(userId, 3025);
		}

		if (!currentAchievements.has(3029) && AchievementEvent.hasEventTrigger(userId, 1112)) {
			Achievement.grantAchievement(userId, 3029);
		}

		if (!currentAchievements.has(3009) && !currentAchievements.has(3010) && !currentAchievements.has(3011)) {
			let t = AchievementEvent.eventTriggerRangeCount(userId, 8101, 8129)

			if (!currentAchievements.has(3009) && t >= 1) {
				Achievement.grantAchievement(userId, 3009);
			}

			if (!currentAchievements.has(3010) && t >= 7) {
				Achievement.grantAchievement(userId, 3010);
			}

			if (!currentAchievements.has(3011) && t >= 14) {
				Achievement.grantAchievement(userId, 3011);
			}
		}

		if (!currentAchievements.has(3012) && AchievementEvent.hasEventTriggerRange(userId, 8101, 8129)) {
			Achievement.grantAchievement(userId, 3012);
		}

		if (!currentAchievements.has(3016) && AchievementEvent.hasEventTriggerRange(userId, 1020, 1042)) {
			Achievement.grantAchievement(userId, 3016);
		}
		if (!currentAchievements.has(3017) && AchievementEvent.hasEventTriggerRange(userId, 1000, 1019)) {
			Achievement.grantAchievement(userId, 3017);
		}
		if (!currentAchievements.has(3018) && AchievementEvent.hasEventTriggerRange(userId, 1043, 1074)) {
			Achievement.grantAchievement(userId, 3018);
		}
		if (!currentAchievements.has(3019) && AchievementEvent.hasEventTriggerRange(userId, 1075, 1084)) {
			Achievement.grantAchievement(userId, 3019);
		}
		if (!currentAchievements.has(3024) && AchievementEvent.hasEventTriggerRange(userId, 1102, 1104)) {
			Achievement.grantAchievement(userId, 3024);
		}
		if (!currentAchievements.has(3026) && AchievementEvent.hasEventTriggerRange(userId, 1106, 1111)) {
			Achievement.grantAchievement(userId, 3026);
		}
		if (!currentAchievements.has(3027) && AchievementEvent.hasEventTriggerRange(userId, 1113, 1118)) {
			Achievement.grantAchievement(userId, 3027);
		}
		if (!currentAchievements.has(3028) && AchievementEvent.hasEventTriggerRange(userId, 1119, 1148)) {
			Achievement.grantAchievement(userId, 3028);
		}

		// Achievement related

		if (!currentAchievements.has(3021)) {
			if (playerAchievements.every(x => [3001, 3004, 3011, 3016, 3017, 3018, 3019].includes(x))) {
				Achievement.grantAchievement(userId, 3021);
			}
		}

		if (!currentAchievements.has(3022)) {
			if (playerAchievements.every(x => [3002, 3003, 3005, 3006, 3007, 3008, 3013, 3014, 3015].includes(x))) {
				Achievement.grantAchievement(userId, 3022);
			}
		}

		if (!currentAchievements.has(3023)) {
			if (playerAchievements.every(x => [3021, 3022].includes(x))) {
				Achievement.grantAchievement(userId, 3023);
			}
		}
		
	}
}