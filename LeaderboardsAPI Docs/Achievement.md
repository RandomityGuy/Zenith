## Achievement

### GET/POST https://marbleblast.com/pq/leader/api/Achievement/GetAchievementList.php

Gets the leaderboards achievement list

Response
| STATUS CODE | RESPONSE |
|-------------|----------|
| 200 | JSON |

JSON Response if success:
```
{
    "achievements": {
        "Single Player" | "Multiplayer" | "Event": [
            {
                "bitmap_extent": str, // The bitmap size for rendering
                "category": str, // The category name, usually same as the key of this list (for eg. "Single Player")
                "description": str, // The description of the achievement
                "id": int, // The id of the achievement
                "index": int, // The sorting index
                "rating": int, // The rating reward for the achievement
                "title": str, // The name of the achievement to be shown
            }...
        ]
    }
    "categories": Dictionary:= name: string => { 
        "bitmap_path": str, // The path to the bitmaps
        "id": int, // The category id
        "title": str, // The category name to be shown
    }
    "categoryNames": string[], // The name of the categories
}
```