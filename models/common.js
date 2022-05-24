const db = require("../connection/database");
const { CreateMagnetURI } = require("./ipfs");
const fs = require("fs");

exports.add_data = async (table, parameters) => {
	var query = 'insert into ' + table + ' set ';
	Object.entries(parameters).forEach(([key, value]) => {
		//query+=key+'='+value+',';
		query += '' + key + '=' + "'" + value + "',";
	});
	var query = query.replace(/,\s*$/, "");
	console.log(query);
	console.log(parameters);
	const responce = await db.query(query);
	return responce;
}
exports.update_data = function (table, parameters, where) {
	var query = "update " + table + " set ";
	Object.entries(parameters).forEach(([key, value]) => {

		query += key + " = '" + value + "',";
	});

	var query = query.replace(/,\s*$/, "");

	if (typeof where === 'object' && where !== null) {
		query += " where 1=1";
		Object.entries(where).forEach(([key, value]) => {

			query += " and " + key + " = '" + value + "'";
		});
	} else {
		query += " " + where;
	}


	console.log('update query',query);

	const responce = db.query(query);
	return responce;
}



exports.delete_data = function (table, where) {
	var query = "delete from " + table;

	if (typeof where === 'object' && where !== null) {
		query += " where 1=1";
		Object.entries(where).forEach(([key, value]) => {

			query += " and " + key + " = '" + value + "'";
		});
	} else {
		query += " " + where;
	}



	const responce = db.query(query);
	return responce;
}
exports.get_data = function (table, where, select = "*", orderBy = "id", orderSet = "DESC") {
	var query = 'select ' + select + ' from ' + table;

	//var query=' where 1=1 ';
	if (typeof where === 'object' && where !== null) {
		var query = query.concat(' where 1=1');
		Object.entries(where).forEach(([key, value]) => {
			query += ' and ' + key + '=' + "'" + value + "'";
		});
	} else {
		query += ' ' + where;
	}

	
	if (orderBy && orderSet) {
		query += " order by " + orderBy + " " + orderSet;
	}


	const responce = db.query(query);
	return responce;
}

exports.get_dynamic_data = function (table, DymicQuery = "", select = "*") {
	var query = "select " + select + " from " + table + " " + DymicQuery;
	const responce = db.query(query);
	return responce;
}

exports.getUserDetails = async function (id) {
	var query = `select * from users where id = ${id} or uuid = '${id}'`;
	try {
		let responce = await db.query(query);

		const result = {}

		if (responce && responce.length > 0) {
		
			let loop = responce[0];

			result.id = loop.id;
			result.uuid = loop.uuid;
			result.city = loop.city;
			result.province = loop.province;
			result.profile_status = loop.profile_status;
			result.country = loop.country;
			result.points = loop.points;

			result.channels = await this.get_data('user_channel', { user_id: loop.id });
			

			if (responce.language) {
				let language = await this.get_data('languages', { id: loop.language });
				result.language = language[0];
			}

			const domains = await this.get_data('domains', { user_id: loop.id },"domain");

			if (domains.length) {
				result.domain = domains[0].domain;
			} else {
				result.domain = loop.uuid;
			}



		}
		return result;

	} catch (error) {
		return false;
	}
}

exports.getShortUserDetails = async function (id) {
	var query = `select * from users where id = ${id} or uuid = '${id}'`;
	try {
		let responce = await db.query(query);

		const result = {}

		if (responce && responce.length > 0) {
		
			let loop = responce[0];

			result.id = loop.id;
			result.uuid = loop.uuid;
			//result.city = loop.city;
			//result.province = loop.province;
			//result.profile_status = loop.profile_status;
			//result.country = loop.country;

			const domains = await this.get_data('domains', { user_id: loop.id },"domain");

			if (domains.length) {
				result.domain = domains[0].domain;
			} else {
				result.domain = loop.uuid;
			}


		}
		return result;

	} catch (error) {
		return false;
	}
}

exports.getPostDetail = async function (post, user_id) {

	var query = `select * from post where id = ${post.id}`;
	try {
		let responce = await db.query(query);

		//console.log(responce);

		if (responce && responce.length > 0) {
			responce = responce[0];

			responce.playlist = await this.get_data('playlist', { id: responce.playlist });
			const channel = await this.get_data('channels', { id: responce.channel_id });

			responce.channel = channel;
		
			const isLIke = await this.get_data('post_like', { post_id: post.id, user_id: user_id }, "state");

			console.log(isLIke);

			responce.screenshots = await this.get_data('screenshots', { post_id: post.id });
			responce.views = 0;
			responce.likes = post.likes;
			responce.stats = post.stats;
			responce.dislikes = post.dislikes;
			responce.comments = 0;
			responce.is_like = (isLIke.length > 0) ? isLIke[0].state : 0;

			const createdBy = await this.getShortUserDetails(responce.user_id);
			responce.createdBy = createdBy;

		}
		return responce;

	} catch (error) {
		return false;
	}
}








