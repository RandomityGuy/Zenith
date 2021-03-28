import * as net from "net"
import { Storage } from "./storage"

export class WebchatServer {
	server: net.Server

	clients: Set<net.Socket>

	initialize() {
		// We assume the settings are already loaded, if not, then we explode into a million pieces
		let hostsplit = Storage.settings.webchatServer.split(':'); // Naive but works for now
		let hostname = hostsplit[0];
		let port = Number.parseInt(hostsplit[1]);

		this.server = net.createServer((socket) => this.onConnect(socket));
		this.server.listen(port, hostname);

		this.clients = new Set<net.Socket>();
	}

	onConnect(socket: net.Socket) {
		this.clients.add(socket);

		// Now we set up the socket callbacks
		socket.on('close', (hadError) => this.onDisconnect(socket, hadError));
	}

	onDisconnect(socket: net.Socket, hadError: boolean) {
		// Bye bye!
		this.clients.delete(socket);
	}
}