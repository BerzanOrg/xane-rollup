export type Balance = {
    tokenId: string
    owner: string
    amount: string
}

export type Pool = {
    baseTokenId: string
    quoteTokenId: string
    baseTokenAmount: string
    quoteTokenAmount: string
    k: string
    lpPoints: string
}

export type Liquidity = {
    baseTokenId: string
    quoteTokenId: string
    lpPoints: string
    provider: string
}

export class Sdk {
    clientUrl: string
    signer: string

    constructor(clientUrl: string, signer: string) {
        this.clientUrl = clientUrl
        this.signer = signer
    }

    async #sign(fields: Array<string>): Promise<string> {
        if (window.mina === undefined) {
            alert("Auro wallet is not connected!")
            throw Error("Auro Wallet is not connected!")
        }

        const { signature } = await window.mina.signFields({ message: fields })

        return signature
    }

    async getAllBalances(): Promise<Array<Balance>> {
        return []
    }

    async getBalancesByOwner(owner: string): Promise<Array<Balance>> {
        return []
    }

    async getBalancesByTokenId(tokenId: string): Promise<Array<Balance>> {
        return []
    }

    async getBalance(owner: string, tokenId: string): Promise<Balance> {
        return { tokenId: "", owner: "", amount: "" }
    }

    async getAllPools(): Promise<Array<Pool>> {
        return []
    }

    async getPoolsByBaseTokenId(baseTokenId: string): Promise<Array<Pool>> {
        return []
    }

    async getPoolsByQuoteTokenId(quoteTokenId: string): Promise<Array<Pool>> {
        return []
    }

    async getPool(baseTokenId: string, quoteTokenId: string): Promise<Pool> {
        return {
            baseTokenId: "",
            quoteTokenId: "",
            baseTokenAmount: "",
            quoteTokenAmount: "",
            k: "",
            lpPoints: "",
        }
    }

    async getAllLiquidities(): Promise<Array<Liquidity>> {
        return []
    }

    async getLiquiditiesByProvider(provider: string): Promise<Array<Liquidity>> {
        return []
    }

    async getLiquiditiesByPool(
        baseTokenId: string,
        quoteTokenId: string,
    ): Promise<Array<Liquidity>> {
        return []
    }

    async getLiquidity(
        provider: string,
        baseTokenId: string,
        quoteTokenId: string,
    ): Promise<Liquidity> {
        return {
            baseTokenId: "",
            quoteTokenId: "",
            lpPoints: "",
            provider: "",
        }
    }

    async createPool(
        baseTokenId: string,
        quoteTokenId: string,
        baseTokenAmount: string,
        quoteTokenAmount: string,
    ): Promise<void> {
        const signature = this.#sign([])

        return
    }

    async addLiquidity(
        baseTokenId: string,
        quoteTokenId: string,
        baseTokenAmount: string,
        quoteTokenAmountMaxLimit: string,
    ): Promise<void> {
        const signature = this.#sign([])

        return
    }

    async removeLiquidity(
        lpPoints: string,
        baseTokenId: string,
        quoteTokenId: string,
        baseTokenAmountMinLimit: string,
        quoteTokenAmountMinLimit: string,
    ): Promise<void> {
        const signature = this.#sign([])

        return
    }

    async buy(
        baseTokenId: string,
        quoteTokenId: string,
        baseTokenAmount: string,
        quoteTokenAmountMaxLimit: string,
    ): Promise<void> {
        const signature = this.#sign([])

        return
    }

    async sell(
        baseTokenId: string,
        quoteTokenId: string,
        baseTokenAmount: string,
        quoteTokenAmountMinLimit: string,
    ): Promise<void> {
        const signature = this.#sign([])

        return
    }
}
