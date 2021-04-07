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
| 200 | JSON or ARGUMENT \<parameter\> if error |

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
if custom mission:
| missionFile | str | The mission filename | Yes | None |
| missionName | str | The mission name | Yes | None |
| missionHash | str | The mission hash | Yes | None |
| missionGamemode | str | The mission gamemode | Yes | None |
| difficultyId | str | The difficulty id of the mission | Yes | None |
else:
| missionId | int | The mission id | Yes | None |
endif
| username | str | The username of the person | Yes | None |
| key | str | The $LB::ChatKey | Yes | None |
| modifiers | int | The modifiers bitfield for which scores with the same modifiers have to be returned | No | None |

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | JSON or ARGUMENT \<parameter\> if error |

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
if custom mission:
| missionFile | str | The mission filename | Yes | None |
| missionName | str | The mission name | Yes | None |
| missionHash | str | The mission hash | Yes | None |
| missionGamemode | str | The mission gamemode | Yes | None |
| difficultyId | str | The difficulty id of the mission | Yes | None |
else:
| missionId | int | The mission id | Yes | None |
endif
| modifiers | int | The modifiers bitfield for which scores with the same modifiers have to be returned | No | None |

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | JSON or ARGUMENT \<parameter\> if error |

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

### GET/POST https://marbleblast.com/pq/leader/api/Score/GetGlobalScores.php

Gets the global top scores for a mission, same thing as above.

Query String Parameters:
| FIELD | TYPE | DESCRIPTION | REQUIRED | DEFAULT|
|-------|------|-------------|----------|--------|
if custom mission:
| missionFile | str | The mission filename | Yes | None |
| missionName | str | The mission name | Yes | None |
| missionHash | str | The mission hash | Yes | None |
| missionGamemode | str | The mission gamemode | Yes | None |
| difficultyId | str | The difficulty id of the mission | Yes | None |
else:
| missionId | int | The mission id | Yes | None |
endif
| modifiers | int | The modifiers bitfield for which scores with the same modifiers have to be returned | No | None |

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | JSON or ARGUMENT \<parameter\> if error |

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
if custom mission:
| missionFile | str | The mission filename | Yes | None |
| missionName | str | The mission name | Yes | None |
| missionHash | str | The mission hash | Yes | None |
| missionGamemode | str | The mission gamemode | Yes | None |
| difficultyId | str | The difficulty id of the mission | Yes | None |
else:
| missionId | int | The mission id | Yes | None |
endif

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | JSON or ARGUMENT \<parameter\> if error |

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

### POST https://marbleblast.com/pq/leader/api/Score/RecordScore.php

Sends the score to the leaderboards

Query String Parameters:
| FIELD | TYPE | DESCRIPTION | REQUIRED | DEFAULT|
|-------|------|-------------|----------|--------|
if custom mission:
| missionFile | str | The mission filename | Yes | None |
| missionName | str | The mission name | Yes | None |
| missionHash | str | The mission hash | Yes | None |
| missionGamemode | str | The mission gamemode | Yes | None |
| difficultyId | str | The difficulty id of the mission | Yes | None |
else:
| missionId | int | The mission id | Yes | None |
endif
| username | str | The username of the person | Yes | None |
| key | str | The $LB::ChatKey | Yes | None |
| modifiers | int | The modifiers bitfield for the score | No | None |
| score | float | The score | Yes | None |
| scoreType | str | The score type | Yes | score |
| totalBonus | int | The time travel bonus | Yes | None |
| gemCount | int | Number of gems collected | Yes | 0 |
| gems1 | int | Number of red gems collected | Yes | 0 |
| gems2 | int | Number of yellow gems collected | Yes | 0 |
| gems5 | int | Number of blue gems collected | Yes | 0 |
| gems10 | int | Number of platinum gems collected | Yes | 0 |

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | CUSTOM FORMAT |

Response Format:  
pq \<req\> SUCCESS or FAILURE \<rating\> // Whether the score was successfully recorded or not  
pq \<req\> RATING \<rating\> // The rating given by the mission.  
pq \<req\> NEWRATING \<rating\> // The new overall rating  
pq \<req\> POSITION \<rating\> // The rank on the mission  
pq \<req\> DELTA \<rating\> // The difference in your top rating with the rating above.  
pq \<req\> RECORDING // Is only present when the score is a WR, triggers RREC upload  
pq \<req\> ACHIEVEMENT \<achievement-id\> // Is only present when the score grants an achievement  
