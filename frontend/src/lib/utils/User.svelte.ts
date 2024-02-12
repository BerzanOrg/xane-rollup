import { Sdk } from "./Sdk"

function createUser() {
    let sdk: Sdk | undefined = undefined
    let address: string | undefined = $state(undefined)

    async function connect() {
        if (!window.mina) {
            alert("Auro Wallet is not connected!")
            throw Error("Auro Wallet is not connected!")
        }

        const addresses = await window.mina.requestAccounts()
        address = addresses[0]
        sdk = new Sdk("http://localhost:1234", address)
    }

    async function disconnect() {
        if (!window.mina) {
            alert("Auro Wallet is not connected!")
            throw Error("Auro Wallet is not connected!")
        }

        window.mina.removeAllListeners()

        address = undefined
        sdk = undefined
    }

    return {
        connect,
        disconnect,
        get address() {
            return address
        },
        sdk,
    }
}

export const user = createUser()
