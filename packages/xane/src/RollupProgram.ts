import { Field, PublicKey, UInt64, ZkProgram } from "o1js"
import { RollupState } from "./RollupState"
import { BalanceWitness } from "./BalanceStorage"
import { BalanceEntry } from "./BalanceEntry"
import { PoolWitness } from "./PoolStorage"
import { Pool } from "./Pool"

export const RollupProgram = ZkProgram({
    name: "rollup-program",

    publicInput: RollupState,

    methods: {
        createPool: {
            privateInputs: [
                Field,
                Field,
                UInt64,
                UInt64,
                PoolWitness,
                PublicKey,
                UInt64,
                UInt64,
                BalanceWitness,
                BalanceWitness,
            ],

            method(
                rollupState: RollupState,
                baseTokenId: Field,
                quoteTokenId: Field,
                initialBaseTokenAmount: UInt64,
                initialQuoteTokenAmount: UInt64,
                poolWitness: PoolWitness,
                senderAddress: PublicKey,
                currentSenderBaseTokenBalance: UInt64,
                currentSenderQuoteTokenBalance: UInt64,
                baseTokenBalanceWitness: BalanceWitness,
                quoteTokenBalanceWitness: BalanceWitness,
            ) {
                const baseTokenBalanceEntry = new BalanceEntry({
                    address: senderAddress,
                    amount: currentSenderBaseTokenBalance,
                    tokenId: baseTokenId,
                })

                const quoteTokenBalanceEntry = new BalanceEntry({
                    address: senderAddress,
                    amount: currentSenderQuoteTokenBalance,
                    tokenId: baseTokenId,
                })

                const pool = Pool.create({
                    baseTokenId,
                    quoteTokenId,
                    baseTokenAmount: initialBaseTokenAmount,
                    quoteTokenAmount: initialQuoteTokenAmount,
                })

                rollupState.balancesRoot.assertEquals(
                    baseTokenBalanceWitness.calculateRoot(
                        baseTokenBalanceEntry.hash(),
                    ),
                    "calculated balances root is not valid",
                )

                rollupState.balancesRoot.assertEquals(
                    quoteTokenBalanceWitness.calculateRoot(
                        quoteTokenBalanceEntry.hash(),
                    ),
                    "calculated balances root is not valid",
                )

                rollupState.poolsRoot.assertEquals(
                    poolWitness.calculateRoot(Field.empty()),
                    "calculated pools root is not valid",
                )

                baseTokenBalanceEntry
                    .hasMoreThan({
                        amount: initialBaseTokenAmount,
                    })
                    .assertTrue("base token balance is not enough")

                quoteTokenBalanceEntry
                    .hasMoreThan({
                        amount: initialQuoteTokenAmount,
                    })
                    .assertTrue("quote token balance is not enough")

                baseTokenBalanceEntry.sub({ amount: initialBaseTokenAmount })
                quoteTokenBalanceEntry.sub({ amount: initialQuoteTokenAmount })

                // todo: Calculate a single Merkle root for the Merkle tree that stores user balances.
                const newBalancesRoot = Field.empty()

                const newPoolsRoot = poolWitness.calculateRoot(pool.hash())

                rollupState.balancesRoot = newBalancesRoot
                rollupState.poolsRoot = newPoolsRoot
            },
        },
        addLiqudity: {
            privateInputs: [
                Field,
                Field,
                UInt64,
                UInt64,
                UInt64,
                UInt64,
                PoolWitness,
                PublicKey,
                UInt64,
                UInt64,
                BalanceWitness,
                BalanceWitness,
            ],

            method(
                rollupState: RollupState,
                baseTokenId: Field,
                quoteTokenId: Field,
                baseTokenAmountToAdd: UInt64,
                quoteTokenAmountToAdd: UInt64,
                currentBaseTokenAmountInPool: UInt64,
                currentQuoteTokenAmountInPool: UInt64,
                poolWitness: PoolWitness,
                senderAddress: PublicKey,
                senderCurrentBaseTokenBalance: UInt64,
                senderCurrentQuoteTokenBalance: UInt64,
                baseTokenBalanceWitness: BalanceWitness,
                quoteTokenBalanceWitness: BalanceWitness,
            ) {
                const baseTokenBalanceEntry = new BalanceEntry({
                    address: senderAddress,
                    amount: senderCurrentBaseTokenBalance,
                    tokenId: baseTokenId,
                })

                const quoteTokenBalanceEntry = new BalanceEntry({
                    address: senderAddress,
                    amount: senderCurrentQuoteTokenBalance,
                    tokenId: baseTokenId,
                })

                const pool = Pool.create({
                    baseTokenId,
                    quoteTokenId,
                    baseTokenAmount: currentBaseTokenAmountInPool,
                    quoteTokenAmount: currentQuoteTokenAmountInPool,
                })

                rollupState.balancesRoot.assertEquals(
                    baseTokenBalanceWitness.calculateRoot(
                        baseTokenBalanceEntry.hash(),
                    ),
                    "calculated balances root is not valid",
                )

                rollupState.balancesRoot.assertEquals(
                    quoteTokenBalanceWitness.calculateRoot(
                        quoteTokenBalanceEntry.hash(),
                    ),
                    "calculated balances root is not valid",
                )

                rollupState.poolsRoot.assertEquals(
                    poolWitness.calculateRoot(pool.hash()),
                    "calculated pools root is not valid",
                )

                baseTokenBalanceEntry
                    .hasMoreThan({
                        amount: baseTokenAmountToAdd,
                    })
                    .assertTrue("base token balance is not enough")

                quoteTokenBalanceEntry
                    .hasMoreThan({
                        amount: quoteTokenAmountToAdd,
                    })
                    .assertTrue("quote token balance is not enough")

                baseTokenBalanceEntry.sub({ amount: baseTokenAmountToAdd })
                quoteTokenBalanceEntry.sub({ amount: quoteTokenAmountToAdd })

                pool.isBalanced({
                    baseTokenAmount: baseTokenAmountToAdd,
                    quoteTokenAmount: quoteTokenAmountToAdd,
                }).assertTrue("amounts are not balanced with pool's liquidity")

                pool.addLiquidity({
                    baseTokenAmount: baseTokenAmountToAdd,
                    quoteTokenAmount: quoteTokenAmountToAdd,
                })

                // todo: Calculate a single Merkle root for the Merkle tree that stores user balances.
                const newBalancesRoot = Field.empty()

                const newPoolsRoot = poolWitness.calculateRoot(pool.hash())

                rollupState.balancesRoot = newBalancesRoot
                rollupState.poolsRoot = newPoolsRoot
            },
        },
        swap: {
            privateInputs: [],

            method(rollupState: RollupState) {
                rollupState
                // todo: Implement swap logic.
            },
        },
    },
})
