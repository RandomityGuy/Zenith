import Database from "better-sqlite3";
import { Player } from "./player";
import { Storage } from "./storage"
export class Marble {

	// Gets the list of all available marbles
	static getMarbleList() {		
		let marbleList = Storage.query("SELECT id, category_id, name, shape_file, shaderF, shaderV, skin FROM marbles WHERE disabled=0 ORDER BY sort ASC;").all();
		let marbleCategories = Storage.query("SELECT file_base, id, name FROM marble_categories WHERE disabled=0;").all();
		return {
			Marbles: marbleList,
			categories: marbleCategories
		};
	}

	// Gets the selected marble for a given user
	static getCurrentMarble(userId: number) {
		let marble = Storage.query("SELECT M.id, M.category_id FROM users AS U, user_current_marble_selection AS UM, marbles AS M WHERE U.id = UM.user_id AND M.id = UM.marble_id AND U.id = @id;").get({ id: userId });

		if (marble === undefined) return "";

		return `${marble.category_id} ${marble.id}`;
	}

	// Sets the selected marble for a given user
	static recordMarbleSelection(userId: number, marbleId: number) {
		// TODO CHECK FOR NONEXISTENT MARBLES
		// This query does an insert or update if exists.
		let res = Storage.query("REPLACE INTO user_current_marble_selection(user_id, marble_id) VALUES(@userid,@marbleid);").run({ userid: userId, marbleid: marbleId });
		return res.changes !== 0;
	}
}