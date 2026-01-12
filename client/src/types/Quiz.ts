export enum QuizItemType {
  MultipleChoice = "MULTIPLE_CHOICE",
  Checkboxes = "CHECKBOXES",
  Text = "TEXT",
  YoutubeEmbed = "YOUTUBE_EMBED",
  ImageEmbed = "IMAGE_EMBED",
  PdfEmbed = "PDF_EMBED"
}

export interface Option {
  id: string;
  text: string;
  correct: boolean;
}

export interface QuizItem {
  id: string;
  type: QuizItemType;
  text: string;
  options?: Option[];
  correctAnswers?: number;
  hint?: string;
  affirmation?: string;
}

export interface Moduledraft {
  name: string;
  archived: boolean;
  quiz: QuizItem[];
}

export interface ReservationPrompt {
  promptText?: string;
  enabled: boolean;
}

export interface Module {
  id: number;
  name: string;
  archived: boolean;
  quiz: QuizItem[];
  reservationPrompt: ReservationPrompt;
  isLocked?: boolean;
  makerspaceID: number | null;
}

export interface Submission {
  id: number;
  moduleID: number;
  makerID: number;
  submissionDate: string;
  passed: boolean;
  expirationDate: string;
}
