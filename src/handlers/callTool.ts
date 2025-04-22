import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import type { calendar_v3 } from "googleapis";
import {
  ListEventsArgumentsSchema,
  SearchEventsArgumentsSchema,
  CreateEventArgumentsSchema,
  UpdateEventArgumentsSchema,
  DeleteEventArgumentsSchema,
  GetEventArgumentsSchema,
  ListCalendarsArgumentsSchema,
  GetCalendarArgumentsSchema,
  CreateCalendarArgumentsSchema,
  UpdateCalendarArgumentsSchema,
  DeleteCalendarArgumentsSchema,
  GetColorsArgumentsSchema,
  GetFreeBusyArgumentsSchema,
  GetSettingsArgumentsSchema,
  WatchEventsArgumentsSchema,
  StopChannelArgumentsSchema,
  MoveEventArgumentsSchema,
  QuickAddEventArgumentsSchema,
  ImportEventArgumentsSchema,
  PatchEventArgumentsSchema,
  PatchCalendarArgumentsSchema,
  ClearCalendarArgumentsSchema,
  Schema$Calendar,
  Schema$Event,
  Schema$Colors,
  Schema$FreeBusyResponse,
  Schema$Setting,
  Schema$Channel,
} from "../types/calendar.js";
import {
  listCalendars,
  listEvents,
  searchEvents,
  listColors,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../services/googleCalendar.js";
import { z } from "zod";

const calendar = google.calendar("v3");

/**
 * Formats a list of calendars into a user-friendly string.
 */
function formatCalendarList(calendars: Schema$Calendar[]): string {
  return calendars
    .map((cal) => `${cal.summary || "Untitled"} (${cal.id || "no-id"})`)
    .join("\n");
}

/**
 * Formats a list of events into a user-friendly string.
 */
function formatEventList(events: Schema$Event[]): string {
  return events
    .map((event) => {
      const attendeeList = event.attendees
        ? `\nAttendees: ${event.attendees
            .map(
              (a: { email: string; responseStatus?: string }) =>
                `${a.email || "no-email"} (${a.responseStatus || "unknown"})`
            )
            .join(", ")}`
        : "";
      const locationInfo = event.location
        ? `\nLocation: ${event.location}`
        : "";
      const colorInfo = event.colorId ? `\nColor ID: ${event.colorId}` : "";
      const reminderInfo = event.reminders
        ? `\nReminders: ${
            event.reminders.useDefault
              ? "Using default"
              : (event.reminders.overrides || [])
                  .map(
                    (r: { method: string; minutes: number }) =>
                      `${r.method} ${r.minutes} minutes before`
                  )
                  .join(", ") || "None"
          }`
        : "";
      return `${event.summary || "Untitled"} (${
        event.id || "no-id"
      })${locationInfo}\nStart: ${
        event.start?.dateTime || event.start?.date || "unspecified"
      }\nEnd: ${
        event.end?.dateTime || event.end?.date || "unspecified"
      }${attendeeList}${colorInfo}${reminderInfo}\n`;
    })
    .join("\n");
}

/**
 * Formats the color information into a user-friendly string.
 */
function formatColorList(colors: Schema$Colors): string {
  const eventColors = colors.event || {};
  return Object.entries(eventColors)
    .map(
      ([id, colorInfo]: [string, { background: string; foreground: string }]) =>
        `Color ID: ${id} - ${colorInfo.background} (background) / ${colorInfo.foreground} (foreground)`
    )
    .join("\n");
}

/**
 * Formats a calendar into a user-friendly string.
 */
function formatCalendar(calendar: Schema$Calendar): string {
  return `${calendar.summary || "Untitled"} (${calendar.id || "no-id"})\n${
    calendar.description || "No description"
  }\nTime Zone: ${calendar.timeZone || "Not specified"}\nLocation: ${
    calendar.location || "Not specified"
  }`;
}

/**
 * Formats free/busy information into a user-friendly string.
 */
function formatFreeBusy(freeBusy: Schema$FreeBusyResponse): string {
  return Object.entries(freeBusy.calendars || {})
    .map(([calendarId, calendar]) => {
      const busy = calendar.busy || [];
      return `${calendarId}:\n${busy
        .map((period) => `Busy from ${period.start} to ${period.end}`)
        .join("\n")}`;
    })
    .join("\n\n");
}

/**
 * Formats settings into a user-friendly string.
 */
function formatSettings(settings: Schema$Setting[]): string {
  return settings
    .map((setting) => `${setting.id}: ${setting.value}`)
    .join("\n");
}

/**
 * Formats a watch response into a user-friendly string.
 */
function formatWatch(watch: Schema$Channel): string {
  return `Watch started with ID: ${watch.id}\nResource ID: ${
    watch.resourceId
  }\nExpiration: ${new Date(watch.expiration || 0).toLocaleString()}`;
}

/**
 * Formats an event into a user-friendly string.
 */
function formatEvent(event: Schema$Event): string {
  return `${event.summary || "Untitled"} (${event.id || "no-id"})\n${
    event.description || "No description"
  }\nStart: ${
    event.start?.dateTime || event.start?.date || "unspecified"
  }\nEnd: ${
    event.end?.dateTime || event.end?.date || "unspecified"
  }\nLocation: ${event.location || "Not specified"}\nColor ID: ${
    event.colorId || "Not specified"
  }`;
}

function convertGoogleCalendarToSchema$Calendar(
  calendar: calendar_v3.Schema$Calendar
): Schema$Calendar {
  return {
    id: calendar.id ?? undefined,
    summary: calendar.summary ?? "",
    description: calendar.description ?? undefined,
    location: calendar.location ?? undefined,
    timeZone: calendar.timeZone ?? undefined,
  };
}

function convertGoogleEventToSchema$Event(
  event: calendar_v3.Schema$Event
): Schema$Event {
  return {
    id: event.id ?? undefined,
    summary: event.summary ?? "",
    description: event.description ?? undefined,
    start: {
      dateTime: event.start?.dateTime ?? "",
      timeZone: event.start?.timeZone ?? "",
      date: event.start?.date ?? undefined,
    },
    end: {
      dateTime: event.end?.dateTime ?? "",
      timeZone: event.end?.timeZone ?? "",
      date: event.end?.date ?? undefined,
    },
    attendees: event.attendees?.map((attendee) => ({
      email: attendee.email ?? "",
      responseStatus: attendee.responseStatus ?? undefined,
    })),
    location: event.location ?? undefined,
    status: event.status ?? undefined,
    created: event.created ?? undefined,
    updated: event.updated ?? undefined,
    colorId: event.colorId ?? undefined,
    reminders: event.reminders
      ? {
          useDefault: event.reminders.useDefault ?? false,
          overrides: event.reminders.overrides?.map((override) => ({
            method: override.method as "email" | "popup",
            minutes: override.minutes ?? 0,
          })),
        }
      : undefined,
  };
}

function convertGoogleColorsToSchema$Colors(
  colors: calendar_v3.Schema$Colors
): Schema$Colors {
  return {
    event: colors.event
      ? Object.fromEntries(
          Object.entries(colors.event).map(([key, value]) => [
            key,
            {
              background: (value as { background?: string })?.background ?? "",
              foreground: (value as { foreground?: string })?.foreground ?? "",
            },
          ])
        )
      : null,
  };
}

function convertGoogleFreeBusyToSchema$FreeBusyResponse(
  freeBusy: calendar_v3.Schema$FreeBusyResponse
): Schema$FreeBusyResponse {
  return {
    calendars: freeBusy.calendars
      ? Object.fromEntries(
          Object.entries(freeBusy.calendars).map(([key, value]) => [
            key,
            {
              busy: value.busy?.map((busy) => ({
                start: busy.start ?? "",
                end: busy.end ?? "",
              })),
            },
          ])
        )
      : undefined,
  };
}

function convertGoogleSettingToSchema$Setting(
  setting: calendar_v3.Schema$Setting
): Schema$Setting {
  return {
    id: setting.id || "",
    value: setting.value || "",
  };
}

function convertGoogleChannelToSchema$Channel(
  channel: calendar_v3.Schema$Channel
): Schema$Channel {
  return {
    id: channel.id || "",
    resourceId: channel.resourceId || "",
    expiration: channel.expiration ? Number(channel.expiration) : undefined,
  };
}

/**
 * Handles incoming tool calls, validates arguments, calls the appropriate service,
 * and formats the response.
 *
 * @param request The CallToolRequest containing tool name and arguments.
 * @param oauth2Client The authenticated OAuth2 client instance.
 * @returns A Promise resolving to the CallToolResponse.
 */
export async function handleCallTool(
  request: typeof CallToolRequestSchema._type,
  oauth2Client: OAuth2Client
) {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list-calendars": {
        const { showHidden = false, showDeleted = false } =
          request.params.arguments || {};
        const calendarList = await calendar.calendarList.list(
          {
            showHidden: showHidden as boolean,
            showDeleted: showDeleted as boolean,
            fields:
              "items(id,summary,description,location,timeZone,primary,selected,accessRole,backgroundColor,foregroundColor,hidden,deleted)",
          },
          {}
        );
        return {
          calendars:
            calendarList.data.items?.map((calendar: any) => ({
              id: calendar.id,
              summary: calendar.summary,
              description: calendar.description,
              location: calendar.location,
              timeZone: calendar.timeZone,
              isPrimary: calendar.primary,
              isSelected: calendar.selected,
              accessRole: calendar.accessRole,
              backgroundColor: calendar.backgroundColor,
              foregroundColor: calendar.foregroundColor,
              isHidden: calendar.hidden,
              isDeleted: calendar.deleted,
            })) || [],
        };
      }

      case "list-events": {
        const validArgs = ListEventsArgumentsSchema.parse(args);
        const events = await listEvents(oauth2Client, validArgs);
        return {
          content: [
            {
              type: "text",
              text: formatEventList(
                events.map(convertGoogleEventToSchema$Event)
              ),
            },
          ],
        };
      }

      case "search-events": {
        const validArgs = SearchEventsArgumentsSchema.parse(args);
        const events = await searchEvents(oauth2Client, validArgs);
        return {
          content: [
            {
              type: "text",
              text: formatEventList(
                events.map(convertGoogleEventToSchema$Event)
              ),
            },
          ],
        };
      }

      case "list-colors": {
        const colors = await listColors(oauth2Client);
        return {
          content: [
            {
              type: "text",
              text: `Available event colors:\n${formatColorList(
                convertGoogleColorsToSchema$Colors(colors)
              )}`,
            },
          ],
        };
      }

      case "create-event": {
        const validArgs = CreateEventArgumentsSchema.parse(args);
        const event = await createEvent(oauth2Client, {
          ...validArgs.event,
          calendarId: validArgs.calendarId,
          timeZone: validArgs.event.timeZone,
          reminders: validArgs.event.reminders
            ? {
                ...validArgs.event.reminders,
                useDefault: validArgs.event.reminders.useDefault ?? false,
                overrides: validArgs.event.reminders.overrides?.map(
                  (override) => ({
                    ...override,
                    method: override.method as "email" | "popup",
                  })
                ),
              }
            : undefined,
        });
        return {
          content: [
            {
              type: "text",
              text: `Event created: ${event.summary} (${event.id})`,
            },
          ],
        };
      }

      case "update-event": {
        const validArgs = UpdateEventArgumentsSchema.parse(args);
        const event = await updateEvent(oauth2Client, {
          ...validArgs.event,
          calendarId: validArgs.calendarId,
          eventId: validArgs.eventId,
          timeZone: validArgs.event.timeZone || "UTC",
          reminders: validArgs.event.reminders
            ? {
                ...validArgs.event.reminders,
                useDefault: validArgs.event.reminders.useDefault ?? false,
                overrides: validArgs.event.reminders.overrides?.map(
                  (override) => ({
                    ...override,
                    method: override.method as "email" | "popup",
                  })
                ),
              }
            : undefined,
        });
        return {
          content: [
            {
              type: "text",
              text: `Event updated: ${event.summary} (${event.id})`,
            },
          ],
        };
      }

      case "delete-event": {
        const validArgs = DeleteEventArgumentsSchema.parse(args);
        await deleteEvent(oauth2Client, validArgs);
        return {
          content: [
            {
              type: "text",
              text: `Event deleted successfully`,
            },
          ],
        };
      }

      case "get-calendar": {
        const validArgs = GetCalendarArgumentsSchema.parse(args);
        const response = await calendar.calendars.get({
          calendarId: validArgs.calendarId,
        });
        return {
          content: [
            {
              type: "text",
              text: formatCalendar(
                convertGoogleCalendarToSchema$Calendar(response.data)
              ),
            },
          ],
        };
      }

      case "create-calendar": {
        const validArgs = CreateCalendarArgumentsSchema.parse(args);
        const response = await calendar.calendars.insert({
          requestBody: {
            summary: validArgs.summary,
            description: validArgs.description,
            location: validArgs.location,
            timeZone: validArgs.timeZone,
          },
        });
        return {
          content: [
            {
              type: "text",
              text: formatCalendar(
                convertGoogleCalendarToSchema$Calendar(response.data)
              ),
            },
          ],
        };
      }

      case "update-calendar": {
        const validArgs = UpdateCalendarArgumentsSchema.parse(args);
        const response = await calendar.calendars.update({
          calendarId: validArgs.calendarId,
          requestBody: {
            summary: validArgs.summary,
            description: validArgs.description,
            location: validArgs.location,
            timeZone: validArgs.timeZone,
          },
        });
        return {
          content: [
            {
              type: "text",
              text: formatCalendar(
                convertGoogleCalendarToSchema$Calendar(response.data)
              ),
            },
          ],
        };
      }

      case "delete-calendar": {
        const validArgs = DeleteCalendarArgumentsSchema.parse(args);
        await calendar.calendars.delete({
          calendarId: validArgs.calendarId,
        });
        return {
          content: [
            {
              type: "text",
              text: "カレンダーを削除しました",
            },
          ],
        };
      }

      case "get-colors": {
        const validArgs = GetColorsArgumentsSchema.parse(args);
        const response = await calendar.colors.get();
        return {
          content: [
            {
              type: "text",
              text: `Available event colors:\n${formatColorList(
                convertGoogleColorsToSchema$Colors(response.data)
              )}`,
            },
          ],
        };
      }

      case "get-free-busy": {
        const validArgs = GetFreeBusyArgumentsSchema.parse(args);
        const response = await calendar.freebusy.query({
          requestBody: {
            timeMin: validArgs.timeMin,
            timeMax: validArgs.timeMax,
            items: validArgs.items,
          },
        });
        return {
          content: [
            {
              type: "text",
              text: formatFreeBusy(
                convertGoogleFreeBusyToSchema$FreeBusyResponse(response.data)
              ),
            },
          ],
        };
      }

      case "get-settings": {
        const validArgs = GetSettingsArgumentsSchema.parse(args);
        const response = await calendar.settings.list();
        return {
          content: [
            {
              type: "text",
              text: formatSettings(
                (response.data.items || []).map(
                  convertGoogleSettingToSchema$Setting
                )
              ),
            },
          ],
        };
      }

      case "watch-events": {
        const validArgs = WatchEventsArgumentsSchema.parse(args);
        const response = await calendar.events.watch({
          calendarId: validArgs.calendarId,
          requestBody: {
            address: validArgs.address,
            type: validArgs.type,
            token: validArgs.token,
            expiration: validArgs.expiration?.toString(),
          },
        });
        return {
          content: [
            {
              type: "text",
              text: formatWatch(
                convertGoogleChannelToSchema$Channel(response.data)
              ),
            },
          ],
        };
      }

      case "stop-channel": {
        const validArgs = StopChannelArgumentsSchema.parse(args);
        await calendar.channels.stop({
          requestBody: {
            id: validArgs.id,
            resourceId: validArgs.resourceId,
          },
        });
        return {
          content: [
            {
              type: "text",
              text: "チャンネルを停止しました",
            },
          ],
        };
      }

      case "move-event": {
        const validArgs = MoveEventArgumentsSchema.parse(args);
        const response = await calendar.events.move({
          calendarId: validArgs.calendarId,
          eventId: validArgs.eventId,
          destination: validArgs.destination,
        });
        return {
          content: [
            {
              type: "text",
              text: formatEvent(
                convertGoogleEventToSchema$Event(response.data)
              ),
            },
          ],
        };
      }

      case "quick-add-event": {
        const validArgs = QuickAddEventArgumentsSchema.parse(args);
        const response = await calendar.events.quickAdd({
          calendarId: validArgs.calendarId,
          text: validArgs.text,
        });
        return {
          content: [
            {
              type: "text",
              text: formatEvent(
                convertGoogleEventToSchema$Event(response.data)
              ),
            },
          ],
        };
      }

      case "import-event": {
        const validArgs = ImportEventArgumentsSchema.parse(args);
        const response = await calendar.events.import({
          calendarId: validArgs.calendarId,
          requestBody: {
            ...validArgs.event,
            start: {
              dateTime: validArgs.event.start,
              timeZone: validArgs.event.timeZone,
            },
            end: {
              dateTime: validArgs.event.end,
              timeZone: validArgs.event.timeZone,
            },
          },
        });
        return {
          content: [
            {
              type: "text",
              text: formatEvent(
                convertGoogleEventToSchema$Event(response.data)
              ),
            },
          ],
        };
      }

      case "patch-event": {
        const validArgs = PatchEventArgumentsSchema.parse(args);
        const response = await calendar.events.patch({
          calendarId: validArgs.calendarId,
          eventId: validArgs.eventId,
          requestBody: {
            ...validArgs.event,
            start: validArgs.event.start
              ? {
                  dateTime: validArgs.event.start,
                  timeZone: validArgs.event.timeZone,
                }
              : undefined,
            end: validArgs.event.end
              ? {
                  dateTime: validArgs.event.end,
                  timeZone: validArgs.event.timeZone,
                }
              : undefined,
          },
        });
        return {
          content: [
            {
              type: "text",
              text: formatEvent(
                convertGoogleEventToSchema$Event(response.data)
              ),
            },
          ],
        };
      }

      case "patch-calendar": {
        const validArgs = PatchCalendarArgumentsSchema.parse(args);
        const response = await calendar.calendars.patch({
          calendarId: validArgs.calendarId,
          requestBody: {
            summary: validArgs.summary,
            description: validArgs.description,
            location: validArgs.location,
            timeZone: validArgs.timeZone,
          },
        });
        return {
          content: [
            {
              type: "text",
              text: formatCalendar(
                convertGoogleCalendarToSchema$Calendar(response.data)
              ),
            },
          ],
        };
      }

      case "clear-calendar": {
        const validArgs = ClearCalendarArgumentsSchema.parse(args);
        await calendar.calendars.clear({
          calendarId: validArgs.calendarId,
        });
        return {
          content: [
            {
              type: "text",
              text: "カレンダーをクリアしました",
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: unknown) {
    console.error(`Error executing tool '${name}':`, error);
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid arguments: ${error.message}`);
    }
    throw error;
  }
}
