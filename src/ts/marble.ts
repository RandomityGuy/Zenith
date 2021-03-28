import Database from "better-sqlite3";
import { Storage } from "./storage"
export class Marble {

	static marbleListQuery: Database.Statement = null;
	static marbleCategoryQuery: Database.Statement = null;
	static getMarbleList() {
		if (Marble.marbleListQuery === null)
			Marble.marbleListQuery = Storage.db.prepare("SELECT id, category_id, name, shape_file AS shapeFile, shaderF, shaderV, skin FROM marbles WHERE disabled=0 ORDER BY sort ASC;");
		if (Marble.marbleCategoryQuery === null)
			Marble.marbleCategoryQuery = Storage.db.prepare("SELECT file_base, id, name FROM marble_categories WHERE disabled=0;");
		
		let marbleList = this.marbleListQuery.all();
		let marbleCategories = this.marbleCategoryQuery.all();
		return {
			Marbles: marbleList,
			categories: marbleCategories
		};
	}
}