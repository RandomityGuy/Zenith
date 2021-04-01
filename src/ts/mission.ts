import { Storage } from './storage'
export class Mission {

	static getMissionList(gameType: "Single Player" | "Multiplayer") {
		let gameListData = Storage.query("SELECT display, force_gamemode, has_blast, id, name FROM mission_games WHERE game_type = @gameType AND disabled=0;").all({ gameType: gameType });

		let gameList = gameListData.map(gameData => {
			let difficultyListData = Storage.query("SELECT * FROM mission_difficulties WHERE game_id = @gameId AND disabled = 0 ORDER BY sort_index;").all({ gameId: gameData.id });
			let difficultyList = difficultyListData.map(difficultyData => {
				let missionList = Storage.query("SELECT M.basename, M.difficulty_id, M.file, M.game_id, M.gamemode, I.has_egg, M.hash, M.id, M.is_custom, M.modification, M.name, M.sort_index FROM missions M, mission_rating_info I WHERE M.game_id = @gameId AND M.difficulty_id = @difficultyId AND M.is_custom = 0 AND M.id = I.mission_id AND I.disabled = 0 ORDER BY sort_index;").all({ gameId: gameData.id, difficultyId: difficultyData.id });

				let difficulty = {
					bitmap_directory: difficultyData.bitmap_directory,
					directory: difficultyData.directory,
					disabled: difficultyData.disabled,
					display: difficultyData.display,
					game_id: difficultyData.game_id,
					id: difficultyData.id,
					is_local: difficultyData.is_local,
					name: difficultyData.name,
					previews_directory: difficultyData.previews_directory,
					sort_index: difficultyData.sort_index,
					missions: missionList
				}

				return difficulty;
			});

			let game = {
				display: gameData.display,
				force_gamemode: gameData.force_gamemode,
				has_blast: gameData.has_blast,
				id: gameData.id,
				name: gameData.name,
				difficulties: difficultyList
			};

			return game;
		});

		let ret = {
			gameType: gameType,
			games: gameList
		}
		return ret;
	}
}