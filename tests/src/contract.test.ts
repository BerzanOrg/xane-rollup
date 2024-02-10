import { it, describe } from "node:test"
import assert from "node:assert/strict"
import { AccountUpdate, Field, Mina, Poseidon, PrivateKey, Signature } from "o1js"
import { RollupContract, RollupProgram, RollupState, RollupStorage } from "xane"

describe("Contract", async () => {
    // creating a local blockchain
    const localBlockchain = Mina.LocalBlockchain({ proofsEnabled: false })

    // setting active instance as the local blockchain
    Mina.setActiveInstance(localBlockchain)

    // compile the zk program
    // do it before the smart contract as the zk program is a dependency of the smart contract
    await RollupProgram.compile()

    // compile the smart contract
    await RollupContract.compile()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const storage = RollupStorage.empty(
        await RollupProgram.genesis(new RollupState(RollupState.empty())),
    )

    // a secret key for testing
    const deployerSecretKey = localBlockchain.testAccounts[0].privateKey

    // an address for testing
    const deployerAddress = localBlockchain.testAccounts[0].publicKey

    // a secret key for testing
    const userSecretKey = localBlockchain.testAccounts[1].privateKey

    // an address for testing
    const userAddress = localBlockchain.testAccounts[1].publicKey

    // a secret key for testing
    const contractSecretKey = PrivateKey.random()

    // an address for testing
    const contractAddress = contractSecretKey.toPublicKey()

    // a token ID for testing

    const rollupContract = new RollupContract(contractAddress)

    it("can deploy the rollup smart contract", async () => {
        const tx = await Mina.transaction(deployerAddress, () => {
            rollupContract.deploy()
            AccountUpdate.fundNewAccount(deployerAddress)
        })
        await tx.prove()
        tx.sign([deployerSecretKey, contractSecretKey])
        await tx.send()

        const stateHashAfterDeployment = rollupContract.rollupStateHash.get()
        assert.deepEqual(stateHashAfterDeployment, Field(0))
    })

    it("can initialize the state of the rollup smart contract", async () => {
        const tx = await Mina.transaction(deployerAddress, () => {
            rollupContract.initStateHash(storage.state)
        })
        await tx.prove()
        tx.sign([deployerSecretKey, contractSecretKey])
        await tx.send()

        const stateHashAfterDeployment = rollupContract.rollupStateHash.get()

        assert.deepEqual(
            stateHashAfterDeployment,
            Poseidon.hash(storage.state.toFields()),
        )
    })

    it("can update the state of the rollup smart contract", async () => {
        const signature = Signature.create(userSecretKey, [])
        const proof = await RollupProgram.doNothing(storage.state, userAddress, signature)

        const tx = await Mina.transaction(userAddress, () => {
            rollupContract.updateStateHash(proof)
        })
        await tx.prove()
        tx.sign([userSecretKey])
        await tx.send()

        const stateHashAfterDeployment = rollupContract.rollupStateHash.get()

        assert.deepEqual(
            stateHashAfterDeployment,
            Poseidon.hash(storage.state.toFields()),
        )
    })
})
