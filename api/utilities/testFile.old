const logger = require("../logger")
const template = require("../routes/template");

module.exports = {

    testUtillity: class extends template.Utillity {
        constructor() {
            const path = "foo.bar"
            super(path);
        }
    },
    
    testUtillity2: class extends template.Utillity {
        constructor() {
            const path = "foo.round"
            super(path);
        }
    },
    testUtillity3: class extends template.Utillity {
        constructor() {
            const path = "bar.foo"
            super(path);
        }
    },
    errorThrower: class extends template.Utillity {
        constructor() {
            const path = "i-like.errors"
            super(path);
        }
        async test() {
            logger.output("I'm gonna throw an error now(feeling mischievous)")
            throw "<3 deftones"
        }
    },
    secondErrorThrower: class extends template.Utillity {
        constructor() {
            const path = "copycat"
            super(path);
        }
        async test() {
            logger.output("I'm a copycat of errorThrower :3")
            throw "<3 deftones"
        }
    },
}