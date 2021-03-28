import Database from "better-sqlite3";
import { Player } from "./player";
import { Storage } from "./storage"
export class Marble {

	static marbleListQuery: Database.Statement = null;
	static marbleCategoryQuery: Database.Statement = null;
	static getMarbleList() {
		if (Marble.marbleListQuery === null)
			Marble.marbleListQuery = Storage.db.prepare("SELECT id, category_id, name, shape_file AS shapeFile, shaderF, shaderV, skin FROM marbles WHERE disabled=0 ORDER BY sort ASC;");
		if (Marble.marbleCategoryQuery === null)
			Marble.marbleCategoryQuery = Storage.db.prepare("SELECT file_base, id, name FROM marble_categories WHERE disabled=0;");
		
		let marbleList = Marble.marbleListQuery.all();
		let marbleCategories = Marble.marbleCategoryQuery.all();
		return {
			Marbles: marbleList,
			categories: marbleCategories
		};
	}

	static getCurrentMarbleQuery: Database.Statement = null;
	static getCurrentMarble(username: string, key: string) {
		if (Marble.getCurrentMarbleQuery === null)
			Marble.getCurrentMarbleQuery = Storage.db.prepare("SELECT M.id, M.category_id FROM users AS U, user_current_marble_selection AS UM, marbles AS M WHERE U.id = UM.user_id AND M.id = UM.marble_id AND U.username = @username AND U.webchatKey = @key;");
		
		let marble = Marble.getCurrentMarbleQuery.get({ username: username, key: key });

		if (marble === undefined) return "";

		return `${marble.category_id} ${marble.id}`;
	}

	static recordCreateMarbleSelectionQuery: Database.Statement = null;
	static recordUpdateMarbleSelectionQuery: Database.Statement = null;
	static recordMarbleSelection(username: string, key: string, marbleId: number) {
		let id = Player.authenticate(username, key);
		if (id !== null) {
			// Check if we have an entry in the marble selection table or soemthing
			if (Marble.getCurrentMarble(username, key) === "") {
				// We don't
				if (Marble.recordCreateMarbleSelectionQuery === null) {
					Marble.recordCreateMarbleSelectionQuery = Storage.db.prepare("INSERT INTO user_current_marble_selection(user_id, marble_id) VALUES(@userid,@marbleid);");
				}
				// TODO CHECK FOR NONEXISTENT MARBLES
				let res = Marble.recordCreateMarbleSelectionQuery.run({ userid: id, marbleid: marbleId });

				return res.changes !== 0;
			} else {
				// Do an update table
				if (Marble.recordUpdateMarbleSelectionQuery === null) {
					Marble.recordUpdateMarbleSelectionQuery = Storage.db.prepare("UPDATE user_current_marble_selection SET marble_id=@marbleid WHERE @user_id=@userid;");
				}
				let res = Marble.recordUpdateMarbleSelectionQuery.run({ userid: id, marbleid: marbleId });

				return res.changes !== 0;
			}
		}
		return false;
	}
}