import * as http from 'http';
import * as url from 'url';
import { initDatabase } from './database';
import { Marble } from './marble';
import { Player } from './player';
import { Settings } from './settings';

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

export class LBServer {

    // The server port
    port: number = 1337;

    constructor() {

    }

    // Handles the response generation for the route handler functions and does type coercion
    response(resp: any, code: number = 200) {
        if (resp instanceof WebResponse) return resp;
        if (typeof resp === "string") return new WebResponse(resp, code, 'text/plain');
        else if (resp instanceof Object) return new WebResponse(JSON.stringify(resp), code, 'application/json');
        else return new WebResponse("Not Found", 404, 'text/plain');
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
        initDatabase();
        Settings.initSettings();
        http.createServer((req, res) => {
            let urlObject = new url.URL(req.url, 'http://localhost/');
            console.log(urlObject);

            // Generate a default response
            var retresponse = new WebResponse("Not Found", 404, 'text/plain');

            // Does the requested url have a valid WebRoute defined?
            if (paths.has(urlObject.pathname)) {
                // Get the route
                let route = paths.get(urlObject.pathname);
                // Are we using the valid request methods?
                if (route.methods.includes(req.method)) {
                    // Get the response from the web route handler function
                    let resp = route.func.call(this, req);
                    // Handle the different return values
                    if (typeof resp === "string")
                        retresponse = this.response(resp, 200);
                    else if (resp instanceof Array)
                        retresponse = this.response(resp[0], resp[1]);
                    else if (resp instanceof Object)
                        retresponse = this.response(resp, 200);
                }
            }

            // I guess here check what the path is and act accordingly
            // Write the header
            res.writeHead(retresponse.code, Object.fromEntries(retresponse.headers));
            // Now write the response
            res.end(retresponse.response);
        }).listen(this.port);
    }

    @route("/api/Marble/GetMarbleList.php", ["GET", "POST"])
    getMarbleList(req: http.IncomingMessage) {
        let obj = Marble.getMarbleList();
        let resp = this.response(obj);
        return this.tryPQify(resp, req);
    }

    @route("/api/Player/RegisterUser.php", ["GET", "POST"])
    registerUser(req: http.IncomingMessage) {
        let urlObject = new url.URL(req.url, 'http://localhost/');
        if (!urlObject.searchParams.has("username"))
            return this.tryPQify(this.response("ARGUMENT username"), req);
        if (!urlObject.searchParams.has("password"))
            return this.tryPQify(this.response("ARGUMENT password"), req);
        if (!urlObject.searchParams.has("email"))
            return this.tryPQify(this.response("ARGUMENT email"), req);
        
        let obj = Player.registerUser(urlObject.searchParams.get("email"), urlObject.searchParams.get("username"), urlObject.searchParams.get("password"));
        let resp = this.response(obj);
        return this.tryPQify(resp, req);
    }

    @route("/api/Player/CheckLogin.php", ["GET", "POST"])
    checkLogin(req: http.IncomingMessage) {
        let urlObject = new url.URL(req.url, 'http://localhost/');
        if (!urlObject.searchParams.has("username"))
            return this.tryPQify(this.response("ARGUMENT username"), req);
        if (!urlObject.searchParams.has("password"))
            return this.tryPQify(this.response("ARGUMENT password"), req);
        
        let obj = Player.checkLogin(urlObject.searchParams.get("username"), urlObject.searchParams.get("password"), req.socket.remoteAddress);
        let resp = this.response(obj);
        return this.tryPQify(resp, req);
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
        let resp = this.response(obj);
        return resp;
    }

}