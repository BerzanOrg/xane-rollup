import { ZkProgram } from "o1js"
import { RollupProgram } from "./RollupProgram"

/**
 * The type of proofs `RollupProgram` generates.
 */
export class RollupProof extends ZkProgram.Proof(RollupProgram) {}
