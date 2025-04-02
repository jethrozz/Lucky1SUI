module lucky1sui::lottery_vault{
    use lending_core::{account::{AccountCap}, lending, version, logic};
    use lending_core::incentive_v2::{Incentive as IncentiveV2};
    use lending_core::incentive_v3::{Self, Incentive, RewardFund};
    use lending_core::pool::{Pool};
    use lending_core::storage::{Storage};
    use oracle::oracle::{PriceOracle};
    use sui::{clock::Clock};
    use std::string::{Self, String};
    use std::type_name;
    use sui::coin::{Self, Coin, TreasuryCap};

    public(package) fun deposit<CoinType> (
        asset_index: u8,
        account_cap: &AccountCap,
        deposit_coin: Coin<CoinType>,
        storage: &mut Storage,
        pool_a: &mut Pool<CoinType>,
        incentive_v2: &mut IncentiveV2,
        incentive_v3: &mut Incentive,
        clock: &Clock
    ) {

        lending_core::incentive_v3::deposit_with_account_cap(clock, storage, pool_a, asset_index, deposit_coin, incentive_v2, incentive_v3, account_cap);
    }

    public entry fun get_reward_claimable_rewards(
        clock: &Clock,
        incentive: &mut Incentive,
        storage: &mut Storage,
        user: address) {
        let (
            asset_coin_types,
            reward_coin_types,
            user_total_rewards,
            user_claimed_rewards,
            rule_ids,
        ) = incentive_v3::parse_claimable_rewards(
            incentive_v3::get_user_claimable_rewards(
                clock,
                storage,
                incentive,
                user
            ),
        );
        let input_coin_types = vector::empty<String>();
        let input_rule_ids = vector::empty<address>();

        let mut i = 0;
        while (i < vector::length(&asset_coin_types)) {
            let asset_coin_type = vector::borrow(&asset_coin_types, i);
            let reward_coin_type = vector::borrow(&reward_coin_types, i);
            let user_total_reward = *vector::borrow(&user_total_rewards, i);
            let user_claimed_reward = *vector::borrow(&user_claimed_rewards, i);
            // event::emit( RewardClaimed {
            //     asset_coin_type: *asset_coin_type,
            //     reward_coin_type: *reward_coin_type,
            //     user_claimable_reward: user_total_reward,
            //     user_claimed_reward: user_claimed_reward
            // });
            i = i + 1;
        };
    }

    public(package) fun claim_reward_entry<RewardCoinType>(
        clock: &Clock,
        incentive: &mut Incentive,
        storage: &mut Storage,
        reward_fund: &mut RewardFund<RewardCoinType>,
        recipient: address,
        ctx: &mut TxContext,
    ) {
        let (
            asset_coin_types,
            reward_coin_types,
            user_total_rewards,
            user_claimed_rewards,
            rule_ids,
        ) = incentive_v3::parse_claimable_rewards(
            incentive_v3::get_user_claimable_rewards(
                clock,
                storage,
                incentive,
                tx_context::sender(ctx),
            ),
        );

        let target_coin_type = &type_name::into_string(type_name::get<RewardCoinType>());

        let mut input_coin_types: vector<std::ascii::String> = vector::empty<std::ascii::String>();
        let mut input_rule_ids = vector::empty<address>();

        let mut i = 0;
        while (i < vector::length(&asset_coin_types)) {
            let asset_coin_type = vector::borrow(&asset_coin_types, i);
            let reward_coin_type = vector::borrow(&reward_coin_types, i);
            let user_total_reward = *vector::borrow(&user_total_rewards, i);
            let user_claimed_reward = *vector::borrow(&user_claimed_rewards, i);
            let rule_id = vector::borrow(&rule_ids, i);

            if (user_total_reward > user_claimed_reward && reward_coin_type == target_coin_type) {
                input_coin_types.push_back(*asset_coin_type);
                input_rule_ids.append(*rule_id)
            };

            i = i + 1;
        };

        let balance = incentive_v3::claim_reward<RewardCoinType>(
            clock,
            incentive,
            storage,
            reward_fund,
            input_coin_types,
            input_rule_ids,
            ctx,
        );

        transfer::public_transfer(coin::from_balance(balance, ctx), recipient)
    }

    public fun withdraw<CoinType> (
        asset_index: u8,
        account_cap: &AccountCap,
        sui_withdraw_amount: u64,
        storage: &mut Storage,
        pool: &mut Pool<CoinType>,
        incentive_v2: &mut IncentiveV2,
        incentive_v3: &mut Incentive,
        clock: &Clock,
        oracle: &PriceOracle,
        ctx: &mut TxContext
    ) {
        //lending_core::incentive_v3::withdraw_with_account_cap
        let withdrawn_balance = lending_core::incentive_v3::withdraw_with_account_cap(clock, 
        oracle, 
        storage, 
        pool, 
        asset_index, 
        sui_withdraw_amount, 
        incentive_v2, 
        incentive_v3, 
        account_cap);
        // 将 withdrawn_balance 转换为 Coin<CoinType>
        let coin = coin::from_balance(withdrawn_balance, ctx);
        // 将 coin 转移给 ctx.sender()
        transfer::public_transfer(coin, ctx.sender());
    }
}