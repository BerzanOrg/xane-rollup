import { PrivateKey, UInt64 } from "o1js"

export const utils = {
    generateKeypair: () => {
        const privateKey = PrivateKey.random()
        const publicKey = privateKey.toPublicKey()
        return {
            privateKey,
            publicKey,
        }
    },
    restoreKeypair: (privateKeyAsBase58: string) => {
        const privateKey = PrivateKey.fromBase58(privateKeyAsBase58)
        const publicKey = privateKey.toPublicKey()
        return {
            privateKey,
            publicKey,
        }
    },
    createNumber: (number: number, decimals: number) => {
        return UInt64.from(BigInt(number) * BigInt(10) ** BigInt(decimals))
    },
}
