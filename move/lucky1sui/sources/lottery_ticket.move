module lucky1sui::lottery_ticket{
    use sui::{package, transfer, random::{Self, Random},display, bag::{Self, Bag}, object::{Self, UID, ID}, clock::Clock};
    use std::string::{Self, String};
    use sui::vec_map::{Self, VecMap};
    use sui::table_vec::{Self, TableVec};
    use lucky1sui::lottery::LotteryPool;

    //**常量定义*/
    const E_NOT_LIVE: u64 = 41;
    const E_EMPTY_POOL: u64 = 42;
    //**管理员权限*/
    public struct ManagerCap has key,store {
        id: UID
    }
    
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
        ticket_number_set: vector<String>,
        pool_no: u64,
    }

    //供应不同活动类型的彩票基本信息
 public struct TicketPool has key, store {
        id: UID,
        tickets: TableVec<Ticket>,
        is_live: bool,
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
            //
            let manager_cap = ManagerCap{
                id: object::new(ctx),
            };
            transfer::public_transfer(manager_cap, ctx.sender());
    }

    public(package) fun getTicket(ticket_pool: &mut TicketPool, lottery_pool_no: u64, random: &Random, ctx : &mut TxContext): Ticket{
        assert!(ticket_pool.is_live, E_NOT_LIVE);
        let tickets = &mut ticket_pool.tickets;
        assert!(!tickets.is_empty(), E_EMPTY_POOL);

        let mut ticket = if (tickets.length() == 1) {
            table_vec::pop_back(&mut ticket_pool.tickets)
        } else {
            let mut generator = random::new_generator(random, ctx);
            let i = random::generate_u64_in_range(&mut generator, 0, len-1);
            table_vec::swap_remove(tickets, i)
        };

        ticket.pool_no = lottery_pool_no;
        ticket
    }

    public(package) fun addTicketNumber(t: &mut Ticket, pool_no: u64, count:u64, clock: &Clock){
        let mut i=1;
        while(i <= count){
            let mut tn: String = b"".to_string();
            let timestamp = clock.timestamp_ms();   
            tn.append(pool_no.to_string());
            tn.append(i.to_string());
            tn.append(timestamp.to_string());
            vector::push_back(&mut t.ticket_number_set, tn);
            i=i+1;
        };
        
    }

    public(package) fun getTicketNumberSet(ticket: &Ticket): & vector<String>{
        let ticket_number_set = &ticket.ticket_number_set;
        ticket_number_set
    }

    public(package) fun getMutTicketNumberSet(ticket: &mut Ticket): &mut vector<String>{
        let ticket_number_set = &mut ticket.ticket_number_set;
        ticket_number_set
    }


    public(package) fun removeTicketNumber(t: &mut Ticket, ticket_number: String){
        let mut i = 0;
        while (i < vector::length(&t.ticket_number_set)) {
            if (*vector::borrow(&t.ticket_number_set, i) == ticket_number) {
                vector::remove(&mut t.ticket_number_set, i);
                break
            };
            i=i+1;
        };
    }

    //创建一个新的池子
    entry fun newTicketPool(
        _manager_cap: &ManagerCap,
        ctx: &mut TxContext,
    ) {
        let pool = createTicketPool(ctx);
        transfer::share_object(pool);
    }
    public(package) fun createTicketPool(ctx: &mut TxContext): TicketPool{
        let pool = TicketPool {
            id: object::new(ctx),
            tickets: table_vec::empty(ctx),
            is_live: true,
        };
        pool
    }

    //关闭池子
    entry fun closeTicketPool(
        _manager_cap: &ManagerCap,
        pool: TicketPool,
    ) {
        deleteTicketPool(pool);
    }

    public(package) fun deleteTicketPool(pool: TicketPool){
        let TicketPool {
            id,
            tickets,
            is_live:_,
        } = pool;

        table_vec::destroy_empty(tickets);
        object::delete(id);
    }

    entry fun deposit_ticket(
        _manager_cap: &ManagerCap,
        pool: &mut TicketPool,
        name: String,
        desc: String,
        link: String,
        image_url: String,
        project_url: String,
        ctx: &mut TxContext,
    ) {
        let ticket = Ticket {
            id: object::new(ctx),
            name,
            description: desc,
            link,
            image_url,
            project_url,
            creator: b"LuckyOneSui".to_string(),
            ticket_number_set: vector::empty<String>(),
            pool_no: 0,
        };
        //存入池子
        table_vec::push_back(&mut pool.tickets, ticket);
    }
}