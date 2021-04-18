import * as path from 'path';
import { Storage } from './storage'
export class Mission {

    // Gets the list of missions for the leaderboards
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

    // Gets the mission id given the identification parameters, if the mission doesnt exist in the database, it will be created and the missionId of that new record is returned
    static getMissionId(missionFile: string, missionName: string, missionHash: string, missionGameMode: string, difficultyId: number): number | null {
        console.log(`${missionFile} ${missionName} ${missionHash} ${missionGameMode} ${difficultyId}`);
        
        let q = Storage.query("SELECT id FROM missions WHERE hash=@missionHash AND difficulty_id=@difficultyId").get({ missionHash: missionHash, difficultyId: difficultyId });
        //let q = Storage.query("SELECT id FROM missions WHERE name=@missionName AND file=@missionFile AND gamemode=@missionGameMode AND difficulty_id=@difficultyId").get({ missionName: missionName, missionFile: missionFile, missionGameMode: missionGameMode, difficultyId: difficultyId });
        if (q === undefined) {
            // First we need to get the game id from the difficultyId cause ugh
            let gameId = Storage.query("SELECT game_id FROM mission_difficulties WHERE id=@difficultyId").get({ difficultyId: difficultyId });
            if (gameId === undefined) {
                return null; // Yeah we failed
            } else {
                gameId = Number.parseInt(gameId.game_id);
            }
            // Now insert
            let insertquery = Storage.query(`INSERT INTO missions(game_id, difficulty_id, file, basename, name, gamemode, sort_index, is_custom, hash, modification) VALUES (@gameId, @difficultyId, @file, @baseName, @name, @gameMode, '1', '1', @hash, '');`);
            let res = insertquery.run({ gameId: gameId, difficultyId: difficultyId, file: missionFile, baseName: path.basename(missionFile), name: missionName, gameMode: missionGameMode, hash: missionHash });
            if (res.changes === 0) {
                return null; // Woops
            } else {
                return this.getMissionId(missionFile, missionName, missionHash, missionGameMode, difficultyId); // Yeah just run the thing again
            }
        } else {
            return q.id;
        }
    }

    // Rate a mission
    static rateMission(userId: number, missionId: number, rating: number) {
        let res = Storage.query("REPLACE INTO user_mission_ratings(user_id,mission_id,rating) VALUES(@userId,@missionId,@rating);").run({ userId: userId, missionId: missionId, rating: rating });
        return (res.changes > 0);
    }

    // Get mission name from its id
    static getMissionName(missionId: number) {
        let q = Storage.query("SELECT name FROM missions WHERE id=@missionId;").get({ missionId: missionId });
        if (q === undefined)
            return null;
        return q.name;
    }
}