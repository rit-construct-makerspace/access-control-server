export enum AnnouncementItemType {
    Text = "TEXT"
  }
  
  export interface AnnouncementInput {
    title: string;
    description: string;
  }
  
  export interface Announcement {
    id: number;
    title: string;
    description: string;
  }
  
  export interface Post {
    id: number;
    postDate: string;
    expDate: string;
  }
  