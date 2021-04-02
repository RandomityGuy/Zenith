import Database from "better-sqlite3";
import { Player } from "./player";
import { Storage } from "./storage"
export class Marble {

	static getMarbleList() {		
		let marbleList = Storage.query("SELECT id, category_id, name, shape_file, shaderF, shaderV, skin FROM marbles WHERE disabled=0 ORDER BY sort ASC;").all();
		let marbleCategories = Storage.query("SELECT file_base, id, name FROM marble_categories WHERE disabled=0;").all();
		return {
			Marbles: marbleList,
			categories: marbleCategories
		};
	}

	static getCurrentMarble(username: string, key: string) {
		let marble = Storage.query("SELECT M.id, M.category_id FROM users AS U, user_current_marble_selection AS UM, marbles AS M WHERE U.id = UM.user_id AND M.id = UM.marble_id AND U.username = @username AND U.webchatKey = @key;").get({ username: username, key: key });

		if (marble === undefined) return "";

		return `${marble.category_id} ${marble.id}`;
	}

	static recordMarbleSelection(username: string, key: string, marbleId: number) {
		let id = Player.authenticate(username, key);
		if (id !== null) {
			// TODO CHECK FOR NONEXISTENT MARBLES
			// This query does an insert or update if exists.
			let res = Storage.query("REPLACE INTO user_current_marble_selection(user_id, marble_id) VALUES(@userid,@marbleid);").run({ userid: id, marbleid: marbleId });
			return res.changes !== 0;
		}
		return false;
	}
}