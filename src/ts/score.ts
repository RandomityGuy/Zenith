import { Achievement } from "./achievement";
import { Storage } from "./storage";

interface RatingInfo {
	mission_id: number,
	par_time: number,
	platinum_time: number,
	ultimate_time: number,
	awesome_time: number,
	par_score: number,
	platinum_score: number,
	ultimate_score: number,
	awesome_score: number,
	versus_par_score: number,
	versus_platinum_score: number,
	versus_ultimate_score: number,
	versus_awesome_score: number,
	completion_bonus: number,
	set_base_score: number,
	multiplier_set_base: number,
	platinum_bonus: number,
	ultimate_bonus: number,
	awesome_bonus: number,
	standardiser: number,
	time_offset: number,
	difficulty: number,
	platinum_difficulty: number,
	ultimate_difficulty: number,
	awesome_difficulty: number,
	hunt_multiplier: number,
	hunt_divisor: number,
	hunt_completion_bonus: number,
	hunt_par_bonus: number,
	hunt_platinum_bonus: number,
	hunt_ultimate_bonus: number,
	hunt_awesome_bonus: number,
	hunt_max_score: number,
	quota_100_bonus: number,
	gem_count: number,
	gem_count_1: number,
	gem_count_2: number,
	gem_count_5: number,
	gem_count_10: number,
	has_egg: number,
	egg_rating: number,
	disabled: number,
	normally_hidden: number,
	notes: string
};

export class Score {
	static getPersonalTopScoreList(userId: number) {
		let topScoresData = Storage.query("SELECT mission_id, score, score_type FROM user_scores WHERE user_id = @userId AND user_scores.disabled = 0 GROUP BY mission_id HAVING sort = MIN(sort);").all({ userId: userId });
		let lapTimes = Storage.query("SELECT mission_id, time as 'score', 'time' as score_type FROM user_lap_times WHERE user_id = @userId GROUP BY mission_id HAVING MIN(time);").all({ userId: userId })
		let quota100 = Storage.query("SELECT mission_id, score, score_type FROM user_scores WHERE user_id = @userId AND (modifiers & (1 << 4) = (1 << 4)) GROUP BY mission_id HAVING (CASE WHEN score_type='time' THEN MIN(score) ELSE MAX(score) END)").all({ userId: userId });
		let wrList = Storage.query(`
		SELECT T.mission_id
		FROM (
			SELECT S.mission_id, S.user_id, S.score, missions.name, missions.sort_index, timestamp
			FROM (
				SELECT mission_id, user_id, score, 1 AS priority, timestamp
				FROM user_scores 
				WHERE score_type = 'time' AND disabled = 0 
				GROUP BY mission_id HAVING MIN(score)
				UNION
				SELECT mission_id, user_id, score, 0 AS priority, timestamp
				FROM user_scores 
				WHERE score_type = 'score' AND disabled = 0 
				GROUP BY mission_id HAVING MAX(score)
			) AS S, missions, mission_games
			WHERE missions.is_custom = 0 AND missions.id = S.mission_id AND missions.id = S.mission_id AND mission_games.id = missions.game_id AND mission_games.game_type = 'Single Player'
			GROUP BY mission_id HAVING MAX(priority) ANd MAX(timestamp)
		) AS T
		WHERE T.user_id = @userId;`).all({ userId: userId }).map(x => x.mission_id);
		let dict = new Map<any, any>();
		topScoresData.forEach(x => {
			dict.set(Number.parseInt(x.mission_id), {
				mission_id: Number.parseInt(x.mission_id),
				score: x.score,
				score_type: x.score_type
			});
		});
		dict.set('lapTimes', lapTimes);
		dict.set('quota100', quota100);
		dict.set('record', wrList);

		let obj = Object.fromEntries(dict);
		return obj;
	}

	static getPersonalTopScores(userId: number, missionId: number, modifiers: number | null = null) {
		let scoreData = Storage.query("SELECT * FROM user_scores WHERE user_id = @userId AND mission_id = @missionId AND user_scores.disabled = 0 ORDER BY sort;").all({ userId: userId, missionId: missionId });
		let obj = {
			scores: scoreData,
			missionId: missionId
		};
		return obj;
	}

	static getGlobalTopScores(missionId: number, modifiers: number = 0) {
		let scoreData = Storage.query("SELECT gem_count, gems_1_point, gems_2_point, gems_5_point, gems_10_point, user_scores.id, modifiers, users.name, users.username, origin, row_number() OVER (ORDER BY sort) AS placement, rating, score, score_type, timestamp, total_bonus, user_id FROM user_scores, users WHERE mission_id = @missionId AND users.id = user_scores.user_id AND (modifiers & @modifier = @modifier) AND disabled = 0 GROUP BY user_id").all({ missionId: missionId, modifier: modifiers });
		let spcolumnData = [
			{ name: "placement", display: "#", type: "place", tab: "1", width: "40" },
			{ name: "name", display: "Player", type: "string", tab: "40", width: "-190" },
			{ name: "score", display: "Score", tab: "-145", width: "-75" },
			{ name: "rating", display: "Rating", type: "score", tab: "0", width: "75" }
		]
		let mpcolumnData = [
			{ name: "placement", display: "#", type: "place", tab: "1", width: "40" },
			{ name: "name", display: "Player", type: "string", tab: "40", width: "-75" },
			{ name: "score", display: "Score", tab: "-75", width: "75" },
		]
		let gameType = Storage.query("SELECT game_type FROM mission_games, missions WHERE missions.game_id=mission_games.id AND missions.id=@missionId").get({ missionId: missionId });
		gameType = gameType.game_type;
		let obj = {
			columns: gameType === "Single Player" ? spcolumnData : mpcolumnData,
			scores: scoreData,
			missionId: missionId
		};
		return obj;
	}

	static getTopScoreModes(missionId: number) {
		let columnData = [
			{ name: "placement", display: "#", type: "place", tab: "1", width: "40" },
			{ name: "name", display: "Player", type: "string", tab: "40", width: "-75" },
			{ name: "score", display: "Time", type: "time", tab: "-75", width: "75" },
		]
		let columnData2 = [
			{ name: "placement", display: "#", type: "place", tab: "1", width: "40" },
			{ name: "name", display: "Player", type: "string", tab: "40", width: "-75" },
			{ name: "time", display: "Time", type: "time", tab: "-75", width: "75" },
		]
		let ddscoredata = this.getGlobalTopScores(missionId, 1 << 2);
		ddscoredata.columns = columnData;

		let eggscoredata = Storage.query("SELECT name, username, time, row_number() OVER (ORDER BY time) AS placement  FROM user_eggs, users WHERE mission_id = @missionId AND users.id = user_eggs.user_id GROUP BY user_id HAVING MIN(time);").all({ missionId: missionId });
		let laptimesdata = Storage.query("SELECT user_id, name, username, time, row_number() OVER (ORDER BY time) AS placement  FROM user_lap_times, users WHERE mission_id = @missionId AND users.id = user_lap_times.user_id GROUP BY user_id HAVING MIN(time);").all({ missionId: missionId });
		let quota100data = this.getGlobalTopScores(missionId, 1 << 4);
		quota100data.columns = columnData;
		let obj = {
			dd: ddscoredata,
			egg: {
				scores: eggscoredata,
				columns: columnData2,
				missionId: missionId,
			},
			lap: {
				scores: laptimesdata,
				columns: columnData2,
				missionId: missionId,
			},
			quota100: quota100data,
			missionId: missionId
		}

		return obj;
	}

	static recordScore(userId: number, missionId: number, score: number, scoreType: string, modifiers: number, totalBonus: number, gemCount: number, gems1: number, gems2: number, gems5: number, gems10: number) {
		// First get the best score of yours and the top score
		let personalTopScore = Storage.query("SELECT * FROM user_scores WHERE user_id = @userId AND mission_id = @missionId AND user_scores.disabled = 0 ORDER BY sort;").get({ userId: userId, missionId: missionId });
		if (personalTopScore === undefined) {
			personalTopScore = {
				rating: 0
			}
		}
		let globaltopScore = Storage.query("SELECT row_number() OVER (ORDER BY sort) AS placement, score, sort FROM user_scores, users WHERE mission_id = @missionId AND users.id = user_scores.user_id AND (modifiers & @modifier = @modifier) AND disabled = 0 GROUP BY user_id").get({ missionId: missionId, modifier: 0 });
		if (globaltopScore === undefined) {
			globaltopScore = {
				placement: 0,
				score: 1000000,
				sort: 10000000,
			}
		}
		let mission = Storage.query("SELECT * FROM missions WHERE id=@missionId;").get({ missionId: missionId });
		let missionRatingInfo = Storage.query("SELECT * FROM mission_rating_info WHERE mission_id=@missionId;").get({ missionId: missionId }) as RatingInfo;
		// Now calculate our ratings
		let rating = Score.getRating(score, mission.gamemode, missionRatingInfo, modifiers);

		// Now delta rating
		let topRating = Number.parseInt(personalTopScore.rating)
		let deltaRating: number;
		if (rating > topRating) {
			deltaRating = rating - topRating;
		} else {
			deltaRating = 0;
		}

		// Generate the 'sort' column, huge hacx
		let sort = scoreType === "time" ? score : 10000000 - score;

		// Check if its WR
		let isWR = false;
		if (sort < globaltopScore.sort) {
			isWR = true;
		}

		// Now update our net ratings
		if (deltaRating > 0) {
			// Get the rating column
			let ratingColumn = Storage.query("SELECT rating_column FROM mission_games, missions WHERE missions.id=@missionId AND game_id=mission_games.id;").get({ missionId: missionId });
			ratingColumn = ratingColumn.rating_column;

			// Now update
			Storage.query(`UPDATE user_ratings SET ${ratingColumn}=${ratingColumn} + @rating WHERE user_id=@userId`).run({ rating: deltaRating, userId: userId });
			Storage.query(`UPDATE user_ratings SET rating_general=rating_general + @rating WHERE user_id=@userId`).run({ rating: deltaRating, userId: userId });
		}

		// Quota100 ratings...
		if (modifiers & Score.modifierFlags.quotaHundred) {
			Storage.query(`UPDATE user_ratings SET rating_quota_bonus=rating_quota_bonus + @rating WHERE user_id=@userId`).run({ rating: missionRatingInfo.quota_100_bonus, userId: userId });
		}

		// Now finally add our score

		let insertQuery = Storage.query(`INSERT INTO user_scores(user_id,mission_id,score,score_type,total_bonus,rating,gem_count,gems_1_point,gems_2_point,gems_5_point,gems_10_point,modifiers,origin,extra_modes,sort,disabled,timestamp) VALUES (@userId, @missionId, @score, @scoreType, @totalBonus, @rating, @gemCount, @gems1, @gems2, @gems5, @gems10, @modifiers, 'PlatinumQuest', '', @sort, '0', DATETIME('now','localtime'));`);
		let c = insertQuery.run({ userId: userId, missionId: missionId, score: score, scoreType: scoreType, totalBonus: totalBonus, rating: rating, gemCount: gemCount, gems1: gems1, gems2: gems2, gems5: gems5, gems10: gems10, modifiers: modifiers, sort: sort });

		let success = c.changes > 0;

		// Get the new rating
		let newRating = Storage.query("SELECT rating_general FROM user_ratings WHERE user_id=@userId").get({ userId: userId });
		newRating = newRating.rating_general;

		// Calculate our rank
		let scoreId = Storage.query("SELECT MAX(id) AS scoreId FROM user_scores;").get(); // ehh
		scoreId = scoreId.scoreId;
		let rank = Storage.query(`
		SELECT placement
		FROM (
			SELECT *, RANK() OVER (ORDER BY sort ASC) AS placement, id
			FROM (
				SELECT score, sort, user_id, user_scores.id
				FROM user_scores, users 
				WHERE mission_id = @missionId AND users.id = user_scores.user_id AND (modifiers & 0 = 0) AND disabled = 0 AND user_id != @userId
				GROUP BY user_id
				UNION 
				SELECT user_scores.score, user_scores.sort, user_scores.user_id, user_scores.id
				FROM user_scores
				WHERE id = @scoreId
			)
		)
		WHERE id = @scoreId`).get({ missionId: missionId, userId: userId, scoreId: scoreId });
		rank = rank.placement;

		// Now generate our final result;
		let resultset = [] as string[];
		if (success) {
			resultset.push(`SUCCESS ${rating}`);
		} else {
			resultset.push(`FAILURE`);
		}
		resultset.push(`RATING ${rating}`);
		resultset.push(`NEWRATING ${newRating}`);
		resultset.push(`POSITION ${rank}`);
		resultset.push(`DELTA ${deltaRating}`);
		if (isWR)
			resultset.push("RECORDING");
		
		// Do the achievement shit
		Achievement.updateSinglePlayerAchievements(userId);
		
		return resultset;
	}

	// The following data is copied from the Marble Blast Ratings Viewer source code

	static modifierFlags = {
		gotEasterEgg:  1 << 0,
		noJumping:     1 << 1,
		doubleDiamond: 1 << 2,
		noTimeTravels: 1 << 3,
		quotaHundred:  1 << 4,
		gemMadnessAll: 1 << 5
	};

	static getNullScoreRating(score: number, ratingInfo: RatingInfo, modifiers: number) {
		//Some quick bounds checking
		if (score < ratingInfo.time_offset)
			return -2; //Bad Score

		//HiGuy: I just copied this all from 1.14
		let parTime = ratingInfo.par_time;
		let platinumTime = ratingInfo.platinum_time;
		let ultimateTime = ratingInfo.ultimate_time;
		let awesomeTime = ratingInfo.awesome_time;
		let completionBonus = ratingInfo.completion_bonus;

		//Levels with a difficulty automatically change their bonus
		completionBonus *= ratingInfo.difficulty;

		//This is the time used for calculating your score. If you got under par (and a par exists)
		// then your score will just be the score at par time, because the if-statement below will
		// reduce it linearly.
		let scoreTime;
		if (parTime > 0)
			scoreTime = Math.min(score, parTime) / 1000;
		else
			scoreTime = score / 1000;

		scoreTime -= ratingInfo.time_offset / 1000;
		scoreTime += 0.1;

		//You instantly get bonus points if you beat a challenge time
		let bonus = 0;
		if (platinumTime && score < platinumTime)
			bonus += ratingInfo.platinum_bonus * ratingInfo.platinum_difficulty;
		if (ultimateTime && score < ultimateTime)
			bonus += ratingInfo.ultimate_bonus * ratingInfo.ultimate_difficulty;
		if (awesomeTime && score < awesomeTime)
			bonus += ratingInfo.awesome_bonus * ratingInfo.awesome_difficulty;

		let standardiser = ratingInfo.standardiser;
		let setBaseScore = ratingInfo.set_base_score;
		let multiplierSetBase = ratingInfo.multiplier_set_base;

		//(completion base score+(Platinum×platinum bonus)+(On Ult×platinum bonus)+(Ultimate×platinum bonus)+(Ultimate×ultimate bonus)+((LOG(Time,10)×Standardiser)−base score)×−1)×multiplier

		// Spy47 : Awesome formula (not made by me).
		let rating = (completionBonus + bonus + (((Math.log(scoreTime) / Math.log(10) * standardiser) - setBaseScore) * -1)) * multiplierSetBase;

		//If they get over the par time, linearly decrease the number of points they'll get until you hit 0
		if (score > parTime && (parTime > 0)) {
			//Number of points you will lose per second over par. It just divides the score at par
			// by the seconds after par until 99:59.999 (which gives a score of 0).
			let lostPerSec = (rating - 1) / (5999.999 - (parTime / 1000));

			//How many seconds over par you are
			let overPar = Math.max(score - parTime, 0) / 1000;

			//Just multiply them and that's how many points you lose
			rating -= overPar * lostPerSec;
		}

		// Spy47 : They'll probably commit suicide if they see a negative rating.
		rating = Math.floor(rating < 1 ? 1 : rating);

		return rating;
	}

	static getHuntScoreRating(score: number, ratingInfo: RatingInfo) {
		//Tons of bonuses
		let bonus = ratingInfo.hunt_completion_bonus;
		if (ratingInfo.par_score && score >= ratingInfo.par_score)
			bonus += ratingInfo.hunt_par_bonus;
		if (ratingInfo.platinum_score && score >= ratingInfo.platinum_score)
			bonus += ratingInfo.hunt_platinum_bonus;
		if (ratingInfo.ultimate_score && score >= ratingInfo.ultimate_score)
			bonus += ratingInfo.hunt_ultimate_bonus;
		if (ratingInfo.awesome_score && score >= ratingInfo.awesome_score)
			bonus += ratingInfo.hunt_awesome_bonus;

		//Rating = HuntBaseScore (ℯ^(x / HuntStandardiser) - 1) + If[x ≥ Par, ParBonus, 0] + If[x ≥ Platinum, PlatinumBonus, 0] + If[x ≥ Ultimate, UltimateBonus, 0] + If[x ≥ Awesome, AwesomeBonus, 0] + CompletionBonus
		//Or more succinctly:
		//Rating = HuntBaseScore (ℯ^(x / HuntStandardiser) - 1) + Bonuses
		return Math.floor(ratingInfo.hunt_multiplier * (Math.exp(score / ratingInfo.hunt_divisor) - 1) + bonus);
	}

	static getGemMadnessScoreRating(score: number, ratingInfo: RatingInfo, modifiers: number) {
		//Check for not all gems, (because it's cleaner)
		if ((modifiers & Score.modifierFlags.gemMadnessAll) === 0) {
			return Score.getHuntScoreRating(score, ratingInfo);
		}

		//They have gotten all the hunt gems, so we need to combine the hunt rating for all gems
		// with a null rating of their time

		//Hunt rating for their points, which has to be calculated from their gem totals
		let huntRating = Score.getHuntScoreRating(ratingInfo.hunt_max_score, ratingInfo);

		//Null rating of their time
		let nullRating = Score.getNullScoreRating(score, ratingInfo, modifiers);

		return huntRating + nullRating;
	}

	static getQuotaScoreRating(score: number, ratingInfo: RatingInfo, modifiers: number) {
		//Just the same as null
		let rating = Score.getNullScoreRating(score, ratingInfo, modifiers);
		if (modifiers & Score.modifierFlags.quotaHundred) {
			rating += ratingInfo.quota_100_bonus;
		}

		return rating;
	}

	static getRating(score: number, gameMode: string, ratingInfo: RatingInfo, modifiers: number) {
		//Combine the mission info with rating info

		//Base mode is the first one
		let baseMode = gameMode.split(" ")[0].toLowerCase();
		switch (baseMode) {
			case "null":
				return Score.getNullScoreRating(score, ratingInfo, modifiers);
			case "hunt":
				return Score.getHuntScoreRating(score, ratingInfo);
			case "gemmadness":
				return Score.getGemMadnessScoreRating(score, ratingInfo, modifiers);
			case "quota":
				return Score.getQuotaScoreRating(score, ratingInfo, modifiers);
		}

		//Unknown game mode, just use null mode
		return Score.getNullScoreRating(score, ratingInfo, modifiers);
	}

	static recordLapTime(userId: number, missionId: number, time: number)
	{
		let q = Storage.query("INSERT INTO user_lap_times(mission_id,user_id,time,timestamp) VALUES(@missionId,@userId,@time,DATETIME('now','localtime'));").run({ missionId: missionId, userId: userId, time: time });
		return (q.changes > 0);
	}
}