import { automation, each, onSchedule, transform } from "automate.ax"
import { googleSheets } from "automate.ax/google-sheets"
import { slack } from "automate.ax/slack"
import { z } from "zod"

export default automation(
  "Remind owners about overdue sheet tasks",
  {
    parameters: [
      { label: "Google spreadsheet ID", name: "spreadsheetId", type: "text" },
      { label: "Tasks sheet name", name: "sheetName", type: "text" },
      { label: "Tasks sheet grid ID", name: "sheetGridId", type: "text" },
      { label: "Reminder time zone", name: "timeZone", type: "text" },
    ],
  },
  ({ parameters }) => {
    const tick = onSchedule({
      schedule: "0 9 * * 1-5",
      timeZone: parameters.timeZone,
    })
    const rows = googleSheets.listRows({
      spreadsheet: parameters.spreadsheetId,
      source: { sheet: parameters.sheetName, headerRow: 1 },
      limit: 1000,
    })

    const digests = transform([rows, tick], (taskRows, { scheduledAt }) => {
      const dateParts = new Intl.DateTimeFormat("en-US", {
        timeZone: parameters.timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(scheduledAt)
      const part = (type: string) =>
        dateParts.find((value) => value.type === type)?.value ?? ""
      const today = `${part("year")}-${part("month")}-${part("day")}`

      const overdue = taskRows.flatMap(({ rowNumber, values }) => {
        const task = z
          .object({
            "Task ID": z.string().min(1),
            Task: z.string().min(1),
            "Due Date": z.iso.date(),
            Complete: z.boolean().nullable(),
            "Slack Conversation ID": z.string().min(1),
          })
          .parse(values)
        return task.Complete === true || task["Due Date"] >= today
          ? []
          : [{ ...task, rowNumber }]
      })

      const byOwner = Object.groupBy(
        overdue,
        (task) => task["Slack Conversation ID"],
      )
      return Object.entries(byOwner).map(([conversation, tasks]) => ({
        conversation,
        text: `Overdue tasks:\n${(tasks ?? [])
          .map(
            (task) =>
              `• ${task.Task} (due ${task["Due Date"]}; ID ${task["Task ID"]}) — https://docs.google.com/spreadsheets/d/${parameters.spreadsheetId}/edit#gid=${parameters.sheetGridId}&range=A${task.rowNumber}`,
          )
          .join("\n")}`,
      }))
    })

    each(digests, (digest) =>
      slack.sendMessage({
        conversation: digest.conversation,
        text: digest.text,
      }),
    )
  },
)
