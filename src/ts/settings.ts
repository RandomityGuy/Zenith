import * as fs from 'fs-extra'
import * as path from 'path'

export class Settings {

	static settings: {
		online: true,
		halloween_event: true,
		winter_event: true,
		welcome: string,
		chat_help_info: string,
		chat_help_cmdlist: string,
		history_count: number,
		default_name: string,
		april20_uid: number,
		show_wr_messages: boolean,
		april20_chance: number,
		show_egg_wr_messages: boolean,
		wr_player_count: number,
		chat_colors: { key: string, value: string }[],
		chat_statuses: string[],
		chat_flairs: string[]
	}

	static initSettings() {
		let file = fs.readFileSync(path.join('storage', 'settings.json'), 'utf-8')
		Settings.settings = JSON.parse(file);
	}
}