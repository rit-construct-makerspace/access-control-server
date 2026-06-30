/**
 * announcementsResolver.ts
 * GraphQL Endpoint Implementations for Announcements
 */

import { ApolloContext } from "../../context.js";
import { getAnnouncements, getAnnouncementByID, createAnnouncement, updateAnnouncement, deleteAnnouncement } from "../../database/repositories/Announcements/AnnouncementsRepository.js";

const AnnouncementsResolver = {

  Query: {
    /**
     * Fetch all announcements
     * @returns all Announcements
     * @throws GraphQLError if not authenticated
     */
    getAllAnnouncements: async (
      _parent: any,
      _args: any,
    ) => {
      return await getAnnouncements();
    },

    /**
     * Fetch Announcement by ID
     * @argument id ID of announcement
     * @returns Announcement
     */
    getAnnouncement: async (
      _parent: any,
      args: { id: number },
      { isAdmin }: ApolloContext) =>
      isAdmin(async () => {
        return await getAnnouncementByID(args.id)
      })
  },

  Mutation: {
    /**
     * Create an Announcement
     * @argument title Announcement header
     * @argument description Announcement body
     * @argument linkText Link text
     * @argument linkUrl Link URL
     * @returns new Announcement
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    createAnnouncement: async (
      _parent: any,
      args: { title: string, description: string, linkText: string, linkUrl: string },
      { isAdmin }: ApolloContext) =>
      isAdmin(async () => {
        return await createAnnouncement(args);
      }),

    /**
     * Modify an Announcement
     * @argument id ID of announcement to modify
     * @argument title New Announcement header
     * @argument description New Announcement body
     * @argument linkText New link text
     * @argument linkUrl New link URL
     * @returns new Announcement
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    updateAnnouncement: async (
      _parent: any,
      args: { id: number, title: string, description: string, linkText: string, linkUrl: string },
      { isAdmin }: ApolloContext) =>
      isAdmin(async () => {
        return await updateAnnouncement(args);
      }),

    /**
     * Delete an Announcement
     * @argument id ID of announcement to delete
     * @returns true
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    deleteAnnouncement: async (
      _parent: any,
      args: { id: number },
      { isAdmin }: ApolloContext) =>
      isAdmin(async () => {
        return await deleteAnnouncement(args.id);
      }),

  }
};

export default AnnouncementsResolver;