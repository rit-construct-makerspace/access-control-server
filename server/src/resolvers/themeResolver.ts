import { ApolloContext } from "../context.js";
import { ThemeRow } from "../db/tables.js";
import * as ThemeRepo from "../repositories/SiteSettings/ThemesRepository.js";

const ThemeResolver = {
  Theme: {
    key: (
      parent: ThemeRow,
      _args: any,
      { isAdmin }: ApolloContext
    ) => isAdmin((_user) => (
      `${parent.id}`
    )),

    muiThemeOptions: (
      parent: ThemeRow,
      _args: any,
      { isAdmin }: ApolloContext
    ) => isAdmin((_user) => (
      JSON.stringify(parent.muiThemeOptions)
    ))
  },

  Query: {
    getThemes: async (
      _parent: any,
      _args: any,
      { isAdmin }: ApolloContext
    ) => isAdmin((_user) => (
      ThemeRepo.getThemes()
    )),

    getTheme: async (
      _parent: any,
      args: {
        key: string
      },
      { isAdmin }: ApolloContext
    ) => isAdmin(async (_user) => (
      await ThemeRepo.getThemeByID(Number(args.key))
    ))
  },

  Mutation: {
    createTheme: async (
      _parent: any,
      args: {
        themeName: string,
        title: string,
        muiThemeOptions: string, // accept as a string, parse to object
        logo: string
      },
      { isAdmin }: ApolloContext
    ) => isAdmin((_user) => (
      ThemeRepo.createNewTheme(args.themeName, args.title, JSON.parse(args.muiThemeOptions), args.logo)
    )),

    updateTheme: async (
      _parent: any,
      args: {
        key: string,
        themeName: string,
        title: string,
        muiThemeOptions: string, // accept as a string, parse to object
        logo: string
      },
      { isAdmin }: ApolloContext
    ) => isAdmin((_user) => (
      ThemeRepo.updateTheme(Number(args.key), args.themeName, args.title, JSON.parse(args.muiThemeOptions), args.logo)
    ))
  }
};

export default ThemeResolver;