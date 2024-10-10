const template = require("../routes/template")
const logger = require("../logger")
const { first, zip } = require("lodash")


function assignDefined(target, source) {

    Object.keys(source).map((key, index) => {
        if (source[key] !== undefined) {
            target[key] = source[key];
        }
    });

    return target;
}



class Product {
    constructor(siteInstance, erpInstance) {
        this.erp = erpInstance
        this.site = siteInstance
    }
    SKU;
    stock;
    name;
    id = {
        erp: undefined,
        site: undefined
    }
    description;
    provider;
    price;
    VAT;
    additionalAttributes;
    basePrice;
    quantityOrdered;
    orderedFromSupplier;
    versions = {
        erp: undefined,
        site: undefined
    }
    providerAssociatedProductId;
    loadFrom = {
        site: async (extraParams) => {
            assignDefined(this, await this.site.products.get(this, extraParams))
        },
        erp: async (extraParams) => {
            await this.erp.products.get(this, extraParams)
        },
    }
    saveTo = {
        site: async () => {
            await this.site.products.set(this)
        },
        erp: async (extraParams) => {
            await this.erp.products.set(this, extraParams)
        },
    }
}

class ProductList {
    constructor(siteInstance, erpInstance) {
        this.erp = erpInstance
        this.site = siteInstance
        this.products = []
    }
    statusId = {
        site: undefined,
        erp: undefined,
    }
    customer;
    loadFrom = {
        site: async (extraParams = {}) => {
        },
        erp: async (extraParams = {filters: {}}) => {
            let skuList = extraParams["filters"]["skuList"];
            let res = await this.erp.products.getAll(undefined, extraParams)
            this.products = res;
        },
    }
    saveTo = {
        site: async () => {
            await this.site.orders.set(this)
        },
        erp: async () => {
            await this.erp.orders.set(this)
        },
    }
}

class OrderList {
    constructor(siteInstance, erpInstance) {
        this.erp = erpInstance
        this.site = siteInstance
        this.orders = []
    }
    statusId = {
        site: undefined,
        erp: undefined,
    }
    customer;
    loadFrom = {
        site: async (extraParams = {}) => {
            let res = await this.site.orders.get(this, extraParams)
            for (let order of res) {
                order.site = this.site
                order.erp = this.erp
                for (let item of order.items) {
                    if (extraParams["loadItems"] == true) {// if this is true every item in the order will be loaded from the site with all the attributes, if not it's going to remain only with the attributes it came with
                        await item.loadFrom.site()
                    }
                }
            }
            this.orders = res
        },
        erp: async () => {
            await this.erp.orders.get(this)
        },
    }
    saveTo = {
        site: async () => {
            await this.site.orders.set(this)
        },
        erp: async () => {
            await this.erp.orders.set(this)
        },
    }
}

class Order {
    constructor(siteInstance, erpInstance) {
        this.erp = erpInstance
        this.site = siteInstance
    }
    date; // implement standardized epoch dates
    total;
    customer;
    items;
    discounts;
    address;
    additionalAttributes = {
        site: {},
        erp: {}
    };
    currency; // implement standardized currencies
    deilvery; // implement standardized values
    id = {
        erp: undefined,
        site: undefined
    }
    number = {
        erp: undefined,
        site: undefined
    }
    statusId = {
        erp: undefined,
        site: undefined
    }
    loadFrom = {
        site: async (extraParams = {}) => {
            let res = await this.site.orders.get(this, extraParams)
            assignDefined(this, res[0])
            if (res.length > 1) {
                logger.warn("Site returned multiple orders from query, but this object is a not a list.")
            }
            for (let item of this.items) {
                if (extraParams["loadItems"] == true) {// if this is true every item in the order will be loaded from the site with all the attributes, if not it's going to remain only with the attributes it came with
                    await item.loadFrom.site()
                }
            }
        },
        erp: async () => {
            await this.erp.orders.get(this)
        },
    }
    saveTo = {
        site: async () => {
            await this.site.orders.set(this)
        },
        erp: async () => {
            await this.erp.orders.set(this)
        },
    }
}

class Customer {
    constructor(siteInstance, erpInstance) {
        this.erp = erpInstance
        this.site = siteInstance
    }
    firstname;
    lastname;
    phone;
    fax;
    email;
    addresses;
    additionalAttributes;
    id = {
        erp: undefined,
        site: undefined
    }
    loadFrom = {
        site: async () => {
            await this.site.customers.get(this)
        },
        erp: async () => {
            await this.erp.customers.get(this)
        },
    }
    saveTo = {
        site: async () => {
            await this.site.customers.set(this)
        },
        erp: async () => {
            await this.erp.customers.set(this)
        },
    }
}

class Address {
    constructor(type, firstname, lastname, company_name, company_code, phone, email, shippingAddress, zip_code, invoiceAddress) {
        this.type = type
        this.firstname = firstname;
        this.lastname = lastname;
        this.company_name = company_name;
        this.company_code = company_code;
        this.phone = phone;
        this.email = email;
        this.shippingAddress = shippingAddress;
        this.zip_code = zip_code;
        this.invoiceAddress = invoiceAddress;
    }
    type;
    firstname;
    lastname;
    company_name;
    company_code;
    phone;
    email;
    address;
    zip_code;
}

class Erp {
    #configs
    constructor(configs) {
        this.#configs = configs
    }
    getConfigs(origin) {
        if (origin instanceof Erp) {
            return this.#configs
        }
        return "Configs censored"
    }
    setConfigs(origin, newVal) {
        if (origin instanceof Erp) {
            this.#configs = newVal
        }
        return "Configs censored"
    }
    orders = {
        get: async function () { },
        set: async function () { },
    }
    products = {
        get: async function () { },
        set: async function () { },
    }
    customers = {
        get: async function () { },
        set: async function () { },
    }
}
class Site {
    #configs
    constructor(configs) {
        this.#configs = configs
    }
    // theese check if caller is a Site instance(ex: gomag instance)
    // or if it's another library that's trying to print this to the screen

    // prevents dump mistakes/exploits that would allow people to have the configs 
    // sent to them
    // THE CONFIGS CONTAIN THE API KEYS
    getConfigs(origin) {
        if (origin instanceof Site) {
            return this.#configs
        }
        return "Configs censored"
    }
    setConfigs(origin, newVal) {
        if (origin instanceof Site) {
            this.#configs = newVal
        }
        return "Configs censored"
    }
    orders = {
        get: async function () { },
        set: async function () { },
    }
    products = {
        get: async function () { },
        set: async function () { },
    }
    customers = {
        get: async function () { },
        set: async function () { },
    }
}



module.exports = {
    site: Site,
    erp: Erp,
    product: Product,
    order: Order,
    orderList: OrderList,
    customer: Customer,
    address: Address,
    template: class extends template.Utillity {
        constructor() {
            super("template")
            this.site = Site;
            this.erp = Erp;
            this.product = Product;
            this.productList = ProductList;
            this.order = Order;
            this.orderList = OrderList;
            this.customer = Customer;
            this.address = Address;
        }
    }
}