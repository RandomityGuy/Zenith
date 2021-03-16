## Multiplayer

### GET/POST https://marbleblast.com/pq/leader/api/Multiplayer/VerifyPlayer.php

Verifies a given player for multiplayer

Query String Parameters:
| FIELD | TYPE | DESCRIPTION | REQUIRED | DEFAULT|
|-------|------|-------------|----------|--------|
| username | str | The username of the person | Yes | None |
| key | str | The $LB::ChatKey | Yes | None |
| session | str | The session token aka $LBGameSess | Yes | None |

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | JSON |

JSON Response:
```
{
    "id": int, // The user id
    "username": str, // The username, is null
    "display": str, // The display name
    "rating": int, // The multiplayer rating
    "verification: "SUCCESS" | "FAIL" | "BADSESSION" | "BANNED" // Whether the verification succeeded or failed
}
```

### POST https://marbleblast.com /pq/leader/api/Multiplayer/RecordMatch.php

Records a multiplayer match played.

Query String Parameters:
| FIELD | TYPE | DESCRIPTION | REQUIRED | DEFAULT|
|-------|------|-------------|----------|--------|
| username | str | The username of the person | Yes | None |
| key | str | The $LB::ChatKey | Yes | None |
| missionId | int | The mission id on which the match was played | Yes | None |
| players | int | The player count of the match | Yes | None |
| port | int | The port of the server on which the match was held | Yes | None |
| scoreType | str | The type of score: "score" or "time" | Yes | None |
| totalBonus | int | The bonus time | Yes | None |
| modes | int | The modes flags of this match | Yes | None |
| teammode | int | Whether the match was teams or not "1" if yes else 0 | No | 0 |
for each team:
| teams[number][] | int | The team number | No | None |
| teams[name][] | str | The team name | No | None |
| teams[color][] | str | The hex color code of the team | No | None |
end for
for each player:
| scores[username][] | str | The username of the player | Yes | None |
| scores[score][] | int | The score by the player | Yes | None |
| scores[place][] | int | The rank of the player | Yes | None |
| scores[host][] | int | Whether the player is host or not | Yes | None |
| scores[guest][] | int | Whether the player is a guest or not | Yes | None |
| scores[marble][] | int | The marble id | Yes | None |
| scores[timePercent][] | float | The percentage of time the player was in match | Yes | None |
| scores[disconnect][] | int | Whether the player disconnected or not | Yes | None |
| scores[gemCount][] | int | Number of gems collected by the player | Yes | None |
| scores[gems1][] | int | Number of red gems collected by the player | Yes | None |
| scores[gems2][] | int | Number of yellow gems collected by the player | Yes | None |
| scores[gems5][] | int | Number of blue gems collected by the player | Yes | None |
| scores[gems10][] | int | Number of platinum gems collected by the player | Yes | None |
| scores[team][] | int | The team index of the player | Yes | -1 |
end for
| extraModes[] | str | The extra modes set for the match | No | None |

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | JSON |

JSON Response:
```
[
    {
        "username": str, // The username of the player
        "rating": int, // The rating of the player
        "change": int, // The change in rating of the player
        "place": int // The ranking of the player
    }...
]
```