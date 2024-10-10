
# TODO:

-- change manager so it uses the user system

-- add a way for people to use the user system and local database easily

-- fix manager cuz currently it's broken / redo it

-- documentation for the command system in the manager

-- documentation for proccess system

-- documentation for utillity system

-- fix https://github.com/CzrCraft/expressJS_api_template/issues/1
# ONLY FILES INSIDE THE ROUTES DIRECTORY WILL BE RUN

# expressJS_api_template
 Basic express JS API template for easy use
 
 **READ https://github.com/CzrCraft/expressJS_api_template/issues/1**
# how 2 use
* have  *NODE JS* installed
* use *npm install* or something like that to install all required packages

# example in proc.js
 
* how this shit works:
*   each route is a child class of the route class thats inside template.js
*   inside the constructor you need to pass the route to the parent class using:
*     super(route_name)
*   after you declared the route, you then declare a function with the name GET or POST or PUT or whatever method you want to get called
*   function should be async

*   and you dont need to initiate the class cuz the template will automatically initiate ur class
*   all u need to do is define it
*   also name don't matter
 
# stuff 2 know:
*     -WHEN USING ROUTE OPTIONS, REMEMBER THAT THE SUPER PARAMETERS ARE ROUTE, PARAMS, THEN THE OPTIONS. IF THE ROUTE DOESN'T HAVE ANY PARAMETERS(aka dynamic routes) PUT UNDEFINED THERE
*    -you can access the configs object by using req.configs
*    -you can place files inside folders and it will still work
*    -also each request will like generate a new proccess wich you can access using req.procID
*    -all of the proccesses functionallity is inside procHandler.js so use that to delete proccesses etc..
*    -that's about it have fun
*    -also the api has a manager at url/api/manager
*    it has a login which is set in the config file
*    you also have commands 4 it --- i have to make a tut for them


# HOW THE LOGGING WORKS
* basically you need to use logger.announce for regular stuff like printing
* it will show up in console & log files
* you can pass it the req parameter so that it also logs the ip of the guy who sent the request :)

* for errors use logger.announceError
* you can pass it the req parameter so that it also logs the ip of the guy who caused the error

# EXAMPLE WORKING ROUTE
````
   const logger = require("../logger")
   const procHandler = require("../procHandler")
   const template = require("./template")
   module.exports = { 
    ur_route_name-it_dont_matter: class extends template.Route{
        constructor() {
            // actuall route like for example github.com/CzrCraft where /CzrCraft is the route

            // MAKE SURE THAT YOU HAVE A SLASH AFTER THE ROUTE!!!!
            // THIS WILL SAVE U A LOT OF HEADACHES!!

            const route = "/exampleRoute/"
            const dynamicRouteParameters = undefined
            const extraOptions = {}
            // syntax for super(routeName, dynamic routes(save them as purely their name, and without their /:, object that specified the addittional properties listed down below
            super(route, dynamicRouteParameters, extraOptions);
            // can be accessed using urdomain.com/exampleRoute
            // where ur domain can be ur ip etc...

            // there are also addittional properties that can be passed to the route constructor
            // IGNORE_TOKEN: this route will be accessible without the access token getting specified in the headers
            // OWN_ALL_CHILD_ROUTES: if you want to have something like a dynamic route something/:some
            //                       this will make so that any route that is a child of this route will have the same properties
            // DONT_LOG_ACCESS: if you don't want this route to save to logs when it gets accessed. Any custom logging will be saved, only the default logging won't be saved
            // CHECK_COOKIE: when serving web pages, this will make it so it will check the cookie called "accessCookie" with the sha256 of the accessToken
            // COOKIE_FAILURE_CALLBACK: if you have CHECK_COOKIE on, then this function will be called when someone has the wrong cookie/no cookies
        }
        // any HTTP method can be declared here with the following syntax
        async GET(req, res) {
            try {
                // if the operation the request is doing doesn't need loading or lookup at a later time you should delete the proccess
                // if you have an operation that does require look up at a later time you can use get proc status(look in proc.js route file)
                logger.announnce("hello am doing someting")
                // like this
                procHandler.deleteProc(req.procID);
            } catch (err) {
                logger.announceError(err)
                res.sendStatus(400)
            }
        }
    },
   }
````

# EXAMPLE WORKING MANAGER COMMAND
````
    proccessCommands: class extends template.Command{
        constructor() {
            const command = "proc" // the command itself
            super(command);
        }
        async called(params) {// all params are split at space then given here as a list
            function printHelp() {
                const paramsObject = {
                    "-h": "show list of available commands",
                    "-s": "get a proccess's status(command + proccessID)",
                    "-c": "create a proccess",
                    "-d": "delete a proccess(command + proccessID)",
                    "-m": "modify a proccess's status(command + procID + new status + new info)",
                    "-a": "see all of the current proccesses",
                }
                logger.announce(parseJsonToOutput(paramsObject))
            }
            if (params == undefined || params == "") {
                logger.announce("Specify a command")
                printHelp()
            } else {
                switch (params[0]) {// how i manage params
                    case "-h":
                        printHelp()
                        break;
                    case "-s":
                        const proccessID = params[1]
                        if (proccessID != undefined) {
                            const result = await procHandler.getProcInfo(proccessID)
                            if (result == undefined) {
                                logger.announceError("Proccess not found")
                            } else {
                                logger.announce(parseJsonToOutput(result))
                            }
                            
                        } else {
                            logger.announceError("Input to proc -s SHOULD BE THE PROCCESS ID")
                        }
                        break;
                    case "-c":
                        const proc = await procHandler.createProc(true)
                        logger.announce("CREATED PROCCESS WITH THIS ID: " + proc)
                        break;
                    case "-d":
                        const procID = params[1]
                        if (procID != undefined) {
                            await procHandler.deleteProc(procID)
                        }
                        break;
                    case "-a":
                        const result = await procHandler.getAllProc()
                        logger.announce(parseJsonToOutput(result))
                    case "-m":
                        const procid = params[1]
                        const newStatus = params[2]
                        const newInfo = params[3]
                        if (procid != undefined && newStatus != undefined && newInfo != undefined) {
                            await procHandler.updateProcStatus(procid, newStatus, newInfo)
                        } else {
                            logger.announce
                        }
                }
            }
        }
    },
````
# CONFIGS
i'm gonna add ssl certificate support soon
````
{
    "serverSettings": {
        "port": the port you want the api to be(leave blank for default),
        "auth": {
            "accessToken": "this is used for authetification, specified in token header on request",
            "managerUser": "for the web GUI",
            "managerPassword": "for the web GUI"
        },
        "logger": {
            "logToDiscord": false,
            "botName": "your bots name(this is how it's going to appear on discord",
            "botIcon": "it's icon",
            "infoAndErrorWebhook": "the webhook links which will be used to send messages",
            "errorOnlyWebhook": "the webhook links which will be used to send messages"
        }
    },
    "customSettings": {
       "test": "here you can put any setting you want, and acces it using req.configs
    }
}
````
# DATABASE FORMATS/DOCUMENTATION

security token format: creationEpoch-randomToken-expirationEpoch

epoch used is in milliseconds so use Date.now() to get currentEpoch

user save format:
````
username: {
     password: password,
     permissions: [],
     token: lastSecurityTokenGenerated
}
````

# MIDDLEWARE DOCUMENTATION

so basically the middleware proccesses the request before calling the apropriate function

each check OVERRIDES THE PREVIOUS ONE

first the middleware checks the token:

           1.check if the token is expired[if(currentEpoch<expirationEpoch)]
           
           2.check what account is associated with this token
           
->next the middleware checks if the route has the IGNORE_TOKEN flag which OVERRIDES the previous check

->next the middleware checks if the route has the CHECK_COOKIE flag which checks the users cookie, used when a route is interacted from a browser for example

->next the middleware checks if the route doesnt have THE IGNORE_TOKEN or CHECK_COOKIE flags and if it HAS the RESTRICTED flag, and if so check if the user has permission for said route

->after all of this the middleware then looks to see if any of theese previous checks failed(again, each check overrides the previous one, for example if the user doesnt have a token but the route has IGNORE_TOKEN, then both checks are considered true), and if they did it responds with which check failed, but if all the checks are ok then the middleware res the req.configs and req.procID headers and calls the next function.

# PROCCESSES DOCUMENTATION(unfinished)

so when a request is made the middleware creates a new "proccess" with an id

this is used when you have something that loads in the background, and an app can interogate the API for the status of this proccess

theese proccesses should be used for stuff that needs to be saved or accessed repeteadly, otherwise delete them at the end of your request using ````procHandler.deleteProc(req.procID);````

when you update a proccesses status you use ````await procHandler.updateProcStatus(req.procID, newStatus, newInfo(optional))```` 

the proccess format is this:
````
{
    "status": the status,
    "info": extra info about this proccess, for example it can be used when something is accessed repeteadly
}
````

the rest of the code is in ````procHandler.js````
