import { Storage } from "./storage";

export class Score {
	static getPersonalTopScoreList(userId: number) {
		let topScoresData = Storage.query("SELECT mission_id, score, score_type FROM user_scores WHERE user_id = @userId GROUP BY mission_id HAVING (CASE WHEN score_type='time' THEN MIN(score) ELSE MAX(score) END)").all({ userId: userId });
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
										WHERE missions.is_custom = 0 AND missions.id = S.mission_id AND missions.id = S.mission_id AND mission_games.id = missions.game_id AND mission_games.game_type = "Single Player"
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
}