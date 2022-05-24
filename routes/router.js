const router = require("express").Router();
const users = require("../controllers/users");
const common_api = require("../controllers/common_api");
const post_module_api = require("../controllers/post_module_api");
const addFileApi = require("../controllers/addFileApi");
//const commonModel = require("../models/common");
const banner = require('../controllers/banner')
const domain = require('../controllers/domain')


const multer = require('multer');
const upload = multer({ dest: 'images/' });

router.get("/get_users", users.list);
router.post("/signup", users.add_users);
router.get("/get_user_by_id/:id", users.get_user_by_id);
//router.get("/delete_user/:id", users.delete_user);
//router.post("/update_user", users.update_user);
router.get("/get_languages", users.get_languages);
router.get("/get_channels", users.get_channels);
router.post("/signin", users.signin);
router.post("/update_user_language", users.update_user_language);
router.post("/update_address", users.update_address);
router.post("/forget_password", users.forget_password);
router.post("/change_password", users.change_password);
router.post("/add_channels", users.add_channels);
router.post("/remove_user_channel", users.remove_user_channel);
router.get("/get_terms", common_api.get_terms);

/**Playlist/Post */
router.post("/add_playlist", post_module_api.add_playlist);
router.post("/delete_playlist", post_module_api.delete_playlist);
router.get("/getUserPlaylist/:id", post_module_api.getUserPlaylist);
router.post("/addUserVideos/", upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }, { name: 'screenshots', maxCount: 10 }]), post_module_api.addUserVideos);
router.post("/create_channels/", upload.fields([{ name: 'image', maxCount: 1 }]), users.create_channels);
router.post("/update_channels/", upload.fields([{ name: 'image', maxCount: 1 }]), users.update_channels);
router.post("/upload_file/", upload.single('files'), addFileApi.upload_file);
router.get("/getMyPost/:id", post_module_api.getMyPost);
router.get("/getPostByID/:id", post_module_api.getPostByID);
router.get("/checkLastPostStatus/:id", post_module_api.checkLastPostStatus);
router.get("/getAllPost", post_module_api.getAllPost);
router.get("/likePost", post_module_api.likePost);
router.get("/dislikePost", post_module_api.dislikePost);
router.get("/removeLikeOrDislike", post_module_api.removeLikeOrDislike);
router.get("/my_channels", users.my_channels);
router.get("/getTopBannerPrices", common_api.getTopBannerPrices);
router.get("/my_points", post_module_api.my_points);

router.get("/check_banner_status", banner.check_banner_status);
router.post("/buy_banner", banner.buy_banner);
router.get("/get_bidders", banner.get_bidders);
router.get("/checker_payment", banner.checker_payment);
router.get("/check_my_banner_status", banner.check_my_banner_status);


//domain api
router.get('/domain_cost', domain.domain_cost);
router.get('/domain_check', domain.check_domain);
router.post('/buy_domain', domain.buy_domain);
router.get('/my_domains', domain.my_domains);

router.all("/*", (req, res) => {
    res.status(404).json({
        status: 0,
        message: "Api Not found."
    })
})

module.exports = router;
