## Server

### GET https://marbleblast.com/pq/leader/api/Server/GetServerVersion.php

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

### GET https://marbleblast.com/pq/leader/api/Server/GetServerStatus.php

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