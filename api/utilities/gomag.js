const template = require("../routes/template")
const requestsLib = require("./request")
const apiTemplates = require("./apiTemplates");
const logger = require("../logger");
class gomag extends apiTemplates.site{
    #apiKeys
    constructor(configs, apiKeys) {
        super(configs)
        this.#apiKeys = (apiKeys == undefined) ? {} : apiKeys
    }

    set #configs(newVal) {
        super.setConfigs(this, newVal)
    }
    get #configs() {
        return super.getConfigs(this)
    }
    //this is a private method
    //it's porpouse is to handle different keys for different routes, as the gomag api can use different keys for orders, products, etc..
    #getApiKey(route) {
        if (typeof this.#apiKeys == typeof {}) {
            //example object for apiKeys
            /*
            {
                "/api/v1/product/read/json": "api_key"
                "/api/v1/product/write/json": "api_key2"
            }
            */
            return this.#apiKeys[route]
        }else if (typeof this.#apiKeys == typeof "") {
            return this.#apiKeys
        }
    }
    //all params are from https://apidocs.gomag.ro/
    #configChecker() {
        //performs checks on all configs
        if (this.#configs.api_key == undefined) {
            throw "GOMAG OBJECT does not have api_key"
        }
        if (this.#configs.url == undefined) {
            throw "GOMAG OBJECT does not have base url"
        }
    }
    
    orders = {
        get: async (paramObj, extraParams = {}) => {
            let params = { // extra checks that CONVIENIENTLY(foreshadowing) won't throw an error if they fail :)
                date: paramObj.date,
                number: (paramObj.number != undefined) ? paramObj.number.site : undefined,
                statusIds: (paramObj.statusId != undefined) ? paramObj.statusId.site : undefined, 
                customer: (paramObj.customer != undefined ) ? ((paramObj.customer.id != undefined) ? paramObj.customer.id.site : undefined) : undefined ,
            } 
            const route = "/api/v1/order/read/json"
            const configs = this.#configs
            let apiKey = this.#getApiKey(route)
            let headers = {
                "Apikey": apiKey,
            }
            
            let result = await requestsLib.GET(configs.url + route, headers, params)
            // default is first item recieved
            //let data = result.data.orders[Object.keys(result.data.orders)[0]]
            // now we set the results
            let finalRes = []
            for (let data of Object.entries(result.data.orders)) {
                let newObj = new apiTemplates.order()
                data = data[1]
                newObj.date = paramObj.date
                newObj.number.site = (paramObj.number != undefined) ? paramObj.number.site : undefined
                newObj.statusId.site = (paramObj.statusId != undefined) ? paramObj.statusId.site : undefined
                newObj.id.site = data.id
                newObj.additionalAttributes.site.number = data.number
                newObj.date = data.date
                newObj.additionalAttributes.site.invoice = data.invoice
                newObj.total = data.total
                newObj.additionalAttributes.site.status = data.status
                newObj.statusId = data.statusId
                newObj.additionalAttributes.site.source = data.source
                //sales_channel scrapped, don't think i need it
                newObj.additionalAttributes.site.sales_agent = data.sales_agent
                newObj.currency = data.currency
                newObj.additionalAttributes.site.payment = data.payment
                newObj.delivery = data.delivery
                newObj.address = new apiTemplates.address(undefined, data.shipping.firstname, data.shipping.lastname, undefined, undefined, data.shipping.phone, data.shipping.email, data.shipping.country + " " + data.shipping.region + " " + data.shipping.city + " " + data.shipping.address, data.shipping.zipcode)
                //billing scrapped, im lazy
                //this will replace the order items with product instances(param.Obj.items )
                let items = data.items
                let result2 = []
                for (let item of Object.entries(items)) {
                    item = item[1]// item comes as [index, object]
                    let newProduct = new apiTemplates.product(this)
                    newProduct.id.site = item.id
                    newProduct.SKU = item.sku
                    newProduct.name = item.name
                    newProduct.price = item.price
                    newProduct.VAT = item.vat
                    newProduct.quantityOrdered = Number(item.quantity)
                    result2.push(newProduct)
                }
                newObj.items = result2
                finalRes.push(newObj)
            }
            return finalRes
            //discounts scrapped, im lazy
            //carrier scrapped, im lazy
        },
        set: async() =>{}
    }
    products = {
        get: async (paramObj, extraParams = {}) => {
            let params = { // extra checks that CONVIENIENTLY(foreshadowing) won't throw an error if they fail :)
                id: paramObj.id.site,
                sku: paramObj.SKU,
                addVersions: extraParams.addVersions
            } 
            const route = "/api/v1/product/read/json"
            const configs = this.#configs
            let apiKey = this.#getApiKey(route)
            let headers = {
                "Apikey": apiKey,
            }
            
            let result = await requestsLib.GET(configs.url + route, headers, params)
            //default is first item recieved
            let data = result.data
            let products = data.products
            let rprdct = products[Object.keys(products)[0]]//short for resultedProduct
            function loadProductFromSite(product, siteProduct) {// made this func to prepare for when i add saving products(i need to load versions)
                // now we set the results
                product.id.site = siteProduct.id
                product.SKU = siteProduct.sku
                product.name = siteProduct.name
                product.description = siteProduct.description
                product.stock = siteProduct.stock
                //paramObj.categories // add this !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                product.price = siteProduct.price
                product.basePrice = siteProduct.base_price
                product.VAT = siteProduct.vat
                if (siteProduct.attributes != undefined) {
                    for (let attribute of siteProduct.attributes) {
                        if (attribute.name == 'COD FZ (invizibil in site)') {
                            product.providerAssociatedProductId = attribute.value
                        }
                    }
                }
            }
            let newProduct = new apiTemplates.product(paramObj.site, paramObj.erp)
            loadProductFromSite(newProduct, rprdct)
            return newProduct
        },
        set: async (paramObj, extraParams = {}) => {
            if (paramObj.sku != undefined) {
                //use SKU
                if (paramObj.id.site != undefined) {
                    // use SKU/ID
                } else {
                    // use only SKU
                }
            } else {
                // use ID
                if (paramObj.id.site != undefined) {
                    // use ID
                } else {
                    // no SKU/ID --> throw error
                    throw "Product can't be saved to site without ID/SKU(no ID/SKU provided to product.loadFrom.site)"
                }
            }
        }
    }
    customer = {
        get: async (paramObj, extraParams = {}) => {
            let params = { // extra checks that CONVIENIENTLY(foreshadowing) won't throw an error if they fail :)
                id: paramObj.id.site,
                sku: paramObj.SKU,
                addVersions: extraParams.addVersions
            } 
            const route = "/api/v1/customer/read/json"
            const configs = this.#configs
            let headers = {
                "Apikey": apiKey,
            }
            
            let result = await requestsLib.GET(configs.url + route, headers, params)
        }
    }
}
module.exports = {
    tester: class extends template.Utillity{
        constructor() {
            super("gomagTester")
        }
        async test(req) {
            let result = []
            let testOrder = new req.utillities.template.order(new gomag(req.configs.customSettings.deliciu.gomag, req.configs.customSettings.deliciu.gomag.api_key))
            await testOrder.loadFrom.site({ loadItems: true })
            result.push(testOrder)
            let testProduct = new req.utillities.template.product(new gomag(req.configs.customSettings.deliciu.gomag, req.configs.customSettings.deliciu.gomag.api_key))
            testProduct.id.site = 16275
            await testProduct.loadFrom.site()
            result.push(testProduct)
            let orderList = new req.utillities.template.orderList(new gomag(req.configs.customSettings.deliciu.gomag, req.configs.customSettings.deliciu.gomag.api_key))
            orderList.statusId.site = 3
            await orderList.loadFrom.site()
            result.push(orderList)
            return result
        }
        async get(apiUrl, apiKey, params){
            let headers = {
                "Apikey": apiKey,
            }
            return await requestsLib.GET(apiUrl + "/order/read/json", headers, params)
        }
    },
    gomagClass: class extends template.Utillity{
        constructor () {
            super("gomag")
            this.template = gomag
        }
        
    },
    getAllProductsTester: class extends template.Utillity{
        constructor() {
            super("gomagProductsTester")
        }
        async test(req) {
            let result = []
            for (let status of req.configs.customSettings.deliciu.gomag.getStatuses) {
                let orders = new req.utillities.template.orderList(new gomag(req.configs.customSettings.deliciu.gomag, req.configs.customSettings.deliciu.gomag.api_key))
                orders.statusId.site = status
                await orders.loadFrom.site()
                console.log(orders.orders.length)
                result = result.concat(orders.orders)
            }
            await req.utillities.cache.write("gomag-orders", result, req)
        }
    },
    // orders: class extends template.Utillity{
    //     constructor() {
    //         super("gomag.orders")
    //     }
    //     async test(req) {
    //         return (await this.get(req.configs.customSettings.deliciu.gomag.url, req.configs.customSettings.deliciu.gomag.api_key)).data
    //     }
    //     async get(apiUrl, apiKey, params){
    //         let headers = {
    //             "Apikey": apiKey,
    //         }
    //         return await requestsLib.GET(apiUrl + "/order/read/json", headers, params)
    //     }
    // },
    // products: class extends template.Utillity{
    //     constructor() {
    //         super("gomag.products")
    //     }
    //     async test(req) {
    //         let result = await this.get(req.configs.customSettings.deliciu.gomag.url, req.configs.customSettings.deliciu.gomag.api_key)
    //         return result.data
    //     }
    //     async get(apiUrl, apiKey, params){
    //         let headers = {
    //             "Apikey": apiKey,
    //         }
    //         return await requestsLib.GET(apiUrl + "/product/read/json", headers, params)
    //     }
    // },
}