import { localAuth, localDb } from "./localDatabase";

export const News = localDb.News;

export const Source = localDb.Source;

export const TelegramConfig = localDb.TelegramConfig;

export const WhatsAppConfig = localDb.WhatsAppConfig;

export const TeamsConfig = localDb.TeamsConfig;

export const EmailConfig = localDb.EmailConfig;

export const User = localAuth;
