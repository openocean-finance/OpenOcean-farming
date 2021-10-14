// 部署合约
async function main() {
    // just for test
    if (false) {
        let multiReward = await ethers.getContractAt('MultiReward', '0x698aeEef2f95d80a6b3AD44468Bbde96C61A4883');
        let owner = await multiReward.owner();
        console.log("owner:", owner.toString());
        await multiReward.initialize('0x052a803358a4d0f20ec9a98d8778a3f27426ce8f');
        return;
    }
    //avax mainnet  0xa08fA63Da5734e7dc83BDd7c3118629dA59625Ae
    if (false) {
        let ooe = "0x0ebd9537A25f56713E34c45b38F421A1e7191469";
        const MultiReward = await ethers.getContractFactory('MultiReward');
        let multiReward = await upgrades.deployProxy(MultiReward, [ooe]);
        console.log("multiReward address:", multiReward.address);
        return;
    }
    //transferOwnership
    if (true) {
        const multiReward = await ethers.getContractAt('MultiReward', '0xa08fA63Da5734e7dc83BDd7c3118629dA59625Ae');
        await multiReward.transferOwnership('0x7eB534Edd88eDB01EC2e16413bd295cF0d0E8AF3');
        return
    }
    let signers = await ethers.getSigners();
    console.log(signers[0].address);
    // const MockERC20 = await ethers.getContractFactory('MockERC20');
    // let stakeAsset = await MockERC20.deploy('Test Stake Asset', 'TSA');
    const MultiReward = await ethers.getContractFactory('MultiReward');
    let multiReward = await upgrades.deployProxy(MultiReward, ['0xc9702b460881689bac6ffc0ed0a48ceabfa0d4d1']);
    console.log("multiReward address:", multiReward.address);
    // await upgrades.upgradeProxy(multiReward.address, MultiReward);
    // console.log("multiReward address:", multiReward.address);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
