const web3 = require("web3.storage");
const { WEB3_TOKEN } = require("./constant");
const { Web3Storage, getFilesFromPath } = web3;

//const token = process.env.API_TOKEN
const token = WEB3_TOKEN;
const client = new Web3Storage({ token });

async function storeFilesToWeb3(path) {
    const files = await getFilesFromPath(path)
    const cid = await client.put(files)
    return cid;
}
async function retrieveFiles(cid) {
    const id = cid;
    const res = await client.get(cid)
    const files = await res.files()
    return files[0].cid;
}

module.exports = { storeFilesToWeb3, retrieveFiles };