declare interface Window {
    mina?: {
        requestAccounts(): Promise<Array<string>>

        getAccounts(): Promise<Array<string>>

        requestNetwork(): Promise<{
            chainId: string
        }>

        sendTransaction(params: {
            transaction: string
            feePayer?: {
                fee?: number
                memo?: string
            }
        }): Promise<{ hash: string }>

        signMessage(params: { message: string }): Promise<{
            publicKey: string
            data: string
            signature: {
                field: string
                scalar: string
            }
        }>

        verifyMessage(params: {
            publicKey: string
            payload: string
            signature: {
                field: string
                scalar: string
            }
        }): Promise<boolean>

        signFields(params: { message: Array<string> }): Promise<{
            data: Array<string>
            signature: string
        }>

        verifyFields(params: {
            publicKey: string
            payload: Array<string>
            signature: {
                field: string
                scalar: string
            }
        }): Promise<boolean>

        on<T extends "accountsChanged" | "chainChanged">(
            eventName: T,
            handler: (
                params: T extends "accountsChanged"
                    ? Array<string>
                    : T extends "chainChanged"
                      ? string
                      : never,
            ) => void,
        ): void

        removeAllListeners(): void
    }
}
