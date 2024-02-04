import { Bool, CircuitValue, Field, Poseidon, Provable, arrayProp } from "o1js"

type Witness = { isLeft: boolean; sibling: Field }[]

function maybeSwap(b: Bool, x: Field, y: Field): [Field, Field] {
    const m = b.toField().mul(x.sub(y)) // b*(x - y)
    const x_ = y.add(m) // y + b*(x - y)
    const y_ = x.sub(m) // x - b*(x - y) = x + b*(y - x)
    return [x_, y_]
}

class BaseMerkleDoubleWitness extends CircuitValue {
    static height: number
    pathFirst: Field[]
    isLeftFirst: Bool[]
    pathSecond: Field[]
    isLeftSecond: Bool[]
    height(): number {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this.constructor as any).height
    }

    constructor(witnessFirst: Witness, witnessSecond: Witness) {
        super()
        const heightFirst = witnessFirst.length + 1
        const heightSecond = witnessSecond.length + 1

        if (heightFirst !== this.height()) {
            throw Error(
                `Length of first witness ${heightFirst}-1 doesn't match static tree height ${this.height()}.`,
            )
        }
        if (heightSecond !== this.height()) {
            throw Error(
                `Length of second witness ${heightSecond}-1 doesn't match static tree height ${this.height()}.`,
            )
        }

        this.pathFirst = witnessFirst.map((item) => item.sibling)
        this.isLeftFirst = witnessFirst.map((item) => Bool(item.isLeft))

        this.pathSecond = witnessSecond.map((item) => item.sibling)
        this.isLeftSecond = witnessSecond.map((item) => Bool(item.isLeft))
    }

    calculateRoot(leafFirst: Field, leafSecond: Field): Field {
        let hash = Field(0)
        let hashFirst = leafFirst
        let hashSecond = leafSecond
        const n = this.height()

        for (let i = 1; i < n; ++i) {
            const isLeftFirst = this.isLeftFirst[i - 1]
            const isLeftSecond = this.isLeftSecond[i - 1]
            const pathFirst = this.pathFirst[i - 1]
            const pathSecond = this.pathSecond[i - 1]
            // I don't know if this `if-else` is provable.
            if (
                pathFirst
                    .equals(pathSecond)
                    .and(isLeftFirst.equals(isLeftSecond))
                    .toBoolean()
            ) {
                const [left, right] = maybeSwap(isLeftFirst, hash, pathFirst)
                hash = Poseidon.hash([left, right])
                console.log(2324334)
            } else {
                const [left, right] = maybeSwap(isLeftFirst, hashFirst, hashSecond)
                hash = Poseidon.hash([left, right])

                const [leftFirst, rightFirst] = maybeSwap(
                    isLeftFirst,
                    hashFirst,
                    pathFirst,
                )
                const [leftSecond, rightSecond] = maybeSwap(
                    isLeftSecond,
                    hashSecond,
                    pathSecond,
                )
                hashFirst = Poseidon.hash([leftFirst, rightFirst])
                hashSecond = Poseidon.hash([leftSecond, rightSecond])
            }
        }

        return hash
    }

    calculateIndexes(): [Field, Field] {
        let powerOfTwo = Field(1)
        let indexFirst = Field(0)
        let indexSecond = Field(0)
        const n = this.height()

        for (let i = 1; i < n; ++i) {
            indexFirst = Provable.if(
                this.isLeftFirst[i - 1],
                indexFirst,
                indexFirst.add(powerOfTwo),
            )
            indexSecond = Provable.if(
                this.isLeftSecond[i - 1],
                indexSecond,
                indexSecond.add(powerOfTwo),
            )
            powerOfTwo = powerOfTwo.mul(2)
        }

        return [indexFirst, indexSecond]
    }
}

export function MerkleDoubleWitness(height: number): typeof BaseMerkleDoubleWitness {
    class MerkleWitness_ extends BaseMerkleDoubleWitness {
        static height = height
    }
    arrayProp(Field, height - 1)(MerkleWitness_.prototype, "path")
    arrayProp(Bool, height - 1)(MerkleWitness_.prototype, "isLeft")
    return MerkleWitness_
}
