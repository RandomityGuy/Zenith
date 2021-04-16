import { AchievementEvent } from "./achievement_event";
import { AchievementMP } from "./achievement_mp";
import { Mission } from "./mission";
import { Player } from "./player";
import { Score } from "./score";
import { Storage } from "./storage";

export interface MatchScore {
	username: string,
	score: number,
	place: number,
	host: number,
	guest: number,
	marble: number,
	timePercent: number,
	disconnect: number,
	gemCount: number,
	gems1: number,
	gems2: number,
	gems5: number,
	gems10: number,
	team: number,

	snowballs: number | null,
	snowballHits: number | null,
}

export interface MatchTeam {
	id: number,
	name: string,
	color: string
}
export class Multiplayer {

	// Store details of a multiplayer match
	static recordMatch(userId: number, missionId: number, address: string, port: number, scoreType: string, totalBonus: number, modes: string, extraModes: string, teams: MatchTeam[], scores: MatchScore[]) {
		// Input the initial match data
		Storage.query(`INSERT INTO matches(mission_id,player_count,team_count,rating_multiplier,server_address,server_port,dedicated) VALUES (@missionId, @playerCount, @teamCount, '1.0', @address, @port, '0');`).run({ missionId: missionId, playerCount: scores.length, teamCount: teams.length, address: address, port: port });

		// Get the match id
		let matchId = Storage.query("SELECT MAX(id) AS matchId FROM matches;").get();
		matchId = matchId.matchId;

		let teamDict = new Map<number, number>(); // Maps team data to the table team id
		// Populate the teams
		teams.forEach((team, idx) => {
			let teamPlayerCount = scores.filter(x => x.team === idx).length;

			// Insert data
			Storage.query(`INSERT INTO match_teams (match_id,name,color,player_count) VALUES (@matchId, @teamName, @color, @playerCount);`).run({ matchId: matchId, teamName: team.name, color: team.color, playerCount: teamPlayerCount });
			// Get the idea for data insertion
			let teamId = Storage.query("SELECT MAX(id) AS teamId FROM match_teams;").get();
			teamId = teamId.teamId;

			teamDict.set(idx, teamId);
		})
		// Get the mission info for modifiers

		let missionInfo = Storage.query("SELECT par_time, platinum_time, ultimate_time, awesome_time, par_score, platinum_score, ultimate_score, awesome_score, versus_par_score, versus_platinum_score, versus_ultimate_score, versus_awesome_score FROM mission_rating_info WHERE mission_id=@missionId").get({ missionId: missionId });

		let retObj: any[] = [];

		let playerCount = Math.min(scores.filter(x => !x.guest).length - 1, 0);

		let bonusRating = 20 * playerCount;

		let topScore = scores.find(x => x.place === 1).score;

		// Scores
		scores.forEach((score) => {
			let rating = bonusRating;
			let totRating = 0;
			if (!score.guest) {

				let playerId = Player.getUserId(score.username);

				let modifiers = 0;

				// Calculate the modifiers
				if (scoreType === "time") {
					if (score < missionInfo.par_time) {
						modifiers |= (1 << 6);
					}
					if (score < missionInfo.platinum_time) {
						modifiers |= (1 << 7);
					}
					if (score < missionInfo.ultimate_time) {
						modifiers |= (1 << 8);
					}
					if (score < missionInfo.awesome_time) {
						modifiers |= (1 << 9);
					}
				}

				if (scoreType === "score") {
					if (modes.includes("hunt") && scores.length > 1) {
						if (score > missionInfo.versus_par_score) {
							modifiers |= (1 << 10);
						}
						if (score > missionInfo.versus_platinum_score) {
							modifiers |= (1 << 11);
						}
						if (score > missionInfo.versus_ultimate_score) {
							modifiers |= (1 << 12);
						}
						if (score > missionInfo.versus_awesome_score) {
							modifiers |= (1 << 13);
						}
					}
					else {
						if (score > missionInfo.par_score) {
							modifiers |= (1 << 10);
						}
						if (score > missionInfo.platinum_score) {
							modifiers |= (1 << 11);
						}
						if (score > missionInfo.ultimate_score) {
							modifiers |= (1 << 12);
						}
						if (score > missionInfo.awesome_score) {
							modifiers |= (1 << 13);
						}
					}
				}

				let sort = scoreType === "time" ? score.score : 10000000 - score.score;

				// Update streaks and get win bonus
				if (playerCount > 0) {
					if (score.place === 1) {
						rating += 30;
						let streak = Storage.query("SELECT * FROM user_streaks WHERE user_id=@userId);").get({ userId: playerId });
						if (streak === undefined) {
							streak = 0;
						} else {
							streak = streak.mp_games;
						}
						Storage.query("REPLACE INTO user_streaks VALUES(@userId, @streakData)").run({ userId: playerId, streakData: streak + 1 });
					} else {
						Storage.query("REPLACE INTO user_streaks VALUES(@userId, @streakData)").run({ userId: playerId, streakData: 0 });
					}
				}

				rating *= score.score / topScore;

				rating = Math.floor(rating);

				let insertQuery = Storage.query(`INSERT INTO user_scores(user_id,mission_id,score,score_type,total_bonus,rating,gem_count,gems_1_point,gems_2_point,gems_5_point,gems_10_point,modifiers,origin,extra_modes,sort,disabled,timestamp) VALUES (@userId, @missionId, @score, @scoreType, @totalBonus, @rating, @gemCount, @gems1, @gems2, @gems5, @gems10, @modifiers, 'PlatinumQuest', @extraModes, @sort, '0', DATETIME('now','localtime'));`);
				let c = insertQuery.run({ userId: playerId, missionId: missionId, score: score.score, scoreType: scoreType, totalBonus: totalBonus, rating: rating, gemCount: score.gemCount, gems1: score.gems1, gems2: score.gems2, gems5: score.gems5, gems10: score.gems10, modifiers: modifiers, sort: sort, extraModes: extraModes });

				let scoreId = Storage.query("SELECT MAX(id) AS scoreId FROM user_scores;").get(); // ehh
				scoreId = scoreId.scoreId;

				// Now fill up the match_scores
				Storage.query(`INSERT INTO match_scores(match_id,user_id,score_id,team_id,placement,time_percent) VALUES (@matchId, @userId, @scoreId, @teamId, @placement, @timePercent);`).run({ matchId: matchId, userId: playerId, scoreId: scoreId, teamId: (teams.length > 0) ? teamDict.get(score.team) : -1, placement: score.place, timePercent: score.timePercent });

				// Update ratings
				let ratingData = Storage.query("SELECT * FROM user_ratings WHERE user_id = @userId").get({ userId: playerId });
				totRating = ratingData.rating_mp;
				totRating += rating;
				Storage.query("UPDATE user_ratings SET rating_mp = @rating WHERE user_id = @userId").run({ userId: playerId, rating: totRating });

				// Snowballs
				if (score.snowballs !== null) {
					Storage.query(`INSERT INTO user_event_snowballs VALUES(@scoreId, @snowballs, @hits)`).run({ scoreId: scoreId, snowballs: score.snowballs, hits: score.snowballHits });
				}

			}
			
			retObj.push({ username: score.username, rating: totRating, change: rating, place: score.place });
				
		})

		scores.forEach(x => {
			let playerId = Player.getUserId(x.username);
			AchievementMP.UpdateMultiplayerAchievements(playerId); // This is ew
			AchievementEvent.updateHalloweenAchievements(playerId);
			AchievementEvent.updateWinterAchievements(playerId);
		})

		return retObj;
	}
}