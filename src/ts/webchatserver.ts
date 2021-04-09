import * as net from "net"
import { isPartiallyEmittedExpression } from "typescript";
import { Player } from "./player";
import { Storage } from "./storage"
import { WebchatInfo, WebchatResponse, WebchatUser } from "./webchat";

class WebchatPlayer {
	socket: net.Socket;
	session: string;

	userId: number;
	username: string;
	display: string;
	accessLevel: number = 0;
	gameVersion: number;

	pingTime: number;
	pingInitial: number;

	status: number = 0;

	rawReceivedData: string = "";

	constructor(socket: net.Socket) {
		this.socket = socket;
	}

	send(response: WebchatResponse) {
		response.getResult().forEach(x => this.socket.write(x + "\n"));
	}
}

export class WebchatServer {
	server: net.Server

	clients: Set<WebchatPlayer>

	initialize() {
		// We assume the settings are already loaded, if not, then we explode into a million pieces
		let hostsplit = Storage.settings.webchatServer.split(':'); // Naive but works for now
		let hostname = hostsplit[0];
		let port = Number.parseInt(hostsplit[1]);

		this.server = net.createServer((socket) => this.onConnect(socket));
		this.server.listen(port, hostname);

		this.clients = new Set<WebchatPlayer>();
	}

	onConnect(socket: net.Socket) {
		let player = new WebchatPlayer(socket);
		this.clients.add(player);

		// Now we set up the socket callbacks
		socket.on('close', (hadError) => this.onDisconnect(player, hadError));
		socket.on('data', (data) => this.onDataRaw(player, data));
		socket.on('error', (err) => this.onError(player, err));
	}

	onDisconnect(player: WebchatPlayer, hadError: boolean) {
		// Bye bye!
		this.clients.delete(player);
	}

	onError(player: WebchatPlayer, error: Error) {
		console.log(`Player ${player.username} errored out due to ${error.message}`);
		this.clients.delete(player);
	}

	onDataRaw(player: WebchatPlayer, data: Buffer) {
		let datastr = data.toString();
		player.rawReceivedData += datastr;
		while (player.rawReceivedData.includes("\r\n")) {
			let line = player.rawReceivedData.slice(0, player.rawReceivedData.indexOf("\r\n"));
			this.onData(player, line);
			player.rawReceivedData = player.rawReceivedData.slice(player.rawReceivedData.indexOf("\r\n") + 2);
		}
	}

	onData(player: WebchatPlayer, data: string) {
		let parts = data.split(' ');
		let command = parts[0];

		if (command === "IDENTIFY") {
			player.username = parts[1];
		}

		if (command === "VERIFY") {
			player.gameVersion = Number.parseInt(parts[1]);
			let pwd = parts[2];
			let authdata = Player.checkLogin(player.username, pwd, player.socket.remoteAddress) as any;

			let response = new WebchatResponse();
			if (player.gameVersion < Storage.settings.gameVersion) {
				response.identify("OUTOFDATE");
			}
			if (authdata.success) {
				player.userId = authdata.id;
				player.accessLevel = authdata.access;
				player.display = authdata.display;

				response.identify("SUCCESS");
				let responseInfo = new WebchatInfo();
				responseInfo.access(authdata.access);
				responseInfo.displayName(authdata.display);
				responseInfo.servertime(new Date().getTime());
				responseInfo.welcome(Storage.settings.welcome);
				responseInfo.defaultHSName(Storage.settings.default_name);
				responseInfo.address(player.socket.remoteAddress);
				responseInfo.help(Storage.settings.chat_help_info, Storage.settings.chat_help_cmdlist);
				responseInfo.privelege(authdata.access);
				response.info(responseInfo);

				// The friend list
				let friendlist = Player.getFriendsList(authdata.id);
				friendlist.forEach(x => {
					response.addFriend(x.username, x.name);
				})

				// The block list
				let blocklist = Player.getBlockList(authdata.id);
				blocklist.forEach(x => {
					response.addBlock(x.username, x.name);
				})

				// Chat statuses
				Storage.settings.chat_statuses.forEach((x,idx) => {
					response.status(idx, x);
				})

				// The list of available chat colours
				Storage.settings.chat_colors.forEach(x => {
					response.color(x.key, x.value)
				})

				// The list of available chat flairs
				Storage.settings.chat_flairs.forEach(x => {
					response.flair(x);
				})

				if (Storage.settings.halloween_event)
					response.frightfest()
				
				if (Storage.settings.winter_event)
					response.winterfest()

				response.logged();
			} else {
				if (authdata.reason === "username" || authdata.reason === "password") {
					response.identify("INVALID");
				}
				if (authdata.reason === "banned") {
					response.identify("BANNED");
				}
			}
			player.send(response);
			if (authdata.success) { // Send player join notification to everyone
				this.notifyJoin(player);
			}
		}

		if (command === "SESSION") {
			player.session = parts[1];
		}

		if (command === "PING") {
			let response = new WebchatResponse();
			player.pingInitial = new Date().getTime();
			response.ping(parts[1]);
			player.send(response);
		}

		if (command === "PONG") {
			player.pingTime = new Date().getTime() - player.pingInitial;
			let response = new WebchatResponse();
			response.pingtime(player.pingTime);
			player.send(response);
		}

		if (command === "LOCATION") {
			player.status = Number.parseInt(parts[1]);
			this.notifyUserUpdate();
		}

		if (command === "FRIEND") {
			let friendId = Player.getUserId(parts[1]);
			Storage.query("REPLACE INTO user_friends(user_id,friend_id) VALUES (@userId,@friendId);").run({ userId: player.userId, friendId: friendId });
			let response = new WebchatResponse();
			response.addFriendSuccess();
			player.send(response);
		}

		if (command === "FRIENDDEL") {
			let friendId = Player.getUserId(parts[1]);
			Storage.query("DELETE FROM user_friends WHERE user_id = @userId AND friend_id = @friendId);").run({ userId: player.userId, friendId: friendId });
			let response = new WebchatResponse();
			response.removeFriendSuccess();
			player.send(response);
		}

		if (command === "BLOCK") {
			let blockId = Player.getUserId(parts[1]);
			Storage.query("REPLACE INTO user_blocks(user_id,block_id) VALUES (@userId,@blockId);").run({ userId: player.userId, blockId: blockId });
			let response = new WebchatResponse();
			response.addBlockSuccess();
			player.send(response);
		}

		if (command === "UNBLOCK") {
			let blockId = Player.getUserId(parts[1]);
			Storage.query("DELETE FROM user_blocks WHERE user_id = @userId AND block_id = @blockId);").run({ userId: player.userId, blockId: blockId });
			let response = new WebchatResponse();
			response.removeBlockSuccess();
			player.send(response);
		}

		if (command === "FRIENDLIST") {
			let response = new WebchatResponse();
			let friendlist = Player.getFriendsList(player.userId);
			friendlist.forEach(x => {
				response.addFriend(x.username, x.name);
			})
			player.send(response);
		}

		if (command === "DISCONNECT") {
			this.clients.delete(player);
			player.socket.destroy();
		}

		if (command === "CHAT") {
			let dest = parts[1];
			let conts = parts.slice(2).join(' ');
			let response = new WebchatResponse();
			response.chat(player.username, player.display, dest, player.accessLevel, conts);
			if (dest === "") {
				this.clients.forEach(x => x.send(response));
			} else {
				for (let client of this.clients) {
					if (client.username === dest || client.display === dest) {
						client.send(response);
					}
				}
			}
		}

	}

	verifyPlayerSession(username: string, session: string) {
		for (let client of this.clients) {
			if (client.username === username && client.session === session)
				return true;
		}
		return false;
	}

	notifyJoin(player: WebchatPlayer) {
		let response = new WebchatResponse();
		this.generateUserList(response);

		response.notify("login", player.username, player.display, []);
		this.clients.forEach(x => x.send(response));
	}

	notifyLeave(player: WebchatPlayer) {
		let response = new WebchatResponse();
		this.generateUserList(response);

		response.notify("logout", player.username, player.display, []);
		this.clients.forEach(x => x.send(response));
	}

	notifyUserUpdate() {
		let response = new WebchatResponse();
		this.generateUserList(response);
		this.clients.forEach(x => x.send(response));
	}

	notifyStatusChange(player: WebchatPlayer) {
		let response = new WebchatResponse();
		response.notify("setlocation", player.username, player.display, [player.status.toString()]);
		this.clients.forEach(x => x.send(response));
	}

	generateUserList(response: WebchatResponse) {
		let groups = [
			{ access: -3, order: 0, display: "Banned Users", altDisplay: "Banned" },
			{ access: 0, order: 2, display: "Users", altDisplay: "Member" },
			{ access: 1, order: 3, display: "Moderators", altDisplay: "Moderator" },
			{ access: 2, order: 4, display: "Administrators", altDisplay: "Administrator" },
			{ access: 3, order: 1, display: "Guests", altDisplay: "Guest" },
			{ access: 4, order: 5, display: "Developers", altDisplay: "Developer" },
		]
		groups.forEach(x => response.group(x));

		this.clients.forEach(player => {
			let titleFlairData = Storage.query("SELECT accessLevel AS access, registerDate, colorValue AS color, donations, id, statusMsg AS status, titleFlair, titlePrefix, titleSuffix, username, name FROM users WHERE id = @userId;").get({ userId: player.userId }); // Taken from player.ts
			let flair = Number.parseInt(titleFlairData.titleFlair);
			let flairStr = "";
			if (Storage.settings.chat_flairs.length > flair) {
				flairStr = Storage.settings.chat_flairs[flair];
			}
			response.userInfo(new WebchatUser(player.username, player.display, player.accessLevel, player.status, titleFlairData.color, flairStr, titleFlairData.titlePrefix, titleFlairData.titleSuffix));
		})
	}
}