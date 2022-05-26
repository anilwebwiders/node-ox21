const common = require("../models/common");

exports.domain_cost = async (req, res) => {
    const data = await common.get_data('domain_cost');
    res.status(200).json({
        status: 1,
        message: 'success',
        data: data
    })
}

exports.check_domain = async (req, res) => {
    const { domain, user_id } = req.query

    if (!domain || !user_id) {
        res.status(200).json({
            status: 0,
            message: 'Domain name is required',
            data: domain
        })
        return
    }

    const check = await this.startsOrEndsWithWhitespace(domain,user_id);

    if (check.status !== 1) {
        res.status(200).json({
            status: check.status,
            message: check.message,
            data:check.data
        })
        return
    }

    const length = domain.length;
    const returndata = {
        domain,
        length,
        status: 'Available',
    }

    const getCost = await common.get_data('domain_cost', `where digit <= ${length}`, "*", "digit", "desc");

    returndata.jinCost = getCost[0].jin_cost;
    returndata.usdCost = getCost[0].usd_cost;

    res.status(200).json({
        status: 1,
        message: 'success',
        data: returndata
    })
}

exports.buy_domain = async (req, res) => {
    const { domain, user_id, payment_by, usd_cost, jin_cost, btc_cost, orderID, transaction_id } = req.body

    if (!domain || !user_id || !payment_by || !usd_cost || !jin_cost || !btc_cost || !orderID) {
        res.status(200).json({
            status: 0,
            message: 'Check Parameter!'
        });
        return
    }

    const check = await this.startsOrEndsWithWhitespace(domain);

    if (check.status === 0) {
        res.status(200).json({
            status: 0,
            message: check.message
        })
        return
    }

    const getCost = await common.get_data('domain_cost', `where digit <= ${domain.length}`, "*", "digit", "desc");

    const usdCost = getCost[0].usd_cost;

    let points = 0;
    let needed_points = 0;

    if (payment_by == 'points') {
        const checkPoints = await common.get_data("users", `where id = ${user_id}`, "points");
        if (checkPoints.length > 0) {
            points = parseInt(checkPoints[0].points);
            console.log(`points ${points}`);
        }

        // 1 point = 15/3600 usd
        // 1 usd = 1 * 3600/15 point = 240 points
        //  

        needed_points = Math.round(usdCost * 240);

        console.log(`needed_points ${needed_points}`);
        console.log(`points ${points}`);
        
        if (needed_points > points) {
            res.status(200).json({
                status: 0,
                message: `You don't have sufficient point. You still need ${needed_points - points} points to checkout.`,
            })
            return
        }


    } else if (payment_by == "btc") {
    } else if (payment_by == "paypal") {

        if (!transaction_id) {
            res.status(200).json({
                status: 0,
                message: `Invalid transaction id`,
            })
            return
        }

    } else {
        res.status(200).json({
            status: 0,
            message: "Invalid Payment method {points,btc}"
        })
        return
    }

    const hours48 = 2 * 24 * 60 * 60; // in secons

    const current_time = Math.round(new Date().getTime() / 1000);
    //console.log(`current_time ${current_time}`);
    const expire_time = hours48 + current_time;
    //console.log(`hours48 ${hours48}`);
    //console.log(`current_time ${current_time}`);

    let payment_status = 0;
    let transaction_id2 = '';

    if (payment_by == 'points') {
        payment_status = 1;
        transaction_id2 = new Date().getTime();
    } else if (payment_by == 'paypal') {
        payment_status = 1;
        transaction_id2 = transaction_id;
    }


    const insert = {
        domain,
        user_id,
        points:needed_points,
        btc_cost,
        jin_cost,
        orderID,
        usd_cost,
        payment_by,
        payment_status,
        transaction_id:transaction_id2,
        expire_time
    }

    const insertdata = await common.add_data('domains', insert);

    if(insertdata.affectedRows > 0 && payment_by =='points'){
        let update_payemnt = points-needed_points;
        
        
        common.update_data("users",{points:update_payemnt},{id:user_id});

        let traxnInsert = {
            user_id:user_id,
            message:`Spend ${needed_points} Points to buy a ${domain} Domain`,
            points:needed_points,
            trxn_id: new Date().getTime(),
            trxn_type:0
        }
        common.add_data('transactions',traxnInsert);
    } else if(insertdata.affectedRows > 0 && payment_by =='paypal'){
       
        let traxnInsert = {
            user_id:user_id,
            message:`Spend ${btc_cost} BTC to buy a ${domain} Domain`,
            btc_amount:btc_cost,
            trxn_id: new Date().getTime(),
            trxn_type:0
        }
        common.add_data('transactions',traxnInsert);
    }

    res.status(200).json({
        status: 1,
        message: 'success',
        data: insert
    })
}

exports.my_domains = async (req, res) => {
    const { user_id, status } = req.query

    if (!user_id) {
        res.status(200).json({
            status: 0,
            message: 'Check Parameter!'
        });
        return
    }

    let where = `where user_id = ${user_id}`;

    if(status){
        where += ` and payment_status = ${status}`;
    }

    const domains = await common.get_data('domains', where);

    res.status(200).json({
        status: 1,
        message: 'success',
        data: domains
    })
}




exports.startsOrEndsWithWhitespace = async (str,user_id) => {
    if ((str.match(/ /g) || []).length > 1) {
        return {
            status: 0,
            message: 'Domain can not contain more then 2 space in a row',
            data:''
        }
    } else if (/^\s|\s$/.test(str)) {
        return {
            status: 0,
            message: 'Domain can not contain leading or ending space',
            data:{}
        }
    } else {

        const check = await common.get_data("domains", `where domain = '${str}'`, "*");
        if (check.length > 0) {

            let data = {};
            let message = 'Not Available';
            let status = 0;
            /*if(user_id == check[0].user_id){
                data = check[0];
                message = 'Pyament pending';
                status = 2;
            }*/

            return {
                status: status,
                message: message,
                data:data
            }
        } else {
            return {
                status: 1,
                message: 'Ok'
            }
        }

    }
}