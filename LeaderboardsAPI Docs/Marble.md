## Marble
### GET/POST https://marbleblast.com/pq/leader/api/Marble/GetMarbleList.php

Gets the leaderboards marble list

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | JSON |

JSON Response if success:
```
{
    "Marbles": [
        {
            "category_id": int, // The id of the category this marble belongs to
            "id": int, // The id of the marble
            "name": str, // The name of the marble
            "shaderF": null | str, // The path to fragment shader of marble
            "shaderV": null | str, // The path to vertex shader of marble
            "shapeFile": str, // The name of the dts shape file
            "skin": str // The name of the skin of the marble   
        }...
    ],
    "categories": [ 
        {
            "file_base": str, // The filepath of the category
            "id": int, // The category id
            "name": str, // The category name
        }...
    ]
}
```

### GET/POST https://marbleblast.com/pq/leader/api/Marble/GetCurrentMarble.php

Gets the current selected marble. 

Query String Parameters:
| FIELD | TYPE | DESCRIPTION | REQUIRED | DEFAULT|
|-------|------|-------------|----------|--------|
| username | str | The username of the person | Yes | None |
| key | str | The $LB::ChatKey | Yes | None |  

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | \<category-id: int\> \<marble-id: int\>|