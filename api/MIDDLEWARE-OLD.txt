const logger = require("./logger")
const mainFile = require("./index")
const procHandler = require("./procHandler")
const sha256 = require('sha256');
let configsJSON;
let securityToken = undefined
const fs = require("fs")
fs.readFile("./config.json", "utf8", (err, jsonString) => {
    if (err) {
    } else {
        configsJSON = JSON.parse(jsonString)
        securityToken = configsJSON["serverSettings"]["auth"]["accessToken"];
    }
})
// i will set a property of req to the config string
// so that any route can access it
module.exports = async function (req, res, next) {
    try {
        if (securityToken != "") {
            let letPass = true;
            let noToken = false;
            const user = req.headers["username"]
            const password = req.headers["password"]
            let gonnaKms = mainFile.getRouteDetails(req.originalUrl)
            // THE ORDER OF THE IF STATEMENTS MATTERS!!
            if (req.headers["token"] != securityToken) {
                letPass = false;
                noToken = true;
            }
            if (gonnaKms["IGNORE_TOKEN"] != undefined) {
                letPass = true;
            }
            if (gonnaKms["CHECK_COOKIE"] != undefined) {
                const orgToken = configsJSON["serverSettings"]["auth"]["accessToken"]
                const hashedCookie = req.cookies["accessCookie"]
                const hashedToken = sha256(orgToken)
                if (hashedCookie != hashedToken) {
                    letPass = false;
                    gonnaKms["COOKIE_FAILURE_CALLBACK"](req, res)
                }
            }
            if (letPass) {
                if (gonnaKms["DONT_LOG_ACCESS"] == undefined) {
                    if (noToken) {
                        logger.announce("Accessed the API !WITH NO TOKEN! : " + req.originalUrl, req)
                    } else {
                        logger.announce("Accessed the API: " + req.originalUrl, req)
                    }
                    req.configs = configsJSON
                    const procID = await procHandler.createProc();
                    req.procID = procID;
                    next();
                } else {
                    req.configs = configsJSON
                    const procID = await procHandler.createProc(true);
                    req.procID = procID;
                    next();
                }
            } else {
                res.sendStatus(400);
                logger.announce("Failed to access the API : " + req.originalUrl, req)
            }
            // if (req.headers["token"] == securityToken) {
            //     if (gonnaKms["DONT_LOG_ACCESS"] == undefined) {
            //         if (noToken) {
            //             logger.announce("Accessed the API !WITH NO TOKEN! : " + req.originalUrl, req)
            //         } else {
            //             logger.announce("Accessed the API: " + req.originalUrl, req)
            //         }
            //         req.configs = configsJSON
            //         const procID = await procHandler.createProc();
            //         req.procID = procID;
            //         next();
            //     } else {
            //         req.configs = configsJSON
            //         const procID = await procHandler.createProc(true);
            //         req.procID = procID;
            //         next();
            //     }
            // } else {
            //     // ignore favicon request for now
            //     if (req.originalUrl != "/favicon.ico") {
            //         let gonnaKms = mainFile.getRouteDetails(req.originalUrl)
            //         if (gonnaKms["IGNORE_TOKEN"] != undefined) {
            //             if (gonnaKms["CHECK_COOKIE"] != undefined) {
            //                 const orgToken = configsJSON["serverSettings"]["auth"]["accessToken"]
            //                 const hashedCookie = req.cookies["accessCookie"]
            //                 const hashedToken = sha256(orgToken)
            //                 if (hashedCookie == hashedToken) {
            //                     if (gonnaKms["DONT_LOG_ACCESS"] == undefined) {
            //                         logger.announce("Accessed the API !WITH NO TOKEN! : " + req.originalUrl, req)
            //                     }
            //                     req.configs = configsJSON
            //                     let procID;
            //                     if (gonnaKms["DONT_LOG_ACCESS"] == undefined) {
            //                         procID = await procHandler.createProc();
            //                     } else {
            //                         procID = await procHandler.createProc(true);
            //                     }
            //                     req.procID = procID;
            //                     next();
            //                 } else {
            //                     if (gonnaKms["COOKIE_FAILURE_CALLBACK"] != undefined) {
            //                         gonnaKms["COOKIE_FAILURE_CALLBACK"](req, res)
            //                     } 
            //                 }
            //             } else {
            //                 if (gonnaKms["DONT_LOG_ACCESS"] == undefined) {
            //                     logger.announce("Accessed the API !WITH NO TOKEN! : " + req.originalUrl, req)
            //                 }
            //                 req.configs = configsJSON
            //                 let procID;
            //                 if (gonnaKms["DONT_LOG_ACCESS"] == undefined) {
            //                     procID = await procHandler.createProc();
            //                 } else {
            //                     procID = await procHandler.createProc(true);
            //                 }
            //                 req.procID = procID;
            //                 next();
            //             }
            //         } else {
            //             res.status = 400;
            //             res.send("INVALID AUTH TOKEN!")
            //             logger.announceError("Failed to access the API : " + req.originalUrl, req)
            //         }
            //     }
            // }
        } else {
            res.sendStatus(500);
            console.log("Please specify a security token in config.json")
            logger.announceError("Please specify a security token in config.json")
            throw "Please specify a security token in config.json";
        }
    } catch (err) {
        logger.announceError(err, req)
        res.sendStatus(400)
    }
}