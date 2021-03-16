## Score

### GET/POST https://marbleblast.com/pq/leader/api/Score/GetPersonalTopScoreList.php

Gets the player's online scores

Query String Parameters:
| FIELD | TYPE | DESCRIPTION | REQUIRED | DEFAULT|
|-------|------|-------------|----------|--------|
| username | str | The username of the person | Yes | None |
| key | str | The $LB::ChatKey | Yes | None |

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | JSON |

JSON Response if success:
```
{
    Dictionary:= mission_id: int => {
        "mission_id": int, // The mission id
        "score": int, // The score
        "score_type": "time" | "score" // The type of the score
    } = typedef ScoreDictionary
    "lapTime": ScoreDictionary, // The lap times
    "quota100": ScoreDictionary, // The 100% quota times
    "record": int[] // List of mission_ids on which the player holds WR on
}
```

Response if failure:
```
FAILURE NEEDLOGIN
```

### GET/POST https://marbleblast.com/pq/leader/api/Score/GetPersonalTopScores.php

Gets the personal top scores for a mission.

Query String Parameters:
| FIELD | TYPE | DESCRIPTION | REQUIRED | DEFAULT|
|-------|------|-------------|----------|--------|
| missionId | int | The mission_id | Yes | None |
| username | str | The username of the person | Yes | None |
| key | str | The $LB::ChatKey | Yes | None |
| modifiers | int | The modifiers bitfield for which scores with the same modifiers have to be returned | No | None |

JSON Response if success:
```
{
    "scores": [
        {
            "gem_count": int, // Number of collected gems
            "gems_1_point": int, // Number of red gems collected
            "gems_2_point": int, // Number of yellow gems collected
            "gems_5_point": int, // Number of blue gems collected
            "gems_10_point": int, // Number of platinum gems collected
            "id": int, // The id of the score
            "mission_id": int, // The mission id
            "modifiers": int, // The modifiers bitfield of the score
            "origin": str, // Where the score came from, set to "PlatinumQuest"
            "sort": int, // The rank of the score
            "rating": int, // The rating this score gives
            "score": int, // The score
            "score_type": "time" | "score", // The type of the score
            "timestamp": str, // When the score was obtained
            "total_bonus": int, // The time travel bonus collected
            "user_id": int, // The user id of the user who obtained the score
            "disabled": int = 0, // Undocumented
            "extra_modes": null, // Undocumented
        }...
    ],
    "missionId": int, // The mission id
}
```

Response if failure:
```
FAILURE NEEDLOGIN
```

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | JSON |

### GET/POST https://marbleblast.com/pq/leader/api/Score/GetGlobalTopScores.php

Gets the global top scores for a mission

Query String Parameters:
| FIELD | TYPE | DESCRIPTION | REQUIRED | DEFAULT|
|-------|------|-------------|----------|--------|
| missionId | int | The mission_id | Yes | None |
| modifiers | int | The modifiers bitfield for which scores with the same modifiers have to be returned | No | None |

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | JSON |

JSON Response if success:
```
{
    "columns": [
        {
            "display": str, // The column display to be shown
            "name": str, // The column name
            "tab": int, // The tab value, used in rendering
            "type": "place" | "string" | "score" | "time", // The type of data this column holds
            "width": int, // The width of the column
        }...
    ],
    "scores": [
        {
            "gem_count": int, // Number of collected gems
            "gems_1_point": int, // Number of red gems collected
            "gems_2_point": int, // Number of yellow gems collected
            "gems_5_point": int, // Number of blue gems collected
            "gems_10_point": int, // Number of platinum gems collected
            "id": int, // The id of the score
            "modifiers": int, // The modifiers bitfield of the score
            "name": str, // The display name of the person who obtained the score
            "origin": str, // Where the score came from, set to "PlatinumQuest"
            "placement": int, // The rank of the score
            "rating": int, // The rating this score gives
            "score": int, // The score
            "score_type": "time" | "score", // The type of the score
            "timestamp": str, // When the score was obtained
            "total_bonus": int, // The time travel bonus collected
            "user_id": int, // The user id of the user who obtained the score
            "username": str // The username of the user who obtained the score
        }...
    ],
    "missionId": int, // The mission id
}
```

### GET/POST https://marbleblast.com/pq/leader/api/Score/GetTopScoreModes.php

Gets the available score modes for a mission

Query String Parameters:
| FIELD | TYPE | DESCRIPTION | REQUIRED | DEFAULT|
|-------|------|-------------|----------|--------|
| missionId | int | The mission_id | Yes | None |

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | JSON |

JSON Response if success:
```
{
    Dictionary:= mode: str => { // mode: the name of the mode
        "columns": [
            {
                "display": str, // The column display to be shown
                "name": str, // The column name
                "tab": int, // The tab value, used in rendering
                "type": "place" | "string" | "score" | "time", // The type of data this column holds
                "width": int, // The width of the column
            }...
        ],
        "scores": []
        "missionId": int, // The mission id
    },
    "missionId": int, // The mission id
}
```