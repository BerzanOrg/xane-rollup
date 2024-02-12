import {
    DeployArgs,
    Field,
    Permissions,
    Poseidon,
    SmartContract,
    State,
    method,
    state,
} from "o1js"
import { RollupState } from "./RollupState.js"
import { RollupProof } from "./RollupProof.js"

/**
 * The on-chain smart contract of the rollup that stores rollup state.
 */
export class RollupContract extends SmartContract {
    @state(Field) rollupStateHash = State<Field>()

    deploy(args?: DeployArgs) {
        super.deploy(args)

        this.account.permissions.set({
            ...Permissions.allImpossible(),
            access: Permissions.proof(),
            editState: Permissions.proof(),
        })
    }

    init() {
        const emptyRollupState = new RollupState(RollupState.empty())
        const emptyRollupStateHash = Poseidon.hash(emptyRollupState.toFields())
        this.rollupStateHash.set(emptyRollupStateHash)
    }

    @method updateStateHash(proof: RollupProof) {
        proof.verify()
        const rollupStateHash = Poseidon.hash(proof.publicOutput.toFields())
        this.rollupStateHash.set(rollupStateHash)
    }
}
