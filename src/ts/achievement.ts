import { Storage } from "./storage";

export class Achievement {
    static getAchievementList() {
        let categoriesDict = new Map<string, any>();
        let categoryNames: string[] = [];
        let categories = Storage.query("SELECT * FROM achievement_categories;").all();
        categories.forEach(x => {
            categoriesDict.set(x.title, x);
            categoryNames.push(x.title);
        });
        // Yeah hardcoded... :pensive:
        let achievementDict = new Map<string, any[]>();
        achievementDict.set("Single Player", Storage.query(`SELECT bitmap_extent, 'Single Player' AS category, description, id, "index", rating, title FROM achievement_names WHERE category_id IN (1,4);`).all());
        achievementDict.set("Multiplayer", Storage.query(`SELECT bitmap_extent, 'Multiplayer' AS category, description, id, "index", rating, title FROM achievement_names WHERE category_id = 2`).all());
        achievementDict.set("Event", Storage.query(`SELECT bitmap_extent, 'Event' AS category, description, id, "index", rating, title FROM achievement_names WHERE category_id = 3`).all());

        let obj = {
            achievements: Object.fromEntries(achievementDict),
            categories: Object.fromEntries(categoriesDict),
            categoryNames: categoryNames
        };

        return obj;
    }
}