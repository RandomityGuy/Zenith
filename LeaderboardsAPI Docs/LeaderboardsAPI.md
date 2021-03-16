# PQ Online Leaderboards API
## Common

The following is to be included for all requests and responses.

Query String Parameters:
| FIELD | TYPE | DESCRIPTION | REQUIRED | DEFAULT|
|-------|------|-------------|----------|--------|
| req | int | The request id | Yes | None |
| version | int | The $MP::RevisionOn, as the script says "MP Revision (only updated when changes to MP happen), probably reliable". Its the game internal version | Yes | 10000 |

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | pq \<req\> \<buffer\> |
