# Send grouped Slack reminders for overdue Google Sheets tasks

Make late deliverables visible to their owners, then stop reminding them when the work is done.

A shared sheet can track deliverables well enough until the due dates pass. Then someone has to keep checking rows, find the right owner, and ask for updates. A blanket daily ping becomes noise quickly.

This example checks the sheet on a schedule, selects rows that are both overdue and incomplete, and sends the owner a grouped Slack reminder. When the completion cell changes, that task drops out of the next reminder.

## Set it up with a coding agent

Copy the setup prompt from [the article](https://automate.ax/articles/sheets-overdue-tasks) into your coding agent. The agent creates the Automate.ax project, asks for your choices, guides account authorization, checks the automation, and deploys it. You do not need to clone this repository yourself when using the prompt.

You'll choose:

- The spreadsheet, task tab, and its grid ID for links back to rows.
- Task ID, Task, Due Date, Complete, and Slack Conversation ID columns. The agent can add missing columns and help populate Slack IDs for owners.
- The reminder time zone; this example runs at 9 a.m. on weekdays.
- Account authorization for Google Sheets and Slack.

## Manual setup

If you prefer to set it up yourself:

```sh
git clone https://github.com/SentsCo/automate-ax-sheets-overdue-tasks.git
cd automate-ax-sheets-overdue-tasks
bun install
bunx automate.ax login
bunx automate.ax init
bun run typecheck
bunx automate.ax deploy
```

Connect the accounts requested by Automate.ax when you deploy. The platform stores credentials outside this repository. Set any project parameters requested by the automation, then review the read and write operations before turning it on.

## Check a run

Use a disposable sheet with two past-due rows and one completed row. Run the automation in a test Slack destination, confirm one digest contains only open items, then mark one row complete and run it again.

## Limits

- Dates should be unambiguous ISO dates; locale-formatted text and spreadsheet serial values need conversion before comparison.
- The code reads the first 1,000 rows and requires a Slack Conversation ID on each. Add pagination or a narrower sheet for larger task lists.
- A sheet is only as accurate as its Slack destinations and completion cells. The automation cannot infer whether work happened outside it.
- The scheduled run can overlap with a slow earlier run; choose a cadence and destination that tolerate an occasional repeated reminder.

The workflow responds to [a real problem described by a Google Sheets user’s overdue-task question](https://www.reddit.com/r/googlesheets/comments/teazxc). The public report informed the example; it is not an endorsement of this implementation.
