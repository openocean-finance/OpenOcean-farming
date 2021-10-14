const constant = require('../constant');
const {expect} = require('chai');
const {fastForwardTo, getBlockHeight} = require('../utils');

module.exports = function (CHECKER, contracts, users) {
    CHECKER.case('/deposit@1e18', async () => {
        let depositAmt = ethers.BigNumber.from('1000000000000000000');
        await contracts.stakeAsset.connect(users.default).approve(contracts.multiReward.address, depositAmt);
        await contracts.multiReward.connect(users.default).deposit(depositAmt);
        CHECKER.change_val("defaultAccTSABalanace", v => v.sub(depositAmt));
        CHECKER.change_val("contractTSABalanace", v => v.add(depositAmt));
        CHECKER.change_val("totalStaked", v => v.add(depositAmt));
        CHECKER.change_val("defaultAccStaked", v => v.add(depositAmt));
        CHECKER.change_val("defaultAccState1", v => [constant.DOUBLE, 0]);
    });

    CHECKER.case('/deposit@1e18/deposit@2e18_after1block', async () => {
        let destBlockHeight = contracts.startBlock.add('1');
        await fastForwardTo(destBlockHeight);

        let totalStaked = await contracts.multiReward.totalStaked();
        let depositAmt = ethers.BigNumber.from('2000000000000000000');
        await contracts.stakeAsset.connect(users.default).approve(contracts.multiReward.address, depositAmt);
        let reward = await contracts.multiReward.rewards(1);
        await contracts.multiReward.connect(users.default).deposit(depositAmt);
        let curHeight = await getBlockHeight();
        let rewardAccrued = constant.SPEED.mul(curHeight.sub(reward[5]));
        let deltaIndex = rewardAccrued.mul(constant.DOUBLE).div(totalStaked);
        let newIndex = constant.DOUBLE.add(deltaIndex);
        CHECKER.change_val("contractTRA1Balanace", v => v.sub(rewardAccrued));
        CHECKER.change_val("defaultAccTRA1Balanace", v => v.add(rewardAccrued));
        CHECKER.change_val("defaultAccTSABalanace", v => v.sub(depositAmt));
        CHECKER.change_val("contractTSABalanace", v => v.add(depositAmt));
        CHECKER.change_val("totalStaked", v => v.add(depositAmt));
        CHECKER.change_val("defaultAccStaked", v => v.add(depositAmt));
        CHECKER.expect_val("reward1", v => [contracts.rewardAsset1.address, constant.SPEED, contracts.startBlock,
            contracts.endBlock, newIndex, curHeight]);
        CHECKER.change_val("defaultAccState1", v => [newIndex, 0]);
    });

    CHECKER.case('/deposit@1e18/deposit@2e18_another', async () => {
        let destBlockHeight = contracts.startBlock.add('2');
        await fastForwardTo(destBlockHeight);
        let totalStaked = await contracts.multiReward.totalStaked();
        let depositAmt = ethers.BigNumber.from('2000000000000000000');
        await contracts.stakeAsset.connect(users.another).approve(contracts.multiReward.address, depositAmt);
        let reward = await contracts.multiReward.rewards(1);
        await contracts.multiReward.connect(users.another).deposit(depositAmt);
        let curHeight = await getBlockHeight();
        let rewardAccrued = constant.SPEED.mul(curHeight.sub(reward[5]));
        let deltaIndex = rewardAccrued.mul(constant.DOUBLE).div(totalStaked);
        let newIndex = constant.DOUBLE.add(deltaIndex);
        CHECKER.change_val("anotherAccStaked", v => v.add(depositAmt));
        CHECKER.change_val("contractTSABalanace", v => v.add(depositAmt));
        CHECKER.change_val("anotherAccTSABalanace", v => v.sub(depositAmt));
        CHECKER.change_val("totalStaked", v => v.add(depositAmt));
        CHECKER.expect_val("reward1", v => [contracts.rewardAsset1.address, constant.SPEED, contracts.startBlock,
            contracts.endBlock, newIndex, curHeight]);
        CHECKER.change_val("anotherAccState1", v => [newIndex, 0]);
        curHeight = await getBlockHeight();
        destBlockHeight = curHeight.add('2');
        await fastForwardTo(destBlockHeight);
        curHeight = await getBlockHeight();
        reward = await contracts.multiReward.rewards(1);
        let rewardUserDefault1 = (reward[5].sub(contracts.startBlock)).mul(constant.SPEED);
        let rewardUserDefault2 = (curHeight.sub(reward[5])).mul(constant.SPEED).div(3);
        let anotherUserDefault2 = (curHeight.sub(reward[5])).mul(constant.SPEED).mul(2).div(3);
        CHECKER.expect_val("defaultAccClaimable", v => [rewardUserDefault1.add(rewardUserDefault2)]);
        CHECKER.expect_val("anotherAccClaimable", v => [anotherUserDefault2]);
    });

    CHECKER.case('/deposit@1e18/withdraw@1e18', async () => {
        let withdrawAmt = ethers.BigNumber.from('1000000000000000000');
        await contracts.multiReward.connect(users.default).withdraw(withdrawAmt);
        CHECKER.change_val("defaultAccTSABalanace", v => v.add(withdrawAmt));
        CHECKER.change_val("contractTSABalanace", v => v.sub(withdrawAmt));
        CHECKER.change_val("totalStaked", v => v.sub(withdrawAmt));
        CHECKER.change_val("defaultAccStaked", v => v.sub(withdrawAmt));
        CHECKER.change_val("defaultAccState1", v => [constant.DOUBLE, 0]);
    });

    CHECKER.case('/deposit@1e18/withdraw@1e18_after2block', async () => {
        let destBlockHeight = contracts.startBlock.add('2');
        await fastForwardTo(destBlockHeight);
        let totalStaked = await contracts.multiReward.totalStaked();
        let withdrawAmt = ethers.BigNumber.from('1000000000000000000');
        await contracts.multiReward.connect(users.default).withdraw(withdrawAmt);
        let curHeight = await getBlockHeight();
        let accrued = curHeight.sub(contracts.startBlock).mul(constant.SPEED);
        let newIndex = constant.DOUBLE.add(accrued.mul(constant.DOUBLE).div(totalStaked));
        CHECKER.change_val("defaultAccTRA1Balanace", v => v.add(accrued));
        CHECKER.change_val("contractTRA1Balanace", v => v.sub(accrued));
        CHECKER.expect_val("reward1", v => [contracts.rewardAsset1.address, constant.SPEED, contracts.startBlock,
            contracts.endBlock, newIndex, curHeight]);
        CHECKER.change_val("defaultAccTSABalanace", v => v.add(withdrawAmt));
        CHECKER.change_val("contractTSABalanace", v => v.sub(withdrawAmt));
        CHECKER.change_val("totalStaked", v => v.sub(withdrawAmt));
        CHECKER.change_val("defaultAccStaked", v => v.sub(withdrawAmt));
        CHECKER.change_val("defaultAccState1", v => [newIndex, 0]);
    });
}
