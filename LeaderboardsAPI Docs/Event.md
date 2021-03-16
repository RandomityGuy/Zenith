## Event

### POST https://marbleblast.com/pq/leader/api/Event/RecordEventTrigger.php

Records an event trigger for seasonal events

Query String Parameters:
| FIELD | TYPE | DESCRIPTION | REQUIRED | DEFAULT|
|-------|------|-------------|----------|--------|
| username | str | The username of the person | Yes | None |
| key | str | The $LB::ChatKey | Yes | None |
| trigger | int | The trigger id | Yes | None |

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | The line number of the trigger message, usually increments from 0 to whatever |