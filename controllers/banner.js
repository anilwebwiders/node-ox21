const common = require('../models/common');
const uuidv5 = require('uuid');
const https = require('https');
const CryptoJS = require("crypto-js");
const MY_VAR = require('../constant');
const web3 = require("../web3");
const fs = require("fs")

exports.checker_payment = async (req, responce) => {

    const url = MY_VAR.BLOCK_API

    const hours48 = 2 * 24 * 60 * 60; // in secons

    const current_time = Math.round(new Date().getTime() / 1000);
    common.delete_data('domains', " where payment_status = 0 and expire_time < " + current_time);

    const bids = await common.get_dynamic_data('banner_bids', " inner join users on users.id = banner_bids.user_id where payment_status = 0 and (select count(id) from banner_owner where banner_owner.hash = banner_bids.hash) = 0 and expire_time > " + current_time, "banner_bids.*, users.uuid as user_uuid");

    const domains = await common.get_dynamic_data('domains', "where payment_status = 0 and expire_time > " + current_time);



    if (bids.length > 0 || domains.length > 0) {

        https.get(url, res => {
            let data = '';
            res.on('data', chunk => {
                data += chunk;
            });
            res.on('end', async () => {
                data = JSON.parse(data);

                const txs = data.txs;
                if (txs && txs.length > 0) {

                    const outputs = [];

                    for (let i = 0; i < txs.length; i++) {
                        const newtxn = txs[i];
                        if (newtxn.outputs && newtxn.outputs.length > 0) {
                            for (let k = 0; k < newtxn.outputs.length; k++) {

                                const newOutput = newtxn.outputs[k];

                                if (newOutput.addresses && newOutput.addresses.length > 0) {

                                    outputs.push(newOutput);

                                }

                            }
                        }
                    }

                    if (bids.length > 0) {
                        for (let i = 0; i < bids.length; i++) {
                            let bid = bids[i];
                            let oid = parseInt(bid.orderID);
                            //let obj = outputs.find(o => o.value == v);

                            let obj = outputs.find((item) => {

                                let trxOrdId = item.value % 1000000;

                                if (trxOrdId == oid) {
                                    return true
                                }
                            });


                            if (obj) {


                                common.update_data('banner_bids', { payment_status: 1, status: 1, transaction_id: obj.addresses[0] }, { id: bid.id });


                                let update_banner = {
                                    uuid: bid.user_uuid,
                                    hash: bid.hash,
                                    language: bid.language,
                                    country: bid.country,
                                    state: bid.state,
                                    city: bid.city,
                                    channel: bid.channel,
                                    page_number: bid.page_number,
                                    user_id:bid.user_id
                                }

                                common.add_data('banner_owner', update_banner);

                                let traxnInsert = {
                                    user_id: bid.user_id,
                                    message: `Spend ${bid.price} BTC to buy a banner`,
                                    btc_amount: bid.price,
                                    trxn_id: new Date().getTime(),
                                    trxn_type: 0
                                }
                                common.add_data('transactions', traxnInsert);

                                /*var bytes = CryptoJS.AES.decrypt(bid.hash, MY_VAR.SHA_KEY);
                                if (bytes) {
                                    var originalText = bytes.toString(CryptoJS.enc.Utf8);

                                    if (originalText) {

                                        let channel_id = originalText.split(',');

                                        if (channel_id && channel_id.length > 0) {*/

                                channel_id = parseInt(bid.channel);

                                const channelWithUser = await common.get_dynamic_data('channels', " inner join users on users.id = channels.created_by where channels.id = " + channel_id, "channels.*, users.uuid as user_uuid, users.id as user_id, users.btc_wallet as btc_wallet");

                                //console.log('channelWithUser', channelWithUser);

                                if (channelWithUser.length > 0) {
                                    let amount = bid.price;

                                    //console.log('amount', amount);

                                    let ownerAmount = amount * 0.1;
                                    //console.log('ownerAmount', ownerAmount);

                                    let ownerTotalBtc = channelWithUser[0].btc_wallet + ownerAmount;
                                    //console.log('ownerTotalBtc', ownerTotalBtc);

                                    common.update_data('users', { btc_wallet: ownerTotalBtc }, { id: channelWithUser[0].user_id });

                                    let traxnInsert2 = {
                                        user_id: channelWithUser[0].user_id,
                                        message: `Credited ${ownerAmount} BTC for a banner`,
                                        btc_amount: ownerAmount,
                                        trxn_id: new Date().getTime(),
                                        trxn_type: 1
                                    }
                                    common.add_data('transactions', traxnInsert2);
                                }
                                /*}
                            }
                        }*/
                            }
                        }
                    }

                    if (domains.length > 0) {
                        for (let i = 0; i < domains.length; i++) {
                            let domain = domains[i];
                            let oid = parseInt(domain.orderID);
                            //let obj = outputs.find(o => o.value == v);

                            let obj = outputs.find((item) => {

                                let trxOrdId = item.value % 1000000;

                                if (trxOrdId == oid) {
                                    return true
                                }
                            });


                            if (obj) {
                                common.update_data('domains', { payment_status: 1, transaction_id: obj.addresses[0] }, { id: domain.id });

                                let traxnInsert = {
                                    user_id: domain.user_id,
                                    message: `Spend ${domain.btc_cost} BTC to buy a ${domain.domain} Domain`,
                                    btc_amount: domain.btc_cost,
                                    trxn_id: new Date().getTime(),
                                    trxn_type: 0
                                }
                                common.add_data('transactions', traxnInsert);
                            }
                        }
                    }

                    //console.log('outputs ', outputs);
                    //console.log('bids ', bids);
                }

            })
        }).on('error', err => {
            console.log(err.message);
        })
    }

    responce.status(200).json({
        status: 1,
        message: 'checker.'
    })
    return;


}

exports.buy_banner = async (req, res) => {
    const { hash, uuid, user_id, price, language, country, state, city, channel, page_number } = req.body;

    if (!hash || !uuid || !user_id || !price) {
        res.status(200).json({
            status: 0,
            message: 'Check parameters.'
        })
        return;
    }

    try {

        const myuuid5 = uuidv5.v5("Fight for privacy! Fight for freedom", uuidv5.v5.URL);


        if (myuuid5 != uuid) {
            res.status(200).json({
                status: 0,
                message: 'Something went wrong.',
                data: "invalid uuid"
            });
        }

        const hours48 = 2 * 24 * 60 * 60; // in secons

        const current_time = Math.round(new Date().getTime() / 1000);
        const expire_time = hours48 + current_time;

        const check = await common.get_data('banner_owner', { hash })

        const check2 = await common.get_data('banner_bids', " where hash = '" + hash + "' and user_id = " + user_id + " and expire_time > " + current_time)

        if (check.length > 0) {

            check[0].owner = await common.getShortUserDetails(check[0].uuid);


            res.status(200).json({
                status: 2,
                message: 'Not available',
                data: check[0]
            })
            return



        } else if (check2.length > 0) {

            res.status(200).json({
                status: 1,
                message: 'Bid already placed',
                data: check2[0]
            })
            return

        } else {

            let gen = n => "x".repeat(n).replace(/x/g, x => Math.random() * 10 | 0)
            let orderID = (1 + Math.random() * 9 | 0) + gen(5);

            const params = {
                hash,
                uuid,
                user_id,
                price,
                orderID,
                country,
                state,
                city,
                channel,
                page_number,
                expire_time: expire_time
            };

            if(country){
                params.country = country
            }

            
            if(state){
                params.state = state
            }

            
            if(city){
                params.language = city
            }

            const insert = common.add_data('banner_bids', params);

            res.status(200).json({
                status: 1,
                message: 'Please payment with in 24 hours',
                data: params
            })
            return
        }




    } catch (error) {
        res.status(200).json({
            status: 0,
            message: 'Something went wrong.',
            data: error
        })
        return;
    }


}

exports.update_banner_image = async (req, res) => {

    const { user_id, id } = req.body;
    const { image } = req.files;

    if (!user_id || !id) {

        res.status(200).json({
            status: 0,
            message: 'Check parameter'
        });
        return
    }

    try {

        let select, where;

        select = "banner_owner.id";
        where = ` where user_id = '${user_id}' ORDER BY id DESC`;

        let data = await common.get_dynamic_data('banner_owner', where, select);

        if (data.length == 0) {
            res.status(200).json({
                status: 0,
                message: 'You are not authorized to update this banner.'
            });
            return
        }

        let update = {
            upload_status:2
        }

        common.update_data('banner_owner', update, { id: id })

        res.status(200).json({
            status: 1,
            message: 'Banner has been updated successfully.',
            //data:inserted_id
        });

        console.log("image: ", image);

        if (image && image.length > 0) {

            let s_video_id = await web3.storeFilesToWeb3(image[0].path);
            //console.log("s_video_id id: ", s_video_id);
            let rs_video_id = await web3.retrieveFiles(s_video_id);
            //console.log("s_video_id retrieve: ", rs_video_id);
            let video_url = encodeURI("https://" + rs_video_id + ".ipfs.dweb.link/?filename=" + image[0].originalname);
            fs.unlinkSync(image[0].path);

            common.update_data('banner_owner', { image: video_url, upload_status:1 }, { id: id })

        }




    } catch (error) {

        res.status(200).json({
            status: 0,
            message: error
        });
    }

}

exports.get_bidders = async (req, res) => {
    const { hash } = req.query;

    if (!hash) {
        res.status(200).json({
            status: 0,
            message: 'Check parameters.'
        })
        return;
    }

    try {

        /*const myuuid5 = uuidv5.v5("Fight for privacy! Fight for freedom", uuidv5.v5.URL);


        if (myuuid5 != uuid) {
            res.status(200).json({
                status: 0,
                message: 'Something went wrong.',
                data: "invalid uuid"
            });
        }*/

        const hours48 = 2 * 24 * 60 * 60; // in secons

        const current_time = Math.round(new Date().getTime() / 1000);

        const check = await common.get_data('banner_bids', " where hash = '" + hash + "' and expire_time > " + current_time)


        if (check.length > 0) {

            for (let i = 0; i < check.length; i++) {
                let owner = await common.getShortUserDetails(check[i].user_id);
                check[i].owner = owner;
            }



            res.status(200).json({
                status: 1,
                message: 'Success',
                data: check
            })
            return
        } else {
            res.status(200).json({
                status: 1,
                message: 'Not data available!',
                data: []
            })
            return
        }




    } catch (error) {
        res.status(200).json({
            status: 0,
            message: 'Something went wrong.',
            data: error
        })
        return;
    }


}

exports.my_banners = async (req, res) => {
    const { user_id } = req.query;

    if (!user_id) {
        res.status(200).json({
            status: 0,
            message: 'Check parameters.'
        })
        return;
    }

    try {


        const check = await common.get_data('banner_owner', " where user_id = " + user_id)


        res.status(200).json({
            status: 1,
            message: 'Success',
            data: check
        })




    } catch (error) {
        res.status(200).json({
            status: 0,
            message: 'Something went wrong.',
            data: error
        })
        return;
    }


}

exports.check_banner_status = async (req, res) => {
    const { hash, user_id } = req.query;

    if (!hash || !user_id) {
        res.status(200).json({
            status: 0,
            message: 'Check parameters.'
        })
        return;
    }

    try {

        const current_time = Math.round(new Date().getTime() / 1000);


        const check = await common.get_data('banner_owner', { hash })

        const check2 = await common.get_data('banner_bids', " where hash = '" + hash + "' and user_id = " + user_id + " and expire_time > " + current_time)


        if (check.length > 0) {

            check[0].owner = await common.getShortUserDetails(check[0].uuid);


            res.status(200).json({
                status: 2,
                message: 'Not available',
                data: check[0]
            })
            return

        } else if (check2.length > 0) {
            res.status(200).json({
                status: 3,
                message: 'Bid already placed',
                data: check2[0]
            })
            return

        } else {

            res.status(200).json({
                status: 1,
                message: 'Available',
                //data:uuidv5.v5("Fight for privacy! Fight for freedom",uuidv5.v5.URL) //created for testing
            })
            return

        }

    } catch (error) {
        res.status(200).json({
            status: 0,
            message: 'Something went wrong.',
            data: error
        })
        return;
    }



}

exports.check_my_banner_status = async (req, res) => {
    const { user_id } = req.query;

    if (!user_id) {
        res.status(200).json({
            status: 0,
            message: 'Check parameters.'
        })
        return;
    }

    try {

        const current_time = Math.round(new Date().getTime() / 1000);

        const check2 = await common.get_data('banner_bids', " where user_id = " + user_id + " and payment_status = 0 and expire_time > " + current_time)

        if (check2.length > 0) {
            res.status(200).json({
                status: 2,
                message: 'Yes pending',
                data: check2[0]
            })
            return
        } else {
            res.status(200).json({
                status: 1,
                message: 'Not pending',
                //data:uuidv5.v5("Fight for privacy! Fight for freedom",uuidv5.v5.URL) //created for testing
            })
            return
        }

    } catch (error) {
        res.status(200).json({
            status: 0,
            message: 'Something went wrong.',
            data: error
        })
        return;
    }



}
