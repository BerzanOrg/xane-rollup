import { z } from "zod"

/** The regular expression for Mina public keys. */
const addressRegex = /^B62[1-9A-HJ-NP-Za-km-z]{52}$/

/** The regular expression for Mina public keys. */
const signatureRegex = /^[1-9A-HJ-NP-Za-km-z]{96}$/

/** Maximum size of a `Field` element. */
const maxFieldSize =
    28948022309329048855892746252171976963363056481941560715954676764349967630336n

/** Maximum size of a `UInt64` number. */
const maxUInt64 = 18446744073709551615n

/** The Zod schema used to validate Mina public keys. */
const publicKey = z.string().regex(addressRegex, "mistaken public key")

/** The Zod schema used to validate signatures. */
const signature = z.string().regex(signatureRegex, "mistaken signature")

/** The Zod schema used to `Field` elements. */
const field = z.coerce.bigint().lte(maxFieldSize, "mistaken field element")

/** The Zod schema used to `UInt64` numbers. */
const uint64 = z.coerce.bigint().lte(maxUInt64, "mistaken uint64")

/** The TypeScript type of the Zod schema used to validate rollup storage in disk. */
export type StorageSchema = z.infer<typeof StorageSchema>

/** The Zod schema used to validate rollup storage in disk. */
export const StorageSchema = z.object({
    lastProof: z.object({
        publicInput: z.array(z.string()),
        publicOutput: z.array(z.string()),
        maxProofsVerified: z.literal(0).or(z.literal(1)).or(z.literal(2)),
        proof: z.string(),
    }),
    balances: z.array(
        z.object({
            tokenId: field,
            owner: publicKey,
            amount: uint64,
        }),
    ),
    pools: z.array(
        z.object({
            baseTokenId: field,
            quoteTokenId: field,
            baseTokenAmount: uint64,
            quoteTokenAmount: uint64,
            k: uint64,
            lpPoints: uint64,
        }),
    ),
    liquidities: z.array(
        z.object({
            baseTokenId: field,
            quoteTokenId: field,
            lpPoints: uint64,
            provider: publicKey,
        }),
    ),
})

/** The TypeScript type of the Zod schema used to validate rollup storage in disk. */
export type RequestSchema = z.infer<typeof RequestSchema>

/** The Zod schema used to validate rollup storage in disk. */
export const RequestSchema = z.union([
    z.object({
        method: z.literal("getAllBalances"),
    }),
    z.object({
        method: z.literal("getBalancesByOwner"),
        owner: publicKey,
    }),
    z.object({
        method: z.literal("getBalancesByTokenId"),
        tokenId: field,
    }),
    z.object({
        method: z.literal("getBalance"),
        owner: publicKey,
        tokenId: field,
    }),
    z.object({
        method: z.literal("getAllPools"),
    }),
    z.object({
        method: z.literal("getPoolsByBaseTokenId"),
        baseTokenId: field,
    }),
    z.object({
        method: z.literal("getPoolsByQuoteTokenId"),
        quoteTokenId: field,
    }),
    z.object({
        method: z.literal("getPool"),
        baseTokenId: field,
        quoteTokenId: field,
    }),
    z.object({
        method: z.literal("getAllLiquidities"),
    }),
    z.object({
        method: z.literal("getLiquiditiesByProvider"),
        provider: publicKey,
    }),
    z.object({
        method: z.literal("getLiquiditiesByPool"),
        baseTokenId: field,
        quoteTokenId: field,
    }),
    z.object({
        method: z.literal("getLiquidity"),
        baseTokenId: field,
        quoteTokenId: field,
        provider: publicKey,
    }),
    z.object({
        method: z.literal("createPool"),
        sender: publicKey,
        senderSignature: signature,
        baseTokenId: field,
        quoteTokenId: field,
        baseTokenAmount: uint64,
        quoteTokenAmount: uint64,
    }),
    z.object({
        method: z.literal("addLiquidity"),
        sender: publicKey,
        senderSignature: signature,
        baseTokenId: field,
        quoteTokenId: field,
        baseTokenAmount: uint64,
        quoteTokenAmountMaxLimit: uint64,
    }),
    z.object({
        method: z.literal("removeLiquidity"),
        sender: publicKey,
        senderSignature: signature,
        lpPoints: uint64,
        baseTokenId: field,
        quoteTokenId: field,
        baseTokenAmountMinLimit: uint64,
        quoteTokenAmountMinLimit: uint64,
    }),
    z.object({
        method: z.literal("buy"),
        sender: publicKey,
        senderSignature: signature,
        baseTokenId: field,
        quoteTokenId: field,
        baseTokenAmount: uint64,
        quoteTokenAmountMaxLimit: uint64,
    }),
    z.object({
        method: z.literal("sell"),
        sender: publicKey,
        senderSignature: signature,
        baseTokenId: field,
        quoteTokenId: field,
        baseTokenAmount: uint64,
        quoteTokenAmountMinLimit: uint64,
    }),
])
