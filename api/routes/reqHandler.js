const e = require("express")
const logger = require("../logger")
const reqHandler = require("../reqHandler")
const template = require("./template")
function parseJsonToOutput(input) {
    return JSON.stringify(input, null, "\t").replace(new RegExp('"', 'g'), '')
}

module.exports = {

    getReqHandler: class extends template.Route{
        constructor() {
            const route = "requestHandlers/get"
            super(route);
        }
        async GET(req, res) {
            try {
                const reqID = req.headers["reqhandlerid"] // REMEMBER NO CAPITALS
                const result = await reqHandler.getReqHandler(reqID)
                if (result == undefined) {
                    logger.warn("Failed to fetch request handler from memory or disk " + reqID)
                    req.handler.respondWIthStatus(404)
                } else {
                    req.handler.respond(result);
                }
                req.handler.delete(true, true)
            } catch (err) {
                logger.announceError(err, req)
                req.handler.respondWIthStatus(400)
            }
        }
    },
    getReqHandlerResponse: class extends template.Route{
        constructor() {
            const route = "requestHandler/getResponse"
            super(route);
        }
        async GET(req, res) {
            try {
                const resID = req.headers["reqhandlerresid"] // REMEMBER NO CAPITALS
                const result = await reqHandler.getReqHandlerResponse(resID)
                if (result == undefined) {
                    logger.warn("Failed to fetch request handler response from memory or disk " + resID)
                    req.handler.respondWithStatus(404)
                } else {
                    req.handler.respond(result);
                }
                req.handler.delete(true, true)
            } catch (err) {
                logger.announceError(err, req)
                req.handler.respondWIthStatus(400)
            }
        }
    },
    
}