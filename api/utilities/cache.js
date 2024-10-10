const template = require("../routes/template")
const logger = require("../logger")
const fs = require('node:fs');
const cacheEntriesName = "downloadedCacheEntries"
let currentPath = process.cwd()
function checkForCacheDirectory(req) {
    if (!fs.existsSync(currentPath + req.configs.serverSettings.cacheDirectory)) {
        logger.announce("Cache directory not found")
        fs.mkdirSync(currentPath + req.configs.serverSettings.cacheDirectory);
        logger.announce("Cache directory created")
    }
}

function checkForDownloadCacheDirectory(req) {
    if (!fs.existsSync(currentPath + req.configs.serverSettings.cacheDirectory + "/downloads")) {
        logger.announce("Download cache directory not found")
        fs.mkdirSync(currentPath + req.configs.serverSettings.cacheDirectory + "/downloads");
        logger.announce("Download cache directory created")
    }
}


module.exports = {
    cacheClass: class extends template.Utillity{
        constructor () {
            super("cache")
        }
        async test(req) {
            checkForCacheDirectory(req)
            this.write("testing", { testing: "testingVal" }, req)
            return this.read("testing", req)
        }
        write(id, content, req   = {}) {
            logger.output("Writing cache", undefined, { cacheID: id, reqID: req.reqID })
            try {
                checkForCacheDirectory(req)
                fs.writeFileSync(currentPath + req.configs.serverSettings.cacheDirectory + "\\" + id + ".cache", JSON.stringify(content, undefined, 2));
            } catch (err) {
                logger.announceError(err, req, {cacheID: id, cacheContent: content})
            }
        }
        read(id, req = {}) {
            try {
                checkForCacheDirectory(req)
                if (fs.existsSync(currentPath + req.configs.serverSettings.cacheDirectory + "\\" + id + ".cache")) {
                    const data = fs.readFileSync(currentPath + req.configs.serverSettings.cacheDirectory + "\\" + id + ".cache", 'utf8');
                    return JSON.parse(data);
                } else {
                    logger.warn(id + " cache file was not found")
                    return undefined
                }
            } catch (err) {
                logger.announceError(err, req, {cacheID: id})
            }
        }
        update(id, newKey, newContent, req) {
            let content = this.read(id, req)
            if (content == undefined) {// this means the cacheEntries file hasn't been created
                content = {}
            }
            content[newKey] = newContent
            this.write(id, content, req);
        }
        getCacheDir(req) {
            checkForCacheDirectory(req)
            return currentPath + req.configs.serverSettings.cacheDirector;
        }   

        // download cache stuff

        getDownloadCacheDir(req) {
            checkForCacheDirectory(req)
            checkForDownloadCacheDirectory(req)
            return currentPath + req.configs.serverSettings.cacheDirectory + "/downloads/";
        }
        updateDownloadCacheEntries(req, id, content) { // if not append then delete, simple :)
            let cacheEntries = this.read(cacheEntriesName, req)
            if (cacheEntries == undefined) {// this means the cacheEntries file hasn't been created
                cacheEntries = {}
            }
            cacheEntries[id] = content
            this.write(cacheEntriesName, cacheEntries, req);
        }
        checkIfDownloadCacheExists(id) {
            let cacheEntries = this.read(cacheEntriesName)
            return (cacheEntries[id] == undefined) ? false : true
        }
        createDownloadCache(req, fileUrl) {
            let downloadCacheID = req.handler.id + "+" + Math.round(Math.random() * 10000000000)
            let loopCounter = 0 // in place for when the API is scaled, so that if so many downloadCaches are made without being deleted
            // and the API runs out of unique ID's to generate this can throw an alert
            while (this.checkIfDownloadCacheExists[downloadCacheID]) {
                downloadCacheID = req.handler.id + "+" + Math.round(Math.random() * 10000000000)
                loopCounter += 1
                if (loopCounter > 1000) {
                    logger.warn("Generated a non-unique downloadCacheID 1000 times, please check if there is no more space to save download caches")
                    logger.warn("If this this warning doesn't keep appearing then it's fine")
                    loopCounter = 0
                }
            }
            this.updateDownloadCacheEntries(req, downloadCacheID, {
                fileUrl: fileUrl,
                reqID: req.reqID,
                dateGenerated: new Date().toString()
            })
            return downloadCacheID
        }
    }
}