import { Sdk } from "./Sdk"

class User {
    sdk?: Sdk
    address?: string = $state()

    constructor() {}

    async connect() {
        if (!window.mina) {
            alert("Auro Wallet is not connected!")
            throw Error("Auro Wallet is not connected!")
        }

        const [address] = await window.mina.requestAccounts()
        this.address = address
        this.sdk = new Sdk("http://localhost:1234", this.address)
    }

    async disconnected() {
        if (!window.mina) {
            alert("Auro Wallet is not connected!")
            throw Error("Auro Wallet is not connected!")
        }

        window.mina.removeAllListeners()

        this.address = undefined
        this.sdk = undefined
    }
}

export const user = new User()
