const template = require("./template")
const logger = require("../logger");
var fs = require('fs'); 
var xl = require('excel4node');
const { prependListener } = require("process");
const currentPath = process.cwd();
const tasker = require("tasking-pm");
const apiTemplates = require("../utilities/apiTemplates");
tasker.setConfigs(300 * 100, 10)
tasker.setLogger({
    info(msg) {
        logger.major_event(msg)
    },
    error(msg) {
        logger.announceError(msg)
    },
    warn(msg) {
        logger.warn(msg)
    }
})
module.exports = {
    website: class extends template.Route { 
        constructor() {
            // MAKE SURE TO HAVE THIS SLASH
            const route = "generateFile"
            // question mark means it can be empty so just parent path
            const params = undefined
            const options = {
                IGNORE_TOKEN: true, // ignore auth token cuz browser can't send it so i have to use cookies
                OWN_ALL_CHILD_ROUTES: false, // this will make it so this route's properties will apply to all of it's children
                DONT_LOG_ACCESS: false,
                CHECK_COOKIE: false,
                RESTRICTED: false,
                // COOKIE_FAILURE_CALLBACK: function (req, res) {
                //     const loginRoute = "/api/manager/login"
                //     const childRoute = req.params.name
                //     const orgPath = req.originalUrl
                //     if (orgPath != loginRoute) {
                //         res.redirect(loginRoute)
                //     } else if (orgPath == loginRoute) {
                //         res.sendFile(managerGUIFiles + "login.html")
                //     }
                // },
            }
            super(route, params, options);
        }
        async GET(req, res) {
            res.sendFile(currentPath + "/routes/fileGenPage.html")
        }
    },
    transferProductPricesFromSiteToNextup: class extends template.Route {
        constructor() {
            const route = "transferProductPricesFromSiteToNextup"
            // question mark means it can be empty so just parent path
            const params = undefined
            const options = {
                IGNORE_TOKEN: true, // ignore auth token cuz browser can't send it so i have to use cookies
                OWN_ALL_CHILD_ROUTES: false, // this will make it so this route's properties will apply to all of it's children
                DONT_LOG_ACCESS: false,
                CHECK_COOKIE: false,
                RESTRICTED: false,
                // COOKIE_FAILURE_CALLBACK: function (req, res) {
                //     const loginRoute = "/api/manager/login"
                //     const childRoute = req.params.name
                //     const orgPath = req.originalUrl
                //     if (orgPath != loginRoute) {
                //         res.redirect(loginRoute)
                //     } else if (orgPath == loginRoute) {
                //         res.sendFile(managerGUIFiles + "login.html")
                //     }
                // },
            }
            super(route, params, options);
        }
        async GET(req, res) {
            let initPage = undefined
            try {
                initPage = (await req.utillities.reqs.get(req.configs.customSettings.deliciu.gomag.url + "/api/v1/product/read/json", {Apikey: req.configs.customSettings.deliciu.gomag.api_key}, {page: 1})).data
                console.log("caca")
            } catch (err) {
                console.log(err)
            }
            let pages = initPage["pages"]
            let run = true;
            let curPage = 1;
            let promises = [];
            tasker.setLogger({
                info(msg) {
                    console.log(msg)
                },
                warn(msg) {
                    console.log(msg)
                },
                error(msg) {
                    console.log(msg)
                }
            })
            let reqs = require("../utilities/request")
            let apiTemp = require("../utilities/apiTemplates");
            let nextup = require("../utilities/nextup")
            let nInstance = await new nextup.nextupClass().template.login(req)
            while (run) {
                console.log(curPage);
                let page = (await reqs.GET(req.configs.customSettings.deliciu.gomag.url + "/api/v1/product/read/json", { Apikey: req.configs.customSettings.deliciu.gomag.api_key }, { page: curPage })).data
                //console.log(page.products)
                for (let productKey of Object.keys(page.products)) {
                    let product = page.products[productKey]
                    let newProduct = new apiTemp.product()
                    newProduct.price = product.price
                    newProduct.basePrice = product.base_price
                    newProduct.erp = nInstance
                    // await newProduct.loadFrom.erp();
                    // await newProduct.saveTo.erp();
                }
                if (curPage >= pages) {
                    run = false;
                }
                curPage += 1;
            }
            let isDone = Promise.all(promises);
            await isDone;
            res.send();
        }
    },
    fileGenRoute: class extends template.Route { 
        constructor() {
            // MAKE SURE TO HAVE THIS SLASH
            const route = "fileGen"
            // question mark means it can be empty so just parent path
            const params = undefined
            const options = {
                IGNORE_TOKEN: true, // ignore auth token cuz browser can't send it so i have to use cookies
                OWN_ALL_CHILD_ROUTES: false, // this will make it so this route's properties will apply to all of it's children
                DONT_LOG_ACCESS: false,
                CHECK_COOKIE: false,
                RESTRICTED: false,
                // COOKIE_FAILURE_CALLBACK: function (req, res) {
                //     const loginRoute = "/api/manager/login"
                //     const childRoute = req.params.name
                //     const orgPath = req.originalUrl
                //     if (orgPath != loginRoute) {
                //         res.redirect(loginRoute)
                //     } else if (orgPath == loginRoute) {
                //         res.sendFile(managerGUIFiles + "login.html")
                //     }
                // },
            }
            super(route, params, options);
        }
        async GET(req, res) {
            try {
                fs.unlinkSync(currentPath + "/Result.xlsx");
            }catch(err){}
            let gomagInstance = new req.utillities.gomag.template(req.configs.customSettings.deliciu.gomag, req.configs.customSettings.deliciu.gomag.api_key)
            let nextupinstnace = await req.utillities.nextup.template.login(req)

            let cacaMaca = new req.utillities.template.productList(undefined, nextupinstnace)
            let asyncCacaMaca = cacaMaca.loadFrom.erp();
            let getStatues = req.configs.customSettings.deliciu.gomag.getStatuses
            let orders = []
            let awaitPromises = []
            for (let status of getStatues) {
                awaitPromises.push(new Promise(async (resolve, reject) => {
                    req.handler.markEvent("Getting orders from gomag", "status: " + status)
                    let orderList = new req.utillities.template.orderList(gomagInstance, nextupinstnace)
                    orderList.statusId.site = status
                    await orderList.loadFrom.site()
                    orders = orders.concat(orderList.orders)
                    resolve()
                }
                ))
            }
            //console.log(awaitPromises)
            await Promise.all(awaitPromises)
	    //console.log(awaitPromises)
            req.utillities.cache.write("orders-gomag", orders, req)
            let products = {}
            let count = 0
            for (let order of orders) {
                req.handler.markEvent("Compiling list for nextup", count + " / " + orders.length)
                for (let item of order.items) {
                    if (products[item.SKU] != undefined) {
                        products[item.SKU].quantityOrdered += item.quantityOrdered;
                    } else {
                        products[item.SKU] = item
                    }
                }
                count += 1;
            }

            let index = 0
            let product = undefined
            let resultingList = []
            let providerFeed = (await req.utillities.excel.loadWorkbook(req.configs.customSettings.providers.novapan.feedPath, req.configs.customSettings.providers.novapan.feedName, "csv")).sheets[0].recordsFromTable(req)
            let proccessedProviderFeed = {}
            req.handler.markEvent("Adding providers", "")
            for (let tmpPrdct of providerFeed) {
                if (tmpPrdct["Cod produs (SKU)"] != undefined) {
                    if (proccessedProviderFeed[tmpPrdct["Cod produs (SKU)"]] != undefined) {
                        proccessedProviderFeed[tmpPrdct["Cod produs (SKU)"]] = Number(proccessedProviderFeed[tmpPrdct["Cod produs (SKU)"]]) + Number(tmpPrdct["Cantitate"])
                    } else {
                        proccessedProviderFeed[tmpPrdct["Cod produs (SKU)"]] = tmpPrdct["Cantitate"]
                    }
                }
            }
            let furnizori = (await req.utillities.excel.loadWorkbook(req.configs.customSettings.providers.filePath, req.configs.customSettings.providers.fileName, req.configs.customSettings.providers.fileExtension)).sheets[0].recordsFromTable(req)
            let proccessedFurnizori = {}
            for (let tmpPrdct of furnizori) {
                proccessedFurnizori[tmpPrdct["Cod Produs (SKU)"]] = tmpPrdct 
            }
            req.utillities.cache.write("cacalaca", proccessedFurnizori, req)
            req.handler.markEvent("Getting stocks from NextUp", "")
            
            let len = Object.keys(products).length;
	//console.log(asyncCacaMaca);
            await asyncCacaMaca;
	//console.log(asyncCacaMaca);
            for (let productSKU of Object.keys(products)) {
                index += 1
                product = products[productSKU]
                product.erp = nextupinstnace
                product.orderedFromSupplier = 0
                product.stock = (cacaMaca.products[productSKU] != undefined) ? cacaMaca.products[productSKU].stock : undefined;
                if (product.stock == undefined) {
                    logger.announceError("Product not found in ERP, setting stock to 0")
                    product.stock = 0
                }
                product.orderedFromSupplier = (proccessedProviderFeed[productSKU] != undefined) ? proccessedProviderFeed[productSKU] : 0
                //console.log(product.orderedFromSupplier)
                resultingList.push(product)
            }
            var wb = new xl.Workbook();
            var ws = wb.addWorksheet('Produse de comandat');
            let highlightedRow = false
            // toOrder is a custom parameter which will get replaced with stock-quantityOrdered
            let shownParameters = ["SKU", "name", "toOrder", "stock", "quantityOrdered", "orderedFromSupplier", "comestibil", "furnizor"]
            for (let i = 0; i < resultingList.length; i++) {
                highlightedRow = false
                let updI = i + 2// offset all rows by 1 because the first one is headers
                if ((updI - 1) % 2 == 0) {
                    highlightedRow = true
                }
                var style = wb.createStyle({
                    font: {
                        color: '#000000',
                        size: 12,
                    }
                });
                let curCounter = 1
                let curProd = resultingList[i]
                for (let param of shownParameters) {
                    if (i == 0) {
                        ws.cell(1, curCounter).string(param).style(style)
                    }
                    if (param == "toOrder") {
                        let toOrderQuant = curProd["stock"] - curProd["quantityOrdered"] + Number(curProd["orderedFromSupplier"])
                        if (toOrderQuant < 0) {
                            ws.cell(updI, curCounter).number(Number(toOrderQuant)).style(style).style({ font: { size: 18, colour: "#FF2D00", bold: true } })
                        } else {
                            ws.cell(updI, curCounter).number(Number(toOrderQuant)).style(style)
                        }
                        
                    } else if (param == "comestibil") {
                        ws.cell(updI, curCounter).string((proccessedFurnizori[curProd.SKU] == undefined) ? "Nu gasit" : (proccessedFurnizori[curProd.SKU]["COM/NonCOM"] == undefined) ? "Nu gasit" : proccessedFurnizori[curProd.SKU]["COM/NonCOM"]).style(style)
                    } else if (param == "furnizor") {
                        ws.cell(updI, curCounter).string((proccessedFurnizori[curProd.SKU] == undefined) ? "Nu gasit" : (proccessedFurnizori[curProd.SKU]["Furnizor"] == undefined) ? "Nu gasit" : proccessedFurnizori[curProd.SKU]["Furnizor"]).style(style)
                    } else if (param == "stock" || param == "quantityOrdered" || param == "orderedFromSupplier") {
                        ws.cell(updI, curCounter).number(Number(curProd[param])).style(style)
                    } else if (param == "SKU") {
                        if (isNaN(curProd[param])) {
                            ws.cell(updI, curCounter).string(curProd[param].toString()).style(style)
                        } else {
                            ws.cell(updI, curCounter).number(Number(curProd[param])).style(style)
                        }
                    } else {
                        ws.cell(updI, curCounter).string(curProd[param].toString()).style(style)
                    }
                    curCounter += 1;
                }
            }
            await wb.write('Result.xlsx');
            setTimeout(() => {
                res.sendFile(currentPath + "/Result.xlsx");;
                logger.announce("Finnished generating the file")
                req.handler.delete(false, true)
            }, 500)
            //res.sendFile(currentPath + "/Result.xlsx");
            setTimeout(() => {
                fs.unlinkSync(currentPath + "/Result.xlsx");
            }, 300000)
        }
    }
}