import {
    DeployArgs,
    Field,
    Permissions,
    SmartContract,
    State,
    method,
    state,
} from "o1js"
import { RollupProof } from "./RollupProof"

export class RollupContract extends SmartContract {
    @state(Field) rollupStateHash = State<Field>()

    deploy(args?: DeployArgs) {
        super.deploy(args)

        this.account.permissions.set({
            ...Permissions.allImpossible(),
            editState: Permissions.proof(),
            send: Permissions.proof(),
            receive: Permissions.proof(),
        })
    }

    @method initStateHash(stateHash: Field) {
        this.rollupStateHash.set(stateHash)
    }

    @method updateStateHash(proof: RollupProof) {
        proof.verify()
        this.rollupStateHash.set(proof.publicInput.hash())
    }
}
