import * as http from 'http';
import * as url from 'url';

const PORT = 1337;

http.createServer((req, res) => {
	let urlObject = new url.URL(req.url, 'http://localhost/');

	// I guess here check what the path is and act accordingly

	res.writeHead(200, {
		'Content-Type': 'text/plain'
	});
	res.end("Works.");
}).listen(PORT);