import { Achievement } from "./achievement";
import { Player } from "./player";
import { Score } from "./score";
import { Storage } from "./storage";

export class AchievementMP {
	// Check MP Achievements, these shits are extremly query heavy
	static async UpdateMultiplayerAchievements(userId: number, playerAchievements: any[], topScores: any) {
		let currentAchievements = new Set(playerAchievements);
		// Most of these queries are just copied from the original php

		if (!currentAchievements.has(46) || !currentAchievements.has(57)) {
			// MP win a non teams match, win 500 matches
			let mpwincount = Storage.query(`
		SELECT COUNT(*) AS mpWins FROM match_scores
			JOIN user_scores ON match_scores.score_id = user_scores.id
			JOIN missions ON user_scores.mission_id = missions.id
			JOIN mission_games ON missions.game_id = mission_games.id
			JOIN matches ON match_scores.match_id = matches.id
		WHERE
			mission_games.rating_column = 'rating_mp'
			AND missions.is_custom = 0
			AND matches.player_count > 1
			AND match_scores.placement = 1
			AND ( match_scores.team_id IS NULL AND match_scores.team_id = -1 )
			AND match_scores.user_id = @userId;`).get({ userId: userId });
			if (mpwincount !== undefined) {
				mpwincount = mpwincount.mpWins;
			} else {
				mpwincount = 0;
			}

			if (!currentAchievements.has(46) && mpwincount > 0) {
				Achievement.grantAchievement(userId, 46);
			}

			if (!currentAchievements.has(57) && mpwincount > 500) {
				Achievement.grantAchievement(userId, 57);
			}
		}

		// Win teams match
		// Win 100 teams matches
		if (!currentAchievements.has(47) || !currentAchievements.has(56)) {
			let mpteamwincount = Storage.query(`
		SELECT COUNT(*) AS mpWins FROM match_scores
			JOIN user_scores ON match_scores.score_id = user_scores.id
			JOIN missions ON user_scores.mission_id = missions.id
			JOIN mission_games ON missions.game_id = mission_games.id
			JOIN matches ON match_scores.match_id = matches.id
		WHERE
			mission_games.rating_column = 'rating_mp'
			AND missions.is_custom = 0
			AND matches.player_count > 1
			AND match_scores.placement = 1
			AND ( match_scores.team_id IS NOT NULL AND match_scores.team_id != -1 )
			AND match_scores.user_id = @userId;`).get({ userId: userId });
			if (mpteamwincount !== undefined) {
				mpteamwincount = mpteamwincount.mpWins;
			} else {
				mpteamwincount = 0;
			}

			if (!currentAchievements.has(47) && mpteamwincount > 0) {
				Achievement.grantAchievement(userId, 47);
			}

			if (!currentAchievements.has(56) && mpteamwincount > 100) {
				Achievement.grantAchievement(userId, 56);
			}
		}

		// Win FFA on spires
		if (!currentAchievements.has(67)) {
			let spirewins = Storage.query(`
		SELECT COUNT(*) AS mpWins
			FROM match_scores
			JOIN matches ON match_scores.match_id = matches.id
			JOIN user_scores ON matches.mission_id = user_scores.mission_id
			JOIN missions ON user_scores.mission_id = missions.id
		WHERE
			missions.basename= 'Spires_Hunt'
			AND matches.player_count >= 4
			AND match_scores.placement = 1
			AND match_scores.user_id = @userId`).get({ userId: userId });
			if (spirewins !== undefined) {
				spirewins = spirewins.mpWins;
			} else {
				spirewins = 0;
			}

			if (spirewins > 0) {
				Achievement.grantAchievement(userId, 67);
			}
		}

		if (!currentAchievements.has(61) || !currentAchievements.has(62) || !currentAchievements.has(63) || !currentAchievements.has(64) || !currentAchievements.has(65)) {
			// Achievement for gems
			let mpGems = Storage.query("SELECT SUM(gems_1_point) AS red, SUM(gems_2_point) AS yellow, SUM(gems_5_point) AS blue, SUM(gems_10_point) AS platinum FROM match_scores, user_scores WHERE user_scores.id = match_scores.score_id AND user_scores.user_id = @userId").get({ userId: userId });
			if (mpGems === undefined) {
				mpGems = {
					red: 0,
					yellow: 0,
					blue: 0,
					platinum: 0
				}
			}
			if (!currentAchievements.has(61) && mpGems.red >= 5000) {
				Achievement.grantAchievement(userId, 61);
			}
			if (!currentAchievements.has(62) && mpGems.yellow >= 2000) {
				Achievement.grantAchievement(userId, 62);
			}

			if (!currentAchievements.has(63) && mpGems.blue >= 400) {
				Achievement.grantAchievement(userId, 63);
			}

			if (!currentAchievements.has(64) && mpGems.red + mpGems.yellow + mpGems.blue + mpGems.platinum >= 15000) {
				Achievement.grantAchievement(userId, 64);
			}
		
			if (!currentAchievements.has(65) && mpGems.red + 2 * mpGems.yellow + 5 * mpGems.blue + 10 * mpGems.platinum >= 30000) {
				Achievement.grantAchievement(userId, 65);
			}
		}


		// 12 players on kotm
		if (!currentAchievements.has(76)) {
			let KOTM12P = Storage.query(`
		SELECT COUNT(*) AS kotm
			FROM matches
			JOIN match_scores ON matches.id = match_scores.match_id
			JOIN missions ON matches.mission_id = missions.id
		WHERE
			missions.basename = 'KingOfTheMarble_Hunt'
			AND matches.player_count > 12
			AND match_scores.user_id = @userId`).get({ userId: userId });
		
			if (KOTM12P === undefined) {
				KOTM12P = 0;
			} else {
				KOTM12P = KOTM12P.kotm;
			}

			if (KOTM12P > 0) {
				Achievement.grantAchievement(userId, 76);
			}
		}

		// Beat hunt with <= 2 pts
		if (!currentAchievements.has(49)) {
			let lessthan2 = Storage.query(`
		SELECT COUNT(*) AS lessthan
		FROM match_scores AS score
		 	JOIN matches On score.match_id = matches.id
		 	JOIN missions ON matches.mission_id = missions.id
		 	JOIN user_scores ON score.score_id = user_scores.id
		WHERE
		  matches.player_count > 1
		  AND score.placement = 1
		  AND score.user_id = @userId
		  AND (user_scores.score - (
			SELECT user_scores.score FROM match_scores
			JOIN user_scores ON match_scores.score_id = user_scores.id
			WHERE
			 	match_scores.placement = 2
			 	AND match_scores.match_id = score.match_id
			LIMIT 1
		  )) <= 2`).get({ userId: userId });
		
			if (lessthan2 === undefined) {
				lessthan2 = 0;
			} else {
				lessthan2 = lessthan2.lessthan;
			}

			if (lessthan2 > 0) {
				Achievement.grantAchievement(userId, 49);
			}
		}

		// Beat hunt with >= 50 pts
		if (!currentAchievements.has(50)) {
			let gt50 = Storage.query(`
		SELECT COUNT(*) AS gt
		FROM match_scores AS score
		 	JOIN matches On score.match_id = matches.id
		 	JOIN missions ON matches.mission_id = missions.id
		 	JOIN user_scores ON score.score_id = user_scores.id
		WHERE
		  matches.player_count > 1
		  AND score.placement = 1
		  AND score.user_id = @userId
		  AND (user_scores.score - (
			SELECT user_scores.score FROM match_scores
			JOIN user_scores ON match_scores.score_id = user_scores.id
			WHERE
			 	match_scores.placement = 2
			 	AND match_scores.match_id = score.match_id
			LIMIT 1
		  )) <= 2`).get({ userId: userId });
		
			if (gt50 === undefined) {
				gt50 = 0;
			} else {
				gt50 = gt50.gt;
			}

			if (gt50 > 0) {
				Achievement.grantAchievement(userId, 50);
			}
		}
		
		// Win match on all hunt levels
		if (!currentAchievements.has(51)) {
			let allhunt = Storage.query(`
		SELECT COUNT(*) AS allhunt FROM missions
		JOIN mission_games ON missions.game_id = mission_games.id
		WHERE missions.id NOT IN (
			SELECT missions.id
			FROM matches
				JOIN match_scores ON matches.id = match_scores.match_id
				JOIN missions ON matches.mission_id = missions.id
				JOIN mission_games ON missions.game_id = mission_games.id
			WHERE rating_column = 'rating_mp'
				AND is_custom = 0
				AND user_id = @userId
				AND player_count > 1
				AND placement = 1
		) AND rating_column = 'rating_mp'
		AND is_custom = 0`).get({ userId: userId });
			if (allhunt === undefined) {
				allhunt = 1;
			} else {
				allhunt = allhunt.allhunt;
			}

			if (allhunt === 0) {
				Achievement.grantAchievement(userId, 51);
			}
		}

		// Win FFA against 7 players
		if (!currentAchievements.has(53)) {
			let ffa7 = Storage.query(`
		SELECT COUNT(*) AS ffa
		FROM matches
			JOIN match_scores ON matches.id = match_scores.match_id
			JOIN missions ON matches.mission_id = missions.id
			JOIN mission_games ON missions.game_id = mission_games.id
		WHERE
			mission_games.rating_column = 'rating_mp'
			AND missions.is_custom = 0
			AND matches.player_count >= 8
			AND match_scores.placement = 1
			AND match_scores.user_id = @userId`).get({ userId: userId });
		
			if (ffa7 === undefined) {
				ffa7 = 0;
			} else {
				ffa7 = ffa7.ffa;
			}
		
			if (ffa7 > 0) {
				Achievement.grantAchievement(userId, 53);
			}
		}

		// Win streak based
		if (!currentAchievements.has(54) || !currentAchievements.has(55)) {
			let streaks = Storage.query("SELECT * FROM user_streaks WHERE user_id = @userId").get({ userId: userId });
			if (streaks === undefined) {
				streaks = 0;
			} else {
				streaks = streaks.mp_games;
			}

			if (!currentAchievements.has(54) && streaks >= 10) {
				Achievement.grantAchievement(userId, 54);
			}
			if (!currentAchievements.has(55) && streaks >= 25) {
				Achievement.grantAchievement(userId, 55);
			}
		}

		// All gold
		if (!currentAchievements.has(69)) {
			let ag = Storage.query(`
		SELECT COUNT(*) AS ag FROM missions
			JOIN mission_rating_info ON missions.id = mission_rating_info.mission_id
		WHERE modification = 'Gold'
			AND game_id = 6
		-- Levels that are in MBG where you do *not* have the platinum score
		-- If this is zero then you get the achievement 
		  AND (SELECT MAX(score) FROM user_scores
				WHERE user_id = @userId
				AND user_scores.mission_id = mission_id
		  ) < mission_rating_info.platinum_score`).get({ userId: userId });
			if (ag === undefined) {
				ag = 1;
			} else {
				ag = ag.ag;
			}

			if (ag === 0) {
				Achievement.grantAchievement(userId, 69);
			}
		}

		// All ultra
		if (!currentAchievements.has(70)) {
			let au = Storage.query(`
		SELECT COUNT(*) AS ag FROM missions
			JOIN mission_rating_info ON missions.id = mission_rating_info.mission_id
		WHERE modification = 'Ultra'
			AND game_id = 6
		-- Levels that are in MBU where you do *not* have the platinum score
		-- If this is zero then you get the achievement 
		  AND (SELECT MAX(score) FROM user_scores
				WHERE user_id = @userId
				AND user_scores.mission_id = mission_id
		  ) < mission_rating_info.platinum_score`).get({ userId: userId });
			if (au === undefined) {
				au = 1;
			} else {
				au = au.ag;
			}

			if (au === 0) {
				Achievement.grantAchievement(userId, 70);
			}
		}

		function numberOfWins(level: string) {
			let q = Storage.query(`
		SELECT COUNT(*) AS wins
			FROM match_scores
			JOIN matches ON match_scores.match_id = matches.id
			JOIN missions ON matches.mission_id = missions.id
		WHERE
			match_scores.user_id = @userId
			AND matches.player_count > 1
			AND match_scores.placement = 1
			AND missions.basename = @basename`).get({ userId: userId, basename: level });

			if (q === undefined) {
				return 0;
			} else {
				return q.wins;
			}
		}

		// 5 MP wins on these levels
		if (
			!currentAchievements.has(68) &&
			numberOfWins("Core_Hunt") >= 5 &&
			numberOfWins("Concentric_Hunt") >= 5 &&
			numberOfWins("Battlecube_Hunt") >= 5 &&
			numberOfWins("BattlecubeRevisited_Hunt") >= 5 &&
			numberOfWins("VortexEffect_Hunt") >= 5 &&
			numberOfWins("Zenith_Hunt") >= 5
		) {
			// wow, that's a lot of queries...
			Achievement.grantAchievement(userId, 68);
		}

		// Win 4v4
		if (!currentAchievements.has(72)) {
			let versus4 = Storage.query(`
		SELECT COUNT(*) AS wins FROM matches
			JOIN match_scores ON matches.id = match_scores.match_id
			JOIN missions ON matches.mission_id = missions.id
			JOIN mission_games ON missions.game_id = mission_games.id
			JOIN match_teams ON match_teams.id = match_scores.team_id
		WHERE rating_column = 'rating_mp'
			AND is_custom = 0
			AND user_id = @userId
			AND matches.player_count = 8
			AND match_teams.player_count = 4
			AND placement = 1
			AND (team_id IS NOT NULL AND team_id != -1)`).get({ userId: userId });
		
			if (versus4 === undefined) {
				versus4 = 0;
			} else {
				versus4 = versus4.wins;
			}

			if (versus4 > 0) {
				Achievement.grantAchievement(userId, 72);
			}
		}

		if (!currentAchievements.has(73)) {
			// Win on sprawl and horizon in teams
			let winquery = Storage.query(`
		SELECT COUNT(*) AS wins FROM matches
			JOIN match_scores ON matches.id = match_scores.match_id
			JOIN missions ON matches.mission_id = missions.id
			JOIN mission_games ON missions.game_id = mission_games.id
			JOIN match_teams ON match_teams.id = match_scores.team_id
		WHERE rating_column = 'rating_mp'
			AND is_custom = 0
			AND user_id = @userId
			AND matches.team_count > 2
			AND placement = 1
			AND (team_id IS NOT NULL AND team_id != -1)
			AND basename = @missionname`);
			let sprawlWins = winquery.get({ userId: userId, missionname: 'Sprawn_Hunt' });
			if (sprawlWins === undefined) {
				sprawlWins = 0;
			} else {
				sprawlWins = sprawlWins.wins;
			}
			let horizonWins = winquery.get({ userId: userId, missionname: 'Horizon_Hunt' });
			if (horizonWins === undefined) {
				horizonWins = 0;
			} else {
				horizonWins = horizonWins.wins;
			}

			if (sprawlWins + horizonWins > 0) {
				Achievement.grantAchievement(userId, 73);
			}
		}

		// Get lowest score on team by atleast half the next person
		if (!currentAchievements.has(74)) {
			let lwst = Storage.query(`
		SELECT COUNT(*) AS lwst FROM match_scores AS score
			JOIN matches ON score.match_id = matches.id
			JOIN missions ON matches.mission_id = missions.id
			JOIN match_teams ON score.team_id = match_teams.id
			JOIN user_scores ON score.score_id = user_scores.id
		-- All scores where:
		WHERE score.user_id = @userId
		-- Your team exists and has at least 2 players
			AND (team_id IS NOT NULL AND team_id != -1)
			AND match_teams.player_count > 1
			AND is_custom = 0
		-- The lowest non-you score on the team 
		  AND (
			SELECT MIN(user_scores.score) FROM match_scores
				JOIN user_scores ON match_scores.score_id = user_scores.id
				WHERE match_scores.match_id = score.match_id
				AND match_scores.user_id != @userId -- Because you can't use the same param twice
				AND team_id = score.team_id
		-- Is greater than twice your score
		) > user_scores.score * 2`).get({ userId: userId });

			if (lwst === undefined) {
				lwst = 0;
			} else {
				lwst = lwst.lwst;
			}

			if (lwst > 0) {
				Achievement.grantAchievement(userId, 74);
			}
		}

		// Get highest points than teammates
		if (!currentAchievements.has(75)) {
			let hghstteam = Storage.query(`
		SELECT COUNT(*) AS hghst FROM match_scores AS score
			JOIN matches ON score.match_id = matches.id
			JOIN missions ON matches.mission_id = missions.id
			JOIN match_teams ON score.team_id = match_teams.id
			JOIN user_scores ON score.score_id = user_scores.id
		-- All scores where:
		WHERE score.user_id = @userId
		-- Your team exists and has at least 3 players
			AND team_id IS NOT NULL
			AND match_teams.player_count > 2
			AND is_custom = 0
		-- Everyone else's scores summed up 
		  AND (
			SELECT SUM(user_scores.score) FROM match_scores
				JOIN user_scores ON match_scores.score_id = user_scores.id
				WHERE match_scores.match_id = score.match_id
				AND match_scores.user_id != @userId -- Because you can't use the same param twice
				AND team_id = score.team_id
		-- Is less than your score
		) < user_scores.score`).get({ userId: userId });
			if (hghstteam === undefined) {
				hghstteam = 0;
			} else {
				hghstteam = hghstteam.hghst;
			}

			if (hghstteam > 0) {
				Achievement.grantAchievement(userId, 75);
			}
		}

		// Get more points than everyone else
		if (!currentAchievements.has(78)) {
			let hghst = Storage.query(`
		SELECT COUNT(*) AS hghst FROM match_scores AS score
			JOIN matches ON score.match_id = matches.id
			JOIN missions ON matches.mission_id = missions.id
			JOIN user_scores ON score.score_id = user_scores.id
		-- All scores where:
		WHERE score.user_id = @userId
		  AND is_custom = 0
		  AND player_count > 2
		-- Everyone else's scores summed up 
		  AND (
			SELECT SUM(user_scores.score) FROM match_scores
				JOIN user_scores ON match_scores.score_id = user_scores.id
				WHERE match_scores.match_id = score.match_id
				AND match_scores.user_id != @userId -- Because you can't use the same param twice
		-- Is less than your score
		) < user_scores.score`).get({ userId: userId });
			if (hghst === undefined) {
				hghst = 0;
			} else {
				hghst = hghst.hghst;
			}

			if (hghst > 0) {
				Achievement.grantAchievement(userId, 78);
			}
		}

		// Beat a guy over 225 points.
		if (!currentAchievements.has(79)) {
			let beat225 = Storage.query(`
		SELECT COUNT(*) AS beat FROM match_scores AS score
			JOIN matches ON score.match_id = matches.id
			JOIN missions ON matches.mission_id = missions.id
			JOIN user_scores ON score.score_id = user_scores.id
		-- All scores where:
		WHERE score.user_id = @userId
		  AND is_custom = 0
		  AND player_count > 2
		-- Everyone else's scores summed up 
		  AND (
			SELECT SUM(user_scores.score) FROM match_scores
				JOIN user_scores ON match_scores.score_id = user_scores.id
				WHERE match_scores.match_id = score.match_id
				AND match_scores.user_id != @userId -- Because you can't use the same param twice
		-- Is less than your score sub 225
		) < (user_scores.score - 225)`).get({ userId: userId });
			if (beat225 === undefined) {
				beat225 = 0;
			} else {
				beat225 = beat225.beat;
			}

			if (beat225 > 0) {
				Achievement.grantAchievement(userId, 79);
			}
		}

		// Beat Matan
		// Yeah no this aint happening. If you're a guy from the future reading this code, yeah no you are not allowed to use your time machine.

		if (!currentAchievements.has(81)) {
			let negativeScore = Storage.query(`
		SELECT COUNT(*) AS neg FROM match_scores AS score
		JOIN matches ON score.match_id = matches.id
		JOIN user_scores ON score.score_id = user_scores.id
		-- So we can only get official levels
		JOIN missions ON matches.mission_id = missions.id
		JOIN mission_games ON missions.game_id = mission_games.id
		WHERE score.user_id = @userId
		  AND score < 0
		  -- And it wasn't custom
		  AND is_custom = 0
		  AND rating_column = 'rating_mp'`).get({ userId: userId });
		
			if (negativeScore === undefined) {
				negativeScore = 0;
			} else {
				negativeScore = negativeScore.neg;
			}

			if (negativeScore > 0) {
				Achievement.grantAchievement(userId, 81);
			}
		}
	}

}