const common = require("../models/common");

const web3 = require("../web3")

let fs = require('fs');


//const client = new Web3Storage({ token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweGJmRTUwMkRDNDcwNjY3OTI5ODJjM2MzNGExOGE3YkFCMjAwNTJFNzciLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NDM3MjY1NTUyMTMsIm5hbWUiOiJveDIxIn0.HEwj-sR7qOLSJvX7kK-VSyZBVnHSjYYdtilBFKFG4SI' })


exports.upload_file = async (req,res) => {
   
    console.log(req.body.test);
    
    let s_id = await web3.storeFilesToWeb3(req.file.path);
    console.log("image id: ", s_id);

    let rs_id = await web3.retrieveFiles(s_id);
    console.log("image retrieve: ", rs_id);

    

    fs.unlinkSync(req.file.path);

   
    res.status(200).json({
        status:0,
        message:rs_id
    });
}