const logger = require("../logger")
const reasons = { // global response failure reasons
    // same set of reasons will be inside the app in used as keys in a dict for responses
    auth: {
        token: {
            invalid: "auth_token_invalid",
            expired: "auth_token_expired",
            format: {
                invalid: "auth_token_format_invalid"
            }
        },
        cookie: {
            invalid: "auth_cookie_invalid",
        },
        permissions: {
            userDoesntHave: "auth_user_permissions_lack",
        }
    },
    user: {
        exists: "user_exists",
        doesntExist: "user_notExists",
        invalidUsernameOrPassword: "user_headers_invalid",
    }
}

class Utillity {
    constructor(path) {
        this.path = path;
        // used for organizing
        // so parent is the filename(for example deliciu.js -> deliciu)
        // and this path is separated by a dot
        // and objects are created based on this path
        // for example the path "do.stuff" in the fille "foo" is going to end up as "do.stuff"
        // ends up  {do: {stuff: class instance}}
    }
    async startup() { }
    async closingProcedure(configs) {return ""}
    async test(req) {
        await logger.output("Utillity does not have a test func")
        return "Utillity does not have a test func"
    }
}

module.exports = {
    reasons: reasons,
    // boillerplate for other routes :)
    // if someone other than my retarded ass reading this
    // and don't know how this shet works
    // just look at other files
    IGNORE_FILE: function () { 
        // so that this file is skipped because this has no valid routes
        // IGNORE_FILE can be a function, a variable it can be anything as long as it's
        // value isn't "undefined"
    },
    Route: class {
        constructor(route, additionalParams, options) {
            // IGNORE_TOKEN, OWN_ALL_CHILD_ROUTES, DONT_LOG_ACCESS, CHECK_COOKIE
            this.path = route;
            this.params = additionalParams
            if (options != undefined) {
                this.IGNORE_TOKEN = options["IGNORE_TOKEN"]
                this.OWN_ALL_CHILD_ROUTES = options["OWN_ALL_CHILD_ROUTES"]
                this.DONT_LOG_ACCESS = options["DONT_LOG_ACCESS"]
                this.CHECK_COOKIE = options["CHECK_COOKIE"]
                this.COOKIE_FAILURE_CALLBACK = options["COOKIE_FAILURE_CALLBACK"]
                this.RESTRICTED = options["RESTRICTED"]
                if (options["IGNORE_TOKEN"] == false) {
                    this.IGNORE_TOKEN = undefined
                }
                if (options["OWN_ALL_CHILD_ROUTES"] == false) {
                    this.OWN_ALL_CHILD_ROUTES = undefined
                }
                if (options["DONT_LOG_ACCESS"] == false) {
                    this.DONT_LOG_ACCESS = undefined
                }
                if (options["CHECK_COOKIE"] == false) {
                    this.CHECK_COOKIE = undefined
                }
                if (options["RESTRICTED"] == undefined) {// default restricted ON 4 security
                    this.RESTRICTED = true
                }
                if (options["RESTRICTED"] == false) {
                    this.RESTRICTED = undefined
                }
            }
        }
        async GET(req, res) { req.handler.respondWIthStatus(400); req.handler.delete();     }
        async POST(req, res) { req.handler.respondWIthStatus(400); req.handler.delete();    }
        async PUT(req, res) { req.handler.respondWIthStatus(400); req.handler.delete();     }
        async DELETE(req, res) { req.handler.respondWIthStatus(400); req.handler.delete();  }
        async HEAD(req, res) { req.handler.respondWIthStatus(400); req.handler.delete();    }
        async CONNECT(req, res) { req.handler.respondWIthStatus(400); req.handler.delete(); }
        async OPTIONS(req, res) { req.handler.respondWIthStatus(400); req.handler.delete(); }
        async TRACE(req, res) { req.handler.respondWIthStatus(400); req.handler.delete();   }
        async PATCH(req, res) { req.handler.respondWIthStatus(400); req.handler.delete();   }
        // async GET(req, res) { }
        // async POST(req, res) { }
        // async PUT(req, res) { }
        // async DELETE(req, res) { }
        // async HEAD(req, res) { }
        // async CONNECT(req, res) {}
        // async OPTIONS(req, res) {}
        // async TRACE(req, res) {}
        // async PATCH(req, res) { }
    },
    Utillity: Utillity,
    Event: class extends Utillity{
        constructor(timerCallback) {
            this.timeouts = {}
            if (timerCallback != undefined) {
                this.timerCallback = timerCallback
            }
            super("events")
        }
        setEventAtDate(targetDate, eventName, callback) {
            if (!Object.keys(this.timeouts).includes(eventName)) {
                if (targetDate instanceof Date) {
                    const targetEpoch = targetDate.getTime();
                    const timerDuration = targetEpoch - Date.now();
                    if (timerDuration >= 0) {
                        this.timeouts[eventName] = setTimeout(() => {
                            this.timeouts[eventName] = undefined
                            callback(eventName)
                        }, timerDuration)
                    } else {
                        throw "Target date has passed|template.js:Event:setEventAtDate"
                    }
                } else {
                    throw "Incorrect parrameters passed to setEventAtDate|template.js:Event"
                }
            } else {
                throw "Event already exists|template.js:Event:setEventAtDate"
            }
        }
        setPeriodicEvent(period, eventName, callback) {
            if (!Object.keys(this.timeouts).includes(eventName)) {
                this.timeouts[eventName] = setInterval(() => {
                    callback(eventName)
                }, period)
            } else {
                throw "Event already exists|template.js:Event:setPeriodicEvent"
            }
        }
        cancelEvent(eventName) {
            this.timeouts[eventName].close()
            this.timeouts[eventName] = undefined
        }
    },
    Command: class {
        constructor(commandString) {
            this.commandString = commandString
        }
        async called(params) {}
    }
}