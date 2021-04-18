
// Based on: Node.js for Front-End Developers by Garann Means (p. 9-10)

const DIR = 'test-site'
const PORT = 20582;
const URL = "127.0.0.1";
const SEP = '\\';

var http = require("http");
var path = require("path");
var fs = require("fs");

console.log("Starting web server at " + URL + ":" + PORT);

const server = http.createServer((req, res) => {
    //Redirect empty url to index.html
    var filename = req.url || '/';
    if (filename == '/' || filename == '' || filename == undefined) filename = "/index.html";
    //Redirect all urls to look in the served directory
    if (!filename.includes(DIR)) filename = '/' + DIR + filename;
    var localPath = __dirname;
    localPath += filename;
    localPath = localPath.replace("/", SEP);

    fs.exists(localPath, function(exists) {
        if(exists) {
            console.log("Serving file: " + localPath);
            getFile(localPath, res);
        } else {
            console.log("File not found: " + localPath);
            res.writeHead(404);
            res.end();
        }
    });
}).listen(PORT, URL);


function getFile(localPath, res) {
	fs.readFile(localPath, function(err, contents) {
		if(!err) {
			res.setHeader("Content-Length", contents.length);
			res.setHeader("Content-Type", 'text');
			res.statusCode = 200;
			res.end(contents);
		} else {
			res.writeHead(500);
			res.end();
		}
	});
}
