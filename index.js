const http = require("http");

const server = http.createServer();
server.on("request", doRequest);
var fs = require("fs");

function doRequest(req, res) {
  var url = req.url;
  let type = "text/html";
  let file = "./Untitled-1.html";
  switch (url) {
    case "/":
      break;
    case "/Untitled-1.js":
      file = "./Untitled-1.js";
      type = "text/javascript";
      break;
    case "/ncmb.min.js":
      file = "./ncmb.min.js";
      type = "text/javascript";
      break;
    case "/Untitled-1.css":
      file = "./Untitled-1.css";
      type = "text/css";
      break;
    // case "/favicon.ico":
    //   file="https://glitch.com/edit/favicon-app.ico";
    //   type = "image/vx-icon";
    //   break;
    default:
      console.log("url:" + url);
      break;
  }
  fs.readFile(file, "UTF-8", function(err, data) {
    res.writeHead(200, { "Content-Type": type });
    res.write(data);
    res.end();
  });
}
server.listen(3000);
//const port = 8080;
//server.listen(port);
console.log("Server listen on port " + 3000);
