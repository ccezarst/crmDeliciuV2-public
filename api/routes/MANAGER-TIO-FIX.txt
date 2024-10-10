const logger = require("../logger")
const procHandler = require("../procHandler")
const template = require("./template")
const path = require('path');
const fs = require("fs")
const sha256 = require('sha256');
const currentPath = process.cwd();
const managerGUIFiles = currentPath + "\\manager\\"

let commandCallbackList = {}
let allCommandClasses = []

function isClass(variable) {
    return typeof variable === 'function' && variable.prototype && variable.prototype.constructor === variable;
}

async function checkDirAndImport(path, importPath) {
    const routesFiles = await fs.readdirSync(path)
    let result = []
    for (const routeFile of routesFiles) {
        // make sure is javascript file
        const isFile = !fs.lstatSync(path + routeFile).isDirectory()
        if (isFile && routeFile.includes(".js") && !routeFile.includes(".json")) {
            // get only the file name and import it
            try {
                const newInclude = require(importPath + routeFile.split(".")[0])
                // so that files like template.js get skipped
                // this value can be defined however u want
                if (newInclude["IGNORE_FILE"] == undefined) {
                    // different functions add details here then after this is done it appends it to extraRouteDetails
                    // so that the middle can check which paths should ignore the auth token
                    for (const value of Object.values(newInclude)) {
                        // make sure this is a route and nuthin else
                        if (isClass(value)) {
                            // don't know why i save em
                            const valueInstance = new value()
                            if (valueInstance instanceof template.Command) {
                                commandCallbackList[valueInstance.commandString] = valueInstance.called
                                //valueInstance.startup()
                                result.push(valueInstance);
                            }
                        }
                    }
                }
            } catch (err) {
                console.log(err)
            }
        }
        if (!isFile) {
            const output = await checkDirAndImport(path + routeFile + "/")
            result = result.concat(output);
        }
    }
    // default commands
    commandCallbackList["help"] = function (params) {
        logger.announce("Commands: " + Object.keys(commandCallbackList))
    }
    return result;
}


module.exports = {
    startupFunction: class extends template.UtilitiesFunction{
        async startup() {
            allCommandClasses = await checkDirAndImport("./routes/", "./")
        }
    },
    getMainManagerPage: class extends template.Route{
        constructor() {
            // MAKE SURE TO HAVE THIS SLASH
            const route = "manager/"
            // question mark means it can be empty so just parent path
            const params = "name"
            const options = {
                IGNORE_TOKEN: true, // ignore auth token cuz browser can't send it so i have to use cookies
                OWN_ALL_CHILD_ROUTES: true, // this will make it so this route's properties will apply to all of it's children
                DONT_LOG_ACCESS: true,
                COOKIE_FAILURE_CALLBACK: function (req, res) {
                    const loginRoute = "/api/manager/login"
                    const childRoute = req.params.name
                    const orgPath = req.originalUrl
                    if (orgPath != loginRoute) {
                        res.redirect(loginRoute)
                    } else if (orgPath == loginRoute) {
                        res.sendFile(managerGUIFiles + "login.html")
                    }
                },
            }
            super(route, params, options);
        }
        async GET(req, res) {
            try {
                const loginRoute = "/api/manager/login"
                const childRoute = req.params.name
                const orgPath = req.originalUrl
                const orgToken = req.configs["serverSettings"]["auth"]["accessToken"]
                const hashedCookie = req.cookies["accessCookie"]
                const hashedToken = sha256(orgToken)
                if (childRoute == undefined) {
                    if (hashedCookie == hashedToken) {
                        res.sendFile(managerGUIFiles + "index.html")
                    } else {
                        res.redirect(loginRoute)
                    }
                } else {
                    if (orgPath == loginRoute) {
                        res.sendFile(managerGUIFiles + "login.html")
                    } else {
                        if (childRoute == "command") {
                            res.sendStatus(200)
                            const command = req.headers["command"]
                            logger.announce(req.ip + " || Manager command recieved: [-" + command + "-]")
                            const splitCommand = command.split(/\s+/) 
                            if (commandCallbackList[splitCommand[0]] != undefined) {
                                let newC = splitCommand[0]
                                splitCommand.shift()
                                commandCallbackList[newC](splitCommand)
                            } else {
                                logger.announceError("Command doesn't exist")
                            }
                        } else {
                            if (fs.existsSync(managerGUIFiles + childRoute + ".html")) {
                                if (hashedCookie == hashedToken) {
                                    logger.announce(childRoute)
                                    res.sendFile(managerGUIFiles + childRoute + ".html")
                                } else {
                                    res.redirect(loginRoute)
                                }
                            } else {
                                res.sendStatus(404)
                            }
                        }
                    }
                }
                procHandler.deleteProc(req.procID, true);
                //res.sendStatus(200);
            } catch (err) {
                logger.announceError(err)
                //res.sendStatus(400)
            }
        }
    },

    tryToLogin: class extends template.Route { 
        constructor() {
            // MAKE SURE TO HAVE THIS SLASH
            const route = "login/manager"
            const options = {
                IGNORE_TOKEN: true, // ignore auth token cuz browser can't send it so i have to use cookies
                OWN_ALL_CHILD_ROUTES: true, // this will make it so this route's properties will apply to all of it's children
            }
            super(route,undefined, options);
        }

        async POST(req, res) {
            try {
                const user = req.body["user"]
                const pass = req.body["password"]
                const loginRoute = "/api/manager/login"
                if (user == req.configs["serverSettings"]["auth"]["managerUser"] && pass == req.configs["serverSettings"]["auth"]["managerPassword"]) {
                    logger.announce("Logged in to the manager", req)
                    res.cookie("accessCookie", sha256(req.configs["serverSettings"]["auth"]["accessToken"]))
                    res.redirect("/api/manager")
                } else {
                    logger.announceError("Failed to login to the manager", req)
                    res.redirect(loginRoute)
                }
                procHandler.deleteProc(req.procID);
            } catch (err) {
                logger.announceError(err)
                res.sendStatus(400)
            }
        }
    },

    getLogFile: class extends template.Route {
        constructor() {
                        // MAKE SURE TO HAVE THIS SLASH
            const route = "logs"
            const options = {
                IGNORE_TOKEN: true, // ignore auth token cuz browser can't send it so i have to use cookies
                OWN_ALL_CHILD_ROUTES: false, // this will make it so this route's properties will apply to all of it's children
                CHECK_COOKIE: true,
                DONT_LOG_ACCESS: true,
                COOKIE_FAILURE_CALLBACK: function(req, res) {
                    res.status = 404
                    res.send({"combined": "go fuck yourself :) \r\npsst also try and not fucking bruteforce my api you stupid twat", "errors": "go fuck yourself :) \r\npsst also try and not fucking bruteforce my api you stupid twat"})
                }
            }
            super(route,undefined, options);
        }

        async GET(req, res) {
            try {
                if (req.headers["mode"] == "getLogFile") {
                    const year = req.headers["year"]
                    const month = req.headers["month"]
                    const day = req.headers["day"]
                    if (year != undefined && month != undefined && day != undefined) {
                        const baseRoute = "./logs/" + year + "/Month-" + month + "/Day-" + day 
                        const combined = await fs.readFileSync(baseRoute + "/combined.log", "utf-8")
                        const errors = fs.readFileSync(baseRoute + "/error.log", "utf-8")
                        res.send({
                            combined: combined,
                            errors: errors
                        })
                    } else {
                        res.status = 404
                        res.send({"1": "go fuck yourself :)"})
                    }
                } else if (req.headers["mode"] == "year") {
                    const result = fs.readdirSync("./logs")
                    res.send(result)
                } else if (req.headers["mode"] == "month") {
                    const result = fs.readdirSync("./logs/" + req.headers["year"])
                    res.send(result)
                } else if (req.headers["mode"] == "day") {
                    const result = fs.readdirSync("./logs/" + req.headers["year"] + "/" + req.headers["month"])
                    res.send(result)
                }

                procHandler.deleteProc(req.procID, true);
            }catch(err){ 

                res.status = 404
                res.send({"Log file not found :(": "Log file not found :("})
                logger.announceError(err)
            }
        }
    },
}