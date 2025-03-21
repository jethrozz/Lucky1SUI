module lucky1sui::lottery_ticket{
    use sui::object::{Self, UID, ID};
    use std::string::{Self, String};
        // 彩票nft
    public struct Ticket has key, store {
        id: UID,
        name: String,
        description: String,
        link: String,
        image_url: String,
        project_url: String,
        creator: String,
        no: String, // 彩票号
    }


    fun init(){}

}