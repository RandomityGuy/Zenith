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
if custom mission:
| missionFile | str | The mission filename | Yes | None |
| missionName | str | The mission name | Yes | None |
| missionHash | str | The mission hash | Yes | None |
| missionGamemode | str | The mission gamemode | Yes | None |
| difficultyId | str | The difficulty id of the mission | Yes | None |
else:
| missionId | int | The mission id on which you got the egg | Yes | None |
endif
| time | float | The egg collection time | Yes | None |

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | SUCCESS or FAILURE or ALREADY or RECORDING |