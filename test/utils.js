
async function fastForwardTo(destHeight) {
    while (ethers.BigNumber.from(await ethers.provider.send('eth_blockNumber')).lt(destHeight)) {
        await ethers.provider.send('evm_mine');
    }
}

async function getBlockHeight() {
    return ethers.BigNumber.from(await ethers.provider.send('eth_blockNumber'));
}

module.exports = {
    fastForwardTo,getBlockHeight
}
