const logger = require("../logger")
const procHandler = require("../reqHandler")
const template = require("./template")
const userDB = require("../userDB")
module.exports = {
    
    createUser: class extends template.Route{
        constructor() {
            const route = "users/register"
            super(route, undefined, {IGNORE_TOKEN: true, RESTRICTED: false});
        }
        async GET(req, res) {
            try {
                const user = req.headers["username"];
                // password should be sent hashed
                // but if the passwords gets set & checked as it's recieved
                // the app should hash it
                const password = req.headers["password"];
                //check if user already exists
                if (user != undefined && password != undefined && user != "" && password != "") {
                    if (!userDB.exists(user)) {
                        // userDB.dbObject.set(user, { password: password, permissions: [] });
                        //    here we return the new token
                        // return req.configs["serverSettings"]["auth"]["accessToken"];
                        logger.user(user + " created an account", req, {
                            user: user,
                            tokenLifetime: req.configs.serverSettings.auth.tokenLifetime,
                            defaultPermissions: req.configs.serverSettings.auth.defaultAccountPermissions
                        })
                        req.handler.respond(userDB.createUser(user, password, req.configs.serverSettings.auth.tokenLifetime, req.configs.serverSettings.auth.defaultAccountPermissions), false)
                    } else {
                        res.status(400);
                        req.handler.respond(template.reasons.user.exists, false, 400)
                    }
                } else {
                    req.handler.respond(template.reasons.user.invalidUsernameOrPassword, false, 400)
                }
                req.handler.delete(true, true)
            } catch (err) {
                logger.announceError(err)
                req.handler.respondWithStatus(400)
            }
        }
    },

    login: class extends template.Route{
        constructor() {
            const route = "users/login"
            super(route, undefined, {IGNORE_TOKEN: true, RESTRICTED: false});
        }
        async GET(req, res) {
            try {
                const user = req.headers["username"];
                // password should be sent hashed
                // but if the passwords gets set & checked as it's recieved
                // the app should hash it
                const password = req.headers["password"];
                //check info
                if (user != undefined && password != undefined && user != "" && password != "") {
                    if (userDB.exists(user)) {
                        // userDB.dbObject.set(user, { password: password, permissions: [] });
                        //    here we return the new token
                        // return req.configs["serverSettings"]["auth"]["accessToken"];
                        if (userDB.checkPassword(user, password)) {
                            let token = userDB.regenToken(user, req.configs.serverSettings.auth.tokenLifetime);
                            logger.user(user + " logged in", undefined, {
                                user: user,
                                token: token,
                                tokenLifetime: req.configs.serverSettings.auth.tokenLifetime,
                            })
                            req.handler.respond(token)
                        } else {
                            req.handler.respond(template.reasons.user.invalidUsernameOrPassword, false, 400);
                        }
                    } else {
                        req.handler.respond(template.reasons.user.doesntExist, false, 400)
                    }
                } else {
                    req.handler.respond(template.reasons.user.invalidUsernameOrPassword, false, 400);
                }
                req.handler.delete(true, true)
            } catch (err) {
                logger.announceError(err)
                console.log(err)
                req.handler.respond(template.reasons.user.exists, false, 400);
            }
        }
    },

    modify: class extends template.Route{
        constructor() {
            const route = "users/modify"
            super(route, undefined, {RESTRICTED: true});
        }
        async GET(req, res) {
            try {
                const user = req.headers["username"];
                const password = req.headers["password"];
                const targetUser = req.headers["targetUser"];
                const mode = req.headers["mode"]
                const opt = req.headers["optional"]
                //check if user already exists
                if (userDB.exists(user)) {
                    if (userDB.checkPassword(user, password)) {
                        switch (mode) {
                            case "add":
                                if (user != targetUser) {
                                    if (!userDB.checkPermission(targetUser, "modify/protect/self")) {
                                        userDB.addPermission(targetUser, opt)
                                    }
                                } else {
                                    if (userDB.checkPermission(user, "modify/perms/self")) {
                                        userDB.addPermission(targetUser, opt)
                                    } else {
                                        req.handler.respond(template.reasons.auth.permissions.userDoesntHave, false, 400)
                                    }
                                }
                                break;
                            case "remove":
                                if (user != targetUser) {
                                    if (!userDB.checkPermission(targetUser, "modify/protect/self")) {
                                        userDB.removePermission(targetUser, opt)
                                    }
                                } else {
                                    if (userDB.checkPermission(user, "modify/perms/self")) {
                                        userDB.removePermission(targetUser, opt)
                                    } else {
                                        req.handler.respond(template.reasons.auth.permissions.userDoesntHave, false, 400)
                                    }
                                }
                                break;
                            case "delete":
                                    if (!userDB.checkPermission(targetUser, "modify/protect/self")) {
                                        userDB.deleteUser(targetUser)
                                    }
                                break;
                            case "changePassword":
                                if (user != targetUser) {
                                    if (!userDB.checkPermission(targetUser, "modify/protect/self")) {
                                        userDB.changePassword(targetUser, opt)
                                    }
                                } else {
                                    if (userDB.checkPermission(user, "modify/perms/self")) {
                                        userDB.changePassword(targetUser, opt)
                                    } else {
                                        req.handler.respond(template.reasons.auth.permissions.userDoesntHave, false, 400)
                                    }
                                }
                                break;
                        }
                        req.handler.respondWithStatus(400)
                    }
                } else {
                    req.handler.respond(template.reasons.user.doesntExist, false, 400)
                }
                procHandler.deleteReq(req.reqID);
            } catch (err) {
                logger.announceError(err)
                req.handler.respondWithStatus(400)
            }
        }
    },

}