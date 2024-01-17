import { Field, MerkleTree, MerkleWitness, Poseidon, PublicKey } from "o1js"
import { RollupErrors } from "./RollupErrors"
import { Liquidity } from "./Structs"

// Change the type of `Error` to provide error messagees in a type-safe way.
declare function Error(msg: `${RollupErrors}`): Error

/**
 * Height of the merkle tree that stores users' liquidities.
 */
export const LIQUIDITY_TREE_HEIGHT = 10

/**
 * Merkle witness for the merkle tree that stores users' liquidities.
 */
export class LiqudityWitness extends MerkleWitness(LIQUIDITY_TREE_HEIGHT) {}

/**
 * Stores users' liquidities with an array and a merkle tree.
 */
export class StorageForLiquidities {
    private innerTree: MerkleTree
    private innerArray: Array<Liquidity>
    private counter: number

    /**
     * Creates a new instance of `LiquidityStorage`.
     */
    public static empty(): StorageForLiquidities {
        return new StorageForLiquidities()
    }

    /**
     * Creates a new instance of `LiquidityStorage` by using old liquidities of users to restore.
     */
    public static restore(oldLiquidities: Array<Liquidity>): StorageForLiquidities {
        return new StorageForLiquidities(oldLiquidities)
    }

    /**
     *  The constructor of `LiquidityStorage` class.
     */
    private constructor(initialLiquidities?: Array<Liquidity>) {
        this.innerTree = new MerkleTree(LIQUIDITY_TREE_HEIGHT)
        this.innerArray = initialLiquidities ?? []
        this.counter = 0

        this.innerArray.forEach(this.store)
    }

    /**
     *  Increments the internal counter that stores the count of users' liquidities.
     */
    private incrementCounter(): void {
        this.counter += 1
    }

    /**
     *  Returns the internal counter that stores the count of users' liquidities.
     */
    private getCounter(): number {
        return this.counter
    }

    /**
     *  Returns the Merkle root of the Merkle tree that stores users' liquidities.
     */
    public getRoot(): Field {
        return this.innerTree.getRoot()
    }

    /**
     * Returns the merkle witness of the given provider's liquidity for the AMM pool of the given base & quote token IDs.
     *
     * Returns an error if the given provider's liquidity for the AMM pool of the given base & quote token IDs is not found.
     */
    public getWitness(params: {
        baseTokenId: Field
        quoteTokenId: Field
        provider: PublicKey
    }): LiqudityWitness | Error {
        const index = this.innerArray.findIndex((liquidity) =>
            liquidity.matches(params).toBoolean(),
        )

        if (index === -1) return Error("liquidity is not found")

        const witness = this.innerTree.getWitness(BigInt(index))

        return new LiqudityWitness(witness)
    }

    /**
     * Stores the given user liquidity.
     *
     * Returns an error if the user already has a liquidity for the AMM pool of the given base & quote token IDs.
     */
    public store(liquidity: Liquidity): void | Error {
        const doesExist = this.innerArray.find((l) => l.matches(liquidity).toBoolean())

        if (doesExist) return Error("liquidity already exists")

        const index = this.getCounter()

        const hash = Poseidon.hash(liquidity.toFields())

        this.innerArray[index] = liquidity
        this.innerTree.setLeaf(BigInt(index), hash)

        this.incrementCounter()
    }

    /**
     * Returns the given provider's liquidity for the AMM pool of the given base & quote token IDs.
     *
     * Returns an error if the given provider's liquidity for the AMM pool of the given base & quote token IDs is not found.
     */
    public get(params: {
        baseTokenId: Field
        quoteTokenId: Field
        provider: PublicKey
    }): Liquidity | Error {
        const liquidity = this.innerArray.find((liquidity) =>
            liquidity.matches(params).toBoolean(),
        )

        return liquidity || Error("liquidity is not found")
    }
}
