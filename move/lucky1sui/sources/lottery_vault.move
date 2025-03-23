module lucky1sui::lottery_vault{
    use lending_core::{account::{AccountCap}, lending, version, logic};
    use lending_core::incentive_v2::{Incentive as IncentiveV2};
    use lending_core::incentive_v3::{Self, Incentive};
    use lending_core::pool::{Pool};
    use lending_core::storage::{Storage};
    use oracle::oracle::{PriceOracle};
    use sui::{clock::Clock};
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
    ): Coin<CoinType> {
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
        coin::from_balance(withdrawn_balance, ctx)
    }
}