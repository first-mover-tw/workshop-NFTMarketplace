module defi_concept::simple_coin {
    use sui::table::{Self, Table};

    // === Concept 0 ===
    public struct GlobalBalances {
        balances: Table<address, u64>,
    }

    public fun erc20_transfer(
        global_balances: &mut GlobalBalances,
        recipient: address,
        value: u64,
        ctx: &TxContext,
    ) {
        let sender = ctx.sender();

        assert!(global_balances.balances[sender] >= value);
        if (!global_balances.balances.contains(sender)) global_balances.balances.add(sender, 0);
        if (!global_balances.balances.contains(recipient))
            global_balances.balances.add(recipient, 0);

        *&mut global_balances.balances[sender] = global_balances.balances[sender] - value;
        *&mut global_balances.balances[recipient] = global_balances.balances[recipient] + value;
    }

    #[test]
    public fun test_global_balance_sheet() {
        let mut ctx = dummy_ctx(@0xA);
        let mut global_balances = GlobalBalances {
            balances: table::new(&mut ctx),
        };

        // topup
        global_balances.balances.add(@0xA, 100);

        // transfer actions; this all touch same shared object, require consensus
        {
            global_balances.erc20_transfer(@0xB, 50, &ctx);
            global_balances.erc20_transfer(@0xA, 50, &ctx);
        };

        std::unit_test::destroy(global_balances);
    }

    // === Concept 1 ===

    #[allow(unused_field)]
    public struct Coin {
        value: u64,
    }

    // === Utils ===
    public fun dummy_ctx(sender: address): TxContext {
        let tx_hash = x"3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532";
        tx_context::new(sender, tx_hash, 0, 0, 0)
    }
}
