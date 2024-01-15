import { Field, Struct } from "o1js"

/**
 * A proovable type that represents the rollup state.
 */
export class RollupState extends Struct({
    /** Merkle root for the Merkle tree that stores token balances of users. */
    balancesRoot: Field,
    /** Merkle root for the Merkle tree that stores AMM pools. */
    poolsRoot: Field,
    /** Merkle root for the Merkle tree that stores users' liquidities. */
    liquiditiesRoot: Field,
}) {}
