// Response for Uptime Robot
const http = require("http");
http
    .createServer(function (request, response) {
        response.writeHead(200, { "Content-Type": "text/plain" });
        response.end("Discord bot is active now \n");
    })
    .listen(3000);

// Discord bot implements
const discord = require("discord.js");
const client = new discord.Client();

const c = 5;
const s = 0.2;
const f = 96;

client.on("ready", message => {
    console.log("bot is ready!");
});

client.on("message", message => {
    //if(message.isMemberMentioned(client.user))
    if (message.author != client.user) {
        let match;
        let face = 0;
        let dice = 0;
        let isCCB = false;
        const rollRe = /^([cC][cC][bB]|[0-9]+[dD][0-9]+) ?(?:<= ?)?([0-9]+)?(\s|$)/;
        const diceRe = /^([0-9]+)[dD]([0-9]+)/;
        //ccbとd表記のどちらかを拾う
        if ((match = rollRe.exec(message.content))) {
            let dMatch;
            if ((dMatch = diceRe.exec(match[0]))) {
                dice = parseInt(dMatch[1], 10);
                face = parseInt(dMatch[2], 10);
            } else {
                face = 100;
                dice = 1;
                isCCB = true;
            }
        }
        let rollResult = -1;
        for (let i = 0, l = dice; i < dice; i++) {
            rollResult += Math.ceil(Math.random() * face);
        }
        if (face != 0 && dice != 0) {
            let comparison;
            let compareStr;

            if (match[2] != "" && match[2] != void 0) {
                comparison = parseInt(match[2], 10);
                compareStr = " <= " + comparison + ";";
            } else {
                compareStr = "";
            }

            let header;
            let resultStr;

            if (comparison != void 0 && comparison != "") {
                if (isCCB) {
                    if (rollResult <= comparison) {
                        header = "\n```yaml\n";
                        resultStr = "♯成功";
                        if (rollResult <= Math.ceil(comparison * s)) {
                            if (rollResult <= 5) {
                                resultStr = "♯決定的成功/スペシャル";
                            } else {
                                resultStr = "♯スペシャル";
                            }
                        } else {
                            if (!(rollResult <= 5)) {
                                ("♯決定的成功");
                            }
                            if (!(rollResult <= 95)) {
                                resultStr += "(f)";
                            }
                        }
                    } else {
                        header = "\n```glsl\n";
                        resultStr = "#失敗";
                        if (rollResult > 95) {
                            resultStr = "#致命的失敗";
                        }
                        if (rollResult <= 5) {
                            resultStr += '(c)';
                        }
                    }
                } else {
                    if (rollResult <= comparison) {
                        header = "\n```yaml\n";
                        resultStr = "♯成功";
                    } else {
                        header = "\n```glsl\n";
                        resultStr = "#失敗";
                    }
                }
            } else {
                header = "```";
                resultStr = '';
                if (rollResult <= 5) {
                    resultStr = '#決定的成功';
                }
                if (rollResult > 95) {
                    resultStr = '#致命的失敗';
                }
            }
            message.reply(header + resultStr + " (" + dice + "d" + face + ") " + rollResult + compareStr + "```");
            return;
        }
    } else {
    }
});

if (process.env.DISCORD_BOT_TOKEN == undefined) {
    console.log("please set ENV: DISCORD_BOT_TOKEN");
    process.exit(0);
}

client.login(process.env.DISCORD_BOT_TOKEN);
