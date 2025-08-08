export enum AtriumError {
	Connection = "Connection",
	InvalidUser = "InvalidUser",
	SomethingElse = "SomethingElse",
}

export async function getBalance(username: string): Promise<number | AtriumError> {
	return AtriumError.SomethingElse;
}


export async function adjustBalanceIfPossible(username: string, deltaCents: number): Promise<boolean> {
	return false;
}
