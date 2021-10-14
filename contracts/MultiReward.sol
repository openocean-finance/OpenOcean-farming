// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import {OwnableUpgradeable} from '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import {SafeERC20Upgradeable, IERC20Upgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol';

// reward amount is constant, =(endBlock - startBlock)*speed, and cannot update
contract MultiReward is OwnableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    uint public constant MULTIPLIER = 1e36;

    /// @notice cannot use deflation token as stake token
    IERC20Upgradeable public stakeToken;

    uint public totalStaked;
    mapping(address => uint) public userStaked;

    struct Reward {
        IERC20Upgradeable rewardToken;
        uint speed;
        uint startBlock;
        uint endBlock;
        uint index; // each reward own different index(accRewardPerShare)
        uint updateBlock;
    }

    mapping(uint => Reward) public rewards;
    uint public rewardsId;

    struct UserState {
        uint index; // user accrued reward per share
        uint accrued; // claimed reward but not transfer to user
    }

    // user => rewardId => rewardAccrued
    mapping(address => mapping(uint => UserState)) public userStates;

    /* events */
    event NewReward(uint rewardId, IERC20Upgradeable rewardToken, uint speed, uint startBlock, uint endBlock);
    event DistributeReward(uint rewardId, address user, uint index, uint earned);
    event Deposit(address user, uint amount, uint blockNumber);
    event Withdraw(address user, uint amount, uint blockNumber);

    function initialize(IERC20Upgradeable _stakeToken) public initializer {
        __Ownable_init();
        stakeToken = _stakeToken;
    }

    function withdrawByOwner(IERC20Upgradeable token, uint amt) public onlyOwner {
        uint balance = token.balanceOf(address(this));
        if (amt > balance) {
            amt = balance;
        }
        token.safeTransfer(owner(), amt);
    }

    function setNewReward(IERC20Upgradeable _rewardToken, uint speed, uint startBlock, uint endBlock) public onlyOwner {
        require(startBlock > block.number, 'illegal start block');
        require(endBlock > startBlock, 'illegal end block');
        rewardsId++;
        rewards[rewardsId] = Reward(_rewardToken, speed, startBlock, endBlock, MULTIPLIER, startBlock);
        _rewardToken.safeTransferFrom(msg.sender, address(this), (endBlock - startBlock) * speed);

        emit NewReward(rewardsId, _rewardToken, speed, startBlock, endBlock);
    }

    function deposit(uint amount) public {
        // update index
        for (uint i = 1; i <= rewardsId; i++) {
            updateRewardIndex(i);
            distributeReward(i, msg.sender);
        }
        uint balance = stakeToken.balanceOf(address(msg.sender));
        if (amount > balance) {
            amount = balance;
        }
        // update state
        userStaked[msg.sender] += amount;
        totalStaked += amount;
        // transfer asset
        stakeToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposit(msg.sender, amount, block.number);
    }

    function withdraw(uint amount) public {
        // update index
        for (uint i = 1; i <= rewardsId; i++) {
            updateRewardIndex(i);
            distributeReward(i, msg.sender);
        }
        if (amount > userStaked[msg.sender]) {
            amount = userStaked[msg.sender];
        }
        uint balance = stakeToken.balanceOf(address(this));
        require(balance >= amount, "Insufficient balance");
        // update state
        userStaked[msg.sender] -= amount;
        totalStaked -= amount;
        // transfer asset
        stakeToken.safeTransfer(msg.sender, amount);
        emit Withdraw(msg.sender, amount, block.number);
    }

    function claimBatch(address []memory users) public {
        for (uint i = 0; i < users.length; i++) {
            claim(users[i]);
        }
    }

    function claim(address user) public {
        for (uint i = 1; i <= rewardsId; i++) {
            updateRewardIndex(i);
            distributeReward(i, user);
        }
    }

    function claimReward(address user, uint rewardId) public {
        updateRewardIndex(rewardId);
        distributeReward(rewardId, user);
    }

    function updateRewardIndex(uint rewardId) internal {
        if (totalStaked == 0) {
            // if there are no staked token, the reward accrued at contract
            return;
        }
        Reward storage reward = rewards[rewardId];
        if (reward.startBlock >= block.number) {
            // reward not start
            return;
        }
        uint latestBlock = block.number < reward.endBlock ? block.number : reward.endBlock;
        uint blockDelta = latestBlock - reward.updateBlock;
        if (blockDelta == 0) {
            // reward ended
            return;
        }
        uint rewardAccrued = blockDelta * reward.speed;
        uint indexDelta = rewardAccrued * MULTIPLIER / totalStaked;
        reward.index += indexDelta;
        reward.updateBlock = latestBlock;
    }

    function distributeReward(uint rewardId, address user) internal {
        UserState storage state = userStates[user][rewardId];
        Reward storage reward = rewards[rewardId];
        if (state.index == 0 && reward.index >= MULTIPLIER) {
            state.index = MULTIPLIER;
        }
        uint indexDelta = reward.index - state.index;
        uint earned = indexDelta * userStaked[user] / MULTIPLIER;
        state.accrued += earned;
        state.index = reward.index;
        if (state.accrued > 0 && reward.rewardToken.balanceOf(address(this)) > state.accrued) {
            reward.rewardToken.safeTransfer(user, state.accrued);
            state.accrued = 0;
        }
        emit DistributeReward(rewardId, user, state.index, earned);
    }

    /* view function */
    // return rewardId => rewardEarned
    // result[rewardId-1] represent `rewardId` reward
    function claimable(address user) public view returns (uint[] memory){
        uint[]memory result = new uint[](rewardsId);
        if (totalStaked == 0) {
            // if there are no staked token, the reward accrued at contract
            return result;
        }
        for (uint i = 1; i <= rewardsId; i++) {
            Reward memory reward = rewards[i];
            if (reward.startBlock >= block.number) {
                // reward not start
                continue;
            }
            uint latestBlock = block.number < reward.endBlock ? block.number : reward.endBlock;
            uint blockDelta = latestBlock - reward.updateBlock;
            if (blockDelta == 0) {
                // reward ended
                continue;
            }
            uint rewardAccrued = blockDelta * reward.speed;
            UserState memory state = userStates[user][i];
            if (state.index == 0 && reward.index >= MULTIPLIER) {
                state.index = MULTIPLIER;
            }
            uint indexDelta = reward.index - state.index + rewardAccrued * MULTIPLIER / totalStaked;
            uint earned = indexDelta * userStaked[user] / MULTIPLIER;
            result[i - 1] = state.accrued + earned;
        }
        return result;
    }
}
