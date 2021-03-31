import * as net from "net"
import { Player } from "./player";
import { Storage } from "./storage"
import { WebchatResponse } from "./webchat";

class WebchatPlayer {
	socket: net.Socket;
	session: string;
	username: string;
	display: string;
	gameVersion: number;

	rawReceivedData: string = "";

	constructor(socket: net.Socket) {
		this.socket = socket;
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
	}

	onDisconnect(player: WebchatPlayer, hadError: boolean) {
		// Bye bye!
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
		};
		if (command === "VERIFY") {
			player.gameVersion = Number.parseInt(parts[1]);
			let pwd = parts[2];
			let authdata = Player.checkLogin(player.username, pwd, player.socket.remoteAddress) as any;

			let response = new WebchatResponse();
			if (player.gameVersion < Storage.settings.gameVersion) {
				response.identify("OUTOFDATE");
			}
			if (authdata.success) {
				response.identify("SUCCESS");
				response.logged();
			} else {
				if (authdata.reason === "username" || authdata.reason === "password") {
					response.identify("INVALID");
				}
				if (authdata.reason === "banned") {
					response.identify("BANNED");
				}
			}
			response.getResult().forEach(x => player.socket.write(x + "\n"));
		}
		if (command === "SESSION") {
			player.session = parts[1];
		}
	}
}