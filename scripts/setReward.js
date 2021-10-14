// 部署合约
async function main() {

    //avax mainnet
    let MultiRewardAddress = '0xa08fA63Da5734e7dc83BDd7c3118629dA59625Ae';
    const multiReward = await ethers.getContractAt('MultiReward', MultiRewardAddress);
    if (true) {
        let ooe = "0x0ebd9537a25f56713e34c45b38f421a1e7191469";
        let png = "0x60781c2586d68229fde47564546784ab3faca982";
        await multiReward.withdrawByOwner(ooe, ethers.BigNumber.from('40000000000000000000'));
        await multiReward.withdrawByOwner(png, ethers.BigNumber.from('40000000000000000000'));
        return;
    }
    if (false) {
        await multiReward.setNewReward('0x7eB534Edd88eDB01EC2e16413bd295cF0d0E8AF3');
    }
    return
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
