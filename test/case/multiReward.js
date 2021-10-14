const constant = require('../constant');
const {expect} = require('chai');
const {fastForwardTo, getBlockHeight} = require('../utils');


module.exports = function (CHECKER, contracts, users) {
    CHECKER.case('/setReward2', async () => {
        let startBlock = contracts.startBlock.add(10);
        let endBlock = contracts.endBlock.add(10);
        let delta = (endBlock.sub(startBlock)).mul(constant.SPEED);
        await contracts.multiReward.setNewReward(contracts.rewardAsset1.address, constant.SPEED, startBlock, endBlock);
        CHECKER.change_val("contractTRA1Balanace", v => v.add(delta));
        CHECKER.expect_val("reward2", v => [contracts.rewardAsset2.address, constant.SPEED, startBlock,
            endBlock, constant.DOUBLE, startBlock]);
        CHECKER.change_val("rewardsId", v => v.add(ethers.BigNumber.from("1")));
        CHECKER.expect_val("defaultAccClaimable", v => [0, 0]);
        CHECKER.expect_val("anotherAccClaimable", v => [0, 0]);
    });

    CHECKER.case('/setReward2/deposit@1e18', async () => {
        let startBlock = contracts.startBlock.add(10);
        let destBlock = startBlock.add(2);
        await fastForwardTo(destBlock);
        await contracts.stakeAsset.connect(users.default).approve(contracts.multiReward.address, constant.SPEED);
        await contracts.multiReward.connect(users.default).deposit(constant.SPEED);

        CHECKER.change_val("contractTSABalanace", v => v.add(constant.SPEED));
        CHECKER.change_val("totalStaked", v => v.add(constant.SPEED));
        CHECKER.change_val("defaultAccTSABalanace", v => v.sub(constant.SPEED));
        CHECKER.change_val("defaultAccStaked", v => v.add(constant.SPEED));
        CHECKER.expect_val("defaultAccState1", v => [constant.DOUBLE, 0]);
        CHECKER.expect_val("defaultAccState2", v => [constant.DOUBLE, 0]);
        curHeight = await getBlockHeight();
        await fastForwardTo(curHeight.add(2));
        curHeight = await getBlockHeight();
        let delta = (curHeight.sub(startBlock)).mul(constant.SPEED);
        let delta2 = (curHeight.sub(contracts.startBlock)).mul(constant.SPEED);
        CHECKER.expect_val("defaultAccClaimable", [delta2, delta]);
    });
}
