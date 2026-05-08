import { ApolloContext } from "../../context.js";
import { createCustomUrl, deleteCustomUrl, getCustomUrl, getCustomUrlById, getCustomUrls, updateCustomUrl } from "../../database/repositories/Links/customUrlRepository.js";
import { CustomUrlInput } from "../schemas/customUrlSchema.js";

const CustomUrlResolver = {
  Query: {
    url: async (
      _parent: any,
      args: { shortUrl: string },
    ) => {
      return await getCustomUrl(args.shortUrl);
    },

    urls: async (
      _parent: any,
      _args: any,
    ) => {
      return await getCustomUrls();
    },

    urlById: async (
      _parent: any,
      args: { id: number },
    ) => {
      return await getCustomUrlById(args.id);
    }
  },

  Mutation: {
    createUrl: async (
      _parent: any,
      args: { shortUrl: string, longUrl: string },
      { isAdmin }: ApolloContext) =>
      isAdmin(async () => {
        const res = await createCustomUrl(args.shortUrl, args.longUrl);
        return res;
      }),

    updateUrl: async (
      _parent: any,
      args: { id: number, newUrl: CustomUrlInput },
      { isAdmin }: ApolloContext) =>
      isAdmin(async () => {
        const res = await updateCustomUrl(args.id, args.newUrl)
        return res
      }),

    deleteUrl: async (
      _parent: any,
      args: { id: number },
      { isAdmin }: ApolloContext) =>
      isAdmin(async () => {
        await deleteCustomUrl(args.id);
        return (await getCustomUrls())[0];
      }),
  }
}

export default CustomUrlResolver