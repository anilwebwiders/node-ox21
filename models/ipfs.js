const { BufferListStream  } = require('bl')
const IPFS = require('ipfs');
const createTorrent = require('create-torrent')
const fs = require('fs');

const WebTorrent = require('webtorrent')

const CreateMagnetURI = async (cid) => {
//const client = create()
    const ipfs = await IPFS.create({
        config: {
            repo: './ipfs'+Date.now(),
            relay: { enabled: true, hop: { enabled: true } },
            Addresses: {
                Swarm: [

                ],

            }       
        },
        EXPERIMENTAL: {
            pubsub: true
        },
    })

    //const cid = 'bafybeigg5crytyd5m7tdabqcz6kgjiyjmzngw2atcalzalxkynxtmpmf3q'


    const content = new BufferListStream()

    for await (const item of ipfs.ls(cid)){
    
        for await (const file of ipfs.get(item.cid)) {

            content.append(file)
        }
        //console.log(content);
        createTorrent(content, (err, torrent) => {
            if (!err) {
                fs.writeFile('my.torrent', torrent, (err) => {
                    if (err)
                        console.log(err);
                    else {
                        console.log("File written successfully\n");
                    }
                });
            }
            else {
                console.error(err)
            }
        });

    }

    const client = new WebTorrent()


    client.seed(content, function (torrent) {
        console.log('Client is seeding ' + torrent.magnetURI);
        return torrent.magnetURI;
    })

}
module.exports = { CreateMagnetURI };