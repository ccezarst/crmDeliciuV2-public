const { FSDB } = require("file-system-db");
const db = new FSDB("./usersDB.json", false);

function makeid(length) { // we <3 stackoverflow
    // was listening to https://open.spotify.com/track/5C0vUlVOGmuUHzzM9LMvUs?si=99653a9f3bbd4998 on 3/1/2024 WITH DD/MM/YYYY
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

function generateNewToken(validFor) {
    const tokenRandomLength = 50;// randomTokenLength is 50 chars(a bit overboard but eh)
    let seconds = Date.now();
    let token = seconds + "-" + makeid(tokenRandomLength) + "-" + (seconds + (cleanInt(validFor) * 24 * 60 * 60 * 1000));
    while (getUserFromToken(token)) {
        token = seconds + "-" + makeid(tokenRandomLength) + "-" + (seconds + (cleanInt(validFor) * 24 * 60 * 60 * 1000));
    }
    return token;
}

function getUserFromToken(token) {
        try {
            let users = db.getAll();
            for (const user of users) {
                let username = user.key;
                let body = user.value
                if (user.value.token == token) {
                    let res = {};
                    res[username] = body;
                    return res;
                }
            }
            return false;// if the token is not found
        } catch (err) {
            console.log(err);
        }
}

function cleanInt(x) {
    x = Number(x);
    return x >= 0 ? Math.floor(x) : Math.ceil(x);
}

module.exports = {
    getUserFromToken: getUserFromToken,
    createUser: function (user, password, validFor, permissions = []) {// validFor is the number of days the token will be valid for
        // expirationEpoch = currentEpoch + validFor * 24 * 60 * 60
        try {
            let token = generateNewToken(validFor);
            db.set(user, {
                password: password,
                permissions: permissions,
                token: token
            });
            return token;
        }catch(err){
            console.log(err)
        }
    },
    regenToken: function (user, validFor) {// validFor is the number of days the token will be valid for
        // expirationEpoch = currentEpoch + validFor * 24 * 60 * 60
        try {
            let token = generateNewToken(validFor);
            let currentObj = db.get(user);
            currentObj.token = token;
            db.set(user, currentObj);
            return token;
        }catch(err){
            console.log(err)
        }
    },
    checkPassword: function (user, password) {
        try{
            if (db.has(user)) {
                return db.get(user)["password"] == password;
            } else {
                return false;
            }
        }catch(err){
            console.log(err)
        }

    },
    exists: function (user) {
        try{
            return db.has(user)
        }catch(err){
            console.log(err)
        }
    },
    checkPermission: function (user, targetPerm) {
        try{
            return db.get(user)["permissions"].includes(targetPerm)
        }catch(err){
            console.log(err)
        }
    },
    getAll: function () {
        try{
            return db.getAll();
        }catch(err){
            console.log(err)
        }
    },
    addPermission: function (user, targetPerm) {
        try {
            let currentObj = db.get(user)
            currentObj.permissions.push(targetPerm)
            db.set(user, currentObj)
        }catch(err){
            console.log(err)
        }
    },
    removePermission: function (user, targetPerm) {
        try {
            let currentObj = db.get(user)
            const index = currentObj.permissions.indexOf(targetPerm);
            if (index > -1) { // only splice array when item is found
                array.splice(index, 1); // 2nd parameter means remove one item only
            }
            db.set(user, currentObj)
        }catch(err){
            console.log(err)
        }

    },
    deleteUser(user) {
        try{
            db.delete(user)
        }catch(err){
            console.log(err)
        }
    },
    changePassword(user, password) {
        try {
            let currentObj = db.get(user)
            currentObj.password = password
            db.set(user, currentObj)
        }catch(err){
            console.log(err)
        }
    },
    dbObject: db,
}