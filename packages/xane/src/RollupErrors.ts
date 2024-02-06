export enum ProgramError {
    InvalidCalculatedRoot = "invalid calculated root",
    InvalidSignature = "invalid signature",
    InsufficientBalance = "insufficient balance",
    InvalidTokenId = "invalid token id",
    InvalidSender = "invalid sender",
    InvalidBalanceOwner = "invalid balance owner",
    InvalidLiquidityProvider = "invalid liquidity provider",
    ExceededLimit = "exceeded limit",
}

export enum StorageError {
    OrderNotFound = "order is not found",
    OrderExists = "order already exists",
    BalanceNotFound = "balance is not found",
    BalanceExists = "balance already exists",
    PoolNotFound = "pool is not found",
    PoolExists = "pool already exists",
    LiqudityNotFound = "liquidity is not found",
    LiqudityExists = "liquidity already exists",
}
