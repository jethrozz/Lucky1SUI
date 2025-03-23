module lucky1sui::lottery_ticket{
    use sui::{package, display, bag::{Self, Bag}, object::{Self, UID, ID}, clock::Clock};
    use std::string::{Self, String};
    use sui::vec_map::{Self, VecMap};
    use lucky1sui::lottery::LotteryPool;
        //彩票的一次性见证者
    public struct LOTTERY_TICKET has drop {}
        // 彩票nft
    public struct Ticket has key, store {
        id: UID,
        name: String,
        description: String,
        link: String,
        image_url: String,
        project_url: String,
        creator: String,
        ext_bag: Bag, // 彩票号
    }

    fun init(otw: LOTTERY_TICKET, ctx : &mut TxContext){
        //固定写法
        let keys = vector[
                b"name".to_string(),
                b"link".to_string(),
                b"image_url".to_string(),
                b"description".to_string(),
                b"project_url".to_string(),
                b"creator".to_string(),
            ];

            let values = vector[
                // For `name` one can use the `Hero.name` property
                b"{name}".to_string(),
                // For `link` one can build a URL using an `id` property
                b"https://luckonesui.xyz".to_string(),
                // For `image_url` use an IPFS template + `image_url` property.
                b"{image_url}".to_string(),
                // Description is static for all `Hero` objects.
                b"{description}".to_string(),
                // Project URL is usually static
                b"https://luckonesui.xyz".to_string(),
                // Creator field can be any
                b"LuckyOneSui".to_string(),
            ];

            // Claim the `Publisher` for the package!
            let publisher = package::claim(otw, ctx);

            // Get a new `Display` object for the `Ticket` type.
            let mut display = display::new_with_fields<Ticket>(
                &publisher, keys, values, ctx
            );

            // Commit first version of `Display` to apply changes.
            display.update_version();
            transfer::public_transfer(publisher, ctx.sender());
            transfer::public_transfer(display, ctx.sender());
    }

    public(package) fun genTicket(name: String, desc: String, link: String, image_url:String,project_url: String, pool_no: u64, ctx : &mut TxContext): Ticket{
        let mut ticket = Ticket {
            id: object::new(ctx),
            name,
            description: desc,
            link,
            image_url,
            project_url,
            creator: b"LuckyOneSui".to_string(),
            ext_bag: bag::new(ctx),
        };

        let ext_bag = &mut ticket.ext_bag; 
        ext_bag.add(b"pool_no", pool_no);

        ticket
    }

    public(package) fun addTicketNumber(ticket: &mut Ticket, pool_no: u64, count:u64,clock: &Clock, joined_ticket_numbers: &mut VecMap<String, ID>){
        let ext_bag = &mut ticket.ext_bag; 
        let mut ticket_number_set = vector::empty<String>();
        let mut i=1;
        let ticket_id = object::id(ticket);
        while(i <= count){
            let mut tn: String = b"".to_string();
            let timestamp = clock.timestamp_ms();   
            tn.append(pool_no.to_string());
            tn.append(i.to_string());
            tn.append(timestamp.to_string());
            ticket_number_set.push_back(tn);
            // 将彩票号和彩票nftid关联起来
            joined_ticket_numbers.insert(tn, ticket_id);
            i=i+1;
        };
        ext_bag.add(b"ticket_number_set", ticket_number_set);
        
    }

}