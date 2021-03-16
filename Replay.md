## Replay

### GET https://marbleblast.com/pq/leader/api/Replay/GetReplay.php

Downloads a replay for a mission

Query String Parameters:
| FIELD | TYPE | DESCRIPTION | REQUIRED | DEFAULT|
|-------|------|-------------|----------|--------|
| missionId | int | The mission_id | Yes | None |
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
}
```

### POST https://marbleblast.com/pq/leader/api/Replay/RecordReplay.php

Uploads replay for a mission

Query String Parameters:
| FIELD | TYPE | DESCRIPTION | REQUIRED | DEFAULT|
|-------|------|-------------|----------|--------|
| missionId | int | The mission_id | Yes | None |
| username | str | The username of the person | Yes | None |
| key | str | The $LB::ChatKey | Yes | None |
| type | str | The type of the replay: "Replay" or "Egg" | No | Replay |
| conts | str | base64 encoded replay data | Yes | None |

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | SUCCESS or RETRY |