## Egg

### GET/POST https://marbleblast.com/pq/leader/api/Egg/GetEasterEggs.php

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

### POST https://marbleblast.com/pq/leader/api/Egg/RecordEgg.php

Records an egg collection

Query String Parameters:
| FIELD | TYPE | DESCRIPTION | REQUIRED | DEFAULT|
|-------|------|-------------|----------|--------|
| username | str | The username of the person | Yes | None |
| key | str | The $LB::ChatKey | Yes | None |
| missionId | int | The mission id on which you got the egg | Yes | None |
| time | float | The egg collection time | Yes | None |

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | SUCCESS |