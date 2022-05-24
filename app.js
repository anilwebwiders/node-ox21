const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const multer = require("multer");
var cors = require('cors');
var bodyParser = require('body-parser');

dotenv.config({
    path:"config.env"
})
const PORT = 3000;
const app = express();

const db = require(path.join(__dirname,"connection/database"));

app.use('/images', express.static('images'));

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(multer().array());
const router = path.join(__dirname,"./routes/router");
app.use('/api',require(router))
const common =require("./models/common");

app.get("/signup11", (req, res, next) => {
	console.log('hello',req.params);
	console.log('hello',req.query);
	var red=common.add_data('users',req.body);
	console.log('hello');
});

app.listen(PORT,(message)=>{
    console.log(`server listening on port ${PORT}`)
})
