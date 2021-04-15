import * as net from "net"
import { isPartiallyEmittedExpression } from "typescript";
import { Mission } from "./mission";
import { Player } from "./player";
import { Storage } from "./storage"
import { WebchatInfo, WebchatResponse, WebchatUser } from "./webchat";

// A webchat player
class WebchatPlayer {

	// The socket used by the player
	socket: net.Socket;
	// The session string of the player
	session: string;

	// The user id of the player
	userId: number = null;
	// The username of the player
	username: string;
	// The display name of the player
	display: string;
	// The access level of the player
	accessLevel: number = 0;
	// The game version of the player
	gameVersion: number;

	// The prefix
	titlePrefix: string;
	// The suffix
	titleSuffix: string;

	// Data used for ping time calculation
	pingTime: number;
	pingInitial: number;

	// The status number of the player
	status: number = 0;
	
	// Whether the player is guest or not
	isGuest: boolean = false;

	// Data,
	rawReceivedData: string = "";

	// Blocked users
	blockList: Set<string> = new Set<string>();

	// The time when the user connected to the server
	connectTime: Date;

	constructor(socket: net.Socket) {
		this.socket = socket;
	}

	// Send data to the player
	send(response: WebchatResponse) {
		response.getResult().forEach(x => this.socket.write(x + "\n"));
	}
}

export class WebchatServer {
	server: net.Server

	clients: Set<WebchatPlayer>

	// Start up the webchat server
	initialize() {
		// We assume the settings are already loaded, if not, then we explode into a million pieces
		let hostsplit = Storage.settings.webchatServer.split(':'); // Naive but works for now
		let hostname = hostsplit[0];
		let port = Number.parseInt(hostsplit[1]);

		this.server = net.createServer((socket) => this.onConnect(socket));
		this.server.listen(port, hostname);

		this.clients = new Set<WebchatPlayer>();
	}

	// Received when a player connects
	onConnect(socket: net.Socket) {
		let player = new WebchatPlayer(socket);
		player.connectTime = new Date();
		this.clients.add(player);

		// Now we set up the socket callbacks
		socket.on('close', (hadError) => this.onDisconnect(player, hadError));
		socket.on('data', (data) => this.onDataRaw(player, data));
		socket.on('error', (err) => this.onError(player, err));
	}

	// Received when a pleyer disconnects
	onDisconnect(player: WebchatPlayer, hadError: boolean) {
		// Bye bye!
		// Update the total time online
		if (player.userId !== null) {
			let seconds = Math.floor((new Date().getTime() - player.connectTime.getTime()) / 1000);
			Storage.query("UPDATE users SET onlineTime = @time WHERE id=@userId;").run({ time: seconds, userId: player.userId });
		}
		this.clients.delete(player);
	}

	// Received when a player errors out
	onError(player: WebchatPlayer, error: Error) {
		if (player.userId !== null) {
			let seconds = Math.floor((new Date().getTime() - player.connectTime.getTime()) / 1000);
			Storage.query("UPDATE users SET onlineTime = @time WHERE id=@userId;").run({ time: seconds, userId: player.userId });
		}
		console.log(`Player ${player.username} errored out due to ${error.message}`);
		this.clients.delete(player);
	}

	// Handles the incoming data and splits it by newlines and calls onData for each newline
	onDataRaw(player: WebchatPlayer, data: Buffer) {
		let datastr = data.toString();
		player.rawReceivedData += datastr;
		while (player.rawReceivedData.includes("\r\n")) {
			let line = player.rawReceivedData.slice(0, player.rawReceivedData.indexOf("\r\n"));
			this.onData(player, line);
			player.rawReceivedData = player.rawReceivedData.slice(player.rawReceivedData.indexOf("\r\n") + 2);
		}
	}

	// Handles the actual logic of what to do when data is received
	onData(player: WebchatPlayer, data: string) {
		let parts = data.split(' ');
		let command = parts[0];

		// Identify the player
		if (command === "IDENTIFY") {
			player.username = parts[1];
			if (player.username === "Guest") {
				player.username = "Guest_" + Player.strRandom(10);
				player.isGuest = true;
				this.handleLogin(player, ["VERIFY", "100000", "bruh"]);
			}
		}

		// Verify the player, authentication stuff
		if (command === "VERIFY") {
			this.handleLogin(player, parts);
		}

		// Set the session data
		if (command === "SESSION") {
			player.session = parts[1];
		}

		// Ping, part 1
		if (command === "PING") {
			let response = new WebchatResponse();
			player.pingInitial = new Date().getTime();
			response.ping(parts[1]);
			player.send(response);
		}

		// Ping, part 2
		if (command === "PONG") {
			player.pingTime = new Date().getTime() - player.pingInitial;
			let response = new WebchatResponse();
			response.pingtime(player.pingTime);
			player.send(response);
		}

		// Set the status of the player
		if (command === "LOCATION") {
			player.status = Number.parseInt(parts[1]);
			this.notifyUserUpdate();
			this.notifyStatusChange(player);
		}

		// Add a friend
		if (command === "FRIEND") {
			let friendId = Player.getUserId(parts[1]);
			Storage.query("REPLACE INTO user_friends(user_id,friend_id) VALUES (@userId,@friendId);").run({ userId: player.userId, friendId: friendId });
			let response = new WebchatResponse();
			response.addFriendSuccess();
			player.send(response);
		}

		// Delete a friend
		if (command === "FRIENDDEL") {
			let friendId = Player.getUserId(parts[1]);
			Storage.query("DELETE FROM user_friends WHERE user_id = @userId AND friend_id = @friendId);").run({ userId: player.userId, friendId: friendId });
			let response = new WebchatResponse();
			response.removeFriendSuccess();
			player.send(response);
		}

		// Block a user
		if (command === "BLOCK") {
			let blockId = Player.getUserId(parts[1]);
			Storage.query("REPLACE INTO user_blocks(user_id,block_id) VALUES (@userId,@blockId);").run({ userId: player.userId, blockId: blockId });
			let response = new WebchatResponse();
			response.addBlockSuccess();
			player.send(response);
		}

		// Unblock a user
		if (command === "UNBLOCK") {
			let blockId = Player.getUserId(parts[1]);
			Storage.query("DELETE FROM user_blocks WHERE user_id = @userId AND block_id = @blockId);").run({ userId: player.userId, blockId: blockId });
			let response = new WebchatResponse();
			response.removeBlockSuccess();
			player.send(response);
		}

		// Get the friend list
		if (command === "FRIENDLIST") {
			let response = new WebchatResponse();
			let friendlist = Player.getFriendsList(player.userId);
			friendlist.forEach(x => {
				response.addFriend(x.username, x.name);
			})
			player.send(response);
		}

		// Disconnect
		if (command === "DISCONNECT") {
			if (player.userId !== null) {
				let seconds = Math.floor((new Date().getTime() - player.connectTime.getTime()) / 1000);
				Storage.query("UPDATE users SET onlineTime = @time WHERE id=@userId;").run({ time: seconds, userId: player.userId });
			}
			this.clients.delete(player);
			player.socket.destroy();
		}

		// Chat
		if (command === "CHAT") {
			let dest = parts[1];
			if (!this.handleChatCommand(player, parts[2], parts.slice(3))) {
				let conts = parts.slice(2).join(' ');
				let response = new WebchatResponse();
				response.chat(player.username, player.display, dest, player.accessLevel, conts);
				// Send to proper destinations
				if (dest === "") {
					this.clients.forEach(x => x.send(response));
				} else {
					for (let client of this.clients) {
						// Don't do it for blocked users
						if (client.username === dest || client.display === dest && !client.blockList.has(player.username)) {
							client.send(response);
						}
					}
				}
			}
		}

	}

	// Authentication stuff
	handleLogin(player: WebchatPlayer, parts: string[]) {
		player.gameVersion = Number.parseInt(parts[1]);
		let pwd = parts[2];
		let authdata = Player.checkLogin(player.username, pwd, player.socket.remoteAddress) as any;
		if (player.isGuest) {
			authdata = {
				id: 0,
				access: 3,
				display: player.username,
				success: true
			}
		}

		let response = new WebchatResponse();
		if (player.gameVersion < Storage.settings.gameVersion) {
			response.identify("OUTOFDATE");
		}
		if (authdata.success || player.isGuest) {
			player.userId = authdata.id;
			player.accessLevel = authdata.access;
			player.display = authdata.display;

			if (!player.isGuest) {
				let titleFlairData = Storage.query("SELECT accessLevel AS access, registerDate, colorValue AS color, donations, id, statusMsg AS status, titleFlair, titlePrefix, titleSuffix, username, name FROM users WHERE id = @userId;").get({ userId: player.userId }); // Taken from player.ts
				player.titlePrefix = titleFlairData.titlePrefix;
				player.titleSuffix = titleFlairData.titleSuffix;
			} else {
				player.titlePrefix = player.titleSuffix = "";
			}

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

			if (player.isGuest) {
				responseInfo.canChat(false);
			}

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
				player.blockList.add(x.username);
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

	// Handles chat commands, currently one command
	handleChatCommand(sender: WebchatPlayer,command: string, context: string[]) {
		if (command === "/ping") {
			let response = new WebchatResponse();
			response.chat("SERVER", "SERVER", sender.username, 0, `/whisper ${sender.username} PONG!`);
			sender.send(response);
			return true;
		}
		return false;
	}

	// Verifies a player session
	verifyPlayerSession(username: string, session: string) {
		for (let client of this.clients) {
			if (client.username === username && client.session === session)
				return true;
		}
		return false;
	}

	// Notifies everyone of a WR
	notifyWR(userId: number, missionId: number, score: number, scoreType: string) {
		let response = new WebchatResponse();
		for (let player of this.clients) {
			if (player.userId === userId) {
				if (scoreType === "time") {
					response.notify("record", player.username, player.display, [WebchatResponse.encodeName(Mission.getMissionName(missionId)), score.toString()]);
				}
				if (scoreType === "score") {
					response.notify("recordscore", player.username, player.display, [WebchatResponse.encodeName(Mission.getMissionName(missionId)), score.toString()]);
				}
				break;
			}
		}
		this.clients.forEach(x => x.send(response));
	}

	// Notifies everyone a player has joined
	notifyJoin(player: WebchatPlayer) {
		let response = new WebchatResponse();
		this.generateUserList(response);

		response.notify("login", player.username, player.display, []);
		this.clients.forEach(x => x.send(response));
	}

	// Notifies everyone a player has left
	notifyLeave(player: WebchatPlayer) {
		let response = new WebchatResponse();
		this.generateUserList(response);

		response.notify("logout", player.username, player.display, []);
		this.clients.forEach(x => x.send(response));
	}

	// Sends user details to everyone again cause someone updated their data
	notifyUserUpdate() {
		let response = new WebchatResponse();
		this.generateUserList(response);
		this.clients.forEach(x => x.send(response));
	}

	// Notifies everyone about a status change of a user
	notifyStatusChange(player: WebchatPlayer) {
		let response = new WebchatResponse();
		response.notify("setlocation", player.username, player.display, [player.status.toString()]);
		this.clients.forEach(x => x.send(response));
	}
	
	// Gets the full display name with prefix suffix for a user
	getFullDisplayName(player: WebchatPlayer) {
		let name = "";
		if (player.titlePrefix !== null && player.titlePrefix !== "")
			name += player.titlePrefix + " ";
		name += player.display;
		if (player.titleSuffix !== null && player.titleSuffix !== "")
			name += " " + player.titleSuffix;
		return WebchatResponse.encodeName(name);
	}

	// Generates the user list data for a response
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
			if (!player.isGuest) {
				let titleFlairData = Storage.query("SELECT accessLevel AS access, registerDate, colorValue AS color, donations, id, statusMsg AS status, titleFlair, titlePrefix, titleSuffix, username, name FROM users WHERE id = @userId;").get({ userId: player.userId }); // Taken from player.ts
				let flair = Number.parseInt(titleFlairData.titleFlair);
				let flairStr = "";
				if (Storage.settings.chat_flairs.length > flair) {
					flairStr = Storage.settings.chat_flairs[flair];
				}
				response.userInfo(new WebchatUser(player.username, player.display, player.accessLevel, player.status, titleFlairData.color, flairStr, titleFlairData.titlePrefix, titleFlairData.titleSuffix));
			} else {
				response.userInfo(new WebchatUser(player.username, player.username, 3, 0, "#000000", "", "", ""));
			}
		})
	}
}