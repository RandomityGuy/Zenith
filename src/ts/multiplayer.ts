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
	team: number
}

export interface MatchTeam {
	id: number,
	name: string,
	color: string
}
export class Multiplayer {

	static recordMatch(userId: number, missionId: number, address: string, port: number, scoreType: string, totalBonus: number, modes: string, teams: MatchTeam[], scores: MatchScore[]) {
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

		// Scores
		scores.forEach((score) => {
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

				let insertQuery = Storage.query(`INSERT INTO user_scores(user_id,mission_id,score,score_type,total_bonus,rating,gem_count,gems_1_point,gems_2_point,gems_5_point,gems_10_point,modifiers,origin,extra_modes,sort,disabled,timestamp) VALUES (@userId, @missionId, @score, @scoreType, @totalBonus, @rating, @gemCount, @gems1, @gems2, @gems5, @gems10, @modifiers, 'PlatinumQuest', '', @sort, '0', DATETIME('now','localtime'));`);
				// TODO FIX RATINGS
				let c = insertQuery.run({ userId: playerId, missionId: missionId, score: score.score, scoreType: scoreType, totalBonus: totalBonus, rating: 0, gemCount: score.gemCount, gems1: score.gems1, gems2: score.gems2, gems5: score.gems5, gems10: score.gems10, modifiers: modifiers, sort: sort });

				let scoreId = Storage.query("SELECT MAX(id) AS scoreId FROM user_scores;").get(); // ehh
				scoreId = scoreId.scoreId;

				// Now fill up the match_scores
				Storage.query(`INSERT INTO match_scores(match_id,user_id,score_id,team_id,placement,time_percent) VALUES (@matchId, @userId, @scoreId, @teamId, @placement, @timePercent);`).run({ matchId: matchId, userId: userId, scoreId: scoreId, teamId: (teams.length > 0) ? teamDict.get(score.team) : "", placement: score.place, timePercent: score.timePercent });

				// Fix this to actually have ratings
			}
			
			retObj.push({ username: score.username, rating: 0, change: 0, place: score.place });
				
		})

		return retObj;
	}
}