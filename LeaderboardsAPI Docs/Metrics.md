## Metrics

### GET/POST https://marbleblast.com/pq/leader/api/Metrics/RecordGraphicsMetrics.php

Records graphics card metrics to the server

Query String Parameters:
| FIELD | TYPE | DESCRIPTION | REQUIRED | DEFAULT|
|-------|------|-------------|----------|--------|
| username | str | The username of the person | Yes | None |
| key | str | The $LB::ChatKey | Yes | None |
| metric-key | str | metric-value. This can be repeated with different metric-keys | No | None |

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | SUCCESS or FAILURE |