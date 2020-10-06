
const fs = require("fs");
const data = "Hello Node";
fs.writeFile("file1.txt", data, (err) => {
    if (err) throw err;
    console.log('正常に書き込み完了');
});
const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.write('<h1>Hello World</h1>');
    res.end('Hello World\n');
}).listen(3000);
//const port = 8080;
//server.listen(port);
console.log('Server listen on port ' + 3000);

