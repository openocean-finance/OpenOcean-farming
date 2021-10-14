// 升级合约
async function main() {

    let network = "avax";
    var MultiRewardAddress;
    if (network == "avax") {
        MultiRewardAddress = "0xa08fA63Da5734e7dc83BDd7c3118629dA59625Ae";
    }
    if (network == "kovan") {
        // kovan
        MultiRewardAddress = "0x4DEdd064Ba05a0837812A4BE4ccd6d3042bd7719";
    }
    const MultiReward = await ethers.getContractFactory("MultiReward");
    let multiReward = await upgrades.upgradeProxy(MultiRewardAddress, MultiReward);
    console.log("new multiReward:", multiReward);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
