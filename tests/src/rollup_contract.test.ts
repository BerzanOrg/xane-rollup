import { it, describe } from "node:test"
// import assert from "node:assert/strict"
import { AccountUpdate, Mina, PrivateKey } from "o1js"
import { RollupContract } from "xane"

// TODO: fix compilation error

describe("Rollup Contract", async () => {
    // compiling the rollup contract
    await RollupContract.compile({})

    // creating a local blockchain
    const localBlockchain = Mina.LocalBlockchain()

    // setting active instance as the local blockchain
    Mina.setActiveInstance(localBlockchain)

    // a secret key for testing
    const deployerSecretKey = localBlockchain.testAccounts[0].privateKey

    // an address for testing
    const deployer = localBlockchain.testAccounts[0].publicKey

    // a secret key for testing
    const contractSecretKey = PrivateKey.random()

    // an address for testing
    const contractAddress = contractSecretKey.toPublicKey()

    const rollupContract = new RollupContract(contractAddress)

    it("can deploy the rollup smart contract", async () => {
        const tx = await Mina.transaction(deployer, () => {
            rollupContract.deploy()
            AccountUpdate.fundNewAccount(deployer)
        })

        await tx.prove()

        tx.sign([deployerSecretKey])

        await tx.send()
    })
})
