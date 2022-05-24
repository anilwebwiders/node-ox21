const user_model = require("../models/users");
const common = require("../models/common");
const fs = require("fs")
const web3 = require("../web3");
const uuidv5 = require('uuid');
var CryptoJS = require("crypto-js");
const { APP_URL } = require("../constant");

exports.get_languages = async (req, res) => {

    try {

        const data = await common.get_data('languages', {});

        res.status(200).json({
            status: 1,
            message: "Success",
            data: data
        });

    } catch (error) {

        res.status(200).json({
            status: 0,
            message: error
        });
    }

}

exports.get_channels = async (req, res) => {

    const { user_id, keywords } = req.query;
    
    /*//const string = 'UmLJ2wNCqVg7nlgssswn8GolzGlcJ09Pycpr/9AhC60';
    const secret = 'manish'
    var ciphertext = CryptoJS.AES.encrypt('1,null,null,null,116,1', secret).toString();
    console.log('hash ',ciphertext);

    var bytes  = CryptoJS.AES.decrypt(ciphertext, secret);
    var originalText = bytes.toString(CryptoJS.enc.Utf8);

    console.log('originalText',originalText.split(',')[4]); // 'my message'*/

    try {

        let select, where;
        where = '';

        if (keywords) {
            where += ` where name like '%${keywords}%'`
        }

        if (user_id) {
            select = "channels.*, (select count(id) from user_channel where user_channel.channel_id = channels.id and user_channel.user_id=" + user_id + ") AS is_subscribed";
            where += ' ORDER BY is_subscribed DESC,  id DESC';
        } else {
            select = "channels.*";
            where += ' ORDER BY id DESC';
        }

        //console.log(where);

        

        const data = await common.get_dynamic_data('channels', where, select);

        const result = data.map(function (item, index) {

            if (!user_id) {
                item.is_subscribed = 0
            }

            if (!item.image) {
                item.image = APP_URL + 'images/channels/icon.png';
            }
            return item;
        })

        res.status(200).json({
            status: 1,
            message: "Success",
            data: result
        });

    } catch (error) {

        res.status(200).json({
            status: 0,
            message: error
        });
    }

}

exports.create_channels = async (req, res) => {

    const { user_id, name } = req.body;
    const { image } = req.files;

    if (!user_id || !name || (image && image.length <= 0)) {

        res.status(200).json({
            status: 0,
            message: 'Check parameter'
        });
        return
    }

    try {

        let select, where;

        const hash = uuidv5.v5(name, uuidv5.v5.URL);

        select = "channels.*";
        where = ` where channel_hash = '${hash}' ORDER BY id DESC`;

        let data = await common.get_dynamic_data('channels', where, select);

        if (data.length > 0) {
            res.status(200).json({
                status: 0,
                message: 'Channel already exit!'
            });
            return
        }

        let insert = {
            name,
            created_by: user_id,
            channel_hash: hash
        }

        const inserted_id = await common.add_data('channels', insert)

        res.status(200).json({
            status: 1,
            message: 'Channel has been created successfully.',
            //data:inserted_id
        });

        let s_video_id = await web3.storeFilesToWeb3(image[0].path);
        //console.log("s_video_id id: ", s_video_id);
        let rs_video_id = await web3.retrieveFiles(s_video_id);
        //console.log("s_video_id retrieve: ", rs_video_id);
        let video_url = encodeURI("https://" + rs_video_id + ".ipfs.dweb.link/?filename=" + image[0].originalname);
        fs.unlinkSync(image[0].path);

        common.update_data('channels', { image: video_url }, { id: inserted_id.insertId })


    } catch (error) {

        res.status(200).json({
            status: 0,
            message: error
        });
    }

}

exports.update_channels = async (req, res) => {

    const { user_id, name, channel_id } = req.body;
    const { image } = req.files;

    if (!user_id || !name || !channel_id) {

        res.status(200).json({
            status: 0,
            message: 'Check parameter'
        });
        return
    }

    try {

        let select, where;

        const hash = uuidv5.v5(name, uuidv5.v5.URL);

        select = "channels.*";
        where = ` where channel_hash = '${hash}' and id != ${channel_id} ORDER BY id DESC`;

        let data = await common.get_dynamic_data('channels', where, select);

        if (data.length > 0) {
            res.status(200).json({
                status: 0,
                message: 'Channel already exit!'
            });
            return
        }

        let insert = {
            name,
            channel_hash: hash,
        }

        const inserted_id = await common.update_data('channels', insert, { id: channel_id, created_by: user_id })

        if (inserted_id.affectedRows == 0) {
            res.status(200).json({
                status: 0,
                message: 'You are not authorized to edit this channel.',
                //data:inserted_id
            });
            return
        }

        res.status(200).json({
            status: 1,
            message: 'Channel has been updated successfully.',
            //data:inserted_id
        });

      

        if (image && image.length > 0) {

            let s_video_id = await web3.storeFilesToWeb3(image[0].path);
            //console.log("s_video_id id: ", s_video_id);
            let rs_video_id = await web3.retrieveFiles(s_video_id);
            //console.log("s_video_id retrieve: ", rs_video_id);
            let video_url = encodeURI("https://" + rs_video_id + ".ipfs.dweb.link/?filename=" + image[0].originalname);
            fs.unlinkSync(image[0].path);

            common.update_data('channels', { image: video_url }, { id: channel_id })

        }




    } catch (error) {

        res.status(200).json({
            status: 0,
            message: error
        });
    }

}

exports.my_channels = async (req, res) => {

    const { user_id } = req.query;

    if (!user_id) {
        res.status(200).json({
            status: 0,
            message: 'Check parameter'
        })
    }



    try {

        const user_channel = await common.get_dynamic_data("user_channel", ` where user_id = ${user_id}`, "GROUP_CONCAT(channel_id) as channels");




        if (user_channel.length > 0 && user_channel[0].channels) {

            where = ` where id in (${user_channel[0].channels})`

            const data = await common.get_dynamic_data('channels', where);

            const result = data.map(function (item, index) {
                if (!item.image) {
                    item.image = APP_URL + 'images/channels/icon.png';
                }
                return item;
            })

            res.status(200).json({
                status: 1,
                message: "Success",
                data: result
            });

        } else {
            res.status(200).json({
                status: 1,
                message: 'No data found'
            });
        }



    } catch (error) {

        res.status(200).json({
            status: 0,
            message: error
        });
    }

}

exports.list = async (req, res) => {

    try {

        const data = await user_model.all_users();

        res.status(200).json({
            status: 1,
            message: "Success",
            data: data
        });

    } catch (error) {
        console.log(error)
        res.status(200).json({
            status: 0,
            message: error
        });
    }

}


exports.signin = async (req, res) => {

    console.log(req.body);

    const { uuid, password } = req.body;

    if (!uuid || !password) {

        res.status(200).json({
            status: 0,
            message: 'Check parameter'
        });
        return
    }

    try {

        const userdata = await common.get_data('users', { uuid: uuid, password: password });

        if (userdata && userdata.length <= 0) {
            res.status(200).json({
                status: 0,
                message: 'Invalid login details'
            });
            return
        }


        const udata = await common.getUserDetails(userdata[0].id);

        res.status(200).json({
            status: 1,
            message: "Success",
            data: udata
        });

    } catch (error) {
        console.log(error)
        res.status(200).json({
            status: 0,
            message: error
        });
    }

}

exports.update_user_language = async (req, res) => {

    console.log(req.body);

    const { language, id } = req.body;

    if (!language || !id) {

        res.status(200).json({
            status: 0,
            message: 'Check parameter'
        });
        return
    }

    try {

        const data = await common.update_data('users', { language: language }, { id: id });

        res.status(200).json({
            status: 1,
            message: "Language has been updated successfully!"
        });

    } catch (error) {
        console.log(error)
        res.status(200).json({
            status: 0,
            message: error
        });
    }

}
exports.add_channels = async (req, res) => {


    const { channel_id, id } = req.body;

    if (!channel_id || !id || channel_id.length <= 0) {

        res.status(200).json({
            status: 0,
            message: 'Check parameter'
        });
        return
    }

    try {

        const channel_id_string = channel_id.join();

        const deleted = await common.delete_data('user_channel', `WHERE channel_id NOT IN (${channel_id_string})`); //delete existing


        channel_id.map(async (item, index) => {
            const check = await common.get_data('user_channel', { user_id: id, channel_id: item });

            if (check.length == 0) {
                common.add_data('user_channel', { channel_id: item, user_id: id });
            }

        });

        res.status(200).json({
            status: 1,
            message: "Address has been updated successfully!"
        });

    } catch (error) {
        console.log(error)
        res.status(200).json({
            status: 0,
            message: error
        });
    }

}

exports.update_address = async (req, res) => {

    console.log(req.body);

    const { country, city, province, id } = req.body;

    if (!country || !city || !province || !id) {

        res.status(200).json({
            status: 0,
            message: 'Check parameter'
        });
        return
    }

    try {

        const data = await common.update_data('users', { country, city, province }, { id: id });

        res.status(200).json({
            status: 1,
            message: "Address has been updated successfully!"
        });

    } catch (error) {
        console.log(error)
        res.status(200).json({
            status: 0,
            message: error
        });
    }

}
exports.change_password = async (req, res) => {

    console.log(req.body);

    const { password, confirm_password, uuid } = req.body;

    if (!password || !confirm_password || !uuid) {

        res.status(200).json({
            status: 0,
            message: 'Check parameter'
        });
        return
    }

    if (password !== confirm_password) {

        res.status(200).json({
            status: 0,
            message: 'Confirm password not matched with new password'
        });
        return
    }

    try {

        const data = await common.update_data('users', { password }, { uuid });

        res.status(200).json({
            status: 1,
            message: "Password has been updated successfully!"
        });

    } catch (error) {
        console.log(error)
        res.status(200).json({
            status: 0,
            message: error
        });
    }

}
exports.add_users = async (req, res) => {

    console.log(req.body);

    const { uuid, password } = req.body;

    if (!uuid || !password) {

        res.status(200).json({
            status: 0,
            message: 'Check parameter'
        });
        return
    }

    try {
        /*
       colsole.log(uuid.split('|'));
       return
       */
        const checkMail = await common.get_data('users', { 'uuid': uuid });

        if (checkMail && checkMail.length > 0) {
            res.status(200).json({
                status: 0,
                message: 'uuid already exist!'
            });
            return
        }
        var date_format = new Date();

        var date4 = date_format.getFullYear() + '-' + date_format.getMonth() + '-' + date_format.getDate();
        const data = await common.add_data('users', { 'uuid': uuid, 'password': password });
        var userdetail = await common.getUserDetails(data.insertId);

        console.log(data.insertId);
        res.status(200).json({
            status: 1,
            message: "Success, registered successfully",
            'userdetail': userdetail
        });

    } catch (error) {
        console.log(error)
        res.status(200).json({
            status: 0,
            message: error
        });
    }

}

exports.get_user_by_id = async (req, res) => {


    const { id } = req.params;

    if (!id) {
        res.status(200).json({
            status: 0,
            message: 'Check parameter'
        });
        return
    }

    try {

        const user = await common.getUserDetails(id);

        res.status(200).json({
            status: 1,
            message: "Success",
            data: user
        });

    } catch (error) {
        console.log(error)
        res.status(200).json({
            status: 0,
            message: error
        });
    }
}
exports.forget_password = async (req, res) => {


    const { uuid } = req.body;

    if (!uuid) {
        res.status(200).json({
            status: 0,
            message: 'Check parameter'
        });
        return
    }

    try {

        const user = await common.get_data('users', { uuid: uuid });

        if (!user || user.length == 0) {
            res.status(200).json({
                status: 0,
                message: 'Invalid uuid!'
            });
            return;
        }

        res.status(200).json({
            status: 1,
            message: "Success",
            data: user[0]
        });

    } catch (error) {
        console.log(error)
        res.status(200).json({
            status: 0,
            message: error
        });
    }
}
exports.remove_user_channel = async (req, res) => {

    const { channel_id, user_id } = req.body;

    if (!channel_id || !user_id || channel_id.length <= 0) {
        res.status(200).json({
            status: 0,
            message: 'Check parameter'
        });
        return
    }

    try {

        channel_id.map(async (item, index) => {
            common.delete_data('user_channel', { channel_id: item, user_id: user_id });
        });


        res.status(200).json({
            status: 1,
            message: 'Channel has been deleted successfully.'
        });


    } catch (error) {
        console.log(error)
        res.status(200).json({
            status: 0,
            message: error
        });
    }
}


