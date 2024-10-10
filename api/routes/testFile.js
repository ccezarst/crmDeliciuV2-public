const template = require("./template");
const logger = require("../logger")
let totCount = 0;
async function recursiveUtillitySearch(obj, currentPath, count, req) {
    if (obj instanceof Object && !(obj instanceof template.Utillity)) {
        let tempCount = count
        for (let i = 0; i < Object.keys(obj).length; i++) {
            let utily = obj[Object.keys(obj)[i]]
            if (utily instanceof Object) {
                tempCount += await recursiveUtillitySearch(utily, currentPath + "." + Object.keys(obj)[i], tempCount, req)
            }
        }
        return tempCount;
    } else {
        if (obj instanceof template.Utillity) {
            let passed = true;
            let additionalInfo = "";
            try {
                additionalInfo = await obj.test(req);
            } catch (err) {
                passed = false;
                additionalInfo = err.toString() + "\n" + err.stack.toString();
            }
            // bag pula in ele da count ca e o bataie de cap
            // logger.output((passed ? "PASS " : "ERROR") + "  " + "(" + (count + 1) + "/" + totCount + ")  :  " + currentPath)
            // s ar putea sa fiu schizo ca al drq daca mai stiu de ce am scris acel comentariu
            await logger.output((passed ? "PASS " : "ERROR") + "  :  " + currentPath + (passed ? "" : "  --> check " + req.reqID + ".json"))
            req.handler.temp[currentPath] = [
                (passed ? "PASS" : "ERROR"),
                additionalInfo,
            ]
            return 1;
        } else {
            return 0;
        }
    }
}
// i hate this
// function countUtilltyRecursives(obj, currentPath, count) {
//     if (obj instanceof Object && !(obj instanceof template.Utillity)) {
//         let tempCount = 0;
//         for (let i = 0; i < Object.keys(obj).length; i++) {
//             let utily = obj[Object.keys(obj)[i]]
//             if (utily instanceof Object) {
//                 tempCount += countUtilltyRecursives(utily, currentPath + "." + Object.keys(obj)[i], count)
//             }
//         }
//         return count + tempCount;
//     } else {
//         if (obj instanceof template.Utillity) {
//             return 1;
//         } else {
//             return 0;
//         }
//     }
// }

module.exports = {
    caca: class extends template.Route{
        constructor() {
            const route = "test"
            super(route, undefined, {RESTRICTED: true});
        }
        async GET(req, res) {
            try {
                req.handler.switchResponseType(true) // tells the req handler that this request will yield a result later
                logger.warn("user -" + req.user + "- requested an API test")
                logger.output("--testing utillities--", undefined, { test: "testMeta" })
                req.handler.status = "testing utillities"
                let utilyes = req.utillities
                let specificUtiltity = req.headers.utility
                // totCount = 0
                // for (let i = 0; i < Object.keys(utilyes).length; i++) {
                //     let utily = utilyes[Object.keys(utilyes)[i]]
                //     if (utily instanceof Object) {
                //         totCount += await countUtilltyRecursives(utily, Object.keys(utilyes)[i], 0)
                //     }
                // }
                if (specificUtiltity != undefined) {
                    let utily = utilyes[specificUtiltity]
                    if (utily instanceof Object) {
                        await recursiveUtillitySearch(utily, specificUtiltity, 0, req)
                    }
                } else {
                    for (let i = 0; i < Object.keys(utilyes).length; i++) {                                                            
                        let utily = utilyes[Object.keys(utilyes)[i]]
                        if (utily instanceof Object) {
                            await recursiveUtillitySearch(utily, Object.keys(utilyes)[i], 0, req)
                        }
                    }
                }
                logger.output("--end--")
                req.handler.respond(req.handler.temp, false)
            } catch (err) {
                logger.announceError(err, req)
                //res.sendStatus(500);
            }
        }
    },
    // caca2: class extends template.Route{
    //     constructor() {
    //         const route = "deliciuTest"
    //         super(route, undefined, {RESTRICTED: false});
    //     }
    //     async GET(req, res) {
    //         try {
    //             req.handler.updateReqStatus(req.reqID, "test test", new req.utillities.gomag.class.g_class())
    //             // let resp = await req.utillities.gomag.orders.get(req.configs.customSettings.deliciu.gomag["url"], req.configs.customSettings.deliciu.gomag["api_key"], { statusIds: req.configs.customSettings.deliciu.gomag["getStatuses"] })
    //             // req.handler.updateReqStatus(req.reqID, "orders", resp.data)
    //             // resp = await req.utillities.gomag.products.get(req.configs.customSettings.deliciu.gomag["url"], req.configs.customSettings.deliciu.gomag["api_key"], { statusIds: req.configs.customSettings.deliciu.gomag["getStatuses"] })
    //             // req.handler.updateReqStatus(req.reqID, "products", resp.data)
    //             res.send(req.reqID);
    //         } catch (err) {
    //             logger.announceError(err, req)
    //             res.sendStatus(500);
    //         }
    //     }
    // },
}

