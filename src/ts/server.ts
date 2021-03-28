import * as http from 'http';
import * as url from 'url';
import * as net from 'net';
import * as fs from 'fs-extra'
import * as path from 'path'
import { Storage } from "./storage"
import { Marble } from './marble';
import { Player } from './player';
import { WebchatServer } from './webchatserver';

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
    func: (request: http.IncomingMessage) => any;

    // A list that specifies valid request methods
    methods: string[] = ["GET"];


    constructor(path: string, fn: (request: http.IncomingMessage) => any, methods: string[]) {
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
    response(resp: any, params: http.IncomingMessage, code: number = 200) {
        if (resp instanceof WebResponse) return this.tryPQify(resp, params);
        if (typeof resp === "string") return this.tryPQify(new WebResponse(resp, code, 'text/plain'), params);
        else if (resp instanceof Object) return this.tryPQify(new WebResponse(JSON.stringify(resp), code, 'application/json'), params);
        else return this.tryPQify(new WebResponse("Not Found", 404, 'text/plain'), params);
    }

    // Makes the response valid for pq to read
    tryPQify(resp: WebResponse, params: http.IncomingMessage) {
        let urlObject = new url.URL(params.url, 'http://localhost/');
        if (urlObject.searchParams.has("req")) {
            let reqid = urlObject.searchParams.get("req");
            resp.response = `pq ${reqid} ${resp.response}`;
            resp.headers.set("Content-Type", "text/plain");
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
            let urlObject = new url.URL(req.url, 'http://localhost/');

            // Generate a default response
            var retresponse = new WebResponse("Not Found", 404, 'text/plain');

            // Does the requested url have a valid WebRoute defined?
            if (paths.has(urlObject.pathname)) {
                // Get the route
                let route = paths.get(urlObject.pathname);
                // Are we using the valid request methods?
                if (route.methods.includes(req.method)) {

                    let gameOutdated = false;
                    // Do a game version check first, don't wanna waste computing power if your game was outdated anyway
                    if (urlObject.searchParams.has("version")) {
                        if (Number.parseInt(urlObject.searchParams.get("version")) < Storage.settings.gameVersion) {
                            retresponse = this.response({
                                success: false,
                                error: "Outdated game client"
                            }, req);
                            gameOutdated = true;
                        }
                    }

                    if (!gameOutdated) {
                        // Get the response from the web route handler function
                        let resp = route.func.call(this, req);
                        // Handle the different return values
                        if (typeof resp === "string")
                            retresponse = this.response(resp, req, 200);
                        else if (resp instanceof Object)
                            retresponse = this.response(resp, req, 200);
                    }
                }
            }

            // I guess here check what the path is and act accordingly
            // Write the header
            res.writeHead(retresponse.code, Object.fromEntries(retresponse.headers));
            // Now write the response
            res.end(retresponse.response);
        }).listen(port, hostname);
        console.log("PQ Online HTTP Server Started");
    }

    // SERVER

    @route("/api/Server/GetServerVersion.php", ["GET", "POST"])
    getServerVersion(req: http.IncomingMessage) {
        return Storage.gameVersionList;
    }

    @route("/api/Server/CheckPortOpen.php", ["GET", "POST"])
    checkPortOpen(req: http.IncomingMessage) {

        let urlObject = new url.URL(req.url, 'http://localhost/');
        if (!urlObject.searchParams.has("port"))
            return "ARGUMENT port";
        let port = Number.parseInt(urlObject.searchParams.get("port"));

        let conn = net.connect(port, req.socket.remoteAddress);
        
        let promises = [];

        let p1 = new Promise((resolve: (status: string) => void, reject) => {
            conn.on('error', () => {
                resolve("PORT FAILURE");
            });
        })

        let p2 = new Promise((resolve: (status: string) => void, reject) => {
            conn.on('timeout', () => {
                resolve("PORT FAILURE");
            });
        })

        let p3 = new Promise((resolve: (status: string) => void, reject) => {
            conn.on('connect', () => {
                // We can connect it yeah lets destroy it now
                conn.destroy();
                resolve("PORT SUCCESS");
            });
        })

        let obj = "PORT FAILURE";

        Promise.race([p1, p2, p3]).then(val => {
            obj = val;
        });
        return obj;
    }

    @route("/api/Server/GetServerStatus.php", ["GET", "POST"])
    getServerStatus(req: http.IncomingMessage) {
        let obj = {
            online: "true",
            version: Storage.settings.gameVersion,
            players: this.webchatServer.clients.size
        };
        return obj;
    }

    // MARBLE
    @route("/api/Marble/GetMarbleList.php", ["GET", "POST"])
    getMarbleList(req: http.IncomingMessage) {
        let obj = Marble.getMarbleList();
        return obj;
    }

    // PLAYER
    @route("/api/Player/RegisterUser.php", ["GET", "POST"])
    registerUser(req: http.IncomingMessage) {
        let urlObject = new url.URL(req.url, 'http://localhost/');
        if (!urlObject.searchParams.has("username"))
            return "ARGUMENT username";
        if (!urlObject.searchParams.has("password"))
            return "ARGUMENT password";
        if (!urlObject.searchParams.has("email"))
            return "ARGUMENT email";
        
        let obj = Player.registerUser(urlObject.searchParams.get("email"), urlObject.searchParams.get("username"), urlObject.searchParams.get("password"));
        return obj;
    }

    @route("/api/Player/CheckLogin.php", ["GET", "POST"])
    checkLogin(req: http.IncomingMessage) {
        let urlObject = new url.URL(req.url, 'http://localhost/');
        if (!urlObject.searchParams.has("username"))
            return "ARGUMENT username";
        if (!urlObject.searchParams.has("password"))
            return "ARGUMENT password";
        
        let obj = Player.checkLogin(urlObject.searchParams.get("username"), urlObject.searchParams.get("password"), req.socket.remoteAddress);
        return obj;
    }

    @route("/")
    test(req: http.IncomingMessage) {
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