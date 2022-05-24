const db = require("../connection/database");
exports.all_users = async () => {
    try {
        const data = await db.query("select * from users order by id asc");
      
        return data;
    } catch (error) {
        console.log(error);
        return false;
    }
}

exports.add_users = async (data) => {
    const responce = await db.query(`insert into users set name = '${data.name}', email = '${data.email}', password = '${data.password}'`);
    return responce;
}

exports.update_users = async (data) => {
    const responce = await db.query(`update users set name = '${data.name}', email = '${data.email}', password = '${data.password}' where id = ${data.id}`);
    return responce;
}

exports.checkByEmail = async (email) => {
    const responce = await db.query(`select * from users where email = '${email}'`);
    //console.log(responce)
    return responce;
}

exports.getUserById = async (id) => {
    const responce = await db.query(`select * from users where id = '${id}'`);
    //console.log(responce)
    return responce;
}

exports.delete_user = async (id) => {
    const responce = await db.query(`delete from users where id = '${id}'`);
    //console.log(responce)
    return responce;
}
