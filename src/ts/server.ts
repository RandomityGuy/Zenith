import * as http from 'http';
import * as url from 'url';
import * as net from 'net';
import * as fs from 'fs-extra'
import * as path from 'path'
import * as dgram from 'dgram';
import { Storage } from "./storage"
import { Marble } from './marble';
import { Player } from './player';
import { WebchatServer } from './webchatserver';
import { Util } from './util';
import { Mission } from './mission';
import { Egg } from './egg';
import { Score } from './score';
import { Achievement } from './achievement';
import { Replay } from './replay';
import { MatchScore, MatchTeam, Multiplayer } from './multiplayer';
import { AchievementEvent } from './achievement_event';

// A class to store incoming web request data
class WebRequest {
    request: http.IncomingMessage;
    url: url.URL;
    searchParams: url.URLSearchParams; // Prefer this over url.searchParams cause we gonna parse the werid PQ post data too
    data: string | null;

    constructor(request: http.IncomingMessage, data: string | null) {
        this.url = new url.URL(request.url, 'http://localhost/');
        this.searchParams = this.url.searchParams;
        this.request = request;
        this.data = data;
        if (request.headers['content-type'] !== undefined) {
            if (request.headers['content-type'] === 'application/x-www-form-urlencoded') {
                // Yeah now we parse the query string
                if (data !== null) {
                    let qstr = data.split('&').map(x => x.split('=').map(y => decodeURIComponent(y).replace(/\+/g,' ')));
                    qstr.forEach(x => {
                        if (this.searchParams.has(x[0])) {
                            this.searchParams.append(x[0], x[1])
                        } else {
                            this.searchParams.set(x[0], x[1]);
                        }
                    });
                }
            }
        }
    }
}

// A class that stores the response data that is to be sent back
class WebResponse {

    // The response as string
    response: string;

    // The response code
    code: number;

    // The response headers
    headers: Map<string, string>;

    constructor(response: string, code: number, contentType: string) {
        this.response = response;
        this.code = code;
        this.headers = new Map<string, string>();
        this.headers.set("Content-Type", contentType);
    }
}

// A class that stores the valid URL route data
class WebRoute {
    // The URL route
    path: string;

    // The function that handles the request
    func: (request: WebRequest) => any;

    // A list that specifies valid request methods
    methods: string[] = ["GET"];


    constructor(path: string, fn: (request: WebRequest) => any, methods: string[]) {
        this.path = path;
        this.func = fn;
        this.methods = methods;
    }
}

// Stores the valid web routes, sadly due to how typescript decorators work, I can't put this in LBServer
let paths: Map<string, WebRoute>= new Map<string, WebRoute>();

// A method decorator that marks a function as a valid handler for a URL route
function route(path: string, methods: string[] = ["GET"]) {
    return  (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        paths.set(path, new WebRoute(path, descriptor.value, methods));
    };
}

export class PQServer {

    webchatServer: WebchatServer

    constructor() {

    }

    // Handles the response generation for the route handler functions and does type coercion
    response(resp: any, params: WebRequest, code: number = 200) {
        if (resp instanceof WebResponse) return this.tryPQify(resp, params);
        if (typeof resp === "string") return this.tryPQify(new WebResponse(resp, code, 'text/plain'), params);
        else if (resp instanceof Object) return this.tryPQify(new WebResponse(JSON.stringify(resp), code, 'application/json'), params);
        else return this.tryPQify(new WebResponse("Not Found", 404, 'text/plain'), params);
    }

    // Makes the response valid for pq to read
    tryPQify(resp: WebResponse, params: WebRequest) {
        if (params.searchParams.has("req")) {
            if (!resp.response.startsWith("pq")) { // Don't try to PQify whats already PQified
                let reqid = params.searchParams.get("req");
                resp.response = `pq ${reqid} ${resp.response}`;
                resp.headers.set("Content-Type", "text/plain");
            }
            return resp;
        };
        return resp;
    }
    
    // Starts the server
    start() {
        Storage.initStorage();

        let hostsplit = Storage.settings.PQServer.split(':'); // Naive but works for now
        let hostname = hostsplit[0];
        let port = Number.parseInt(hostsplit[1]);

        console.log("Starting PQ Online Webchat Server");
        this.webchatServer = new WebchatServer();
        this.webchatServer.initialize();
        console.log("PQ Online Webchat Server Started");

        console.log("Starting PQ Online HTTP Server");

        http.createServer((req, res) => {
            if (req.method === 'POST') {
                let data: Buffer[] = [];
                req.on('data', chunk => data.push(chunk));
                req.on('end', () => {
                    let dataBuffer = Buffer.concat(data);
                    this.handleOnRequest(req, res, dataBuffer.toString());
                })
            } else {
                this.handleOnRequest(req, res, null);
            };
        }).listen(port, hostname);
        console.log("PQ Online HTTP Server Started");
    }

    handleOnRequest(req: http.IncomingMessage, res: http.ServerResponse, data: string) {
        let urlObject = new url.URL(req.url, 'http://localhost/');

        // Generate a default response
        var retresponse = new WebResponse("Not Found", 404, 'text/plain');

        console.log(`ATTEMPT ${urlObject.pathname}`);
        // Does the requested url have a valid WebRoute defined?
        if (paths.has(urlObject.pathname)) {
            // Get the route
            let route = paths.get(urlObject.pathname);
            console.log(`INCOMING ${route.path}`);
            // Are we using the valid request methods?
            if (route.methods.includes(req.method)) {

                let webreq = new WebRequest(req, data);
                let gameOutdated = false;
                // Do a game version check first, don't wanna waste computing power if your game was outdated anyway
                if (webreq.searchParams.has("version")) {
                    if (Number.parseInt(webreq.searchParams.get("version")) < Storage.settings.gameVersion) {
                        retresponse = this.response({
                            success: false,
                            error: "Outdated game client"
                        }, webreq);
                        gameOutdated = true;
                    }
                }

                if (!gameOutdated) {
                    // Get the response from the web route handler function
                    let resp = route.func.call(this, webreq);
                    // Handle the different return values
                    if (typeof resp === "string")
                        retresponse = this.response(resp, webreq, 200);
                    else if (resp instanceof Object)
                        retresponse = this.response(resp, webreq, 200);
                }

                console.log(`OUTGOING ${route.path}`);
            }
        }

        // I guess here check what the path is and act accordingly
        // Write the header
        res.writeHead(retresponse.code, Object.fromEntries(retresponse.headers));
        // Now write the response
        res.end(retresponse.response);
    }

    // SERVER

    @route("/api/Server/GetServerVersion.php", ["GET", "POST"])
    getServerVersion(req: WebRequest) {
        return Storage.gameVersionList;
    }

    @route("/api/Server/CheckPortOpen.php", ["GET", "POST"])
    checkPortOpen(req: WebRequest) {

        if (!req.searchParams.has("port"))
            return "ARGUMENT port";
        let port = Number.parseInt(req.searchParams.get("port"));

        let socket = dgram.createSocket('udp4');
        
        let promises = [];

        let p1 = new Promise((resolve: (status: string) => void, reject) => {
            socket.on('error', () => {
                resolve("PORT FAILURE");
            });
        })

        let p2 = new Promise((resolve: (status: string) => void, reject) => {
            socket.on('timeout', () => {
                resolve("PORT FAILURE");
            });
        })

        let p3 = new Promise((resolve: (status: string) => void, reject) => {
            socket.on('connect', () => {
                // We can connect it yeah lets destroy it now
                socket.disconnect();
                socket.close();
                resolve("PORT SUCCESS");
            });
        })

        socket.connect(port, req.request.socket.remoteAddress);

        let obj = "PORT FAILURE";

        Promise.race([p1, p2, p3]).then(val => {
            obj = val;
        });
        return obj;
    }

    @route("/api/Server/GetServerStatus.php", ["GET", "POST"])
    getServerStatus(req: WebRequest) {
        let obj = {
            online: "true",
            version: Storage.settings.gameVersion,
            players: this.webchatServer.clients.size
        };
        return obj;
    }

    // EGG
    @route("/api/Egg/GetEasterEggs.php", ["GET", "POST"])
    getEasterEggs(req: WebRequest) {
        if (!req.searchParams.has("username"))
            return "ARGUMENT username";
        if (!req.searchParams.has("key"))
            return "ARGUMENT key";
        let userId = Player.authenticate(req.searchParams.get("username"), req.searchParams.get("key"));
        if (userId === null) {
            return "FAILURE NEEDLOGIN";
        } else {
            let obj = Egg.getEasterEggs(userId);
            return obj;
        }
    }

    @route("/api/Egg/RecordEgg.php", ["GET", "POST"])
    recordEgg(req: WebRequest) {
        if (!req.searchParams.has("username"))
            return "ARGUMENT username";
        if (!req.searchParams.has("key"))
            return "ARGUMENT key";
        if (!req.searchParams.has("time"))
            return "ARGUMENT time";
        
        let missionId = this.getMissionId(req);
        if (typeof missionId === "string")
            return missionId; // Throw the error message
        
        let userId = Player.authenticate(req.searchParams.get("username"), req.searchParams.get("key"));
        if (userId === null) {
            return "FAILURE NEEDLOGIN";
        }
        let obj = Egg.recordEgg(userId, missionId, Number.parseInt(req.searchParams.get("time")));
        return obj;
    }

    // MARBLE
    @route("/api/Marble/GetMarbleList.php", ["GET", "POST"])
    getMarbleList(req: WebRequest) {
        let obj = Marble.getMarbleList();
        return obj;
    }

    @route("/api/Marble/GetCurrentMarble.php", ["GET", "POST"])
    getCurrentMarble(req: WebRequest) {
        if (!req.searchParams.has("username"))
            return "ARGUMENT username";
        if (!req.searchParams.has("key"))
            return "ARGUMENT key";
        let userId = Player.authenticate(req.searchParams.get("username"), req.searchParams.get("key"));
        if (userId === null) {
            return "FAILURE NEEDLOGIN";
        } else {
            let obj = Marble.getCurrentMarble(userId);
            return obj;
        }
    }

    @route("/api/Marble/RecordMarbleSelection.php", ["GET", "POST"])
    recordMarbleSelection(req: WebRequest) {
        if (!req.searchParams.has("username"))
            return "ARGUMENT username";
        if (!req.searchParams.has("key"))
            return "ARGUMENT key";
        if (!req.searchParams.has("marbleId"))
            return "ARGUMENT marbleId";
        let userId = Player.authenticate(req.searchParams.get("username"), req.searchParams.get("key"));
        if (userId === null) {
            return "FAILURE NEEDLOGIN";
        } else {
            let res = Marble.recordMarbleSelection(userId, Number.parseInt(req.searchParams.get("marbleId")));
            return res ? "SUCCESS" : "FAILURE";
        }
    }

    // ACHIEVEMENT
    @route("/api/Achievement/GetAchievementList.php", ["GET", "POST"])
    getAchievementList(req: WebRequest) {
        let obj = Achievement.getAchievementList();
        return obj;
    }

    @route("/api/Achievement/RecordAchievement.php", ["GET", "POST"])
    recordAchievement(req: WebRequest) {
        if (!req.searchParams.has("username"))
            return "ARGUMENT username";
        if (!req.searchParams.has("key"))
            return "ARGUMENT key";
        if (!req.searchParams.has("achievement"))
            return "ARGUMENT achievement";
        let userId = Player.authenticate(req.searchParams.get("username"), req.searchParams.get("key"));
        if (userId === null)
            return "FAILURE NEEDLOGIN";
        let obj = Achievement.recordAchievement(Number.parseInt(userId), Number.parseInt(req.searchParams.get("achievement")));
        return obj;
    }

    // SCORE
    @route("/api/Score/GetPersonalTopScoreList.php", ["GET", "POST"])
    getPersonalTopScoreList(req: WebRequest) {
        if (!req.searchParams.has("username"))
            return "ARGUMENT username";
        if (!req.searchParams.has("key"))
            return "ARGUMENT key";
        let userId = Player.authenticate(req.searchParams.get("username"), req.searchParams.get("key"));
        if (userId === null)
            return "FAILURE NEEDLOGIN";
        
        let scoreData = Score.getPersonalTopScoreList(userId);
        return scoreData;
    }

    @route("/api/Score/GetPersonalTopScores.php", ["GET", "POST"])
    getPersonalTopScores(req: WebRequest) {
        if (!req.searchParams.has("username"))
            return "ARGUMENT username";
        if (!req.searchParams.has("key"))
            return "ARGUMENT key";
        let userId = Player.authenticate(req.searchParams.get("username"), req.searchParams.get("key"));
        if (userId === null)
            return "FAILURE NEEDLOGIN";
        
        let missionId = this.getMissionId(req);
        if (typeof missionId === "string")
            return missionId; // Throw the error message
        
        let scoreData = Score.getPersonalTopScores(userId, missionId, 0);
        return scoreData;
    }

    @route("/api/Score/GetGlobalScores.php", ["GET", "POST"])
    @route("/api/Score/GetGlobalTopScores.php", ["GET", "POST"])
    getGlobalTopScores(req: WebRequest) {
        let missionId = this.getMissionId(req);
        if (typeof missionId === "string")
            return missionId; // Throw the error message
        
        let scoreData = Score.getGlobalTopScores(missionId, 0);
        return scoreData;
    }

    @route("/api/Score/RecordScore.php", ["GET", "POST"])
    recordScore(req: WebRequest) {
        if (!req.searchParams.has("username"))
            return "ARGUMENT username";
        if (!req.searchParams.has("key"))
            return "ARGUMENT key";
        if (!req.searchParams.has("modifiers"))
            return "ARGUMENT modifiers";
        if (!req.searchParams.has("score"))
            return "ARGUMENT score";
        if (!req.searchParams.has("scoreType"))
            return "ARGUMENT scoreType";
        if (!req.searchParams.has("totalBonus"))
            return "ARGUMENT totalBonus";
        if (!req.searchParams.has("gemCount"))
            return "ARGUMENT gemCount";
        if (!req.searchParams.has("gems1"))
            return "ARGUMENT gems1";
        if (!req.searchParams.has("gems2"))
            return "ARGUMENT gems2";
        if (!req.searchParams.has("gems5"))
            return "ARGUMENT gems5";
        if (!req.searchParams.has("gems10"))
            return "ARGUMENT gems10";
        
        let missionId = this.getMissionId(req);
        if (typeof missionId === "string")
            return missionId; // Throw the error message
        
        let userId = Player.authenticate(req.searchParams.get("username"), req.searchParams.get("key"));
        if (userId === null)
            return "FAILURE NEEDLOGIN";
        
        let results = Score.recordScore(userId, missionId, Number.parseInt(req.searchParams.get("score")), req.searchParams.get("scoreType"), Number.parseInt(req.searchParams.get("modifiers")), Number.parseInt(req.searchParams.get("totalBonus")), Number.parseInt(req.searchParams.get("gemCount")), Number.parseInt(req.searchParams.get("gems1")), Number.parseInt(req.searchParams.get("gems2")), Number.parseInt(req.searchParams.get("gems5")), Number.parseInt(req.searchParams.get("gems10")));

        if (req.searchParams.has("lapTime")) {
            Score.recordLapTime(userId, missionId, Number.parseInt(req.searchParams.get("lapTime")));
        }

        // Generate the result thing
        let resultset = [] as string[];
        if (results.success) {
            resultset.push(`SUCCESS ${results.rating}`);
        } else {
            resultset.push(`FAILURE`);
        }
        resultset.push(`RATING ${results.rating}`);
        resultset.push(`NEWRATING ${results.newRating}`);
        resultset.push(`POSITION ${results.rank}`);
        resultset.push(`DELTA ${results.delta}`);
        if (results.wr) {
            resultset.push("RECORDING");

            if (Storage.settings.show_wr_messages) {
                // Announce WR, BUT, check the score count
                let scores = Score.getGlobalTopScores(missionId, 0);
                if (scores.scores.length > Storage.settings.wr_player_count) {
                    this.webchatServer.notifyWR(userId, missionId, Number.parseInt(req.searchParams.get("score")), req.searchParams.get("scoreType"));
                }
            }
        }

        // Generate our custom result data
        let obj = [] as string[];
        resultset.forEach(x => {
            let rsp = this.response(x, req);
            obj.push(rsp.response);
        });
        let retObj = obj.join('\n');
        let response = this.response(retObj, req);
        response.response = retObj;
        return response;
    }

    @route("/api/Score/GetTopScoreModes.php", ["GET", "POST"])
    getTopScoreModes(req: WebRequest) {
        let missionId = this.getMissionId(req);
        if (typeof missionId === "string")
            return missionId; // Throw the error message
        
        let modeData = Score.getTopScoreModes(missionId);
        return modeData;
    }

    // PLAYER
    @route("/api/Player/RegisterUser.php", ["GET", "POST"])
    registerUser(req: WebRequest) {
        if (!req.searchParams.has("username"))
            return "ARGUMENT username";
        if (!req.searchParams.has("password"))
            return "ARGUMENT password";
        if (!req.searchParams.has("email"))
            return "ARGUMENT email";
        
        let obj = Player.registerUser(req.searchParams.get("email"), req.searchParams.get("username"), req.searchParams.get("password"));
        return obj;
    }

    @route("/api/Player/CheckLogin.php", ["GET", "POST"])
    checkLogin(req: WebRequest) {
        if (!req.searchParams.has("username"))
            return "ARGUMENT username";
        if (!req.searchParams.has("password"))
            return "ARGUMENT password";
        
        let obj = Player.checkLogin(req.searchParams.get("username"), req.searchParams.get("password"), req.request.socket.remoteAddress);
        return obj;
    }

    @route("/api/Player/GetTopPlayers.php", ["GET", "POST"])
    getTopPlayers(req: WebRequest) {
        let obj = Player.getTopPlayers();
        return obj;
    }

    @route("/api/Player/GetPlayerAvatar.php", ["GET", "POST"])
    getPlayerAvatar(req: WebRequest) {
        if (!req.searchParams.has("user"))
            return "ARGUMENT user";
        let user = req.searchParams.get("user");
        let obj = Player.getPlayerAvatar(user);
        obj.filename = `avatar${user}.png`;
        return obj;
    }

    @route("/api/Player/GetPlayerProfileInfo.php", ["GET", "POST"])
    getPlayerProfileInfo(req: WebRequest) {
        if (!req.searchParams.has("user"))
            return "ARGUMENT user";
        let user = req.searchParams.get("user");
        return Player.getPlayerProfileInfo(user);
    }

    @route("/api/Player/GetPlayerStats.php", ["GET", "POST"])
    getPlayerStats(req: WebRequest) {
        let targetUser = "";
        if (!req.searchParams.has("username"))
            return "ARGUMENT username";
        else {
            targetUser = req.searchParams.get("username");
        }
        if (!req.searchParams.has("key"))
            return "ARGUMENT key";
        if (req.searchParams.has("user"))
            targetUser = req.searchParams.get("user");
        
        let userId = Player.authenticate(req.searchParams.get("username"), req.searchParams.get("key"));
        if (userId === null)
            return "FAILURE NEEDLOGIN";
        
        let statData = Player.getPlayerStats(targetUser);
        return statData;
    }

    @route("/api/Player/GetPlayerAchievements.php", ["GET", "POST"])
    getPlayerAchievements(req: WebRequest) {
        let targetUser = "";
        if (!req.searchParams.has("username"))
            return "ARGUMENT username";
        else {
            targetUser = req.searchParams.get("username");
        }
        if (!req.searchParams.has("key"))
            return "ARGUMENT key";
        if (req.searchParams.has("user"))
            targetUser = req.searchParams.get("user");
        
        let userId = Player.authenticate(req.searchParams.get("username"), req.searchParams.get("key"));
        if (userId === null)
            return "FAILURE NEEDLOGIN";
        
        let achievementData = Player.getPlayerAchievements(targetUser);
        return achievementData;
    }

    // MISSION
    @route("/api/Mission/GetMissionList.php", ["GET", "POST"])
    getMissionList(req: WebRequest) {
        if (!req.searchParams.has("gameType"))
            return "ARGUMENT gameType";
        let obj = Mission.getMissionList(req.searchParams.get("gameType") as ("Single Player" | "Multiplayer"));
        return obj;
    }

    @route("/api/Mission/RateMission.php", ["GET", "POST"])
    rateMission(req: WebRequest) {
        if (!req.searchParams.has("username"))
            return "ARGUMENT username";
        if (!req.searchParams.has("key"))
            return "ARGUMENT key";
        if (!req.searchParams.has("rating"))
            return "ARGUMENT rating";
        
        let missionId = this.getMissionId(req);
        if (typeof missionId === "string")
            return missionId; // Throw the error message
        
        
        let userId = Player.authenticate(req.searchParams.get("username"), req.searchParams.get("key"));
        if (userId === null)
            return "FAILURE NEEDLOGIN";
        
        
        let obj = Mission.rateMission(userId, missionId, Number.parseInt(req.searchParams.get("rating")));
        return obj;
    }

    // MULTIPLAYER
    @route("/api/Multiplayer/VerifyPlayer.php", ["GET", "POST"])
    verifyPlayer(req: WebRequest) {
        if (!req.searchParams.has("username"))
            return "ARGUMENT username";
        if (!req.searchParams.has("key"))
            return "ARGUMENT key";
        if (!req.searchParams.has("session"))
            return "ARGUMENT session";
        let userId = Player.authenticate(req.searchParams.get("username"), req.searchParams.get("key"));
        if (userId === null)
            return {
                verification: "FAIL"
            }
        
        let session = req.searchParams.get("session");
        if (this.webchatServer.verifyPlayerSession(req.searchParams.get("username"), req.searchParams.get("session"))) {
            let data = Storage.query("SELECT rating_mp, name, username, id FROM user_ratings, users WHERE user_ratings.user_id = users.id AND users.id = @userId;").get({ userId: userId });
            let obj = {
                id: data.id,
                username: data.username,
                display: data.name,
                rating: data.rating_mp,
                verification: "SUCCESS"
            }
            return obj;
        } else {
            return {
                verification: "BADSESSION"
            };
        }
    }

    @route("/api/Multiplayer/RecordMatch.php", ["GET", "POST"])
    recordMatch(req: WebRequest) {
        if (!req.searchParams.has("username"))
            return "ARGUMENT username";
        if (!req.searchParams.has("key"))
            return "ARGUMENT key";
        if (!req.searchParams.has("players"))
            return "ARGUMENT players";
        if (!req.searchParams.has("port"))
            return "ARGUMENT port";
        if (!req.searchParams.has("scoreType"))
            return "ARGUMENT scoreType";
        if (!req.searchParams.has("totalBonus"))
            return "ARGUMENT totalBonus"
        if (!req.searchParams.has("modes"))
            return "ARGUMENT modes";
        let teamMode = 0;
        if (req.searchParams.has("teammode"))
            teamMode = Number.parseInt(req.searchParams.get("teammode"));
        if (teamMode) {
            if (!req.searchParams.has("teams[number][]"))
                return "ARGUMENT teams[number][]";
            if (!req.searchParams.has("teams[name][]"))
                return "ARGUMENT teams[name][]";
            if (!req.searchParams.has("teams[color][]"))
                return "ARGUMENT teams[color][]";
        }
        if (!req.searchParams.has("scores[username][]"))
            return "ARGUMENT scores[username][]";
        if (!req.searchParams.has("scores[score][]"))
            return "ARGUMENT scores[score][]";
        if (!req.searchParams.has("scores[place][]"))
            return "ARGUMENT scores[place][]";
        if (!req.searchParams.has("scores[host][]"))
            return "ARGUMENT scores[host][]";
        if (!req.searchParams.has("scores[guest][]"))
            return "ARGUMENT scores[guest][]";
        if (!req.searchParams.has("scores[marble][]"))
            return "ARGUMENT scores[marble][]";
        if (!req.searchParams.has("scores[timePercent][]"))
            return "ARGUMENT scores[timePercent][]";
        if (!req.searchParams.has("scores[disconnect][]"))
            return "ARGUMENT scores[disconnect][]";
        if (!req.searchParams.has("scores[gemCount][]"))
            return "ARGUMENT scores[gemCount][]";
        if (!req.searchParams.has("scores[gems1][]"))
            return "ARGUMENT scores[gems1][]";
        if (!req.searchParams.has("scores[gems2][]"))
            return "ARGUMENT scores[gems2][]";
        if (!req.searchParams.has("scores[gems5][]"))
            return "ARGUMENT scores[gems5][]";
        if (!req.searchParams.has("scores[gems10][]"))
            return "ARGUMENT scores[gems10][]";
        if (!req.searchParams.has("scores[team][]"))
            return "ARGUMENT scores[team][]";
        
        
        let missionId = this.getMissionId(req);
        if (typeof missionId === "string")
            return missionId; // Throw the error message
        
        
        let userId = Player.authenticate(req.searchParams.get("username"), req.searchParams.get("key"));
        if (userId === null)
            return "FAILURE NEEDLOGIN";
        
        let teams = [] as MatchTeam[];
        if (teamMode) {
            let teamNumbers = req.searchParams.getAll("teams[number][]");
            let teamNames = req.searchParams.getAll("teams[name][]");
            let teamColors = req.searchParams.getAll("teams[color][]");

            for (let i = 0; i < teamNumbers.length; i++) {
                teams.push({ id: Number.parseInt(teamNumbers[i]), name: teamNames[i], color: teamColors[i] });
            }
        }
        let scoreUsernames = req.searchParams.getAll("scores[username][]");
        let scoreScores = req.searchParams.getAll("scores[score][]");
        let scorePlaces = req.searchParams.getAll("scores[place][]");
        let scoreHosts = req.searchParams.getAll("scores[host][]");
        let scoreGuests = req.searchParams.getAll("scores[guest][]");
        let scoreMarbles = req.searchParams.getAll("scores[marble][]");
        let scoreTimePercents = req.searchParams.getAll("scores[timePercent][]");
        let scoreDisconnects = req.searchParams.getAll("scores[disconnect][]");
        let scoreGemCounts = req.searchParams.getAll("scores[gemCount][]");
        let scoreGems1 = req.searchParams.getAll("scores[gems1][]");
        let scoreGems2 = req.searchParams.getAll("scores[gems2][]");
        let scoreGems5 = req.searchParams.getAll("scores[gems5][]");
        let scoreGems10 = req.searchParams.getAll("scores[gems10][]");
        let scoreTeams = req.searchParams.getAll("scores[team][]");
        let scoreSnowballs: string[] = [];
        if (req.searchParams.has("scores[snowballs][]")) {
            scoreSnowballs = req.searchParams.getAll("scores[snowballs][]");
        }
        let scoreSnowballHits: string[] = [];
        if (req.searchParams.has("scores[snowballhits][]")) {
            scoreSnowballHits = req.searchParams.getAll("scores[snowballhits][]");
        }

        let scoreDatas: MatchScore[] = [];

        for (let i = 0; i < scoreUsernames.length; i++) {
            let scoreData: MatchScore = {
                username: scoreUsernames[i],
                score: Number.parseInt(scoreScores[i]),
                place: Number.parseInt(scorePlaces[i]),
                host: Number.parseInt(scoreHosts[i]),
                guest: Number.parseInt(scoreGuests[i]),
                marble: Number.parseInt(scoreMarbles[i]),
                timePercent: Number.parseInt(scoreTimePercents[i]),
                disconnect: Number.parseInt(scoreDisconnects[i]),
                gemCount: Number.parseInt(scoreGemCounts[i]),
                gems1: Number.parseInt(scoreGems1[i]),
                gems2: Number.parseInt(scoreGems2[i]),
                gems5: Number.parseInt(scoreGems5[i]),
                gems10: Number.parseInt(scoreGems10[i]),
                team: Number.parseInt(scoreTeams[i]),
                snowballs: scoreSnowballs === [] ? null : Number.parseInt(scoreSnowballs[i]),
                snowballHits: scoreSnowballHits === [] ? null : Number.parseInt(scoreSnowballHits[i])
            }

            scoreDatas.push(scoreData);
        }

        let extraModes = "";
        if (req.searchParams.has('extraModes'))
            extraModes = req.searchParams.get('extraModes');

        let obj = Multiplayer.recordMatch(userId, missionId, req.request.socket.remoteAddress, Number.parseInt(req.searchParams.get("port")), req.searchParams.get("scoreType"), Number.parseInt(req.searchParams.get("totalBonus")), req.searchParams.get("modes"), extraModes, teams, scoreDatas);
        return obj;
    }

    // CHAT
    @route("/api/Chat/GetFlairBitmap.php", ["GET", "POST"])
    getFlairBitmap(req: WebRequest) {

        // Maybe cache this if feasible?

        if (!req.searchParams.has("flair"))
            return "ARGUMENT flair";
        let flairfile = req.searchParams.get('flair') + ".png";
        if (fs.pathExistsSync(path.join(__dirname, 'storage', ' flairs', flairfile))) {
            return Util.responseAsFile(flairfile);
        } else {
            return {
                error: "Flair not found"
            }
        }
    }

    // EVENT
    @route("/api/Event/RecordEventTrigger.php", ["GET", "POST"])
    recordEventTrigger(req: WebRequest) {
        if (!req.searchParams.has("username"))
            return "ARGUMENT username";
        if (!req.searchParams.has("key"))
            return "ARGUMENT key";
        if (!req.searchParams.has("trigger"))
            return "ARGUMENT trigger";
        
        let userId = Player.authenticate(req.searchParams.get("username"), req.searchParams.get("key"));
        if (userId === null)
            return "FAILURE NEEDLOGIN";
        
        let trigger = Number.parseInt(req.searchParams.get("trigger"));
        
        // Yeah so idk how all of this works, its just a big gamble. Lets get a count of times the trigger was triggered

        let triggerCount = Storage.query('SELECT COUNT(*) AS triggerCount FROM user_event_triggers WHERE user_id=@userId AND "trigger"=@trigger;').get({ userId: userId, trigger: trigger });
        triggerCount = triggerCount.triggerCount;

        
        Storage.query("INSERT INTO user_event_triggers VALUES(@userId,@trigger,DATETIME('now','localtime'));").run({ userId: userId, trigger: trigger });
        
        // Do this gay shit
        let userName = Player.getUsername(userId);
        let topScores = Score.getPersonalTopScoreList(userId);
        let achievementList = Player.getPlayerAchievements(userName);
        AchievementEvent.updateEventAchievements(userId, achievementList.achievements, topScores);
        Achievement.checkTitleFlairUnlocks(userId, achievementList.achievements, topScores);
        
        let obj = triggerCount;
        return obj;
    }

    // REPLAY
    @route("/api/Replay/GetReplay.php", ["GET", "POST"])
    getReplay(req: WebRequest) {
        if (!req.searchParams.has("username"))
            return "ARGUMENT username";
        if (!req.searchParams.has("key"))
            return "ARGUMENT key";
        
        let replayType: "Replay" | "Egg" = "Replay";
        if (req.searchParams.has("type"))
            replayType = req.searchParams.get("type") === "Egg" ? "Egg" : "Replay";
        
        let missionId = this.getMissionId(req);
        if (typeof missionId === "string")
            return missionId; // Throw the error message
        
        let userId = Player.authenticate(req.searchParams.get("username"), req.searchParams.get("key"));
        if (userId === null)
            return "FAILURE NEEDLOGIN";
        
        let obj = Replay.getReplay(missionId, replayType);
        return obj;
    }

    @route("/api/Replay/RecordReplay.php", ["GET", "POST"])
    recordReplay(req: WebRequest) {
        if (!req.searchParams.has("username"))
            return "ARGUMENT username";
        if (!req.searchParams.has("key"))
            return "ARGUMENT key";
        if (!req.searchParams.get("conts"))
            return "ARGUMENT conts";
        
        let replayType: "Replay" | "Egg" = "Replay";
        if (req.searchParams.has("type"))
            replayType = req.searchParams.get("type") === "Egg" ? "Egg" : "Replay";
        
        let missionId = this.getMissionId(req);
        if (typeof missionId === "string")
            return missionId; // Throw the error message
        
        let userId = Player.authenticate(req.searchParams.get("username"), req.searchParams.get("key"));
        if (userId === null)
            return "FAILURE NEEDLOGIN";
        
        let obj = Replay.recordReplay(missionId, replayType, req.searchParams.get("conts"));
        return obj;
    }

    // METRICS
    @route("/api/Player/RecordMetrics.php", ["GET", "POST"])
    @route("/api/Metrics/RecordGraphicsMetrics.php", ["GET", "POST"])
    recordGraphicsMetrics(req: WebRequest) {
        if (!req.searchParams.has("username"))
            return "ARGUMENT username";
        if (!req.searchParams.has("key"))
            return "ARGUMENT key";
        let userId = Player.authenticate(req.searchParams.get("username"), req.searchParams.get("key"));
        if (userId === null)
            return "FAILURE";
        
        let jdict = new Map<string, string[]>();
        for (const key of req.searchParams.keys()) {
            if (key === "username" || key === "key")
                continue;
            
            jdict.set(key, req.searchParams.getAll(key));
        };

        let metricsString = JSON.stringify(Object.fromEntries(jdict));

        Storage.query("INSERT INTO metrics(user_id,metrics) VALUES(@userId,@metrics);").run({ userId: userId, metrics: metricsString });
        
        return "SUCCESS";
    }

    // Helper function to retrieve mission ids
    getMissionId(req: WebRequest) {
        let hasMissionId = req.searchParams.has("missionId");
        if (hasMissionId) {
            return Number.parseInt(req.searchParams.get("missionId"));
        } else {
            // Yeah now we do the alternate thing for custom missions
            if (!req.searchParams.has("missionFile"))
                return "ARGUMENT missionFile";
            if (!req.searchParams.has("missionName"))
                return "ARGUMENT missionName";
            if (!req.searchParams.has("missionHash"))
                return "ARGUMENT missionHash";
            if (!req.searchParams.has("missionGamemode"))
                return "ARGUMENT missionGamemode";
            if (!req.searchParams.has("difficultyId"))
                return "ARGUMENT difficultyId";
            
            return Mission.getMissionId(req.searchParams.get("missionFile"), decodeURIComponent(req.searchParams.get("missionName")).replace(/\+/g,' '), req.searchParams.get("missionHash"), req.searchParams.get("missionGamemode"), Number.parseInt(req.searchParams.get("difficultyId")));
        }
    }

    @route("/")
    test(req: WebRequest) {
        Marble.getMarbleList();
        let obj = {
            jobject: [{
                property: "Key",
                list: [
                    "Item1"
                ]
            }],
            jobj2: "Test"
        };
        return obj;
    }

}