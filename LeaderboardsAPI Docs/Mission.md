## Mission
### GET/POST https://marbleblast.com/pq/leader/api/Mission/GetMissionList.php

Gets the leaderboards mission list

Query String Parameters:
| FIELD | TYPE | DESCRIPTION | REQUIRED | DEFAULT|
|-------|------|-------------|----------|--------|
| gameType | str | The gametype, usually "Single Player" or "Multiplayer" | Yes | Single Player |

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | JSON |

JSON Response if success:
```
{
    "gameType": "Single Player" | "Multiplayer", // The gameType
    "games": [
        {
            "display": str, // The display name of the game
            "force_gamemode": str, // The forced gamemode for this game
            "has_blast": int, // Whether the game has blast
            "id": int, // The id of the game
            "name": str, // The name of the game
            "difficulties: [
                {
                    "bitmap_directory": str, // The path to the bitmap directory
                    "directory": str, // The directory to where the mis' are stored
                    "disabled": int, // Whether the difficulty is disabled
                    "display": str, // The display text of the difficulty
                    "game_id": int, // The game id
                    "id": int, // The id of the difficulty
                    "is_local": int, // Whether the difficulty is a local difficulty, not lb, its set to 0 in the lb MissionList.json
                    "name": str, // The name of the difficulty
                    "previews_directory": str, // The path to the preview directory,
                    "sort_index": int, // The index of the difficulty in the list, used for sorting
                    "missions": [
                        {
                            "basename": str, // The internal name used for the mission
                            "difficulty_id": int, // The id of the difficulty
                            "file": str, // The path to the mis
                            "game_id": int, // The id of the game
                            "gamemode": strm // The gamemode of the mission
                            "has_egg": int, // Whether the mission has egg
                            "hash": str, // The hash of the mission
                            "id": int, // The id of the mission
                            "is_custom": int, // Whether the mission is custom, always set to 0 for all missions in the lb MissionList.json,
                            "modification": str, // The name of the mod where the mission came from
                            "name": str, // The name of the mission
                            "sort_index": int // The index of the mission in the list, used for sorting 
                        }...
                    ]
                }...
            ]
        }...
    ]
}
```

### POST https://marbleblast.com/pq/leader/api/Mission/RateMission.php

Rates a multiplayer mission

Query String Parameters:
| FIELD | TYPE | DESCRIPTION | REQUIRED | DEFAULT|
|-------|------|-------------|----------|--------|
| username | str | The username of the person | Yes | None |
| key | str | The $LB::ChatKey | Yes | None |
if custom mission:
| missionFile | str | The mission filename | Yes | None |
| missionName | str | The mission name | Yes | None |
| missionHash | str | The mission hash | Yes | None |
| missionGamemode | str | The mission gamemode | Yes | None |
| difficultyId | str | The difficulty id of the mission | Yes | None |
else:
| missionId | int | The mission id of the mission to rate | Yes | None |
endif
| rating | int | The rating: can be -1, 0, 1 | Yes | None |

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | SUCCESS or FAILURE |