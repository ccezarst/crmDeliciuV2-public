const axios = require('axios');
const logger = require("../logger")
const fs = require('fs'); 
const template = require("../routes/template")
async function downloadFile(fileUrl, outputLocationPath, headers, params, body, fileName) {
    const writer = fs.createWriteStream(outputLocationPath + fileName);
    return axios({
        method: 'get',
        url: fileUrl,
        responseType: 'stream',
    }).then(response => {
        response.data.pipe(writer);
        return
    });
}


module.exports = {
    GET: async function (path, headers, params, body) {
        return await axios.get(path, {
            headers: headers,
            params: params,
            data: body,
        },)
    },
    POST: async function (path, headers, params, body) {
        return await axios({
            method: "post",
            url: path, 
            headers: headers,
            params: params,
            data: body,
        },)
    },
    DOWNLOAD_FILE: async function (path, headers, body, params, req) { 
        let downloadDir = req.utillities.cache.getDownloadCacheDir(req)
        let fileName = req.utillities.cache.createDownloadCache(req, path)
        let res = await downloadFile(path, downloadDir, headers, params, body, fileName + ".cache")
        logger.announce("Downloaded a file and cached it: " + fileName)
        return fileName
    },
    reqs_u: class extends template.Utillity{
        constructor() {
            super("reqs")
        }
        async get(path, headers, params, body) {
            return module.exports.GET(path, headers, params, body)
        }
        async post(path, headers, params, body) {
            return module.exports.POST(path, headers, params, body)
        }
        async downloadFile(path, headers, params, body, req) {
            return module.exports.DOWNLOAD_FILE(path, headers, body, params, req)
        }
    },
}
