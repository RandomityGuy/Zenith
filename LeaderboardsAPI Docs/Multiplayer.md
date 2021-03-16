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
| session | str | The session token aka $LBGameSess | Yes | None |