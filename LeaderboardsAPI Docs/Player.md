## Player
### GET/POST https://marbleblast.com/pq/leader/api/Player/CheckLogin.php

Checks credentials

Query String Parameters:
| FIELD | TYPE | DESCRIPTION | REQUIRED | DEFAULT|
|-------|------|-------------|----------|--------|
| username | str | The username | Yes | None |
| password | str | The garbledeguck'ed password | Yes | None |
| version | int | The $MP::RevisionOn, as the script says "MP Revision (only updated when changes to MP happen), probably reliable" | Yes | 10000 |

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | JSON |

JSON Response if success:
```
{
    "access": int, // The access level, different for normal users, mods and admins
    "color": string, // The hex color code of the user, hex is lowercase
    "display": string, // The display name of the user
    "id": int, // The id of the user
    "key": string, // The $LB::ChatKey
    "success": bool = true, // Whether success or not
    "username": string, // The username
    "settings": string[] // This is a custom format, see below
}
```

JSON Response if fail:
```
{
    "success": bool = false, // Whether success or not
    "reason": string, // The reason
}
```

Settings Custom Format
```
INFO
    ACCESS int // The access level
    DISPLAY string // The display name of the user
    SERVERTIME int // The timestamp
    WELCOME string // The webchat welcome text
    DEFAULT Nardo-SPC-Polo // Undocumented
    ADDRESS ip // The ip address of the user
    HELP
        INFO string // The command help
        CMDLIST string // The /help cmdlist result
    PRIVILEGE int // privilege, undocumented

FRIEND
    START // Begin listing friends
    NAME username displayname // Friend info
    DONE // End listing friends

BLOCK
    START // Beging block list
    DONT // End block list

STATUS id status-text? // Maps status id to status-text, status-text can be omitted
COLOR id hex // Maps color id to hex, hex in lowercase
FLAIR flair-id // Defines a flair, flair-id is a string
LOGGED // Undocumented
```

### POST https://marbleblast.com/pq/leader/api/Player/RegisterUser.php

Registers a user

Query String Parameters:
| FIELD | TYPE | DESCRIPTION | REQUIRED | DEFAULT|
|-------|------|-------------|----------|--------|
| username | str | The username | Yes | None |
| password | str | The plaintext password | Yes | None |
| email | str | The email | Yes | None |

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | JSON |

JSON Response if success (not properly documented)
```
{
    "result": "true"
}
```

JSON Response if failure 
```
{
    "result": "false"
    "error": str, // The error code
}
```



### GET/POST https://marbleblast.com/pq/leader/api/Player/GetPlayerAchievements.php

Gets the achievement list for a given player

Query String Parameters:
| FIELD | TYPE | DESCRIPTION | REQUIRED | DEFAULT|
|-------|------|-------------|----------|--------|
| username | str | The username of the person | Yes | None |
| key | str | The $LB::ChatKey | Yes | None |
| user | str | The user whose achievements are to be given | No | Same as username |

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | JSON |

JSON Response if success:
```
{
    "username": str, // The username of the person
    "achievements": int[] // The list of achievement ids
}
```

Response if failure:
```
FAILURE NEEDLOGIN
```

### GET/POST https://marbleblast.com/pq/leader/api/Player/GetPlayerAvatar.php

Gets the player avatar

Query String Parameters:
| FIELD | TYPE | DESCRIPTION | REQUIRED | DEFAULT|
|-------|------|-------------|----------|--------|
| user | str | The player whose avatar is to be found | Yes | None |

JSON Response if success:
```
{
    "filename": str, // The filename of the avatar
    "contents": str[], // The base64 encoded bitmap data
    "hash": str, // The hash of the file
    "username": str // The username this avatar belongs to
}
```

JSON Response if failure:
```
{
    "error": str, // The error
}
```

### GET/POST https://marbleblast.com/pq/leader/api/Player/GetPlayerProfileInfo.php

Gets the player profile details

Query String Parameters:
| FIELD | TYPE | DESCRIPTION | REQUIRED | DEFAULT|
|-------|------|-------------|----------|--------|
| user | str | The player whose profile is to be viewed | Yes | None |

JSON Response if success:
```
{
    "access": int, // The access level of the user
    "accountAge": str, // The age of the account
    "color": str, // The hex color of the user, hex in lowercase
    "display": str, // The display name of the user
    "donations": int, // The donations done by the user
    "friends": [
        {
            "name": str, // The friend display name
            "username": str, // The friend username
        }...
    ],
    "id": str, // The id of the user
    "lastLevel": str, // The last level played
    "mp_average": str, // The average MP score
    "mp_best": str, // The best MP score description
    "mp_games": Dictionary:= place: int => times: int = typedef MPGames, // The dictionary that gives the number of times the player has obtained the "place"-th place in MP. Usually ranges from 1-5
    "mp_team_games": MPGames
    "mp_gems": {
        "blue": str, // Number of blue gems collected
        "platinum": str, // Number of platinum gems collected
        "red": str, // Number of red gems collected
        "yellow": str // Number of yellow gems collected
    },
    "ranking": {
        "rating_achievement": int, // The ranking based on achievement
        "rating_custom": int, // The customs ranking
        "rating_egg": int, // The ranking based on eggs
        "rating_general": int, // The overall ranking
        "rating_mbg": int, // The MBG ranking
        "rating_mbp": int, // The MBP ranking
        "rating_mbu": int, // The MBU ranking
        "rating_pq": int, // The PQ ranking
        "rating_mp": int, // The multiplayer ranking
        "rating_quota_bonus": int // The ranking based on quota 100%
    },
    "rating": {
        "rating_achievement": int, // The rating based on achievement
        "rating_custom": int, // The customs rating
        "rating_egg": int, // The rating based on eggs
        "rating_general": int, // The overall rating
        "rating_mbg": int, // The MBG rating
        "rating_mbp": int, // The MBP rating
        "rating_mbu": int, // The MBU rating
        "rating_pq": int, // The PQ rating
        "rating_mp": int, // The multiplayer rating
        "rating_quota_bonus": int, // The rating based on quota 100%
        "user_id": int, // The user id
    },
    "registerDate": str, // The register date of the account
    "status": str, // The status text of the user
    "titles" {
        "flair": str, // The flair of the user
        "prefix": str, // The prefix of the user
        "suffix": str, // The suffix of the user
    },
    "totalTime": int, // The total seconds online
    "username": str // The username of the person
}
```

### GET/POST https://marbleblast.com/pq/leader/api/Player/GetPlayerStats.php

Gets the player stats

Query String Parameters:
| FIELD | TYPE | DESCRIPTION | REQUIRED | DEFAULT|
|-------|------|-------------|----------|--------|
| username | str | The username of the person | Yes | None |
| key | str | The $LB::ChatKey | Yes | None |
| user | str | The user whose achievements are to be given | No | Same as username |

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | JSON |

JSON Response if success:
```
{
    "display": str, // The display name of the user
    "gameIds": Dictionary:= game: str => game_id: int, // A dictionary that maps game names to its ids
    "general": {
        "grand_total": str, // The total time played
        "rank": int, // The overall rank
        "rating": int, // The total rating
        "total_bonus": str, // The total time travel bonus collected
        "total_time": str, // The sum of all times obtained
    },
    "id": str, // The user id
    "username": str, // The username
    "games": Dictionary: game_id: int => {
        "awesome_time_name": str, // The display name for the awesome time
        "ultimate_time_name": str, // The display name for the ultimate time
        "platinum_time_name": str, // The display name for the platinum time
        "easter_egg_name": str, // The display name for the Easter Eggs
        "has_awesome_times": int, // Whether the game as ATs
        "has_ultimate_times": int, // Whether the game as UTs
        "has_platinum_times": int, // Whether the game has PTs
        "has_easter_eggs": int, // Whether the game has EEs
        "name": str, // The name of the game
        "rank": int, // The rank in the game
        "rating": int, // The rating obtained by the game
        "completion": {
            "awesome_count": str, // The number of awesomes obtained
            "completion": int, // The number of missions completed
            "egg_count": int, // The number of eggs collected
            "platinum_count": str, // The number of platinums obtained
            "ultimate_count": str, // The number of ultimates obtained
            "total_time": str, // The total time for the game
        },
        "totals": {
            "total_awesomes": str, // The total number of awesomes
            "total_eggs": str, // The total number of eggs
            "total_missions": int, // The total number of missions
            "total_platinums": str, // The total number of platinums
            "total_ultimates": str // The total number of ultimates
        },
        "difficulties": [
            {
                "completion": int, // Number of missions completed
                "display": str, // The display name for the difficulty
                "name": str, // The difficulty name
                "total_missions": int, // The total missions in the difficulty
                "total_time": int // The total time by the player in the difficulty
            }...
        ]
    }
}
```

Response if failure:
```
FAILURE NEEDLOGIN
```

### GET/POST https://marbleblast.com/pq/leader/api/Player/GetTopPlayers.php

Gets the top players leaderboards.

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | JSON |

JSON Response if success: 
```
{
    "rating_mbg": {
        "display": str[], // The list of display names in order
        "rating": int[], // The list of ratings in order
        "username": str[] // the list of usernames in order
    } = typedef Rating, // MBG Leaderboards
    "rating_mbp": Rating, // MBP Leaderboards
    "rating_mbu": Rating, // MBU Leaderboards
    "rating_pq": Rating, // PQ Leaderboards
    "rating_mp": Rating, // Multiplayer Leaderboards
    "rating_general": Rating, // Overall Leaderboards
    "rating_custom": Rating, // Customs Leaderboards
}
```

### GET/POST https://marbleblast.com/pq/leader/api/Player/RecordMetrics.php

Records screen resolution metrics to the server

Query String Parameters:
| FIELD | TYPE | DESCRIPTION | REQUIRED | DEFAULT|
|-------|------|-------------|----------|--------|
| username | str | The username of the person | Yes | None |
| key | str | The $LB::ChatKey | Yes | None |
| screenResolution | str | The current screen resolution | No | None |
| windowResolution | str | The game window resolution | No | None |
| supportedResolutions[] | str | This parameter can be repeated, give it differnt resolutions each time | No | None |

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | SUCCESS |