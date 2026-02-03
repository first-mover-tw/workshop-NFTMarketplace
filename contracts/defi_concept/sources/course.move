module defi_concept::course {
    use sui::table::Table;

    // === Concept 0 ===
    // Q1. What is account-based, what is advantages & disadvantages?
    public struct Balances {
        balances: Table<address, u64>,
    }

    // === Concept 1 ===
    /// Q2. What fields do we need in Balance for the fungible token needs?
    #[allow(unused_field)]
    public struct Balance()

    /// Q3. What fields do we need in Coin with Balance and without Balance?
    #[allow(unused_field)]
    public struct Coin()
}
