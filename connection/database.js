const Mysqli = require("mysqli");
const MY_VAR = require("../constant");

const conn = new Mysqli({
    host: MY_VAR.DATABASE_HOST, // IP/domain   
    user: MY_VAR.DATABASE_USER, // username
    passwd: MY_VAR.DATABASE_PASS, // nw5BZI2fvs8Rr11K5Y@
    db: MY_VAR.DATABASE_NAME // the default database name  【optional】
});

let db = conn.emit();


module.exports = db;


