import { Storage } from "./storage";

export class Score {
	static getPersonalTopScoreList(userId: number) {
		let topScoresData = Storage.query("SELECT mission_id, score, score_type FROM user_scores WHERE user_id = @userId GROUP BY mission_id HAVING MIN(sort);").all({ userId: userId });
		let lapTimes = Storage.query("SELECT mission_id, time as 'score', 'time' as score_type FROM user_lap_times WHERE user_id = @userId GROUP BY mission_id HAVING MIN(time);").all({ userId: userId })
		let quota100 = Storage.query("SELECT mission_id, score, score_type FROM user_scores WHERE user_id = @userId AND (modifiers & (1 << 4) = (1 << 4)) GROUP BY mission_id HAVING (CASE WHEN score_type='time' THEN MIN(score) ELSE MAX(score) END)").all({ userId: userId });
		let wrList = Storage.query(`SELECT T.mission_id
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
		let scoreData = Storage.query("SELECT * FROM user_scores WHERE user_id = @userId AND mission_id = @missionId ORDER BY sort;").all({ userId: userId, missionId: missionId });
		let obj = {
			scores: scoreData,
			missionId: missionId
		};
		return obj;
	}

	static getGlobalTopScores(missionId: number, modifiers: number = 0) {
		let scoreData = Storage.query("SELECT gem_count, gems_1_point, gems_2_point, gems_5_point, gems_10_point, user_scores.id, modifiers, users.name, users.username, origin, row_number() OVER (ORDER BY sort) AS placement, rating, score, score_type, timestamp, total_bonus, user_id FROM user_scores, users WHERE mission_id = @missionId AND users.id = user_scores.user_id AND (modifiers & @modifier = @modifier) GROUP BY user_id HAVING MIN(sort);").all({ missionId: missionId, modifier: modifiers });
		let columnData = [
			{ name: "placement", display: "#", type: "place", tab: "1", width: "40" },
			{ name: "name", display: "Player", type: "string", tab: "40", width: "-190" },
			{ name: "score", display: "Score", tab: "-145", width: "-75" },
			{ name: "rating", display: "Rating", type: "score", tab: "0", width: "75" }
		]
		let obj = {
			columns: columnData,
			scores: scoreData,
			missionId: missionId
		};
		return obj;
	}

	static getTopScoreModes(missionId: number) {
		console.log("MISSION ID");
		console.log(missionId);
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
}