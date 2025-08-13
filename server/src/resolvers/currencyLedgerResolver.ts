import { ApolloContext } from "../context.js"
import * as CurrencyLedgerRepo from "../repositories/Currency/CurrencyLedgerRepository.js"


export const CurrencyLedgerResolvers = {
  Query: {
    currencyLedgerEntriesLimit: (
      _parent: any,
      args: {
        searchText?: string
      },
      { isManager }: ApolloContext
    ) => {
      return isManager(async () => (
        await CurrencyLedgerRepo.getCurrencyLedgerEntriesLimit(args.searchText)
      ))
    }
  }
}