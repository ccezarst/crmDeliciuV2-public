const logger = require("./logger")
let reqHandlerArray = {}
let resArray = {}
// these are the statuses i will use:
//   init -> when the proccess is initialising
//   working -> while the proccess is handling the request
//   done -> after it has finnished working
//        -> the info value is going to be set to the result of the route
//   error -> request errored out

// req id is creationEpoch-randomNum

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function updateReqHandlerToDisk(req) {
    if (req != undefined) {
        logger.logReqHandler(req.id, req);
    } else {
        logger.announceError("Undefined parameters passed to updateReqHandlerToDisk")
        throw "Undefined parameters passed to updateReqHandlerToDisk";
    }
}

function archiveReqHandler (req) {
    if (req != undefined && req != "") {
        logger.logReqHandler(req.id, req)
        delete reqHandlerArray[req.id]
    } else {
        logger.announceError("Incorrect parameters passed to archiveReqHandler")
        throw "Incorrect parameters passed to archiveReqHandler";
    }
}

function updateReqHandlerResponseToDisk(res) {
    if (res != undefined) {
        logger.logReqHandlerResponse(res.ID, res);
    } else {
        logger.announceError("Undefined parameters passed to updateReqHandlerResponseToDisk")
        throw "Undefined parameters passed to updateReqHandlerResponseToDisk";
    }
}

function deleteReqHandler (req, dont_log, deleteResponse) {
    if (req != undefined && req != "") {
        delete reqHandlerArray[req.id];
        logger.deleteReqHandler(req.id);
        if (deleteResponse) {
            delete resArray[req.id]
            logger.deleteReqHandlerResponse(req.id)
        }
        if (dont_log == undefined) {
            logger.request("Deleted a proccess with Proccess ID: " + req.id)
        }
    } else {
        logger.request("Incorrect parameters passed to deleteReqHandler")
        throw "Incorrect parameters passed to deleteReqHandler";
    }
}

class HandlerResponse{
    constructor(isFile, ext, status, requestHandler, ID) {
        this.isFile = isFile
        this.response = ext
        this.requestHandler = requestHandler
        this.ID = ID
        this.status = status
        updateReqHandlerResponseToDisk(this) // we assume the handler response is already in the resArray
    }
    sendResponse(res) {
        res.status(this.status)
        if (this.isFile) {
            res.sendFile(this.response)
        } else {
            res.send(this.response)
        }
        module.exports.archiveReqHandler(requestHandler.id)
    }
    sendStatus(res) {
        res.sendStatus(this.status)
    }
}
class RequestHandler{
    #progress
    #target
    #orgIp
    #orgUser
    #orgPath
    #orgDate
    #sepResponse
    #res
    #req
    #internalStatus
    // internal variables(private) are used so that i can create custom setters with the right name that log when a variable is changed
    #intHistory 
    // ex: everytime the status is changed the change is logged in #intHistory (short for internal worker history)
    #internalInfo
    #internalID
    constructor(reqPath, ip, user, req, res) {
        this.#orgDate = Date.now()
        this.#internalID = this.#orgDate + "-" + getRandomInt(10000000000)
        let count = 0
        while (logger.getReqHandler(this.id) != undefined && reqHandlerArray[this.id] != undefined) {
            this.#internalID = this.#orgDate + "-" + getRandomInt(10000000000)
            count += 1;
            if (count > 10000) {
                logger.warn("Over 10,000 repetitions of the worker ID picking loop, might have run out of ID's")
                logger.warn("If this warning keeps showing up, it's probably because there were too many workers generated and you need to delete some of them off the disk")
                count = 0
            }
        }
        reqHandlerArray[this.id] = this
        this.#intHistory = []
        this.#orgPath = reqPath
        this.#orgIp = ip
        this.#orgUser = user
        this.status = "idle"
        this.#progress = 0
        this.#target = 0//target is when progress is finnished
        this.#sepResponse = false
        this.#req = req
        this.#res = res
        this.#internalInfo = ""
        this.temp = {}
    }
    #markWorking() {
        if (this.status != "working") {
            this.status = "working"
        }
    }
    #markDone() {
        this.status = "finished"
    }
    delete(delRes, dont_log) {
        deleteReqHandler(this, dont_log, delRes)
    }
    tickProgress(info) {
        this.#markWorking()
        this.#progress += 1;
        this.#intHistory.push(["progressTick", this.#progress])
        if (info != undefined) {
            this.info = info
        }
        this.#varChange()
    }
    createEarlyResponse(isFile, response) {
        if (this.#sepResponse == true) {
            resArray[this.id] = new HandlerResponse(isFile, response)
            return resArray[this.id]
        } else {
            return false
        }
    }
    respond(response, isFile = false, status = 200) {// TODO: add stream support
        this.#intHistory.push(["respondingToRequest", "isFile: " + isFile])
        if (isFile) {
            if (this.#sepResponse) {
                resArray[this.id] = new HandlerResponse(true, response,status, this, this.id)
            } else {//response must be full filePath
                resArray[this.id] = new HandlerResponse(true, response,status, this, this.id)
                this.#res.status(status)
                this.#res.sendFile(response)
            }
        } else {
            if (this.#sepResponse) {
                resArray[this.id] = new HandlerResponse(false, response,status, this, this.id)
            } else {
                resArray[this.id] = new HandlerResponse(false, response,status, this, this.id)
                this.#res.status(status)
                this.#res.send(response)
            }
        }
        this.#markDone()
    }
    respondWithStatus(status = 200) {
        if (this.#sepResponse) {
            resArray[this.id] = new HandlerResponse(false, undefined, status, this, this.id)
            resArray[this.id].sendStatus()
        } else {
            this.#res.sendStatus(status)
        }
    }
    markErrored(error) {
        this.status = "error"
        this.#intHistory.push(["error", error])
        this.info = error
    }
    markEvent(event, extraInfo) {
        this.#intHistory.push([event, extraInfo])
        this.#varChange()
    }
    switchResponseType(seperateResponse) {//seperateResponse means that the response needs to be gotten in a seperate request
        this.#sepResponse = seperateResponse
        this.#intHistory.push(["switchedResponseType", (seperateResponse) ? "seperateResponse" : "sameRequestResponse"])
        if (seperateResponse) {
            this.#res.send(this.id)
            // the handlerResponse is going to have a matching id to it's requestHandler so tracking them is easier
            this.#intHistory.push(["sentHandlerResponseID", this.id])
        }
    }
    #varChange() {
        updateReqHandlerToDisk(this)
    }
    set progressTarget(newV) {
        this.#markWorking()
        this.#target = newV
        this.#intHistory.push(["updadedProgressTarget", newV])
        this.#varChange()
    }
    set progressClean(newV) {
        this.#markWorking()
        this.#progress = newV
        this.#intHistory.push(["updadedProgress", newV])
        this.#varChange()
    }
    get progressTarget() {
        return this.#target
    }
    get progress() {
        return this.#progress + "/" + this.#target
    }
    get progressClean() {
        return this.#progress
    }
    get callerIp() {
        return this.#orgIp
    }
    get callerUser() {
        return this.#orgUser
    }
    get creationDate() {
        return this.#orgDate
    }
    get routePath() {
        return this.#orgPath
    }
    get history() {
        return this.#intHistory
    }
    get status() {
        return this.#internalStatus
    }
    get id() {
        return this.#internalID
    }
    set status(newV) {
        if (newV != undefined) {
            this.#internalStatus = newV
            this.#intHistory.push(["statusUpdate", newV])
        } else {
            this.#internalStatus = newV
            this.#intHistory.push(["FAILED-statusUpdate", "Status tried to be set to undefined, caught and rejected"])
        }
        this.#varChange()
    }
    get info() {
        return this.#internalInfo
    }
    set info(newV) { // cannot set to undefined so it makes it easier for me when i can just pass undefined as a parameter without check it elsewhere
        if (newV != undefined) {
            this.#internalInfo = newV
            this.#intHistory.push(["infoUpdate", newV])
        } else {
            this.#intHistory.push(["FAILED-infoUpdate", "Info tried to be set to undefined, caught and rejected"])
        }
        this.#varChange()
    }
    toJSON() { // custom serialization func
        return {
            id: this.id,
            status: this.status,
            info: this.info,
            eventHistory: this.history,
            routePath: this.routePath,
            creationDate: this.creationDate,
            callerUser: this.callerUser,
            callerIp: this.callerIp,
            progress: this.progress,
        }
    }
}

// TODO: RESET PROC ARRAY AFTER A DAY

module.exports = {
    // i use this req aproach to be able to have loading statuses and more, along with easier tracking and logging of functions
    // basically i allow the app to show a loading screen
    createReqHandler: function (dont_log, requestPath, callerIp, callerUser, req, res) {
        // create a random reqID and make sure that it isn't already present in reqHandlerArray
        let reqHandler = new RequestHandler(requestPath, callerIp, callerUser, req, res)  
        if (dont_log == undefined) {
            logger.request("New requestHandler was made with ID: " + reqHandler.id)
        }
        logger.logReqHandler(reqHandler.id, reqHandler);
        return reqHandler;
    },
    updateReqHandlerStatus: function (reqID, newStatus, newInfo) {
        if (reqID != undefined) {
            reqHandlerArray[reqID].status = newStatus
            reqHandlerArray[reqID].info = newInfo
            logger.logReqHandler(reqID, reqHandlerArray[reqID]);
        } else {
            logger.announceError("Undefined parameters passed to updateReqHandlerStatus")
            throw "Undefined parameters passed to updateReqHandlerStatus";
        }
    },
    getReqHandler: function (reqID) {
        if (reqID != undefined && reqID != "") {
            let reqs = reqHandlerArray[reqID];
            if (reqs == undefined) { // if the requestHandler is not in memory anymore(API restarted, proccesses were flushed etc..) grab it from storage
                reqs = logger.getReqHandler(reqID);
            }
            if (reqs != undefined) {
                return reqs;
            } else {
                logger.announceError("Failed to fetch reqHandler " + reqID + " from storage or memory")
                return undefined
            }
        } else {
            logger.announceError("Incorrect parameters passed to getReqHandlerInfo")
            logger.announceError(reqID)
            throw "Incorrect parameters passed to getReqHandlerInfo";
        }
    },
    getReqHandlerResponse: function (reqID) {
        if (reqID != undefined && reqID != "") {
            let res = resArray[reqID];
            if (res == undefined) { // if the requestHandlerResponse is not in memory anymore(API restarted, proccesses were flushed etc..) grab it from storage
                res = logger.getReqHandlerResponse(reqID);
            }
            if (res != undefined) {
                return res;
            } else {
                logger.announceError("Failed to fetch reqHandlerResponse " + reqID + " from storage or memory")
                return undefined
            }
        } else {
            logger.announceError("Incorrect parameters passed to getReqHandlerResponse")
            throw "Incorrect parameters passed to getReqHandlerResponse";
        }
    },
    archiveReqHandler: function (reqID) {
        if (reqID != undefined && reqID != "") {
            logger.logReqHandler(reqID, reqHandlerArray[reqID])
            delete reqHandlerArray[reqID]
        } else {
            logger.announceError("Incorrect parameters passed to archiveReqHandler")
            throw "Incorrect parameters passed to archiveReqHandler";
        }
    },
    deleteReqHandler: function (reqID, dont_log, deleteResponse) {
        if (reqID != undefined && reqID != "") {
            delete reqHandlerArray[reqID];
            logger.deleteReqHandler(reqID);
            if (deleteResponse) {
                delete resArray[reqID]
                logger.deleteReqHandlerResponse(reqID)
            }
            if (dont_log == undefined) {
                logger.request("Deleted a proccess with Proccess ID: " + reqID)
            }
        } else {
            logger.request("Incorrect parameters passed to deleteReqHandler")
            throw "Incorrect parameters passed to deleteReqHandler";
        }
    },
    // TODO: ADD REQHANDLER ARCHIVING SO AFTER IT'S DONE IT GETS DELETED FROM MEMORY AND ONLY KEPT IN STORAGE
    getAllReqHandlers: function () {
        return reqHandlerArray;
    },
}