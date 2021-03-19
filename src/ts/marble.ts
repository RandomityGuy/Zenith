import { db } from "./database"

export class Marble {

    static marbleListQuery = db.prepare("SELECT id, category_id, name, shape_file AS shapeFile, shaderF, shaderV, skin FROM marbles WHERE disabled=0 ORDER BY sort ASC;");
    static marbleCategoryQuery = db.prepare("SELECT file_base, id, name FROM marble_categories WHERE disabled=0;")
    static getMarbleList() {
        let marbleList = this.marbleListQuery.all();
        let marbleCategories = this.marbleCategoryQuery.all();
        return {
            Marbles: marbleList,
            categories: marbleCategories
        };
    }
}