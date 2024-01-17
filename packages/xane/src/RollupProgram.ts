import { Field, Poseidon, PublicKey, Signature, UInt64, ZkProgram } from "o1js"
import { PoolWitness } from "./StorageForPools"
import { LiqudityWitness } from "./StoreageForLiquidities"
import { Balance, Liquidity, Pool } from "./Structs"
import { RollupState } from "./RollupState"

/**
 * The off-chain zk-program of the rollup that generates prooves.
 */
export const RollupProgram = ZkProgram({
    name: "xane",

    publicInput: RollupState,

    methods: {
        createPool: {
            privateInputs: [
                PublicKey,
                Signature,
                Balance,
                Balance,
                // BalancePairWitness (todo: make a merkle witness for a pair of leaves)
                PoolWitness,
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
                poolWitness: PoolWitness,
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
                    ...poolWitness.toFields(),
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

                /*//////////////////////////////////////////////////////////////
                                            LOGIC
                //////////////////////////////////////////////////////////////*/

                balanceBaseToken.amount = balanceBaseToken.amount.sub(amountBaseToken)
                balanceQuoteToken.amount = balanceQuoteToken.amount.sub(amountQuoteToken)

                const pool = new Pool({
                    baseTokenId: balanceBaseToken.tokenId,
                    quoteTokenId: balanceQuoteToken.tokenId,
                    baseTokenAmount: amountBaseToken,
                    quoteTokenAmount: amountQuoteToken,
                    k: amountBaseToken.mul(amountQuoteToken),
                    lpTokensSupply: new UInt64(65535),
                })

                const liquidity = new Liquidity({
                    baseTokenId: balanceBaseToken.tokenId,
                    quoteTokenId: balanceQuoteToken.tokenId,
                    amount: new UInt64(65535),
                    provider: sender,
                })

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
                    .mul(pool.lpTokensSupply)
                    .div(pool.baseTokenAmount)

                const poolNewBaseTokenAmount = pool.baseTokenAmount.add(amountBaseToken)

                const poolNewQuoteTokenAmount = pool.baseTokenAmount.add(amountQuoteToken)

                const poolNewK = poolNewBaseTokenAmount.mul(poolNewQuoteTokenAmount)
                const poolNewLpTokensSupply = pool.lpTokensSupply.sub(lpTokensToMint)

                pool.baseTokenAmount = poolNewBaseTokenAmount
                pool.quoteTokenAmount = poolNewQuoteTokenAmount
                pool.k = poolNewK
                pool.lpTokensSupply = poolNewLpTokensSupply

                liquidity.amount = liquidity.amount.add(lpTokensToMint)

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
                pool.lpTokensSupply.assertGreaterThanOrEqual(lpTokensToBurn)

                /*//////////////////////////////////////////////////////////////
                                            LOGIC
                //////////////////////////////////////////////////////////////*/

                const senderBaseTokenAmount = lpTokensToBurn
                    .mul(pool.baseTokenAmount)
                    .div(pool.lpTokensSupply)

                const senderQuoteTokenAmount = lpTokensToBurn
                    .mul(pool.quoteTokenAmount)
                    .div(pool.lpTokensSupply)

                const poolNewBaseTokenAmount =
                    pool.baseTokenAmount.sub(senderBaseTokenAmount)

                const poolNewQuoteTokenAmount =
                    pool.baseTokenAmount.sub(senderQuoteTokenAmount)

                const poolNewK = poolNewBaseTokenAmount.mul(poolNewQuoteTokenAmount)
                const poolNewLpTokensSupply = pool.lpTokensSupply.sub(lpTokensToBurn)

                pool.baseTokenAmount = poolNewBaseTokenAmount
                pool.quoteTokenAmount = poolNewQuoteTokenAmount
                pool.k = poolNewK
                pool.lpTokensSupply = poolNewLpTokensSupply

                liquidity.amount = liquidity.amount.sub(lpTokensToBurn)

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
