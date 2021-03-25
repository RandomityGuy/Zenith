
export class WebchatUser {
	username: string;
	displayname: string;
	access: number;
	statusId: number;
	color: string;
	flair: string;
	prefix: string;
	suffix: string;
	constructor(username: string, displayname: string, access: number, statusId: number, color: string, flair: string, prefix: string, suffix: string) {
		this.username = username;
		this.displayname = displayname;
		this.access = access;
		this.statusId = statusId;
		this.color = color;
		this.flair = flair;
		this.prefix = prefix;
		this.suffix = suffix;
	}
}

export class WebchatInfo {
	text: string[] = [];

	canchat: boolean = true;

	logging() {
		this.text.push("INFO LOGGING");
	}

	access(accessLevel: number) {
		this.text.push(`INFO ACCESS ${accessLevel}`);
	}

	privelege(accessLevel: number) {
		this.text.push(`INFO PRIVELEGE ${accessLevel}`);
	}

	servertime(time: number) {
		this.text.push(`INFO SERVERTIME ${time}`);
	}

	displayName(displayname: string) {
		this.text.push(`INFO DISPLAY ${displayname}`);
	}

	username(username: string) {
		this.text.push(`INFO USERNAME ${username}`);
	}

	rating(rating: number) {
		this.text.push(`INFO CURRATING ${rating}`);
	}

	welcome(message: string) {
		this.text.push(`INFO WELCOME ${message}`);
	}

	defaultHSName(name: string) {
		this.text.push(`INFO DEFAULT ${name}`);
	}

	address(ip: string) {
		this.text.push(`INFO ADDRESS ${ip}`);
	}

	help(info: string, cmdlist: string) {
		this.text.push(`INFO HELP INFO ${info}`);
		this.text.push(`INFO HELP CMDLIST ${cmdlist}`);
	}

	canChat(chat: boolean) {
		this.canchat = chat;
	}

	getResult() {
		let res = [...this.text];
		res.push(`CANCHAT ${this.canChat}`);
		return res;
	}
}

// It is a class that is used to generate valid webchat responses by just calling functions
export class WebchatResponse {
	text: string[] = [];

	webchatInfo: WebchatInfo = null;;

	friendList: { username: string, displayname: string }[] = [];
	blockList: { username: string, displayname: string }[] = [];

	userList: WebchatUser[] = [];
	userGroupList: { access: number, order: number, display: string, altDisplay: string }[] = [];

	identify(status: "BANNED" | "INVALID" | "CHALLENGE" | "OUTOFDATE" | "SUCCESS", banreason: string = null) {
		if (banreason === null)
			this.text.push(`IDENTIFY ${status}`);
		else
			this.text.push(`IDENTIFY ${status} ${banreason}`);
	}

	logged() {
		this.text.push("LOGGED");
	}

	acceptTOS() {
		this.text.push("ACCEPTTOS");
	}

	// Friend operations
	addFriend(username: string, displayname: string) {
		this.friendList.push({ username: username, displayname: displayname });
	}

	removeFriend(username: string) {
		this.friendList.splice(this.friendList.findIndex(x => x.username === username), 1);
	}

	addFriendSuccess() {
		this.text.push("FRIEND ADDED");
	}

	removeFriendSuccess() {
		this.text.push("FRIEND DELETED");
	}

	friendOperationFailure() {
		this.text.push("FRIEND FAILED");
	}

	// Blocked users operations
	addBlock(username: string, displayname: string) {
		this.blockList.push({ username: username, displayname: displayname });
	}

	removeBlock(username: string) {
		this.blockList.splice(this.friendList.findIndex(x => x.username === username), 1);
	}

	addBlockSuccess() {
		this.text.push("BLOCK ADDED");
	}

	removeBlockSuccess() {
		this.text.push("BLOCK DELETED");
	}

	blockOperationFailure() {
		this.text.push("BLOCK FAILED");
	}

	// Other stuff
	flair(flair_id: string) {
		this.text.push(`"FLAIR ${flair_id}`);
	}

	winterfest() {
		this.text.push("WINTER");
	}

	frightfest() {
		this.text.push("2SPOOKY");
	}

	chat(username: string, displayname: string, destination: string, access: number, message: string) {
		this.text.push(`CHAT ${username} ${displayname} ${destination} ${access} ${encodeURI(message)}`);
	}

	notify(type: "login" | "logout" | "setlocation" | "kick" | "levelup" | "mastery" | "taskcomplete" | "achievement" | "prestigeup" | "record" | "recordscore", username: string, displayname: string, data: string[]) {
		this.text.push(`NOTIFY ${type} ${username} ${displayname} ${data.join(' ')}`);
	}

	shutdown() {
		this.text.push("SHUTDOWN");
	}

	ping(data: string) {
		this.text.push(`PING ${data}`);
	}

	pong(data: string) {
		this.text.push(`PONG ${data}`);
	}

	pingtime(time: number) {
		this.text.push(`PINGTIME ${time}`);
	}

	status(id: number, status: string) {
		this.text.push(`STATUS ${id} ${status}`);
	}

	color(id: number, hex: string) {
		this.text.push(`COLOR ${id} ${hex}`);
	}

	userInfo(user: WebchatUser) {
		this.userList.push(user);
	}

	group(group: { access: number, order: number, display: string, altDisplay: string }) {
		this.userGroupList.push(group);
	}

	info(info: WebchatInfo) {
		this.webchatInfo = info;
	}
	
	invalid() {
		this.text.push("INVALID");
	}

	getResult() {
		let result: string[] = [];

		// The INFO section
		if (this.webchatInfo !== null) {
			result.push(...this.webchatInfo.getResult());
		}

		// The friend list
		if (this.friendList.length !== 0) {
			result.push("FRIEND START");
			this.friendList.forEach(x => {
				result.push(`FRIEND NAME ${x.username} ${x.displayname}`);
			})
			result.push("FRIEND DONE");
		}

		// The block list
		if (this.blockList.length !== 0) {
			result.push("BLOCK START");
			this.blockList.forEach(x => {
				result.push(`BLOCK NAME ${x.username} ${x.displayname}`);
			})
			result.push("BLOCK DONE");
		}
		
		// The rest
		result.push(...this.text);

		// Now for the users section
		if (this.userList.length !== 0) {
			result.push("USER START");
			this.userGroupList.forEach(x => {
				result.push(`USER GROUP ${x.access} ${x.order} ${x.display} ${x.altDisplay}`);
			})
			this.userList.forEach(x => {
				result.push(`USER INFO ${x.username} ${x.access} ${x.statusId} ${x.displayname} ${x.color} ${x.flair} ${x.prefix} ${x.suffix}`);
			})
			result.push("USER DONE");
		}

		return result;
	}
}