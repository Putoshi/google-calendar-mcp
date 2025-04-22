import { z } from "zod";

// カレンダーイベントの型定義
export type CalendarEvent = {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
    date?: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
    date?: string;
  };
  attendees?: Array<{
    email: string;
    responseStatus?: string;
  }>;
  location?: string;
  status?: string;
  created?: string;
  updated?: string;
  colorId?: string;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
};

// イベント一覧取得のパラメータ型
export type ListEventsParams = {
  calendarId: string;
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
  singleEvents?: boolean;
  orderBy?: "startTime" | "updated";
  q?: string;
};

// イベント作成のパラメータ型
export type CreateEventParams = {
  calendarId: string;
  event: CalendarEvent;
};

// イベント更新のパラメータ型
export type UpdateEventParams = {
  calendarId: string;
  eventId: string;
  event: CalendarEvent;
};

// イベント削除のパラメータ型
export type DeleteEventParams = {
  calendarId: string;
  eventId: string;
};

// カレンダー一覧取得のパラメータ型
export type ListCalendarsParams = {
  maxResults?: number;
  minAccessRole?: "freeBusyReader" | "reader" | "writer" | "owner";
};

// カレンダー作成のパラメータ型
export type CreateCalendarParams = {
  summary: string;
  description?: string;
  timeZone?: string;
};

// カレンダー更新のパラメータ型
export type UpdateCalendarParams = {
  calendarId: string;
  summary: string;
  description?: string;
  timeZone?: string;
};

// カレンダー削除のパラメータ型
export type DeleteCalendarParams = {
  calendarId: string;
};

// カレンダー設定の型定義
export type CalendarSettings = {
  timeZone: string;
  defaultReminders?: Array<{
    method: string;
    minutes: number;
  }>;
  notificationSettings?: {
    notifications: Array<{
      type: string;
      method: string;
    }>;
  };
};

// Google Calendar APIの型定義
export interface Schema$Calendar {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  timeZone?: string;
}

export interface Schema$CalendarListEntry {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  timeZone?: string;
  primary?: boolean;
  selected?: boolean;
  accessRole?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  hidden?: boolean;
  deleted?: boolean;
}

export interface Schema$Event {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
    date?: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
    date?: string;
  };
  attendees?: Array<{
    email: string;
    responseStatus?: string;
  }>;
  location?: string;
  status?: string;
  created?: string;
  updated?: string;
  colorId?: string;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: "email" | "popup";
      minutes: number;
    }>;
  };
}

export interface Schema$ColorDefinition {
  background: string;
  foreground: string;
}

export interface Schema$Colors {
  event?: {
    [key: string]: Schema$ColorDefinition;
  } | null;
}

export interface Schema$CalendarList {
  items?: Schema$CalendarListEntry[];
}

export interface Schema$FreeBusyResponse {
  calendars?: {
    [key: string]: {
      busy?: Array<{
        start: string;
        end: string;
      }>;
    };
  };
}

export interface Schema$Setting {
  id: string;
  value: string;
}

export interface Schema$Channel {
  id: string;
  resourceId: string;
  expiration?: number;
}

// Zodスキーマの定義
export const ListCalendarsArgumentsSchema = z.object({
  showHidden: z.boolean().optional(),
  showDeleted: z.boolean().optional(),
});

export const GetCalendarArgumentsSchema = z.object({
  calendarId: z.string(),
});

export const CreateCalendarArgumentsSchema = z.object({
  summary: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  timeZone: z.string().optional(),
});

export const UpdateCalendarArgumentsSchema = z.object({
  calendarId: z.string(),
  summary: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  timeZone: z.string().optional(),
});

export const DeleteCalendarArgumentsSchema = z.object({
  calendarId: z.string(),
});

export const ListEventsArgumentsSchema = z.object({
  calendarId: z.string(),
  timeMin: z.string().optional(),
  timeMax: z.string().optional(),
  maxResults: z.number().optional(),
  singleEvents: z.boolean().optional(),
  orderBy: z.enum(["startTime", "updated"]).optional(),
  q: z.string().optional(),
});

export const SearchEventsArgumentsSchema = z.object({
  calendarId: z.string(),
  query: z.string(),
  timeMin: z.string().optional(),
  timeMax: z.string().optional(),
});

export const CreateEventArgumentsSchema = z.object({
  calendarId: z.string(),
  event: z.object({
    summary: z.string(),
    description: z.string().optional(),
    start: z.string(),
    end: z.string(),
    timeZone: z.string(),
    attendees: z.array(z.object({ email: z.string() })).optional(),
    location: z.string().optional(),
    colorId: z.string().optional(),
    reminders: z
      .object({
        useDefault: z.boolean().optional(),
        overrides: z
          .array(
            z.object({
              method: z.string(),
              minutes: z.number(),
            })
          )
          .optional(),
      })
      .optional(),
    recurrence: z.array(z.string()).optional(),
  }),
});

export const UpdateEventArgumentsSchema = z.object({
  calendarId: z.string(),
  eventId: z.string(),
  event: z.object({
    summary: z.string().optional(),
    description: z.string().optional(),
    start: z.string().optional(),
    end: z.string().optional(),
    timeZone: z.string().optional(),
    attendees: z.array(z.object({ email: z.string() })).optional(),
    location: z.string().optional(),
    colorId: z.string().optional(),
    reminders: z
      .object({
        useDefault: z.boolean().optional(),
        overrides: z
          .array(
            z.object({
              method: z.string(),
              minutes: z.number(),
            })
          )
          .optional(),
      })
      .optional(),
    recurrence: z.array(z.string()).optional(),
  }),
});

export const DeleteEventArgumentsSchema = z.object({
  calendarId: z.string(),
  eventId: z.string(),
});

export const GetEventArgumentsSchema = z.object({
  calendarId: z.string(),
  eventId: z.string(),
});

export const GetColorsArgumentsSchema = z.object({});

export const GetFreeBusyArgumentsSchema = z.object({
  timeMin: z.string(),
  timeMax: z.string(),
  items: z.array(
    z.object({
      id: z.string(),
    })
  ),
});

export const GetSettingsArgumentsSchema = z.object({});

export const WatchEventsArgumentsSchema = z.object({
  calendarId: z.string(),
  address: z.string(),
  type: z.string(),
  token: z.string().optional(),
  expiration: z.number().optional(),
});

export const StopChannelArgumentsSchema = z.object({
  id: z.string(),
  resourceId: z.string(),
});

export const MoveEventArgumentsSchema = z.object({
  calendarId: z.string(),
  eventId: z.string(),
  destination: z.string(),
});

export const QuickAddEventArgumentsSchema = z.object({
  calendarId: z.string(),
  text: z.string(),
});

export const ImportEventArgumentsSchema = z.object({
  calendarId: z.string(),
  event: z.object({
    summary: z.string(),
    description: z.string().optional(),
    start: z.string(),
    end: z.string(),
    timeZone: z.string(),
    attendees: z.array(z.object({ email: z.string() })).optional(),
    location: z.string().optional(),
    colorId: z.string().optional(),
    reminders: z
      .object({
        useDefault: z.boolean().optional(),
        overrides: z
          .array(
            z.object({
              method: z.string(),
              minutes: z.number(),
            })
          )
          .optional(),
      })
      .optional(),
    recurrence: z.array(z.string()).optional(),
  }),
});

export const PatchEventArgumentsSchema = z.object({
  calendarId: z.string(),
  eventId: z.string(),
  event: z.object({
    summary: z.string().optional(),
    description: z.string().optional(),
    start: z.string().optional(),
    end: z.string().optional(),
    timeZone: z.string().optional(),
    attendees: z.array(z.object({ email: z.string() })).optional(),
    location: z.string().optional(),
    colorId: z.string().optional(),
    reminders: z
      .object({
        useDefault: z.boolean().optional(),
        overrides: z
          .array(
            z.object({
              method: z.string(),
              minutes: z.number(),
            })
          )
          .optional(),
      })
      .optional(),
    recurrence: z.array(z.string()).optional(),
  }),
});

export const PatchCalendarArgumentsSchema = z.object({
  calendarId: z.string(),
  summary: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  timeZone: z.string().optional(),
});

export const ClearCalendarArgumentsSchema = z.object({
  calendarId: z.string(),
});
