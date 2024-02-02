import { Field, Poseidon, Provable, PublicKey, Signature, UInt64, ZkProgram } from "o1js"
import { PoolWitness } from "./StorageForPools.js"
import { LiqudityWitness } from "./StorageForLiquidities.js"
import { Balance, Liquidity, Pool } from "./Structs.js"
import { RollupState } from "./RollupState.js"
import { BalanceWitness } from "./StorageForBalances.js"
import { Errors } from "./RollupErrors.js"

/**
 * The off-chain zk-program of the rollup that generates prooves.
 */
export const RollupProgram = ZkProgram({
    name: "xane-program",

    publicInput: RollupState,

    methods: {
        addBalanceV2: {
            privateInputs: [UInt64, Balance, BalanceWitness],
            method(
                rollupState: RollupState,
                amount: UInt64,
                balance: Balance,
                balanceWitness: BalanceWitness,
            ) {
                // Calculates root using given data.
                const calculatedBalancesRoot = Provable.if(
                    balance.amount.equals(UInt64.zero),
                    balanceWitness.calculateRoot(Field.empty()),
                    balanceWitness.calculateRoot(Poseidon.hash(balance.toFields())),
                )

                // Requires calculated root to be valid.
                rollupState.balancesRoot.assertEquals(
                    calculatedBalancesRoot,
                    Errors.InvalidCalculatedRoot,
                )

                // Adds amount to balance.
                rollupState.addBalance({
                    amount,
                    balance,
                    balanceWitness,
                })
            },
        },
        subBalanceV2: {
            privateInputs: [UInt64, Balance, BalanceWitness],
            method(
                rollupState: RollupState,
                amount: UInt64,
                balance: Balance,
                balanceWitness: BalanceWitness,
            ) {
                // Calculates root using given data.
                const calculatedBalancesRoot = Provable.if(
                    balance.amount.equals(UInt64.zero),
                    balanceWitness.calculateRoot(Field.empty()),
                    balanceWitness.calculateRoot(Poseidon.hash(balance.toFields())),
                )

                // Requires calculated root to be valid.
                rollupState.balancesRoot.assertEquals(
                    calculatedBalancesRoot,
                    Errors.InvalidCalculatedRoot,
                )

                // Subtracts amount from balance.
                rollupState.subBalance({
                    amount,
                    balance,
                    balanceWitness,
                })
            },
        },
        createPoolV2: {
            privateInputs: [
                PublicKey,
                Signature,
                UInt64,
                UInt64,
                Balance,
                Balance,
                Pool,
                Liquidity,
                PoolWitness,
                LiqudityWitness,
            ],
            method(
                rollupState: RollupState,
                sender: PublicKey,
                signature: Signature,
                baseTokenAmount: UInt64,
                quoteTokenAmount: UInt64,
                baseTokenBalance: Balance,
                quoteTokenBalance: Balance,
                emptyPool: Pool,
                emptyLiquidity: Liquidity,
                poolWitness: PoolWitness,
                liquidityWitness: LiqudityWitness,
            ) {
                // Requires signature to be valid.
                const message = [
                    ...rollupState.toFields(),
                    ...baseTokenAmount.toFields(),
                    ...quoteTokenAmount.toFields(),
                    ...baseTokenBalance.toFields(),
                    ...quoteTokenBalance.toFields(),
                    ...poolWitness.toFields(),
                    ...liquidityWitness.toFields(),
                ]
                signature.verify(sender, message).assertTrue(Errors.InvalidSignature)

                // Calculates roots using given data.
                const calculatedPoolsRoot = poolWitness.calculateRoot(Field.empty())
                const calculatedLiquiditiesRoot = liquidityWitness.calculateRoot(
                    Field.empty(),
                )

                // Requires calculated root to be valid.
                rollupState.poolsRoot.assertEquals(
                    calculatedPoolsRoot,
                    Errors.InvalidCalculatedRoot,
                )
                rollupState.liquiditiesRoot.assertEquals(
                    calculatedLiquiditiesRoot,
                    Errors.InvalidCalculatedRoot,
                )

                // Requires balances to be enough.
                baseTokenBalance.amount.assertGreaterThanOrEqual(
                    baseTokenAmount,
                    Errors.InsufficientBalance,
                )
                quoteTokenBalance.amount.assertGreaterThanOrEqual(
                    quoteTokenAmount,
                    Errors.InsufficientBalance,
                )

                // Requires base and quote tokens not to be same.
                baseTokenBalance.tokenId.assertNotEquals(
                    quoteTokenBalance.tokenId,
                    Errors.SameTokenIds,
                )

                // Requires balances to be owned by sender.
                baseTokenBalance.owner.assertEquals(sender)
                quoteTokenBalance.owner.assertEquals(sender)

                // Requires pool and liquidity to be empty.
                emptyPool.isEmpty().assertTrue(Errors.NonEmptyStruct)
                emptyLiquidity.isEmpty().assertTrue(Errors.NonEmptyStruct)

                // Subtracts amount from balance.
                rollupState.createPool({
                    baseTokenAmount,
                    quoteTokenAmount,
                    baseTokenBalance,
                    quoteTokenBalance,
                    emptyPool,
                    poolWitness,
                    emptyLiquidity,
                    liquidityWitness,
                })
            },
        },
        addLiquidityV2: {
            privateInputs: [
                PublicKey,
                Signature,
                UInt64,
                UInt64,
                Balance,
                Balance,
                Pool,
                Liquidity,
                PoolWitness,
                LiqudityWitness,
            ],
            method(
                rollupState: RollupState,
                sender: PublicKey,
                signature: Signature,
                baseTokenAmount: UInt64,
                quoteTokenAmountLimit: UInt64,
                baseTokenBalance: Balance,
                quoteTokenBalance: Balance,
                pool: Pool,
                liquidity: Liquidity,
                poolWitness: PoolWitness,
                liquidityWitness: LiqudityWitness,
            ) {
                // Requires signature to be valid.
                const message = [
                    ...rollupState.toFields(),
                    ...baseTokenAmount.toFields(),
                    ...quoteTokenAmountLimit.toFields(),
                    ...baseTokenBalance.toFields(),
                    ...quoteTokenBalance.toFields(),
                    ...pool.toFields(),
                    ...liquidity.toFields(),
                    ...poolWitness.toFields(),
                    ...liquidityWitness.toFields(),
                ]
                signature.verify(sender, message).assertTrue(Errors.InvalidSignature)

                // Calculates quote token amount.
                const quoteTokenAmount = pool.baseTokenAmount
                    .add(baseTokenAmount)
                    .mul(pool.quoteTokenAmount)
                    .div(pool.baseTokenAmount)
                    .sub(pool.quoteTokenAmount)

                // Calculates roots using given data.
                const calculatedPoolsRoot = poolWitness.calculateRoot(
                    Poseidon.hash(pool.toFields()),
                )
                const calculatedLiquiditiesRoot = liquidityWitness.calculateRoot(
                    Poseidon.hash(liquidity.toFields()),
                )

                // Requires calculated root to be valid.
                rollupState.poolsRoot.assertEquals(
                    calculatedPoolsRoot,
                    Errors.InvalidCalculatedRoot,
                )
                rollupState.liquiditiesRoot.assertEquals(
                    calculatedLiquiditiesRoot,
                    Errors.InvalidCalculatedRoot,
                )

                // Requires balance owners to be sender.
                baseTokenBalance.owner.equals(sender).assertTrue(Errors.MistakenOwner)
                quoteTokenBalance.owner.equals(sender).assertTrue(Errors.MistakenOwner)

                // Requires liquidity provider to be sender.
                liquidity.provider.equals(sender).assertTrue(Errors.MistakenProvider)

                // Requires balances to be enough.
                baseTokenBalance.amount.assertGreaterThanOrEqual(baseTokenAmount)
                quoteTokenBalance.amount.assertGreaterThanOrEqual(quoteTokenAmount)

                // Requires quote token amount to be lower than limit.
                quoteTokenAmount.assertLessThanOrEqual(
                    quoteTokenAmountLimit,
                    Errors.LimitIsLow,
                )

                // Requires base and quote token IDs to be valid.
                pool.baseTokenId.assertEquals(
                    baseTokenBalance.tokenId,
                    Errors.InvalidTokenIds,
                )
                pool.quoteTokenId.assertEquals(
                    quoteTokenBalance.tokenId,
                    Errors.InvalidTokenIds,
                )
                liquidity.baseTokenId.assertEquals(
                    baseTokenBalance.tokenId,
                    Errors.InvalidTokenIds,
                )
                liquidity.quoteTokenId.assertEquals(
                    quoteTokenBalance.tokenId,
                    Errors.InvalidTokenIds,
                )

                // Adds liquidity.
                rollupState.addLiquidity({
                    baseTokenAmount,
                    baseTokenBalance,
                    quoteTokenBalance,
                    pool,
                    liquidity,
                    poolWitness,
                    liquidityWitness,
                })
            },
        },
        removeLiquidityV2: {
            privateInputs: [
                PublicKey,
                Signature,
                UInt64,
                UInt64,
                UInt64,
                Balance,
                Balance,
                Pool,
                Liquidity,
                PoolWitness,
                LiqudityWitness,
            ],
            method(
                rollupState: RollupState,
                sender: PublicKey,
                signature: Signature,
                lpPoints: UInt64,
                baseTokenAmountLimit: UInt64,
                quoteTokenAmountLimit: UInt64,
                baseTokenBalance: Balance,
                quoteTokenBalance: Balance,
                pool: Pool,
                liquidity: Liquidity,
                poolWitness: PoolWitness,
                liquidityWitness: LiqudityWitness,
            ) {
                // Requires signature to be valid.
                const message = [
                    ...rollupState.toFields(),
                    ...lpPoints.toFields(),
                    ...baseTokenAmountLimit.toFields(),
                    ...quoteTokenAmountLimit.toFields(),
                    ...baseTokenBalance.toFields(),
                    ...quoteTokenBalance.toFields(),
                    ...pool.toFields(),
                    ...liquidity.toFields(),
                    ...poolWitness.toFields(),
                    ...liquidityWitness.toFields(),
                ]
                signature.verify(sender, message).assertTrue(Errors.InvalidSignature)

                // Calculates base & quote token amounts.
                const baseTokenAmount = lpPoints
                    .mul(pool.baseTokenAmount)
                    .div(pool.lpPoints)
                const quoteTokenAmount = lpPoints
                    .mul(pool.quoteTokenAmount)
                    .div(pool.lpPoints)

                // Calculates roots using given data.
                const calculatedPoolsRoot = poolWitness.calculateRoot(
                    Poseidon.hash(pool.toFields()),
                )
                const calculatedLiquiditiesRoot = liquidityWitness.calculateRoot(
                    Poseidon.hash(liquidity.toFields()),
                )

                // Requires calculated root to be valid.
                rollupState.poolsRoot.assertEquals(
                    calculatedPoolsRoot,
                    Errors.InvalidCalculatedRoot,
                )
                rollupState.liquiditiesRoot.assertEquals(
                    calculatedLiquiditiesRoot,
                    Errors.InvalidCalculatedRoot,
                )

                // Requires balance owners to be sender.
                baseTokenBalance.owner.equals(sender).assertTrue(Errors.MistakenOwner)
                quoteTokenBalance.owner.equals(sender).assertTrue(Errors.MistakenOwner)

                // Requires liquidity provider to be sender.
                liquidity.provider.equals(sender).assertTrue(Errors.MistakenProvider)

                // Requires balances to be enough.
                baseTokenBalance.amount.assertGreaterThanOrEqual(baseTokenAmount)
                quoteTokenBalance.amount.assertGreaterThanOrEqual(quoteTokenAmount)

                // Requires base & quote token amounts to be lower than limits.
                baseTokenAmount.assertLessThanOrEqual(
                    baseTokenAmountLimit,
                    Errors.LimitIsLow,
                )
                quoteTokenAmount.assertLessThanOrEqual(
                    quoteTokenAmountLimit,
                    Errors.LimitIsLow,
                )

                // Requires base and quote token IDs to be valid.
                pool.baseTokenId.assertEquals(
                    baseTokenBalance.tokenId,
                    Errors.InvalidTokenIds,
                )
                pool.quoteTokenId.assertEquals(
                    quoteTokenBalance.tokenId,
                    Errors.InvalidTokenIds,
                )
                liquidity.baseTokenId.assertEquals(
                    baseTokenBalance.tokenId,
                    Errors.InvalidTokenIds,
                )
                liquidity.quoteTokenId.assertEquals(
                    quoteTokenBalance.tokenId,
                    Errors.InvalidTokenIds,
                )

                // Removes liquidity.
                rollupState.removeLiquidity({
                    lpPoints,
                    baseTokenBalance,
                    quoteTokenBalance,
                    pool,
                    liquidity,
                    poolWitness,
                    liquidityWitness,
                })
            },
        },
        doNothing: {
            privateInputs: [PublicKey, Signature],
            method(rollupState: RollupState, sender: PublicKey, signature: Signature) {
                const message: Array<Field> = []
                signature.verify(sender, message).assertTrue()
            },
        },
        createPool: {
            privateInputs: [
                PublicKey,
                Signature,
                Balance,
                Balance,
                // BalancePairWitness (todo: make a merkle witness for a pair of leaves)
                Pool,
                PoolWitness,
                Liquidity,
                LiqudityWitness,
                UInt64,
                UInt64,
            ],
            method(
                rollupState: RollupState,
                sender: PublicKey,
                signature: Signature,
                balanceBaseToken: Balance,
                balanceQuoteToken: Balance,
                // balancePairWitness (todo: make a merkle witness for a pair of leaves)
                pool: Pool,
                poolWitness: PoolWitness,
                liquidity: Liquidity,
                liquidityWitness: LiqudityWitness,
                amountBaseToken: UInt64,
                amountQuoteToken: UInt64,
            ) {
                /*//////////////////////////////////////////////////////////////
                                    SIGNATURE VERIFICATION
                //////////////////////////////////////////////////////////////*/

                // don't forget to add each parameter except `sender` & `signature` in order.
                const message = [
                    ...rollupState.toFields(),
                    ...balanceBaseToken.toFields(),
                    ...balanceQuoteToken.toFields(),
                    // ...balancePairWitness.toFields(), (todo: make a merkle witness for a pair of leaves)
                    ...pool.toFields(),
                    ...poolWitness.toFields(),
                    ...liquidity.toFields(),
                    ...liquidityWitness.toFields(),
                    ...amountBaseToken.toFields(),
                    ...amountQuoteToken.toFields(),
                ]
                signature.verify(sender, message).assertTrue()

                /*//////////////////////////////////////////////////////////////
                                        STATE ASSERTIONS
                //////////////////////////////////////////////////////////////*/

                // todo: make a merkle witness for a pair of leaves

                // const calculatedBalancesRoot = balancePairWitness.calculateRoot(
                //      Poseidon.hash(balanceBaseToken.toFields()),
                //      Poseidon.hash(balanceQuoteToken.toFields()),
                // )

                // I've used `Field.empty()`, because the `Pool` must not be a part of the tree as it's not created yet.
                const calculatedPoolsRoot = poolWitness.calculateRoot(Field.empty())

                // I've used `Field.empty()`, because the `Liquidity` must not be a part of the tree yet.
                const calculatedLiquiditiesRoot = liquidityWitness.calculateRoot(
                    Field.empty(),
                )

                // rollupState.balancesRoot.assertEquals(calculatedBalancesRoot)
                rollupState.poolsRoot.assertEquals(calculatedPoolsRoot)
                rollupState.liquiditiesRoot.assertEquals(calculatedLiquiditiesRoot)

                /*//////////////////////////////////////////////////////////////
                                        DATA ASSERTIONS
                //////////////////////////////////////////////////////////////*/

                balanceBaseToken.amount.assertGreaterThanOrEqual(amountBaseToken)
                balanceQuoteToken.amount.assertGreaterThanOrEqual(amountQuoteToken)

                pool.isEmpty().assertTrue()
                liquidity.isEmpty().assertTrue()

                /*//////////////////////////////////////////////////////////////
                                            LOGIC
                //////////////////////////////////////////////////////////////*/

                balanceBaseToken.amount = balanceBaseToken.amount.sub(amountBaseToken)
                balanceQuoteToken.amount = balanceQuoteToken.amount.sub(amountQuoteToken)

                pool.baseTokenId = balanceBaseToken.tokenId
                pool.quoteTokenId = balanceQuoteToken.tokenId
                pool.baseTokenAmount = amountBaseToken
                pool.quoteTokenAmount = amountQuoteToken
                pool.k = amountBaseToken.mul(amountQuoteToken)
                pool.lpPoints = new UInt64(65535)

                liquidity.baseTokenId = balanceBaseToken.tokenId
                liquidity.quoteTokenId = balanceQuoteToken.tokenId
                liquidity.lpPoints = new UInt64(65535)
                liquidity.provider = sender

                /*//////////////////////////////////////////////////////////////
                                        STATE UPDATES
                //////////////////////////////////////////////////////////////*/

                // todo: make a merkle witness for a pair of leaves

                // const newCalculatedBalancesRoot = balancePairWitness.calculateRoot(
                //      Poseidon.hash(balanceBaseToken.toFields()),
                //      Poseidon.hash(balanceQuoteToken.toFields()),
                // )

                const newCalculatedPoolsRoot = poolWitness.calculateRoot(
                    Poseidon.hash(pool.toFields()),
                )

                const newCalculatedLiquiditiesRoot = liquidityWitness.calculateRoot(
                    Poseidon.hash(liquidity.toFields()),
                )

                // rollupState.balancesRoot = newCalculatedBalancesRoot
                rollupState.poolsRoot = newCalculatedPoolsRoot
                rollupState.liquiditiesRoot = newCalculatedLiquiditiesRoot
            },
        },
        addLiquidity: {
            privateInputs: [
                PublicKey,
                Signature,
                Balance,
                Balance,
                // BalancePairWitness (todo: make a merkle witness for a pair of leaves)
                Pool,
                PoolWitness,
                Liquidity,
                LiqudityWitness,
                UInt64,
                UInt64,
            ],
            method(
                rollupState: RollupState,
                sender: PublicKey,
                signature: Signature,
                balanceBaseToken: Balance,
                balanceQuoteToken: Balance,
                // balancePairWitness (todo: make a merkle witness for a pair of leaves)
                pool: Pool,
                poolWitness: PoolWitness,
                liquidity: Liquidity,
                liquidityWitness: LiqudityWitness,
                amountBaseToken: UInt64,
                amountQuoteToken: UInt64,
            ) {
                /*//////////////////////////////////////////////////////////////
                                    SIGNATURE VERIFICATION
                //////////////////////////////////////////////////////////////*/

                // don't forget to add each parameter except `sender` & `signature` in order.
                const message = [
                    ...rollupState.toFields(),
                    ...balanceBaseToken.toFields(),
                    ...balanceQuoteToken.toFields(),
                    // ...balancePairWitness.toFields(), (todo: make a merkle witness for a pair of leaves)
                    ...pool.toFields(),
                    ...poolWitness.toFields(),
                    ...liquidity.toFields(),
                    ...liquidityWitness.toFields(),
                    ...amountBaseToken.toFields(),
                    ...amountQuoteToken.toFields(),
                ]

                signature.verify(sender, message).assertTrue()

                /*//////////////////////////////////////////////////////////////
                                        STATE ASSERTIONS
                //////////////////////////////////////////////////////////////*/

                // todo: make a merkle witness for a pair of leaves

                // const calculatedBalancesRoot = balancePairWitness.calculateRoot(
                //      Poseidon.hash(balanceBaseToken.toFields()),
                //      Poseidon.hash(balanceQuoteToken.toFields()),
                // )

                // I've used `Poseidon.hash(pool.toFields())`, because the `Pool` must be a part of the tree.
                const calculatedPoolsRoot = poolWitness.calculateRoot(
                    Poseidon.hash(pool.toFields()),
                )

                // I've used `Poseidon.hash(liquidity.toFields())`, because the `Liquidity` must be a part of the tree.
                const calculatedLiquiditiesRoot = liquidityWitness.calculateRoot(
                    Poseidon.hash(liquidity.toFields()),
                )

                // rollupState.balancesRoot.assertEquals(calculatedBalancesRoot)
                rollupState.poolsRoot.assertEquals(calculatedPoolsRoot)
                rollupState.liquiditiesRoot.assertEquals(calculatedLiquiditiesRoot)

                /*//////////////////////////////////////////////////////////////
                                        DATA ASSERTIONS
                //////////////////////////////////////////////////////////////*/

                const poolRatio = pool.baseTokenAmount.div(pool.quoteTokenAmount)
                const amountRatio = amountBaseToken.div(amountQuoteToken)
                poolRatio.assertEquals(amountRatio)

                pool.baseTokenId.assertEquals(balanceBaseToken.tokenId)
                pool.quoteTokenId.assertEquals(balanceQuoteToken.tokenId)
                pool.baseTokenId.assertEquals(liquidity.baseTokenId)
                pool.quoteTokenId.assertEquals(liquidity.quoteTokenId)
                balanceBaseToken.amount.assertGreaterThanOrEqual(amountBaseToken)
                balanceQuoteToken.amount.assertGreaterThanOrEqual(amountQuoteToken)

                /*//////////////////////////////////////////////////////////////
                                            LOGIC
                //////////////////////////////////////////////////////////////*/

                const lpTokensToMint = amountBaseToken
                    .mul(pool.lpPoints)
                    .div(pool.baseTokenAmount)

                const poolNewBaseTokenAmount = pool.baseTokenAmount.add(amountBaseToken)

                const poolNewQuoteTokenAmount =
                    pool.quoteTokenAmount.add(amountQuoteToken)

                const poolNewK = poolNewBaseTokenAmount.mul(poolNewQuoteTokenAmount)
                const poolNewLpTokensSupply = pool.lpPoints.sub(lpTokensToMint)

                pool.baseTokenAmount = poolNewBaseTokenAmount
                pool.quoteTokenAmount = poolNewQuoteTokenAmount
                pool.k = poolNewK
                pool.lpPoints = poolNewLpTokensSupply

                liquidity.lpPoints = liquidity.lpPoints.add(lpTokensToMint)

                balanceBaseToken.amount = balanceBaseToken.amount.sub(amountBaseToken)
                balanceQuoteToken.amount = balanceQuoteToken.amount.sub(amountQuoteToken)

                /*//////////////////////////////////////////////////////////////
                                        STATE UPDATES
                //////////////////////////////////////////////////////////////*/

                // todo: make a merkle witness for a pair of leaves

                // const newCalculatedBalancesRoot = balancePairWitness.calculateRoot(
                //      Poseidon.hash(balanceBaseToken.toFields()),
                //      Poseidon.hash(balanceQuoteToken.toFields()),
                // )

                const newCalculatedPoolsRoot = poolWitness.calculateRoot(
                    Poseidon.hash(pool.toFields()),
                )

                const newCalculatedLiquiditiesRoot = liquidityWitness.calculateRoot(
                    Poseidon.hash(liquidity.toFields()),
                )

                // rollupState.balancesRoot = newCalculatedBalancesRoot
                rollupState.poolsRoot = newCalculatedPoolsRoot
                rollupState.liquiditiesRoot = newCalculatedLiquiditiesRoot
            },
        },
        removeLiquidity: {
            privateInputs: [
                PublicKey,
                Signature,
                Balance,
                Balance,
                // BalancePairWitness (todo: make a merkle witness for a pair of leaves)
                Pool,
                PoolWitness,
                Liquidity,
                LiqudityWitness,
                UInt64,
            ],
            method(
                rollupState: RollupState,
                sender: PublicKey,
                signature: Signature,
                balanceBaseToken: Balance,
                balanceQuoteToken: Balance,
                // balancePairWitness (todo: make a merkle witness for a pair of leaves)
                pool: Pool,
                poolWitness: PoolWitness,
                liquidity: Liquidity,
                liquidityWitness: LiqudityWitness,
                lpTokensToBurn: UInt64,
            ) {
                /*//////////////////////////////////////////////////////////////
                                    SIGNATURE VERIFICATION
                //////////////////////////////////////////////////////////////*/

                // don't forget to add each parameter except `caller` in order.
                const message = [
                    ...rollupState.toFields(),
                    ...balanceBaseToken.toFields(),
                    ...balanceQuoteToken.toFields(),
                    // ...balancePairWitness.toFields(), (todo: make a merkle witness for a pair of leaves)
                    ...pool.toFields(),
                    ...poolWitness.toFields(),
                    ...liquidity.toFields(),
                    ...liquidityWitness.toFields(),
                    ...lpTokensToBurn.toFields(),
                ]

                signature.verify(sender, message).assertTrue()

                /*//////////////////////////////////////////////////////////////
                                        STATE ASSERTIONS
                //////////////////////////////////////////////////////////////*/

                // todo: make a merkle witness for a pair of leaves

                // const calculatedBalancesRoot = balancePairWitness.calculateRoot(
                //      Poseidon.hash(balanceBaseToken.toFields()),
                //      Poseidon.hash(balanceQuoteToken.toFields()),
                // )

                // I've used `Poseidon.hash(pool.toFields())`, because the `Pool` must be a part of the tree.
                const calculatedPoolsRoot = poolWitness.calculateRoot(
                    Poseidon.hash(pool.toFields()),
                )

                // I've used `Poseidon.hash(liquidity.toFields())`, because the `Liquidity` must be a part of the tree.
                const calculatedLiquiditiesRoot = liquidityWitness.calculateRoot(
                    Poseidon.hash(liquidity.toFields()),
                )

                // rollupState.balancesRoot.assertEquals(calculatedBalancesRoot)
                rollupState.poolsRoot.assertEquals(calculatedPoolsRoot)
                rollupState.liquiditiesRoot.assertEquals(calculatedLiquiditiesRoot)

                /*//////////////////////////////////////////////////////////////
                                        DATA ASSERTIONS
                //////////////////////////////////////////////////////////////*/

                pool.baseTokenId.assertEquals(balanceBaseToken.tokenId)
                pool.quoteTokenId.assertEquals(balanceQuoteToken.tokenId)
                pool.baseTokenId.assertEquals(liquidity.baseTokenId)
                pool.quoteTokenId.assertEquals(liquidity.quoteTokenId)
                pool.lpPoints.assertGreaterThanOrEqual(lpTokensToBurn)

                /*//////////////////////////////////////////////////////////////
                                            LOGIC
                //////////////////////////////////////////////////////////////*/

                const senderBaseTokenAmount = lpTokensToBurn
                    .mul(pool.baseTokenAmount)
                    .div(pool.lpPoints)

                const senderQuoteTokenAmount = lpTokensToBurn
                    .mul(pool.quoteTokenAmount)
                    .div(pool.lpPoints)

                const poolNewBaseTokenAmount =
                    pool.baseTokenAmount.sub(senderBaseTokenAmount)

                const poolNewQuoteTokenAmount =
                    pool.baseTokenAmount.sub(senderQuoteTokenAmount)

                const poolNewK = poolNewBaseTokenAmount.mul(poolNewQuoteTokenAmount)
                const poolNewLpTokensSupply = pool.lpPoints.sub(lpTokensToBurn)

                pool.baseTokenAmount = poolNewBaseTokenAmount
                pool.quoteTokenAmount = poolNewQuoteTokenAmount
                pool.k = poolNewK
                pool.lpPoints = poolNewLpTokensSupply

                liquidity.lpPoints = liquidity.lpPoints.sub(lpTokensToBurn)

                balanceBaseToken.amount =
                    balanceBaseToken.amount.add(senderBaseTokenAmount)
                balanceQuoteToken.amount =
                    balanceQuoteToken.amount.add(senderQuoteTokenAmount)

                /*//////////////////////////////////////////////////////////////
                                        STATE UPDATES
                //////////////////////////////////////////////////////////////*/

                // todo: make a merkle witness for a pair of leaves

                // const newCalculatedBalancesRoot = balancePairWitness.calculateRoot(
                //      Poseidon.hash(balanceBaseToken.toFields()),
                //      Poseidon.hash(balanceQuoteToken.toFields()),
                // )

                const newCalculatedPoolsRoot = poolWitness.calculateRoot(
                    Poseidon.hash(pool.toFields()),
                )

                const newCalculatedLiquiditiesRoot = liquidityWitness.calculateRoot(
                    Poseidon.hash(liquidity.toFields()),
                )

                // rollupState.balancesRoot = newCalculatedBalancesRoot
                rollupState.poolsRoot = newCalculatedPoolsRoot
                rollupState.liquiditiesRoot = newCalculatedLiquiditiesRoot
            },
        },
        buy: {
            privateInputs: [
                PublicKey,
                Signature,
                Balance,
                Balance,
                // BalancePairWitness (todo: make a merkle witness for a pair of leaves)
                Pool,
                PoolWitness,
                UInt64,
                UInt64,
            ],
            method(
                rollupState: RollupState,
                sender: PublicKey,
                signature: Signature,
                senderBaseTokenBalance: Balance,
                senderQuoteTokenBalance: Balance,
                // balancePairWitness (todo: make a merkle witness for a pair of leaves)
                pool: Pool,
                poolWitness: PoolWitness,
                baseTokensToBuy: UInt64,
                maxQuoteTokensToPay: UInt64,
            ) {
                /*//////////////////////////////////////////////////////////////
                                    SIGNATURE VERIFICATION
                //////////////////////////////////////////////////////////////*/

                // don't forget to add each parameter except `caller` in order.
                const message = [
                    ...rollupState.toFields(),
                    ...senderBaseTokenBalance.toFields(),
                    ...senderQuoteTokenBalance.toFields(),
                    // ...balancePairWitness.toFields(), (todo: make a merkle witness for a pair of leaves)
                    ...pool.toFields(),
                    ...poolWitness.toFields(),
                    ...baseTokensToBuy.toFields(),
                    ...maxQuoteTokensToPay.toFields(),
                ]

                signature.verify(sender, message).assertTrue()

                /*//////////////////////////////////////////////////////////////
                                        STATE ASSERTIONS
                //////////////////////////////////////////////////////////////*/

                // todo: make a merkle witness for a pair of leaves

                // const calculatedBalancesRoot = balancePairWitness.calculateRoot(
                //      Poseidon.hash(balanceBaseToken.toFields()),
                //      Poseidon.hash(balanceQuoteToken.toFields()),
                // )

                // I've used `Poseidon.hash(pool.toFields())`, because the `Pool` must be a part of the tree.
                const calculatedPoolsRoot = poolWitness.calculateRoot(
                    Poseidon.hash(pool.toFields()),
                )

                // rollupState.balancesRoot.assertEquals(calculatedBalancesRoot)
                rollupState.poolsRoot.assertEquals(calculatedPoolsRoot)

                /*//////////////////////////////////////////////////////////////
                                        DATA ASSERTIONS
                //////////////////////////////////////////////////////////////*/

                const poolNewBaseTokenAmount = pool.baseTokenAmount.sub(baseTokensToBuy)
                const poolNewQuoteTokenAmount = pool.k.div(poolNewBaseTokenAmount)
                const quoteTokensToPay = poolNewQuoteTokenAmount.sub(
                    pool.quoteTokenAmount,
                )

                pool.baseTokenId.assertEquals(senderBaseTokenBalance.tokenId)
                pool.quoteTokenId.assertEquals(senderQuoteTokenBalance.tokenId)
                pool.baseTokenAmount.assertGreaterThan(baseTokensToBuy)
                maxQuoteTokensToPay.assertGreaterThanOrEqual(quoteTokensToPay)
                senderQuoteTokenBalance.amount.assertGreaterThanOrEqual(
                    maxQuoteTokensToPay,
                )

                /*//////////////////////////////////////////////////////////////
                                            LOGIC
                //////////////////////////////////////////////////////////////*/

                const senderNewBaseTokenBalance =
                    senderBaseTokenBalance.amount.add(baseTokensToBuy)

                const senderNewQuoteTokenBalance =
                    senderQuoteTokenBalance.amount.sub(quoteTokensToPay)

                const poolNewK = poolNewBaseTokenAmount.mul(poolNewQuoteTokenAmount)

                pool.baseTokenAmount = poolNewBaseTokenAmount
                pool.quoteTokenAmount = poolNewQuoteTokenAmount
                pool.k = poolNewK

                senderBaseTokenBalance.amount = senderNewBaseTokenBalance
                senderQuoteTokenBalance.amount = senderNewQuoteTokenBalance

                /*//////////////////////////////////////////////////////////////
                                        STATE UPDATES
                //////////////////////////////////////////////////////////////*/

                // todo: make a merkle witness for a pair of leaves

                // const newCalculatedBalancesRoot = balancePairWitness.calculateRoot(
                //      Poseidon.hash(balanceBaseToken.toFields()),
                //      Poseidon.hash(balanceQuoteToken.toFields()),
                // )

                const newCalculatedPoolsRoot = poolWitness.calculateRoot(
                    Poseidon.hash(pool.toFields()),
                )

                // rollupState.balancesRoot = newCalculatedBalancesRoot
                rollupState.poolsRoot = newCalculatedPoolsRoot
            },
        },
        sell: {
            privateInputs: [
                PublicKey,
                Signature,
                Balance,
                Balance,
                // BalancePairWitness (todo: make a merkle witness for a pair of leaves)
                Pool,
                PoolWitness,
                UInt64,
                UInt64,
            ],
            method(
                rollupState: RollupState,
                sender: PublicKey,
                signature: Signature,
                senderBaseTokenBalance: Balance,
                senderQuoteTokenBalance: Balance,
                // balancePairWitness (todo: make a merkle witness for a pair of leaves)
                pool: Pool,
                poolWitness: PoolWitness,
                baseTokensToSell: UInt64,
                minQuoteTokensToReceive: UInt64,
            ) {
                /*//////////////////////////////////////////////////////////////
                                    SIGNATURE VERIFICATION
                //////////////////////////////////////////////////////////////*/

                // don't forget to add each parameter except `caller` in order.
                const message = [
                    ...rollupState.toFields(),
                    ...senderBaseTokenBalance.toFields(),
                    ...senderQuoteTokenBalance.toFields(),
                    // ...balancePairWitness.toFields(), (todo: make a merkle witness for a pair of leaves)
                    ...pool.toFields(),
                    ...poolWitness.toFields(),
                    ...baseTokensToSell.toFields(),
                    ...minQuoteTokensToReceive.toFields(),
                ]

                signature.verify(sender, message).assertTrue()

                /*//////////////////////////////////////////////////////////////
                                        STATE ASSERTIONS
                //////////////////////////////////////////////////////////////*/

                // todo: make a merkle witness for a pair of leaves

                // const calculatedBalancesRoot = balancePairWitness.calculateRoot(
                //      Poseidon.hash(balanceBaseToken.toFields()),
                //      Poseidon.hash(balanceQuoteToken.toFields()),
                // )

                // I've used `Poseidon.hash(pool.toFields())`, because the `Pool` must be a part of the tree.
                const calculatedPoolsRoot = poolWitness.calculateRoot(
                    Poseidon.hash(pool.toFields()),
                )

                // rollupState.balancesRoot.assertEquals(calculatedBalancesRoot)
                rollupState.poolsRoot.assertEquals(calculatedPoolsRoot)

                /*//////////////////////////////////////////////////////////////
                                        DATA ASSERTIONS
                //////////////////////////////////////////////////////////////*/

                const poolNewBaseTokenAmount = pool.baseTokenAmount.add(baseTokensToSell)
                const poolNewQuoteTokenAmount = pool.k.div(poolNewBaseTokenAmount)
                const quoteTokensToReceive = poolNewQuoteTokenAmount.sub(
                    pool.quoteTokenAmount,
                )

                pool.baseTokenId.assertEquals(senderBaseTokenBalance.tokenId)
                pool.quoteTokenId.assertEquals(senderQuoteTokenBalance.tokenId)
                pool.quoteTokenAmount.assertGreaterThan(minQuoteTokensToReceive)
                minQuoteTokensToReceive.assertLessThanOrEqual(quoteTokensToReceive)
                senderBaseTokenBalance.amount.assertGreaterThanOrEqual(baseTokensToSell)

                /*//////////////////////////////////////////////////////////////
                                            LOGIC
                //////////////////////////////////////////////////////////////*/

                const senderNewBaseTokenBalance =
                    senderBaseTokenBalance.amount.sub(baseTokensToSell)

                const senderNewQuoteTokenBalance =
                    senderQuoteTokenBalance.amount.add(quoteTokensToReceive)

                const poolNewK = poolNewBaseTokenAmount.mul(poolNewQuoteTokenAmount)

                pool.baseTokenAmount = poolNewBaseTokenAmount
                pool.quoteTokenAmount = poolNewQuoteTokenAmount
                pool.k = poolNewK

                senderBaseTokenBalance.amount = senderNewBaseTokenBalance
                senderQuoteTokenBalance.amount = senderNewQuoteTokenBalance

                /*//////////////////////////////////////////////////////////////
                                        STATE UPDATES
                //////////////////////////////////////////////////////////////*/

                // todo: make a merkle witness for a pair of leaves

                // const newCalculatedBalancesRoot = balancePairWitness.calculateRoot(
                //      Poseidon.hash(balanceBaseToken.toFields()),
                //      Poseidon.hash(balanceQuoteToken.toFields()),
                // )

                const newCalculatedPoolsRoot = poolWitness.calculateRoot(
                    Poseidon.hash(pool.toFields()),
                )

                // rollupState.balancesRoot = newCalculatedBalancesRoot
                rollupState.poolsRoot = newCalculatedPoolsRoot
            },
        },
    },
})
