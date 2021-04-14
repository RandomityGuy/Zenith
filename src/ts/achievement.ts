import { Player } from "./player";
import { Score } from "./score";
import { Storage } from "./storage";

export class Achievement {
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

	// Checks SP achievements
	static async updateSinglePlayerAchievements(userId: number) {
		let username = Player.getUsername(userId);
		let currentAchievements = Player.getPlayerAchievements(username).achievements;
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

		if (!currentAchievements.includes(1) || !currentAchievements.includes(2) || !currentAchievements.includes(32)) {	
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
			if (mbpeggcount + mbueggcount + pqeggcount + customeggcount > 0 && !currentAchievements.includes(1)) {
				Achievement.grantAchievement(userId, 1);
			}

			// All MBP eggs
			if (mbpeggcount === 98 && !currentAchievements.includes(2)) {
				Achievement.grantAchievement(userId, 2);
			}

			// All MBU Eggs
			if (mbueggcount === 20 && !currentAchievements.includes(32)) {
				Achievement.grantAchievement(userId, 32);
			}
		}

		if (!currentAchievements.includes(3) || !currentAchievements.includes(31) || !currentAchievements.includes(36)) {
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
				if (mbpPar.parScores > 0 && !currentAchievements.includes(3)) {
					Achievement.grantAchievement(userId, 3);
				}
			}

			// Any MBU Par
			let mbuPar = parCounts.find(x => x.game_id === 2);
			if (mbuPar !== undefined) {
				if (mbuPar.parScores > 0 && !currentAchievements.includes(31)) {
					Achievement.grantAchievement(userId, 31);
				}

				// All MBU Pars
				if (mbuPar.parScores === 61 && !currentAchievements.includes(36)) {
					Achievement.grantAchievement(userId, 36);
				}
			}
		}

		if (!currentAchievements.includes(37)) {
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
			if (!currentAchievements.includes(achievement) && best(levelId) < score) {
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
		if (!currentAchievements.includes(21) && best(117) < 95000 && best(107) < 150000) {
			Achievement.grantAchievement(userId, 21);
		}

		// LearnTheSuperJump and ThereAndBackAgain
		if (!currentAchievements.includes(22) && best(219) < 3500 && best(210) < 10000) {
			Achievement.grantAchievement(userId, 22);
		}

		// Moto-Marblecross, MSQ and MS
		if (!currentAchievements.includes(23) && best(193) < 4000 && best(194) < 20000 && best(195) < 15000) {
			Achievement.grantAchievement(userId, 23);
		}

		// Shimmy, PathOfLeastResistance, Daedalus, Tango
		if (!currentAchievements.includes(24) && best(248) < 3000 && best(256) < 10000 && best(275) < 15000 && best(241) < 13000) {
			Achievement.grantAchievement(userId, 24);
		}

		// halfpipe2_ultra and halfpipe_ultra
		if (!currentAchievements.includes(45) && best(54) < 1600 && best(36) < 1900) {
			Achievement.grantAchievement(userId, 45);
		}

		// Beat any 3 of: Skyscraper, SOTF, GDR, TowerMaze, Battlements, NaturakSelection
		if (!currentAchievements.includes(25)) {
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
		if (!currentAchievements.includes(26)) {
			if (topScores.record.length > 0) {
				Achievement.grantAchievement(userId, 26);
			}
		}

		// Beat a lot of ultra levels cause bruh
		if (!currentAchievements.includes(34)) {
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

		if (!currentAchievements.includes(35)) {
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
		if (!currentAchievements.includes(33) && bestModifiers(53, Score.modifierFlags.noJumping) < 30000) {
			Achievement.grantAchievement(userId, 33);
		}

		if (!currentAchievements.includes(38) && bestModifiers(17, Score.modifierFlags.doubleDiamond | Score.modifierFlags.noTimeTravels) < 75000) {
			Achievement.grantAchievement(userId, 38);
		}

		if (!currentAchievements.includes(39) && bestModifiers(1, Score.modifierFlags.gotEasterEgg) < 25000) {
			Achievement.grantAchievement(userId, 39);
		}

		// Rating based ones
		let rating = Storage.query("SELECT * FROM user_ratings WHERE user_id = @userId").get({ userId: userId });
		if (!currentAchievements.includes(27) && rating.rating_mbg > 7000000) {
			Achievement.grantAchievement(userId, 27);
		}

		if (!currentAchievements.includes(28) && rating.rating_mbp > 12000000) {
			Achievement.grantAchievement(userId, 28);
		}

		if (!currentAchievements.includes(29) && rating.rating_general > 30000000) {
			Achievement.grantAchievement(userId, 29);
		}
		
		if (!currentAchievements.includes(30) && rating.rating_general > 60000000) {
			Achievement.grantAchievement(userId, 30);
		}

		if (!currentAchievements.includes(40) && rating.rating_mbu > 4000000) {
			Achievement.grantAchievement(userId, 40);
		}

	}

	// Check MP Achievements, these shits are extremly query heavy
	static async UpdateMultiplayerAchievements(userId: number) {
		// Most of these queries are just copied from the original php
		let username = Player.getUsername(userId);
		let currentAchievements = Player.getPlayerAchievements(username).achievements;

		if (!currentAchievements.includes(46) || !currentAchievements.includes(57)) {
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

			if (!currentAchievements.includes(46) && mpwincount > 0) {
				Achievement.grantAchievement(userId, 46);
			}

			if (!currentAchievements.includes(57) && mpwincount > 500) {
				Achievement.grantAchievement(userId, 57);
			}
		}

		// Win teams match
		// Win 100 teams matches
		if (!currentAchievements.includes(47) || !currentAchievements.includes(56)) {
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

			if (!currentAchievements.includes(47) && mpteamwincount > 0) {
				Achievement.grantAchievement(userId, 47);
			}

			if (!currentAchievements.includes(56) && mpteamwincount > 100) {
				Achievement.grantAchievement(userId, 56);
			}
		}

		// Win FFA on spires
		if (!currentAchievements.includes(67)) {
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

		if (!currentAchievements.includes(61) || !currentAchievements.includes(62) || !currentAchievements.includes(63) || !currentAchievements.includes(64) || !currentAchievements.includes(65)) {
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
			if (!currentAchievements.includes(61) && mpGems.red >= 5000) {
				Achievement.grantAchievement(userId, 61);
			}
			if (!currentAchievements.includes(62) && mpGems.yellow >= 2000) {
				Achievement.grantAchievement(userId, 62);
			}

			if (!currentAchievements.includes(63) && mpGems.blue >= 400) {
				Achievement.grantAchievement(userId, 63);
			}

			if (!currentAchievements.includes(64) && mpGems.red + mpGems.yellow + mpGems.blue + mpGems.platinum >= 15000) {
				Achievement.grantAchievement(userId, 64);
			}
		
			if (!currentAchievements.includes(65) && mpGems.red + 2 * mpGems.yellow + 5 * mpGems.blue + 10 * mpGems.platinum >= 30000) {
				Achievement.grantAchievement(userId, 65);
			}
		}


		// 12 players on kotm
		if (!currentAchievements.includes(76)) {
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
		if (!currentAchievements.includes(49)) {
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
		if (!currentAchievements.includes(50)) {
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
		if (!currentAchievements.includes(51)) {
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
				allhunt = 0;
			} else {
				allhunt = allhunt.allhunt;
			}

			if (allhunt > 0) {
				Achievement.grantAchievement(userId, 51);
			}
		}

		// Win FFA against 7 players
		if (!currentAchievements.includes(53)) {
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
		if (!currentAchievements.includes(54) || !currentAchievements.includes(55)) {
			let streaks = Storage.query("SELECT * FROM user_streaks WHERE user_id = @userId").get({ userId: userId });
			if (streaks === undefined) {
				streaks = 0;
			} else {
				streaks = streaks.mp_games;
			}

			if (!currentAchievements.includes(54) && streaks >= 10) {
				Achievement.grantAchievement(userId, 54);
			}
			if (!currentAchievements.includes(55) && streaks >= 25) {
				Achievement.grantAchievement(userId, 55);
			}
		}

		// All gold
		if (!currentAchievements.includes(69)) {
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
		if (!currentAchievements.includes(70)) {
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
			!currentAchievements.includes(68) &&
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
		if (!currentAchievements.includes(72)) {
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

		if (!currentAchievements.includes(73)) {
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
		if (!currentAchievements.includes(74)) {
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
		if (!currentAchievements.includes(75)) {
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
		if (!currentAchievements.includes(78)) {
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
		if (!currentAchievements.includes(79)) {
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

		if (!currentAchievements.includes(81)) {
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