import {
    DeployArgs,
    Permissions,
    SmartContract,
    State,
    method,
    state,
} from "o1js"
import { RollupProof } from "./RollupProof"
import { RollupState } from "./RollupState"

export class RollupContract extends SmartContract {
    @state(RollupState) rollupState = State<RollupState>()

    deploy(args?: DeployArgs) {
        super.deploy(args)

        this.account.permissions.set({
            ...Permissions.allImpossible(),
            editState: Permissions.proof(),
            send: Permissions.proof(),
            receive: Permissions.proof(),
        })
    }

    @method initState(stateHash: RollupState) {
        this.rollupState.set(stateHash)
    }

    @method updateState(proof: RollupProof) {
        proof.verify()
        this.rollupState.set(proof.publicInput)
    }
}
