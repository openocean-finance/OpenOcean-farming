const constant = require('./constant');
const {expect} = require("chai");
const initAssetAmount = constant.MULTIPLIER.mul(1000000);

describe('MultiReward Farming System', async function () {
    const CHECKER = {
        __data__: {},
        __case__: {},
        add: function (name, f, val = 0) {
            CHECKER.__data__[name] = {
                f: f,
            }
            CHECKER.expect_val(name, val);
        },
        expect_val: function (name, val) {
            if (val === null) {
                CHECKER.__data__[name].expect = v => v.should.be.rejected;
            } else if (typeof val === "function") {
                CHECKER.__data__[name].expect = val;
            } else if (Array.isArray(val)) {
                CHECKER.__data__[name].expect = async v => {
                    const a = await v;
                    for (let i = 0; i < a.length; i++) {
                        if (name == "defaultAccTRA1Balanace") {
                            // console.log(name, i, a[i].toString(), val[i].toString());
                        }
                        expect(a[i]).to.be.equal(val[i]);
                    }
                };
            } else {
                CHECKER.__data__[name].expect = async v => {
                    const a = await v;
                    if (ethers.BigNumber.isBigNumber(a) && !a.eq(val)) {
                        console.log(name, 'not equal', a.toString(), val.toString());
                        // mismatch should be less than 1e-13
                        expect(a.sub(val).abs().mul(constant.MULTIPLIER).div(a)).to.lt(100000);
                    } else {
                        v.should.eventually.equal(val);
                    }
                };
            }
        },
        change_val: function (name, f) {
            CHECKER.expect_val(name, f(CHECKER.__data__[name].val))
        },
        fetch: async function () {
            for (const k in CHECKER.__data__) {
                await CHECKER.__data__[k].f().then(v => {
                    CHECKER.__data__[k].val = v;
                    CHECKER.expect_val(k, v);
                }).catch(err => {
                });
            }
        },
        check: async function () {
            for (const k in CHECKER.__data__) {
                try {
                    await CHECKER.__data__[k].expect(CHECKER.__data__[k].f());
                } catch (err) {
                    throw new Error(`${k}: ${err}`);
                }
            }
        },
        case: function (name, f) {
            [...name].forEach(v => {
                if (v < '/') {
                    throw name;
                }
            })
            if (this.__case__[name]) {
                throw name;
            }
            this.__case__[name] = f
        },
        run: function () {
            Object.keys(this.__case__).sort().forEach(key => {
                CHECKER.test(key, this.__case__[key]);
            })
        },
        test: function (name, f) {
            it(name, async function () {
                const path = require('path')
                await network.provider.send("evm_revert", [snapshots[path.dirname(name)]]).should.eventually.equal(true);
                snapshots[path.dirname(name)] = await network.provider.send("evm_snapshot");
                await CHECKER.fetch();
                await f();
                await CHECKER.check();
                snapshots[name] = await network.provider.send("evm_snapshot");
            })
        },
    }
    let users = {};
    let contracts = {};
    let snapshots = {};
    let reward1StartBlock;
    before(async function () {
        const chai = require("chai");
        const cap = require("chai-as-promised");
        chai.use(cap);
        chai.should();
    });
    before('initialize user', async function () {
        [users.owner, users.default, users.another] = await ethers.getSigners();
    });
    before('deploy contract', async function () {
        reward1StartBlock = await deploy(contracts, users);
    });
    before('initialize CHECKER', async function () {
        CHECKER.add('defaultAccTSABalanace', () => contracts.stakeAsset.balanceOf(users.default.address));
        CHECKER.add('anotherAccTSABalanace', () => contracts.stakeAsset.balanceOf(users.another.address));
        CHECKER.add('contractTSABalanace', () => contracts.stakeAsset.balanceOf(contracts.multiReward.address));
        CHECKER.add('defaultAccTRA1Balanace', () => contracts.rewardAsset1.balanceOf(users.default.address));
        CHECKER.add('anotherAccTRA1Balanace', () => contracts.rewardAsset1.balanceOf(users.another.address));
        CHECKER.add('contractTRA1Balanace', () => contracts.rewardAsset1.balanceOf(contracts.multiReward.address));
        CHECKER.add('defaultAccTRA2Balanace', () => contracts.rewardAsset2.balanceOf(users.default.address));
        CHECKER.add('anotherAccTRA2Balanace', () => contracts.rewardAsset2.balanceOf(users.another.address));
        CHECKER.add('contractTRA2Balanace', () => contracts.rewardAsset2.balanceOf(contracts.multiReward.address));

        CHECKER.add('totalStaked', () => contracts.multiReward.totalStaked());
        CHECKER.add('defaultAccStaked', () => contracts.multiReward.userStaked(users.default.address));
        CHECKER.add('anotherAccStaked', () => contracts.multiReward.userStaked(users.another.address));
        CHECKER.add('reward1', () => contracts.multiReward.rewards(1));
        CHECKER.add('reward2', () => contracts.multiReward.rewards(2));
        CHECKER.add('rewardsId', () => contracts.multiReward.rewardsId());
        CHECKER.add('defaultAccState1', () => contracts.multiReward.userStates(users.default.address, 1));
        CHECKER.add('anotherAccState1', () => contracts.multiReward.userStates(users.another.address, 1));
        CHECKER.add('defaultAccState2', () => contracts.multiReward.userStates(users.default.address, 2));
        CHECKER.add('anotherAccState2', () => contracts.multiReward.userStates(users.another.address, 2));
        CHECKER.add('defaultAccClaimable', () => contracts.multiReward.claimable(users.default.address));
        CHECKER.add('anotherAccClaimable', () => contracts.multiReward.claimable(users.another.address));
    });
    before('check initial state', async function () {
        CHECKER.expect_val('defaultAccTSABalanace', initAssetAmount);
        CHECKER.expect_val('anotherAccTSABalanace', initAssetAmount);
        CHECKER.expect_val('contractTSABalanace', constant.SPEED.mul(constant.REWARD_DURATION));

        CHECKER.expect_val('reward1', [contracts.rewardAsset1.address, constant.SPEED, reward1StartBlock,
            reward1StartBlock.add(constant.REWARD_DURATION), constant.DOUBLE, reward1StartBlock]);
    });
    before(async function () {
        snapshots['/'] = await network.provider.send("evm_snapshot");
    });
    require('./case/multiReward')(CHECKER, contracts, users);
    require('./case/singleReward')(CHECKER, contracts, users);
    CHECKER.run()
})

async function deploy(contracts, users) {
    /* deploy test asset */
    const MockERC20 = await ethers.getContractFactory('MockERC20');
    contracts.stakeAsset = await MockERC20.deploy('Test Stake Asset', 'TSA');
    contracts.rewardAsset1 = await MockERC20.deploy('Test Reward Asset 1', 'TRA1');
    contracts.rewardAsset2 = await MockERC20.deploy('Test Reward Asset 2', 'TRA2');
    /* deploy MultiReward */
    const MultiReward = await ethers.getContractFactory('MultiReward');
    contracts.multiReward = await upgrades.deployProxy(MultiReward, [contracts.stakeAsset.address]);

    /* transfer test asset */
    await contracts.stakeAsset.transfer(users.default.address, initAssetAmount);
    await contracts.stakeAsset.transfer(users.another.address, initAssetAmount);

    /* set reward */
    let startBlock = await ethers.provider.getBlockNumber();
    startBlock = ethers.BigNumber.from(startBlock).add(10);
    let endBlock = startBlock.add(constant.REWARD_DURATION);
    await contracts.rewardAsset1.approve(contracts.multiReward.address, constant.DOUBLE);
    await contracts.multiReward.setNewReward(contracts.rewardAsset1.address, constant.SPEED, startBlock, endBlock);
    contracts.startBlock = startBlock;
    contracts.endBlock = endBlock;
    return startBlock;
}
