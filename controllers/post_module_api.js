const common = require("../models/common");
let fs = require('fs');
const web3 = require("../web3");



exports.addUserVideos = async (req, res) => {
    console.log(req.body);
    console.log(req.files);



    const { title, user_id, visibility, time, description, playlist, video_type, madeForKids, ageRestricted, channel_id } = req.body;

    const { video, thumbnail, screenshots } = req.files;


    console.log(video);
    console.log(thumbnail);
    console.log(screenshots);






    if (!title || !user_id || !visibility || !time || !channel_id || !playlist || !video_type || video.length <= 0 || thumbnail.length <= 0 || screenshots.length <= 0) {

        res.status(200).json({
            status: 0,
            message: 'Check parameter'
        });
        return
    }



    try {

        const post_status = await common.add_data('post_status', { user_id: user_id, status: 0, message: `Post ${title} has been uploaded successfully.` });

        let s_video_id = await web3.storeFilesToWeb3(video[0].path);
        console.log("s_video_id id: ", s_video_id);
        let rs_video_id = await web3.retrieveFiles(s_video_id);
        console.log("s_video_id retrieve: ", rs_video_id);
        let video_url = encodeURI("https://" + rs_video_id + ".ipfs.dweb.link/?filename=" + video[0].originalname);
        fs.unlinkSync(video[0].path);



        let s_thumb_id = await web3.storeFilesToWeb3(thumbnail[0].path);
        console.log("s_video_id id: ", s_thumb_id);
        let rs_thumb_id = await web3.retrieveFiles(s_thumb_id);
        console.log("rs_thumb_id retrieve: ", rs_thumb_id);
        let thumbnail_url = encodeURI("https://" + rs_thumb_id + ".ipfs.dweb.link/?filename=" + thumbnail[0].originalname);
        fs.unlinkSync(thumbnail[0].path);



        const params = {
            title,
            user_id,
            visibility,
            time,
            channel_id,
            description,
            playlist,
            video_type,
            madeForKids,
            ageRestricted,
            video: video_url,
            thumbnail: thumbnail_url,
            video_cid: rs_video_id,
            thumbnail_cid: rs_thumb_id
        }

        const data = await common.add_data('post', params);
        console.log(data);
        if (data.insertId) {


            if (screenshots.length > 0) {

                for (var i = 0; i < screenshots.length; i++) {
                    var screenshot = screenshots[i];

                    let s_screen_id = await web3.storeFilesToWeb3(screenshot.path);
                    console.log("s_screen_id id: ", s_screen_id);
                    let rs_screen_id = await web3.retrieveFiles(s_screen_id);
                    console.log("s_screen_id retrieve: ", rs_screen_id);
                    let screenshot_url = encodeURI("https://" + rs_screen_id + ".ipfs.dweb.link/?filename=" + screenshot.originalname);
                    fs.unlinkSync(screenshot.path);

                    let s_data = await common.add_data('screenshots', { post_id: data.insertId, screenshot_cid: rs_screen_id, screenshot: screenshot_url });
                    console.log(s_data);
                }

            }

            const updatePostStatus = await common.update_data('post_status', { post_id: data.insertId }, { id: post_status.insertId })


            res.status(200).json({
                status: 1,
                message: "Post has been created successfully!"
            });

            return;

        } else {
            res.status(200).json({
                status: 0,
                message: 'Something went wrong try again later.'
            });
            return;
        }



    } catch (error) {
        console.log(error)
        res.status(200).json({
            status: 0,
            message: error
        });
    }
}
exports.add_playlist = async (req, res) => {



    const { name, user_id } = req.body;

    if (!name || !user_id) {

        res.status(200).json({
            status: 0,
            message: 'Check parameter'
        });
        return
    }

    try {

        const check = await common.get_data('playlist', { user_id: user_id, name: name });
        //console.log(check); 
        if (check.length == 0) {
            common.add_data('playlist', { user_id: user_id, name: name });

            res.status(200).json({
                status: 1,
                message: "Playlist has been added successfully!"
            });
            return;

        } else {
            res.status(200).json({
                status: 0,
                message: 'This playlist already exist.'
            });
            return;
        }



    } catch (error) {
        console.log(error)
        res.status(200).json({
            status: 0,
            message: error
        });
    }

}

exports.delete_playlist = async (req, res) => {



    const { id, user_id } = req.body;

    if (!id || !user_id) {

        res.status(200).json({
            status: 0,
            message: 'Check parameter'
        });
        return
    }

    try {

        const check = await common.delete_data('playlist', { user_id: user_id, id: id });

        if (check.affectedRows > 0) {

            res.status(200).json({
                status: 1,
                message: "Playlist has been deleted successfully!"
            });
            return;

        } else {
            res.status(200).json({
                status: 0,
                message: 'Something went wrong.'
            });
            return;
        }



    } catch (error) {
        console.log(error)
        res.status(200).json({
            status: 0,
            message: error
        });
    }

}

exports.getUserPlaylist = async (req, res) => {



    const { id } = req.params;

    if (!id) {

        res.status(200).json({
            status: 0,
            message: 'Check parameter'
        });
        return
    }

    try {

        const data = await common.get_data('playlist', { user_id: id });

        res.status(200).json({
            status: 1,
            message: "Success",
            data: data
        });
        return;



    } catch (error) {
        console.log(error)
        res.status(200).json({
            status: 0,
            message: error
        });
    }

}

exports.getMyPost = async (req, res) => {

    const { id } = req.params;

    if (!id) {

        res.status(200).json({
            status: 0,
            message: 'Check parameter'
        });
        return
    }

    try {

        let where = "where user_id = " + id;

        let select = "id, (select sum(state) from post_like where post_like.post_id = post.id) AS state, (select count(state) from post_like where post_like.post_id = post.id and state = 1) AS likes, (select count(state) from post_like where post_like.post_id = post.id and state = -1) AS dislikes";


        const { video_type } = req.query;


        if (video_type) {
            if (video_type == 'video' || video_type == 'videos') {
                where += " and (video_type = 'videos' or video_type = 'video')";
            } else {
                where += " and video_type = '" + video_type + "'";
            }
        }

        where += ' order by id desc';


        const data = await common.get_dynamic_data('post', where, select);

        const result = [];

        if (data.length > 0) {

            for (var i = 0; i < data.length; i++) {
                const loop = await common.getPostDetail(data[i], id);
                result.push(loop)
            }
        }


        res.status(200).json({
            status: 1,
            message: "Success",
            data: result
        });
        return;



    } catch (error) {
        console.log(error)
        res.status(200).json({
            status: 0,
            message: error
        });
    }

}

exports.checkLastPostStatus = async (req, res) => {
    const { id } = req.params;

    if (!id) {

        res.status(200).json({
            status: 0,
            message: 'Check parameter'
        });
        return
    }

    try {

        const data = await common.get_data('post_status', { user_id: id, status: 0 });

        if (data.length > 0) {

            const post_status = data[0];
            console.log(post_status);



            const status = post_status.post_id ? 1 : 2;
            if (status == 1) {
                const update = await common.update_data('post_status', { status: 1 }, { id: post_status.id })
            }
            const message = post_status.post_id ? post_status.message : 'Uploading';

            res.status(200).json({
                status: status,
                message: message,
                data: post_status
            });
            return;
        } else {
            res.status(200).json({
                status: 0,
                message: "No Pending post",
            });
            return;
        }






    } catch (error) {
        console.log(error)
        res.status(200).json({
            status: 0,
            message: error
        });
    }
}

exports.getPostByID = async (req, res) => {



    const { id, user_id } = req.params;

    if (!id) {

        res.status(200).json({
            status: 0,
            message: 'Check parameter'
        });
        return
    }

    try {

        let select = "id, (select sum(state) from post_like where post_like.post_id = post.id) AS state, (select count(state) from post_like where post_like.post_id = post.id and state = 1) AS likes, (select count(state) from post_like where post_like.post_id = post.id and state = -1) AS dislikes";

        const data = await common.get_data('post', { id: id }, select);

        if (data.length > 0) {

            const result = await common.getPostDetail(data[0], user_id);

            res.status(200).json({
                status: 1,
                message: "Success",
                data: result
            });
            return;
        } else {
            res.status(200).json({
                status: 1,
                message: "Invalid ID",
                data: []
            });
            return;
        }






    } catch (error) {
        console.log(error)
        res.status(200).json({
            status: 0,
            message: error
        });
    }

}

exports.likePost = async (req, res) => {
    const { user_id, post_id } = req.query;

    if (!user_id || !post_id) {
        res.status(200).json({
            status: 0,
            message: 'Check parameter'
        })
    }



    try {

        const where = {
            post_id: post_id,
            user_id: user_id
        }

        const insert = {
            post_id: post_id,
            user_id: user_id,
            state: 1
        }

        const check = await common.get_data('post_like', where, "id");


        if (check.length > 0) {

            await common.update_data('post_like', insert, where)
        } else {
            await common.add_data('post_like', insert)
            const users = await common.get_data("users",{id:user_id},"points");
            if(users.length > 0){
                const updates = {
                    points:users[0].points+1
                }
                common.update_data("users",updates,{id:user_id});
            }
        }

        res.status(200).json({
            status: 1,
            message: 'Liked successfully.'
        })

    } catch (error) {
        res.status(200).json({
            status: 0,
            message: 'Error',
            data: error
        })
    }





}

exports.dislikePost = async (req, res) => {
    const { user_id, post_id } = req.query;

    if (!user_id || !post_id) {
        res.status(200).json({
            status: 0,
            message: 'Check parameter'
        })
    }



    try {

        const where = {
            post_id: post_id,
            user_id: user_id
        }

        const insert = {
            post_id: post_id,
            user_id: user_id,
            state: -1
        }

        const check = await common.get_data('post_like', where, "id");


        if (check.length > 0) {

            await common.update_data('post_like', insert, where)
        } else {
            await common.add_data('post_like', insert);
            const users = await common.get_data("users",{id:user_id},"points");
            if(users.length > 0){
                const updates = {
                    points:users[0].points+1
                }
                common.update_data("users",updates,{id:user_id});
            }
            
        }

        res.status(200).json({
            status: 1,
            message: 'Disliked successfully.'
        })

    } catch (error) {
        res.status(200).json({
            status: 0,
            message: 'Error',
            data: error
        })
    }

}

exports.removeLikeOrDislike = async (req, res) => {
    const { user_id, post_id } = req.query;

    if (!user_id || !post_id) {
        res.status(200).json({
            status: 0,
            message: 'Check parameter'
        })
    }



    try {

        const where = {
            post_id: post_id,
            user_id: user_id
        }

        const insert = {
            post_id: post_id,
            user_id: user_id,
            state: 0
        }

        const check = await common.get_data('post_like', where, "id");


        if (check.length > 0) {
            await common.update_data('post_like', insert, where)
        }

        res.status(200).json({
            status: 1,
            message: 'Disliked successfully.'
        })

    } catch (error) {
        res.status(200).json({
            status: 0,
            message: 'Error',
            data: error
        })
    }





}

exports.getAllPost = async (req, res) => {

    const { user_id } = req.query;

    if (!user_id) {

        res.status(200).json({
            status: 0,
            message: 'User id missing {user_id}'
        });
        return
    }

    try {

        let where = "where visibility = 'public'";


        let { video_type, last_id, channel_id } = req.query;


        if (video_type) {

            if (video_type == 'video' || video_type == 'videos') {
                where += " and (video_type = 'videos' or video_type = 'video')";
            } else {
                where += " and video_type = '" + video_type + "'";
            }


        }

        const user_channel = await common.get_dynamic_data("user_channel", ` where user_id = ${user_id}`, "GROUP_CONCAT(channel_id) as channels");



        if (user_channel.length > 0) {

            if (user_channel[0].channels) {
                //where += ` and channel_id in (${user_channel[0].channels})`
            }
        }

        if (last_id !== undefined) {
            where += ` and id < ${last_id}`
        }

        if (channel_id !== undefined) {
            where += ` and channel_id = ${channel_id}`
        }


        //console.log(where);

        //let select = "t1.id, IF(ISNULL(SUM(t2.state)), 0, SUM(t2.state)) AS state";
        //let table = "post as t1 LEFT JOIN post_like as t2 on t1.id = t2.post_id";

        let select = "id, (select sum(state) from post_like where post_like.post_id = post.id) AS state, (select count(state) from post_like where post_like.post_id = post.id and state = 1) AS likes, (select count(state) from post_like where post_like.post_id = post.id and state = -1) AS dislikes";

        where += ' ORDER BY state DESC,  id DESC LIMIT 10';


        const data = await common.get_dynamic_data('post', where, select);


        const result = [];

        console.log(data);

        if (data.length > 0) {

            for (var i = 0; i < data.length; i++) {
                const loop = await common.getPostDetail(data[i], user_id);
                result.push(loop)
            }
        }


        res.status(200).json({
            status: 1,
            message: "Success",
            data: result
        });
        return;



    } catch (error) {
        console.log(error)
        res.status(200).json({
            status: 0,
            message: error
        });
    }

}

exports.my_points = async (req, res) => {

    const { user_id, last_id, state } = req.query;

    if (!user_id) {

        res.status(200).json({
            status: 0,
            message: 'User id missing {user_id}'
        });
        return
    }

    try {

        let where = "inner join post on post.id = post_like.post_id where post_like.user_id = "+user_id;

        if (last_id !== undefined) {
            where += ` and id < ${last_id}`
        }

        if (state !== undefined) {
            where += ` and post_like.state = ${state}`
        }


        let select = "post_like.state as state, post.title as title, post_like.post_id as post_id, post_like.id as last_id";

        where += ' ORDER BY post_like.id DESC LIMIT 10';


        const data = await common.get_dynamic_data('post_like', where, select);

        res.status(200).json({
            status: 1,
            message: "Success",
            data: data
        });
        return;



    } catch (error) {
        console.log(error)
        res.status(200).json({
            status: 0,
            message: error
        });
    }

}
