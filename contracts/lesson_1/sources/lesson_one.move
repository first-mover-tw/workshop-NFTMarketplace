module lesson_one::lesson_one {
    use std::ascii::{Self, String};
    use sui::{
        clock::Clock,
        coin::Coin,
        dynamic_field as df,
        dynamic_object_field as dof,
        package,
        sui::SUI,
        vec_set::{Self, VecSet}
    };

    // === Imports ===

    // === Errors ===
    const EIsOwner: u64 = 100;
    const ENotUpgradeable: u64 = 101;

    // === Constants ===

    // === Structs ===
    public struct LESSON_ONE has drop {}

    public struct AdminCap has key {
        id: UID,
    }

    public struct Member has key {
        id: UID,
        name: String,
        img_url: String,
    }

    public struct Rookie has key, store {
        id: UID,
        creator: address,
        name: String,
        img_url: String,
        signer: Option<address>,
    }
    // === Events ===
    public struct MemberRegisterEvent has copy, drop {
        member_id: ID,
        name: String,
        img_url: String,
        timestamp: u64,
    }

    // === Method Aliases ===

    // === Public Functions ===

    #[allow(lint(self_transfer))]
    public fun new_member(name: String, ctx: &mut TxContext) {
        transfer::public_transfer(
            Rookie {
                id: object::new(ctx),
                creator: ctx.sender(),
                name,
                img_url: ascii::string(b""),
                signer: option::none(),
            },
            ctx.sender(),
        )
    }

    public fun update_name(rookie: &mut Rookie, name: String) {
        rookie.name = name;
    }

    public fun update_img_url(rookie: &mut Rookie, img_url: String) {
        rookie.img_url = img_url;
    }

    public fun update_with_different_signer(rookie: &mut Rookie, ctx: &TxContext) {
        assert!(rookie.creator != ctx.sender(), EIsOwner);
        rookie.signer = option::some(ctx.sender());
    }

    public fun upgrade(rookie: Rookie, clock: &Clock, ctx: &mut TxContext) {
        let Rookie {
            id,
            creator,
            name,
            img_url,
            signer,
        } = rookie;

        object::delete(id);

        assert!(
            signer.is_some() && ctx.sender() == creator && !img_url.is_empty() && !name.is_empty(),
            ENotUpgradeable,
        );

        let id = object::new(ctx);
        sui::event::emit(MemberRegisterEvent {
            member_id: id.to_inner(),
            name,
            img_url,
            timestamp: clock.timestamp_ms(),
        });
        transfer::transfer(
            Member {
                id,
                name,
                img_url,
            },
            ctx.sender(),
        );
    }

    // === View Functions ===

    // === Admin Functions ===
    fun init(otw: LESSON_ONE, ctx: &mut TxContext) {
        package::claim_and_keep(otw, ctx);

        transfer::transfer(AdminCap { id: object::new(ctx) }, ctx.sender());
    }

    // === Package Functions ===

    // === Private Functions ===

    // === Test Functions ===

    // === Lesson<Two> ===

    const ENoItemListed: u64 = 404;

    public struct MarktetPlace has key {
        id: UID,
        whitelist: VecSet<ID>,
    }

    public struct Listing<Item> has key, store {
        id: UID,
        owner: address,
        price: u64,
        item: Item,
    }

    public fun create_market(_cap: &AdminCap, ctx: &mut TxContext) {
        let market = MarktetPlace { id: object::new(ctx), whitelist: vec_set::empty() };

        transfer::share_object(market);
    }

    public fun add_whitelist(_cap: &AdminCap, market: &mut MarktetPlace, id: ID) {
        market.whitelist.insert(id);
    }

    public fun remove_whitelist(_cap: &AdminCap, market: &mut MarktetPlace, id: ID) {
        market.whitelist.remove(&id);
    }

    // @return Rookie object
    public fun new_rookie(name: String, ctx: &mut TxContext): Rookie {
        Rookie {
            id: object::new(ctx),
            creator: ctx.sender(),
            name,
            img_url: ascii::string(b""),
            signer: option::none(),
        }
    }

    public fun list_rookie_with_df(
        market: &mut MarktetPlace,
        rookie: Rookie,
        price: u64,
        ctx: &mut TxContext,
    ) {
        let id = object::id(&rookie);
        let listing = Listing {
            id: object::new(ctx),
            owner: ctx.sender(),
            price,
            item: rookie,
        };
        df::add(&mut market.id, id, listing);
    }

    public fun list_rookie_with_dof(
        market: &mut MarktetPlace,
        rookie: Rookie,
        price: u64,
        ctx: &mut TxContext,
    ) {
        let id = object::id(&rookie);
        let listing = Listing {
            id: object::new(ctx),
            owner: ctx.sender(),
            price,
            item: rookie,
        };
        dof::add(&mut market.id, id, listing);
    }

    public fun delist_rookie_with_df(market: &mut MarktetPlace, id: ID, ctx: &TxContext): Rookie {
        let listing = df::remove(&mut market.id, id);

        let Listing {
            id,
            owner,
            price: _,
            item,
        } = listing;

        assert!(owner == ctx.sender());
        object::delete(id);

        item
    }

    public fun delist_rookie_with_dof(market: &mut MarktetPlace, id: ID, ctx: &TxContext): Rookie {
        let listing = dof::remove(&mut market.id, id);

        let Listing {
            id,
            owner,
            price: _,
            item,
        } = listing;

        assert!(owner == ctx.sender());
        object::delete(id);

        item
    }

    public fun buy(
        market: &mut MarktetPlace,
        id: ID,
        coin: &mut Coin<SUI>,
        ctx: &mut TxContext,
    ): Rookie {
        if (df::exists_(&market.id, id)) {
            let listing = df::remove(&mut market.id, id);

            let Listing {
                id,
                owner,
                price,
                item,
            } = listing;

            transfer::public_transfer(coin.split(price, ctx), owner);

            object::delete(id);

            return item
        } else if (dof::exists_(&market.id, id)) {
            let listing = dof::remove(&mut market.id, id);

            let Listing {
                id,
                owner,
                price,
                item,
            } = listing;

            transfer::public_transfer(coin.split(price, ctx), owner);

            object::delete(id);

            return item
        };

        abort ENoItemListed
    }

    public fun whitelist_buy(market: &mut MarktetPlace, member: &Member, id: ID): Rookie {
        assert!(market.whitelist.contains(&object::id(member)));

        if (df::exists_(&market.id, id)) {
            let listing = df::remove(&mut market.id, id);

            let Listing {
                id,
                owner: _,
                price: _,
                item,
            } = listing;

            object::delete(id);

            return item
        } else if (dof::exists_(&market.id, id)) {
            let listing = dof::remove(&mut market.id, id);

            let Listing {
                id,
                owner: _,
                price: _,
                item,
            } = listing;

            object::delete(id);

            return item
        };

        abort ENoItemListed
    }
}
