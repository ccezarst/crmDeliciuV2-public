const winston = require("winston");
const discord = require("./discord");
var _ = require('lodash');
const fs = require('fs');
function serializeObjects(obj) {
    if (typeof obj === "object") {
        return JSON.stringify(obj, undefined, 1)
    } else {
        return obj
    }
}
module.exports = {
    announceHTTP: async function (message, req, meta) {
        if (req != null && req != undefined) {
            backLogger.log("http", "-" + req.ip + "- " + serializeObjects(message), _.merge({
                meta: {
                    caller_ip: req.ip,
                    user: req.user,
                    token: req.token,
                    req_id: (req.handler != undefined) ? req.handler.id : undefined,
                }
            },meta)
            );
            await discord.sendInfo("-" + req.ip + "- " + serializeObjects(message))
        } else {
            backLogger.log("http",serializeObjects(message), meta);
            await discord.sendInfo(serializeObjects(message))
        }
    },
    user: async function (message, req, meta) {
        if (req != null && req != undefined) {
            backLogger.log("user", "-" + req.ip + "- " + serializeObjects(message), _.merge({
                meta: {
                    caller_ip: req.ip,
                    user: req.user,
                    token: req.token,
                    req_id: (req.handler != undefined) ? req.handler.id : undefined,
                }
            },meta)
            );
            await discord.sendInfo("-" + req.ip + "- " + serializeObjects(message))
        } else {
            backLogger.log("user",serializeObjects(message), meta);
            await discord.sendInfo(serializeObjects(message))
        }
    },
    output: async function (message, req, meta) {
        if (req != null && req != undefined) {
            backLogger.log("output", "-" + req.ip + "- " + serializeObjects(message), _.merge({
                meta: {
                    caller_ip: req.ip,
                    user: req.user,
                    token: req.token,
                    req_id: (req.handler != undefined) ? req.handler.id : undefined,
                }
            },meta)
            );
            await discord.sendInfo("-" + req.ip + "- " + serializeObjects(message))
        } else {
            backLogger.log("output",serializeObjects(message), meta);
            await discord.sendInfo(serializeObjects(message))
        }
    },
    warn: async function (message, req, meta) {
        if (req != null && req != undefined) {
           // backLogger.log({ level: "warn", message: "-" + req.ip + "- " + message });
            backLogger.log("warn", "-" + req.ip + "- " + serializeObjects(message), Object.assign({}, {
                caller_ip: req.ip,
                user: req.user,
                token: req.token,
                req_id: (req.handler != undefined) ? req.handler.id : undefined
            }, meta)  );
            await discord.sendInfo("-" + req.ip + "- " + serializeObjects(message))
        } else {
            //backLogger.log({ level: "warn", serializeObjects(message): serializeObjects(message) });
            backLogger.log("warn",serializeObjects(message), meta);
            await discord.sendInfo(serializeObjects(message))
        }
    },
    // profile: async function (profile) {
    //     if (profile != null && profile != undefined) {
    //         backLogger.profile(profile);
    //     } else {
    //         console.log("sugi putulica :)")
    //     }
    // },
    major_event: async function (message, req, meta) {
        if (req != null && req != undefined) {
            //backLogger.log({ level: "major_event", message: "-" + req.ip + "- " + message });
            backLogger.log("major_event", "-" + req.ip + "- " + serializeObjects(message), Object.assign({}, {
                caller_ip: req.ip,
                user: req.user,
                token: req.token,
                req_id: (req.handler != undefined) ? req.handler.id : undefined
            }, meta)  );
            await discord.sendInfo("-" + req.ip + "- " + serializeObjects(message))
        } else {
            backLogger.log("major_event",serializeObjects(message), meta);
            //backLogger.log({ level: "major_event", serializeObjects(message): serializeObjects(message) });
            await discord.sendInfo(serializeObjects(message))
        }
    },
    request: async function (message, req, meta) {
        if (req != null && req != undefined) {
            //backLogger.log({ level: "request", message: "-" + req.ip + "- " + message });
            backLogger.log("request", "-" + req.ip + "- " + serializeObjects(message), Object.assign({}, {
                caller_ip: req.ip,
                user: req.user,
                token: req.token,
                req_id: (req.handler != undefined) ? req.handler.id : undefined
            }, meta)  );
            await discord.sendInfo("-" + req.ip + "- " + serializeObjects(message))
        } else {
            backLogger.log("request", serializeObjects(message), meta);
            //backLogger.log({ level: "request", message: message });
            await discord.sendInfo(serializeObjects(message))
        }
    },
    announce: async function (message, req, meta) {
        if (req != null && req != undefined) {
            //backLogger.log({ level: "info", serializeObjects(message): "-" + req.ip + "- " + serializeObjects(message), meta });
            backLogger.log("info", "-" + req.ip + "- " + serializeObjects(message), Object.assign({}, {
                caller_ip: req.ip,
                user: req.user,
                token: req.token,
                req_id: (req.handler != undefined) ? req.handler.id : undefined
            }, meta)  );
            await discord.sendInfo("-" + req.ip + "- " + serializeObjects(message))
        } else {
            //backLogger.log({ level: "info", serializeObjects(message): serializeObjects(message) });
            backLogger.log("info",serializeObjects(message), meta);
            await discord.sendInfo(serializeObjects(message))
        }
    },
    announceDynamic: async function (whatToDo, message, req, meta) {
        if (whatToDo) {
            await this.announce(serializeObjects(message), req, meta)
        } else {
            await this.announceError(serializeObjects(message), req, meta)
        }
    },
    announceError: async function (message, req, meta) {
        if (req != null && req != undefined) {
            let stackLines = ""
            if (message instanceof Error) {
                // Use Error object to capture the call stack
                const callerStack = message.stack;
                // Split the stack trace into lines
                stackLines = callerStack.split('\n');
                // The second line usually contains the caller information
                // backLogger.log({ level: "error", message: "-" + req.ip + "- " + message });
                // backLogger.log({ level: "error", message: callerLine })
                backLogger.log("error", "-" + req.ip + "- " + serializeObjects(message), meta);
                backLogger.log("error", stackLines, meta);
                await discord.sendError("-" + req.ip + "- " + serializeObjects(message))
                await discord.sendError(stackLines)
            } else {
                // backLogger.log({ level: "error", message: "-" + req.ip + "- " + message });
                // backLogger.log({ level: "error", message: callerLine })
                backLogger.log("error", "-" + req.ip + "- " + serializeObjects(message), meta);
                await discord.sendError("-" + req.ip + "- " + serializeObjects(message))
            }
            req.handler.markErrored({
                "caller_ip": req.ip,
                "stackLines": stackLines,
                "error": serializeObjects(message),
                "req_id": (req.handler != undefined) ? req.handler.id : undefined,
                "token": req.token,
                "user": req.user
            });
        } else {
            if (message instanceof Error) {
                // Use Error object to capture the call stack
                const callerStack = message.stack;
                // Split the stack trace into lines
                stackLines = callerStack.split('\n');
                // The second line usually contains the caller information
                // backLogger.log({ level: "error", message: "-" + req.ip + "- " + message });
                // backLogger.log({ level: "error", message: callerLine })
                backLogger.log("error", stackLines, meta);
                await discord.sendError(stackLines)
            } else {
                // backLogger.log({ level: "error", message: "-" + req.ip + "- " + message });
                // backLogger.log({ level: "error", message: callerLine })
                backLogger.log("error", serializeObjects(message), meta);
                await discord.sendError(serializeObjects(message))
            }
        }
    },
    logObject: function (filename, jsObj) {
        const dir = getLogDir();
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        const jsonStr = JSON.stringify(jsObj, null, 2);
        fs.writeFileSync(dir + filename + '.json', jsonStr, 'utf8');
    },
    logReqHandler: function (reqID, jsObj) {
        try {
            const dir = getLogDirFromEpoch(reqID.split("-")[0]);
            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir, { recursive: true });
            }
            const jsonStr = JSON.stringify(jsObj, null, 2);
            fs.writeFileSync(dir + reqID + '-REQ.json', jsonStr, 'utf8');
        } catch (err) {
            console.log(jsObj)
            this.announceError(err)
        }

    },
    deleteReqHandler: function (reqID) {
        const dir = getLogDirFromEpoch(reqID.split("-")[0]);
        if (fs.existsSync(dir + reqID + "-REQ.json")) {
            deleteFile(dir + reqID + "-REQ.json");
        }
    },
    getReqHandler: function (reqID) { // time consuming operation, should not be used often
        const proccessCreation = reqID.split("-")[0]
        const dir = getLogDirFromEpoch(proccessCreation)
        let path = dir + reqID + "-REQ.json"
        if (fs.existsSync(path)) {
            const data = fs.readFileSync(path, 'utf8');
            return JSON.parse(data);
        } else {
            return undefined
        }
    },


    logReqHandlerResponse: function (reqID, jsObj) {
        try {
            const dir = getLogDirFromEpoch(reqID.split("-")[0]);
            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir, { recursive: true });
            }
            const jsonStr = JSON.stringify(jsObj, null, 2);
            fs.writeFileSync(dir + reqID + '-RES.json', jsonStr, 'utf8');
        } catch (err) {
            console.log(jsObj)
            this.announceError(err)
        }

    },
    deleteReqHandlerResponse: function (reqID) {
        const dir = getLogDirFromEpoch(reqID.split("-")[0]);
        if (fs.existsSync(dir + reqID + "-RES.json")) {
            deleteFile(dir + reqID + "-RES.json");
        }
    },
    getReqHandlerResponse: function (reqID) { // time consuming operation, should not be used often
        const proccessCreation = reqID.split("-")[0]
        const dir = getLogDirFromEpoch(proccessCreation)
        let path = dir + reqID + "-RES.json"
        if (fs.existsSync(path)) {
            const data = fs.readFileSync(path, 'utf8');
            return JSON.parse(data);
        } else {
            return undefined
        }
    },
}

function deleteFile(name) {
    fs.unlink(name, (err) => {
        if (err) {
            backLogger.log({ level: "error", message: err });
            discord.sendError(err)
        }
    });
}

function formatLocalTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const millySeconds = String(now.getMilliseconds()).padStart(3, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}:${millySeconds}`;
}

function getLogDir() {
    return 'logs/' + date_ob.getFullYear() + "/" + "Month-" + (date_ob.getMonth() + 1) + "/" + "Day-" + date_ob.getDate() + "/";
}
function getLogDirFromEpoch(epochDate) {
    var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
    d.setUTCMilliseconds(epochDate);
    return 'logs/' + d.getFullYear() + "/" + "Month-" + (d.getMonth() + 1) + "/" + "Day-" + d.getDate() + "/";
}

const logFormat = winston.format.printf(({ level, message, timestamp }) => {
    return `${formatLocalTime()} [${level}]: ${message}`;
});
let date_ob = new Date();
const levelsAndColors = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        user: 3,
        major_event: 4,
        http: 5,
        request: 6,
        output: 7,
        all: 8,
    },
    colors: {
        error: "bold red",
        warn: "bold yellow",
        info: "bold white",
        user: "bold magenta",
        major_event: "bold blue",
        http: "bold green",
        request: "bold cyan",
        output: "bold white"
    }
}
winston.addColors(levelsAndColors.colors)
const backLogger = winston.createLogger({
    levels: levelsAndColors.levels,
    format: winston.format.combine( 
        winston.format.timestamp(),
        logFormat,
    ),
    exitOnError: false,
    timestamp: true,
    localTime: true,
    transports: [
        new winston.transports.Console({
            level: "http",
            format: winston.format.combine(
                winston.format.colorize({level: true, message: false},), 
                winston.format.timestamp(),
                logFormat,
            ),
        }),
        new winston.transports.File({ filename: getLogDir() + 'error.log', level: 'error', }),
        new winston.transports.File({ filename: getLogDir() + 'clean.log', level: "http" }),
        new winston.transports.File({ filename: getLogDir() + 'all.log', level: "all" }),

        new winston.transports.File({ filename: getLogDir() + 'error.json', level: 'error', format: winston.format.json()}),
        new winston.transports.File({ filename: getLogDir() + 'clean.json', level: "http" , format: winston.format.json()}),
        new winston.transports.File({ filename: getLogDir() + 'all.json', level: "output", format: winston.format.json() }),
    ],
});