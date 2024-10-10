const fs = require("fs")
let configs;
let infoAndError;
let errorOnly;
const { Webhook } = require('discord-webhook-node');
var Bottleneck = require("bottleneck/es5");
let infoHook;
let errorHook;
let useDiscord;

const limiter = new Bottleneck({
    minTime: 300
});

function readConfigs() {
    configs = JSON.parse(fs.readFileSync("./config.json", "utf8"))
    infoAndError = configs["serverSettings"]["logger"]["infoAndErrorWebhook"]
    errorOnly = configs["serverSettings"]["logger"]["errorOnlyWebhook"]
    useDiscord = configs["serverSettings"]["logger"]["logToDiscord"]
    infoHook = new Webhook(infoAndError)
    errorHook = new Webhook(errorOnly)

    infoHook.setUsername(configs["serverSettings"]["logger"]["botName"])
    infoHook.setAvatar(configs["serverSettings"]["logger"]["botIcon"]);

    errorHook.setUsername(configs["serverSettings"]["logger"]["botName"])
    errorHook.setAvatar(configs["serverSettings"]["logger"]["botIcon"]);
}

readConfigs()

module.exports = {
    sendInfo: async function (message) {
        if (useDiscord) {
            while (infoAndError == "undefiend") { }
            limiter.schedule(() => {
                infoHook.send(message);
            })
        }
    },
    sendError: async function (message) {
        if (useDiscord) {
            while (infoAndError == "undefiend") { }
            limiter.schedule(() => {
                infoHook.send(message);
                errorHook.send(message);
            })
        }
    }
}