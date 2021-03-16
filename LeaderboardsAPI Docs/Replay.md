## Replay

### GET https://marbleblast.com/pq/leader/api/Replay/GetReplay.php

Downloads a replay for a mission

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
| type | str | The type of the replay: "Replay" or "Egg" | No | Replay |

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | JSON |

```
{
    "contents": str[] // Base64 encoded replay file 
    "error": str?, // The error if failure
}
```

### POST https://marbleblast.com/pq/leader/api/Replay/RecordReplay.php

Uploads replay for a mission

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
| type | str | The type of the replay: "Replay" or "Egg" | No | Replay |
| conts | str | base64 encoded replay data | Yes | None |

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | SUCCESS or RETRY |