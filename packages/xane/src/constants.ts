import { MerkleWitness } from "o1js"

export const MINA_BALANCES_HEIGHT = 11
export class MinaBalancesWitness extends MerkleWitness(MINA_BALANCES_HEIGHT) {}
