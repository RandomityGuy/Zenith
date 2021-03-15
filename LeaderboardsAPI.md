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


## POST https://marbleblast.com/pq/leader/api/Player/CheckLogin.php

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