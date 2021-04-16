import { Achievement } from "./achievement";
import { Player } from "./player";
import { Score } from "./score";
import { Storage } from "./storage";

export class AchievementSP {
    // Checks SP achievements
	static async updateSinglePlayerAchievements(userId: number) {
		let username = Player.getUsername(userId);
		let currentAchievements = new Set(Player.getPlayerAchievements(username).achievements);
		let topScores = Score.getPersonalTopScoreList(userId);

		let eggCountQuery = Storage.query(`
		SELECT COUNT(*) AS eggCount
		FROM (
			SELECT * 
			FROM user_eggs, missions, mission_games 
			WHERE user_eggs.mission_id = missions.id AND missions.game_id = @gameId AND user_id = @userId 
			GROUP BY mission_id 
			HAVING MIN("time")
		);`);

		if (!currentAchievements.has(1) || !currentAchievements.has(2) || !currentAchievements.has(32)) {	
			let mbpeggcount = eggCountQuery.get({ userId: userId, gameId: 2 });
			if (mbpeggcount !== undefined) {
				mbpeggcount = mbpeggcount.eggCount;
			} else {
				mbpeggcount = 0;
			}
			let mbueggcount = eggCountQuery.get({ userId: userId, gameId: 3 });
			if (mbueggcount !== undefined) {
				mbueggcount = mbueggcount.eggCount;
			} else {
				mbueggcount = 0;
			}
			let pqeggcount = eggCountQuery.get({ userId: userId, gameId: 4 });
			if (pqeggcount !== undefined) {
				pqeggcount = pqeggcount.eggCount;
			} else {
				pqeggcount = 0;
			}
			let customeggcount = eggCountQuery.get({ userId: userId, gameId: 5 });
			if (customeggcount !== undefined) {
				customeggcount = customeggcount.eggCount;
			} else {
				customeggcount = 0;
			}
		
			// Get atleast 1 egg
			if (mbpeggcount + mbueggcount + pqeggcount + customeggcount > 0 && !currentAchievements.has(1)) {
				Achievement.grantAchievement(userId, 1);
			}

			// All MBP eggs
			if (mbpeggcount === 98 && !currentAchievements.has(2)) {
				Achievement.grantAchievement(userId, 2);
			}

			// All MBU Eggs
			if (mbueggcount === 20 && !currentAchievements.has(32)) {
				Achievement.grantAchievement(userId, 32);
			}
		}

		if (!currentAchievements.has(3) || !currentAchievements.has(31) || !currentAchievements.has(36)) {
			// Any level under par
			let parCounts = Storage.query(`
		SELECT COUNT(*) AS parScores, game_id
		FROM (
			SELECT * 
			FROM user_scores, mission_rating_info, mission_games, missions
			WHERE user_scores.user_id = @userId AND mission_rating_info.mission_id = user_scores.mission_id AND mission_games.id  = missions.game_id AND missions.id = user_scores.mission_id AND user_scores.disabled = 0 AND mission_games.game_type = 'Single Player'
			GROUP BY user_scores.mission_id 
			HAVING sort = MIN(sort)
			)
		WHERE ( 
			CASE
			WHEN score_type = 'time' THEN ( par_time > score OR gamemode LIKE '%gemmadness%')
			WHEN score_type = 'score' THEN par_score < score
			END
		)
		GROUP BY game_id`).all({ userId: userId });

			// let totalPars = parCounts.map(x => x.parScores).reduce((total, current) => (total + current), 0);

			// Any MBP Par
			let mbpPar = parCounts.find(x => x.game_id === 1);
			if (mbpPar !== undefined) {
				if (mbpPar.parScores > 0 && !currentAchievements.has(3)) {
					Achievement.grantAchievement(userId, 3);
				}
			}

			// Any MBU Par
			let mbuPar = parCounts.find(x => x.game_id === 2);
			if (mbuPar !== undefined) {
				if (mbuPar.parScores > 0 && !currentAchievements.has(31)) {
					Achievement.grantAchievement(userId, 31);
				}

				// All MBU Pars
				if (mbuPar.parScores === 61 && !currentAchievements.has(36)) {
					Achievement.grantAchievement(userId, 36);
				}
			}
		}

		if (!currentAchievements.has(37)) {
			// All MBU UTs, query copied from player.ts so we can cache
			let UTCount = Storage.query(`
		SELECT COUNT(*) AS CTCount
		FROM (
			SELECT * 
			FROM user_scores, mission_rating_info, mission_games, missions
			WHERE user_scores.user_id = @userId AND mission_rating_info.mission_id = user_scores.mission_id AND mission_games.id = @gameId AND mission_games.id  = missions.game_id AND missions.id = user_scores.mission_id AND user_scores.disabled = 0
			GROUP BY user_scores.mission_id 
			HAVING sort = MIN(sort)
		)
		WHERE ( 
			CASE
			WHEN score_type = 'time' THEN ( ultimate_time > score OR gamemode LIKE '%gemmadness%')
			WHEN score_type = 'score' THEN ultimate_score < score
			END
		);`).get({ userId: userId, gameId: 3 })
		
			if (UTCount.CTCount === 61) {
				Achievement.grantAchievement(userId, 37);
			}
		}

		function best(missionId: number) {
			if (topScores[missionId] === undefined) {
				return 6000000
			}
			return topScores[missionId].score;
		}

		function levelBased(levelId: number, score: number, achievement: number) {
			if (!currentAchievements.has(achievement) && best(levelId) < score) {
				Achievement.grantAchievement(userId, achievement)
			}
		}
		
		// Level based ones, man this is literally unmaintainable cause fuck me, literally hardcoded ids
		levelBased(130, 1750, 4); // LearnTheTimeModifier
		levelBased(121, 7000, 5); // ArchAcropolis
		levelBased(264, 9000, 6); // KingOfTheMountain
		levelBased(254, 10000, 7); // PinballWizard
		levelBased(250, 15000, 8); // RampsReloaded
		levelBased(273, 17000, 9); // Dive!
		levelBased(280, 18000, 10); // Acrobat
		levelBased(265, 20000, 11); // Icarus
		levelBased(279, 25000, 12); // Airwalk
		levelBased(255, 30000, 13); // Pathways
		levelBased(247, 40000, 14); // Siege
		levelBased(238, 40000, 15); // Tightrope
		levelBased(180, 60000, 16); // ComboCourse
		levelBased(150, 60000, 17); // Thief
		levelBased(106, 390000, 18); // SpaceStation
		levelBased(120, 570000, 19); // BattlecubeFinale
		levelBased(120, 420000, 20); // BattlecubeFinale
		levelBased(17, 12000, 41); // blackdiamond_ultra
		levelBased(2, 10000, 42); // urban_ultra
		levelBased(55, 15000, 43); // endurance_ultra
		levelBased(40, 7250, 44); // earlyfrost_ultra

		// Catwalks and Slowropes
		if (!currentAchievements.has(21) && best(117) < 95000 && best(107) < 150000) {
			Achievement.grantAchievement(userId, 21);
		}

		// LearnTheSuperJump and ThereAndBackAgain
		if (!currentAchievements.has(22) && best(219) < 3500 && best(210) < 10000) {
			Achievement.grantAchievement(userId, 22);
		}

		// Moto-Marblecross, MSQ and MS
		if (!currentAchievements.has(23) && best(193) < 4000 && best(194) < 20000 && best(195) < 15000) {
			Achievement.grantAchievement(userId, 23);
		}

		// Shimmy, PathOfLeastResistance, Daedalus, Tango
		if (!currentAchievements.has(24) && best(248) < 3000 && best(256) < 10000 && best(275) < 15000 && best(241) < 13000) {
			Achievement.grantAchievement(userId, 24);
		}

		// halfpipe2_ultra and halfpipe_ultra
		if (!currentAchievements.has(45) && best(54) < 1600 && best(36) < 1900) {
			Achievement.grantAchievement(userId, 45);
		}

		// Beat any 3 of: Skyscraper, SOTF, GDR, TowerMaze, Battlements, NaturakSelection
		if (!currentAchievements.has(25)) {
			let c = (best(245) < 60000 ? 1 : 0) +
				(best(242) < 30000 ? 1 : 0) +
				(best(267) < 30000 ? 1 : 0) +
				(best(236) < 20000 ? 1 : 0) +
				(best(277) < 15000 ? 1 : 0) +
				(best(259) < 20000 ? 1 : 0);
			if (c >= 3) {
				Achievement.grantAchievement(userId, 25);
			}
		}

		// Get a WR
		if (!currentAchievements.has(26)) {
			if (topScores.record.length > 0) {
				Achievement.grantAchievement(userId, 26);
			}
		}

		// Beat a lot of ultra levels cause bruh
		if (!currentAchievements.has(34)) {
			if (best(26) != 6000000 &&
				best(38) != 6000000 &&
				best(25) != 6000000 &&
				best(40) != 6000000 &&
				best(21) != 6000000 &&
				best(24) != 6000000 &&
				best(34) != 6000000 &&
				best(22) != 6000000 &&
				best(14) != 6000000 &&
				best(19) != 6000000 &&
				best(15) != 6000000 &&
				best(9) != 6000000 &&
				best(20) != 6000000 &&
				best(16) != 6000000 &&
				best(8) != 6000000 &&
				best(4) != 6000000 &&
				best(13) != 6000000 &&
				best(7) != 6000000 &&
				best(1) != 6000000 &&
				best(12) != 6000000 &&
				best(45) != 6000000 &&
				best(51) != 6000000 &&
				best(44) != 6000000 &&
				best(50) != 6000000 &&
				best(49) != 6000000 &&
				best(61) != 6000000 &&
				best(60) != 6000000 &&
				best(43) != 6000000 &&
				best(59) != 6000000 &&
				best(46) != 6000000 &&
				best(42) != 6000000 &&
				best(52) != 6000000 &&
				best(47) != 6000000 &&
				best(48) != 6000000
			) {
				Achievement.grantAchievement(userId, 34);
			}
		}

		if (!currentAchievements.has(35)) {
			if (best(10) != 6000000 &&
				best(18) != 6000000 &&
				best(56) != 6000000 &&
				best(2) != 6000000 &&
				best(11) != 6000000 &&
				best(3) != 6000000 &&
				best(6) != 6000000 &&
				best(58) != 6000000 &&
				best(55) != 6000000
			) {
				Achievement.grantAchievement(userId, 35);
			}
		}

		function bestModifiers(missionId: number, modifiers: number) {
			let score = Storage.query("SELECT * FROM user_scores WHERE user_id = @userId AND mission_id = @missionId AND user_scores.disabled = 0 AND (modifiers & @modifiers = @modifiers) ORDER BY sort;").get({ userId: userId, missionId: missionId, modifiers: modifiers });
			if (score === undefined) {
				return 6000000;
			}
			return score.score;
		}

		// Special modifiers
		if (!currentAchievements.has(33) && bestModifiers(53, Score.modifierFlags.noJumping) < 30000) {
			Achievement.grantAchievement(userId, 33);
		}

		if (!currentAchievements.has(38) && bestModifiers(17, Score.modifierFlags.doubleDiamond | Score.modifierFlags.noTimeTravels) < 75000) {
			Achievement.grantAchievement(userId, 38);
		}

		if (!currentAchievements.has(39) && bestModifiers(1, Score.modifierFlags.gotEasterEgg) < 25000) {
			Achievement.grantAchievement(userId, 39);
		}

		// Rating based ones
		let rating = Storage.query("SELECT * FROM user_ratings WHERE user_id = @userId").get({ userId: userId });
		if (!currentAchievements.has(27) && rating.rating_mbg > 7000000) {
			Achievement.grantAchievement(userId, 27);
		}

		if (!currentAchievements.has(28) && rating.rating_mbp > 12000000) {
			Achievement.grantAchievement(userId, 28);
		}

		if (!currentAchievements.has(29) && rating.rating_general > 30000000) {
			Achievement.grantAchievement(userId, 29);
		}
		
		if (!currentAchievements.has(30) && rating.rating_general > 60000000) {
			Achievement.grantAchievement(userId, 30);
		}

		if (!currentAchievements.has(40) && rating.rating_mbu > 4000000) {
			Achievement.grantAchievement(userId, 40);
		}

	}
}