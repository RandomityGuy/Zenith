## GET https://marbleblast.com/pq/leader/api/Server/GetServerVersion.php

Gets the game version changelog

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | JSON |


JSON Response:
```
[
    {
        "desc": string, // The description of the version
        "id": int, // The id of the version object
        "time": string, // The time when version was released
        "timestamp: string, // same thing as above but timestamp
        "title": string, // The title of of the version
        "url": string, // The url for the version
        "version": int // The version number
    }...
]
```

## GET https://marbleblast.com/pq/leader/api/Server/GetServerStatus.php

Gets the server status

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | JSON |


JSON Response:
```
{
    "online": "true" | "false", // Checks if the server is online or offline
    "version": int, // The version number
    "players": int // Number of online players
}
```


## GET/POST https://marbleblast.com/pq/leader/api/Player/CheckLogin.php

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

## GET/POST https://marbleblast.com/pq/leader/api/Chat/GetFlairBitmap.php

Gets the flair bitmap image

Query String Parameters:
| FIELD | TYPE | DESCRIPTION | REQUIRED | DEFAULT|
|-------|------|-------------|----------|--------|
| flair | str | The flair id | Yes | None |

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | JSON |

JSON Response if success:
```
{
    "filename": str, // The filename of the flair
    "contents": [
        data: str... // The base64 encoded bitmap data
    ],
    "hash": str // The hash of the file
}
```

JSON Response if failure:
```
{
    "error": str, // The error
}
```

## GET/POST https://marbleblast.com/pq/leader/api/Egg/GetEasterEggs.php

Gets the easter egg data

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
    Dictionary:= id: int => time: int
    // id: the mission id
    // time: the easter egg time
}
```

Response if failure:
```
FAILURE NEEDLOGIN
```

## GET/POST https://marbleblast.com/pq/leader/api/Marble/GetMarbleList.php

Gets the leaderboards marble list

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | JSON |

JSON Response if success:
```
{
    "Marbles": [
        {
            "category_id": int, // The id of the category this marble belongs to
            "id": int, // The id of the marble
            "name": str, // The name of the marble
            "shaderF": null | str, // The path to fragment shader of marble
            "shaderV": null | str, // The path to vertex shader of marble
            "shapeFile": str, // The name of the dts shape file
            "skin": str // The name of the skin of the marble   
        }...
    ],
    "categories": [ 
        {
            "file_base": str, // The filepath of the category
            "id": int, // The category id
            "name": str, // The category name
        }...
    ]
}
```

## GET/POST https://marbleblast.com/pq/leader/api/Mission/GetMissionList.php

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

## GET/POST https://marbleblast.com/pq/leader/api/Achievement/GetAchievementList.php

Gets the leaderboards achievement list

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | JSON |

JSON Response if success:
```
{
    "achievements": {
        "Single Player" | "Multiplayer" | "Event": [
            {
                "bitmap_extent": str, // The bitmap size for rendering
                "category": str, // The category name, usually same as the key of this list (for eg. "Single Player")
                "description": str, // The description of the achievement
                "id": int, // The id of the achievement
                "index": int, // The sorting index
                "rating": int, // The rating reward for the achievement
                "title": str, // The name of the achievement to be shown
            }...
        ]
    }
    "categories": Dictionary:= name: string => { 
        "bitmap_path": str, // The path to the bitmaps
        "id": int, // The category id
        "title": str, // The category name to be shown
    }
    "categoryNames": string[], // The name of the categories
}
```

## GET/POST https://marbleblast.com/pq/leader/api/Player/RecordMetrics.php

Records screen resolution metrics to the server

Query String Parameters:
| FIELD | TYPE | DESCRIPTION | REQUIRED | DEFAULT|
|-------|------|-------------|----------|--------|
| username | str | The username of the person | Yes | None |
| key | str | The $LB::ChatKey | Yes | None |
| screenResolution | str | The current screen resolution | No | null |
| windowResolution | str | The game window resolution | No | null |
| supportedResolutions[] | str | This parameter can be repeated, give it differnt resolutions each time | No | null |

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | SUCCESS |

## GET/POST https://marbleblast.com/pq/leader/api/Metrics/RecordGraphicsMetrics.php

Records graphics card metrics to the server

Query String Parameters:
| FIELD | TYPE | DESCRIPTION | REQUIRED | DEFAULT|
|-------|------|-------------|----------|--------|
| username | str | The username of the person | Yes | None |
| key | str | The $LB::ChatKey | Yes | None |
| metric-key | str | metric-value. This can be repeated with different metric-keys | No | null |

## GET/POST https://marbleblast.com/pq/leader/api/Marble/GetCurrentMarble.php

Gets the current selected marble. 

Query String Parameters:
| FIELD | TYPE | DESCRIPTION | REQUIRED | DEFAULT|
|-------|------|-------------|----------|--------|
| username | str | The username of the person | Yes | None |
| key | str | The $LB::ChatKey | Yes | None |  

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | \<category-id: int\> \<marble-id: int\>|