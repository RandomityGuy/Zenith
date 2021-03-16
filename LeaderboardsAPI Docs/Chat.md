## Chat

### GET/POST https://marbleblast.com/pq/leader/api/Chat/GetFlairBitmap.php

Gets the flair bitmap image

Query String Parameters:
| FIELD | TYPE | DESCRIPTION | REQUIRED | DEFAULT|
|-------|------|-------------|----------|--------|
| flair | str | The flair id | Yes | None |

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | JSON |

JSON Response if success:
```
{
    "filename": str, // The filename of the flair
    "contents": str[], // The base64 encoded bitmap data
    "hash": str // The hash of the file
}
```

JSON Response if failure:
```
{
    "error": str, // The error
}
```