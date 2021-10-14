require("@nomiclabs/hardhat-waffle");
require('@openzeppelin/hardhat-upgrades');
const { privateKey, address } = require('./secrets.json');


/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {},
        kovan: {
            url: "https://kovan.infura.io/v3/d87255a6627542eba4eaa9d5278832e0",
            chainId: 42,
            gasPrice:1000000000,
            gas:2000000,
            timeout:10000000,
            accounts: [privateKey]
        },
        avax:{
            url: "https://api.avax.network/ext/bc/C/rpc",
            chainId: 0xa86a,
            gas:2000000,
            timeout:10000000,
            accounts: [privateKey]
        }
    },
    etherscan: {
        // Your API key for Etherscan
        // Obtain one at https://bscscan.com/
        apiKey: "d87255a6627542eba4eaa9d5278832e0"
    },
    solidity: "0.8.4",
    settings: {
        optimizer: {
            enabled: true,
            runs: 999999
        }
    }
};
