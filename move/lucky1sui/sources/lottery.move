module lucky1sui::lottery;

use sui::object::{Self, UID};
use std::string::String;
use sui::vec_map::{Self, VecMap};
use lending_core::account::{AccountCap};
use lending_core::lending;
use lending_core::incentive::{Incentive as IncentiveV1};
use lending_core::incentive_v2::{Self, Incentive};
use lending_core::pool::{Pool};
use lending_core::storage::{Storage};
use lending_core::version;
use lending_core::logic;

use oracle::oracle::{PriceOracle};


//资金管理池
public struct Pool has key, store{
    id: UID,
    sui_index: u8,
    account_cap: AccountCap,
    //用户资金映射
    activitiesInProgress: VecMap<address, u64>, //用户已存入的资金
}

public struct Lottery has key, store{
    id: UID,
    //名称
    name: String,
    //期数
    no: u64,
    //参与用户
    users: vector<address>,
    pool: Pool
}