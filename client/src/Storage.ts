import { MerkleTree } from "o1js"
import { MINA_BALANCES_HEIGHT, RollupState } from "xane"

export class Storage {
    private rollupState: RollupState
    private minaBalances: MerkleTree

    private constructor() {
        const minaBalances = new MerkleTree(MINA_BALANCES_HEIGHT)

        this.rollupState = new RollupState({
            minaBalancesRoot: minaBalances.getRoot(),
        })

        this.minaBalances = minaBalances
    }

    public static init() {
        return new Storage()
    }
}
