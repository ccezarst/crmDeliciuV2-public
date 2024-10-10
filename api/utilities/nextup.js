const reqs = require("./request")
const template = require("../routes/template")
const apiTemplates = require("./apiTemplates")
const logger = require("../logger")
const cache = new (require("./cache")).cacheClass()

class NextUp extends apiTemplates.erp{
    constructor(req, authToken) {
        super(req.configs)
        this.authToken = (authToken == undefined) ? "" : authToken
    }
    set #configs(newVal) {
        super.setConfigs(this, newVal)
    }
    get #configs() {
        return super.getConfigs(this)
    }
    async login() {// convieniently this can use the raw configs with no name change :)
        await this.logout({configs: this.configs})
        let username = this.configs.customSettings.nextup["username"]
        let password = this.configs.customSettings.nextup["password"]
        let database = this.configs.customSettings.nextup["database"]
        let nextupIP = this.configs.customSettings.nextup["ip"]
        let nextupPort = this.configs.customSettings.nextup["port"]
        this.standardPath = "http://" + nextupIP + ":" + nextupPort + "/NextUpServices/msc/POST"
        const body = {
            "Method": "GetAuthenticationToken",
            "Params": {
                "UserName": username,
                "Password": password,
                "Database": database
            }
        }
        let res = await reqs.POST("http://" + nextupIP + ":" + nextupPort + "/NextUpServices/msc/POST", {
            // REMEMBER TO SET CONTENT-TYPE TO TEXT/PLAIN
            // OTHERWISE YOU'RE GOING TO GET 400 RESPONSE STATUS
            "content-type": "text/plain"
        }, undefined, body)
        let data = res.data
        if (data.Error == null) {
            this.authToken = data.Result
            logger.announce("Logged into nextup")
            cache.write("nextup_token", {token: data.Result}, {configs: this.configs})
        } else {
            logger.announceError("Failed to login to NEXTUP")
            logger.announceError(data.Error)
            throw data.Error;
        }
    }

    async logout(req) {// convieniently this can use the raw configs with no name change :)
        logger.announce("Logging out of nextup.....")
        if(this.authToken != "" ) { this.authToken = cache.read("nextup_token", req)["token"]}
        if (this.authToken != "") {
            let nextupIP = this.configs.customSettings.nextup["ip"]
            let nextupPort = this.configs.customSettings.nextup["port"]
            this.standardPath = "http://" + nextupIP + ":" + nextupPort + "/NextUpServices/msc/POST"
            const body = {
                "Method": "Logout",
                "Params": {},
                AuthenticationToken:this.authToken,
            }
            let res = await reqs.POST("http://" + nextupIP + ":" + nextupPort + "/NextUpServices/msc/POST", {
                // REMEMBER TO SET CONTENT-TYPE TO TEXT/PLAIN
                // OTHERWISE YOU'RE GOING TO GET 400 RESPONSE STATUS
                "content-type": "text/plain"
            }, undefined, body)
            let data = res.data
            if (data.Error == null) {
                cache.write("nextup_token", {}, req)
                logger.announce("Logged out of nextup")
            } else {
                logger.announceError("Failed to logout of NEXTUP")
                logger.announceError(JSON.stringify(data.Error))
                throw data.Error;
            }
        }
    }

    static async logout(req) {// convieniently obj can use the raw configs with no name change :)
        logger.announce("Logging out of nextup.....")
        let authToken = cache.read("nextup_token", req)["token"]
        if (authToken != "") {
            let nextupIP = req.configs.customSettings.nextup["ip"]
            let nextupPort = req.configs.customSettings.nextup["port"]
            const body = {
                "Method": "Logout",
                "Params": {},
                AuthenticationToken: authToken,
            }
            let res = await reqs.POST("http://" + nextupIP + ":" + nextupPort + "/NextUpServices/msc/POST", {
                // REMEMBER TO SET CONTENT-TYPE TO TEXT/PLAIN
                // OTHERWISE YOU'RE GOING TO GET 400 RESPONSE STATUS
                "content-type": "text/plain"
            }, undefined, body)
            let data = res.data
            if (data.Error == null) { 
                cache.write("nextup_token", {}, req)
                logger.announce("Logged out of nextup")
            } else {
                logger.announceError("Failed to logout of NEXTUP")
                logger.announceError(JSON.stringify(data.Error))
                throw data.Error;
            }
        }
    }

    static async login(req) {// convieniently this can use the raw configs with no hash change :)
        let instance = new NextUp(req)
        await instance.logout(req)
        let username = req.configs.customSettings.nextup["username"]
        let password = req.configs.customSettings.nextup["password"]
        let database = req.configs.customSettings.nextup["database"]
        let nextupIP = req.configs.customSettings.nextup["ip"]
        let nextupPort = req.configs.customSettings.nextup["port"]
        this.standardPath = "http://" + nextupIP + ":" + nextupPort + "/NextUpServices/msc/POST"
        const body = {
            "Method": "GetAuthenticationToken",
            "Params": {
                "UserName": username,
                "Password": password,
                "Database": database
            }
        }
        let res = await reqs.POST(this.standardPath,{
            // REMEMBER TO SET CONTENT-TYPE TO TEXT/PLAIN
            // OTHERWISE YOU'RE GOING TO GET 400 RESPONSE STATUS
            "content-type": "text/plain"
        }, undefined, body)
        let data = res.data
        if (data.Error == null) {
            instance.authToken = data.Result
            instance.standardPath = "http://" + nextupIP + ":" + nextupPort + "/NextUpServices/msc/POST"
            cache.write("nextup_token", { token: data.Result }, req)
            logger.announce("Logged into nextup")
            return instance
        } else {
            logger.announceError("Failed to login to NEXTUP")
            logger.announceError(data.Error)
            throw data.Error;
        }
    }
    products = {
        get: async (orgObj, extraParams = {}) => {
            const body = {
                "AuthenticationToken": this.authToken,
                "Method": "GetArticleByCode",
                "Params": {
                    "code": orgObj.SKU,
                    "includeArticleWarehouseStock": true,
                }
            }
            let paramObj = new apiTemplates.product()
            let result = await reqs.POST(this.standardPath,{
                // REMEMBER TO SET CONTENT-TYPE TO TEXT/PLAIN
                // OTHERWISE YOU'RE GOING TO GET 400 RESPONSE STATUS
                "content-type": "text/plain"
            }, undefined, body)
            const decodedData = result.data;
            if (decodedData.Error == null && decodedData.Result != null) {
                let product = decodedData.Result
                let Warehouses = product.ArticlesWarehouseStocks
                if (Warehouses != undefined && Warehouses != null) {
                    for (let Warehouse of Warehouses) {
                        if (Warehouse.WarehouseName == this.#configs.customSettings.nextup.warehouse) {
                            paramObj.stock = Warehouse.StockQuantity
                        }
                    }
                } else {
                    paramObj.stock = 0
                }
                paramObj.name = product.Name
                paramObj.id.erp = product.Id
                //paramObj.price = product.LastPurchasePriceWithoutVat
                paramObj.VAT = product.VatInQoutaName
                return paramObj;
            } else {
                logger.announceError("Error thrown from NextUp products.get function")
                logger.announceError("Failed to get article from NextUp")
                logger.announceError("Article code: " + paramObj.SKU)
                logger.announceError("Auth token: " + this.authToken)
                logger.announceError("NextUp returned: " + JSON.stringify(decodedData["Error"]))
            }
        },
        getAll: async (orgObj, extraParams = {}) => {
            const body = {
                "AuthenticationToken": this.authToken,
                "Method": "GetAllStocksForArticles",
                "Params": {
                    "articleType": 1,
                }
            }
            let resultinglist = {}
            let result = await reqs.POST(this.standardPath,{
                // REMEMBER TO SET CONTENT-TYPE TO TEXT/PLAIN
                // OTHERWISE YOU'RE GOING TO GET 400 RESPONSE STATUS
                "content-type": "text/plain"
            }, undefined, body)
            const decodedData = result.data;
            if (decodedData.Error == null && decodedData.Result != null) {
                let reqResult = decodedData.Result;
                for (let i = 0; i < reqResult.length; i++){
                    let paramObj = new apiTemplates.product()
                    let product = reqResult[i];
                    if (product.WarehouseName == this.#configs.customSettings.nextup.warehouse) {
                        paramObj.stock = product.StockQuantity
                    } else {
                        paramObj.stock = 0
                    }
                    paramObj.name = product.ArticleName
                    paramObj.id.erp = product.ArticleId
                    resultinglist[product["ArticleCode"]] = paramObj;
                }
            } else {
                logger.announceError("Error thrown from NextUp products.getAll function")
                logger.announceError("Failed to getAll article from NextUp")
                logger.announceError("Article code: " + paramObj.SKU)
                logger.announceError("Auth token: " + this.authToken)
                logger.announceError("NextUp returned: " + JSON.stringify(decodedData["Error"]))
                return;
            }
            return resultinglist;
        },
        set: async(paramObj, extraParams = {}) =>{
            const body = {
                "AuthenticationToken": this.authToken,
                "Method": "UpdateArticle",
                "Params": {
                    "id": paramObj.id.erp,
                    "name": paramObj.name,
                    "code": paramObj.SKU,
                    "GenericSalePriceEnGross": paramObj.basePrice,
                    "GenericSalePriceWithouthVat ": paramObj.basePrice,
                }
            }
            let result = await reqs.POST(this.standardPath,{
                // REMEMBER TO SET CONTENT-TYPE TO TEXT/PLAIN
                // OTHERWISE YOU'RE GOING TO GET 400 RESPONSE STATUS
                "content-type": "text/plain"
            }, undefined, body)
            const decodedData = result.data;
            if (decodedData.Error == null && decodedData.Result != null) {
                return true;
            } else {
                logger.announceError("Error thrown from NextUp products.set function")
                logger.announceError("Failed to set article to NextUp")
                logger.announceError("Article code: " + paramObj.SKU)
                logger.announceError("Auth token: " + this.authToken)
                logger.announceError("NextUp returned: " + JSON.stringify(decodedData["Error"]))
            }
        }
    }
}

module.exports = {
    auth: class extends template.Utillity {
        constructor() {
            super("nextup-auth")
        }
        async test(req) {
            let reqs = await NextUp.login(req)
            //console.log(reqs)
            return reqs
        }
        async closingProcedure(configs) {
            await NextUp.logout({configs: configs})
        }
    },
    productTest: class extends template.Utillity{
        constructor() {
            super("nextup-productTest")
        }
        async test(req) {
            let product = new req.utillities.template.product(undefined, await NextUp.login(req))
            product.SKU = "823-E0-D94"
            await product.loadFrom.erp()
            return product
        }
    },
    nextupClass: class extends template.Utillity{
        constructor () {
            super("nextup")
            this.template = NextUp
        }
    },
    tester23: class extends template.Utillity{
        constructor () {
            super("tester23")
        }
        async test(req) {
            await req.utillities.reqs.downloadFile("https://cofetarulistet.ro/feed/orders/7d9e1ae88484b77dc60ac5968854ca2d", undefined, undefined, undefined, req)
        }
    },
    cacaTemplate: class extends template.Utillity {
        constructor() {
            super("ligma")
        }
        async test(req) {
            let caca = new req.utillities.template.productList(undefined, await NextUp.login(req))
            await caca.loadFrom.erp()
            return caca.products;
        }
    },
}