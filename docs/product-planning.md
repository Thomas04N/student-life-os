# Product Planning Notes

## Deferred: Modules And Subjects

Hold off on fully implementing modules and subjects until the MSc module list is confirmed.

The eventual feature should let study sessions, notes, goals, and analytics connect to a specific academic subject or module. This will make the existing productivity area more useful without needing to redesign the study tracking system later.

Suggested module model:

- `name`: display name, such as "Research Methods"
- `code`: optional module code
- `color`: visual identifier for charts and filters
- `term`: optional semester or academic term
- `archived`: hide old modules without deleting historical study data

Suggested study session updates:

- Allow each focus session to optionally link to a module.
- Allow notes and the "What did I study?" field to be filtered by module.
- Add module breakdowns to total study time, weekly charts, best study days, and completion rate.
- Keep the module link optional so general study, career, admin, and personal sessions still work.

## Next Section: Calendar Planning

The calendar section should turn the app from a tracker into a planning tool. It should connect naturally to tasks, study sessions, daily goals, weekly study data, and later modules.

### GitHub Issue Draft

Title: Build calendar planning section

Goal:

Create a calendar area for planning university, career, personal, and admin commitments. The first version should focus on manually created events and study blocks, with future support for module-linked lectures, assignment deadlines, and exams.

Core features:

- Calendar page with week and month views.
- Add, edit, and delete calendar events.
- Event categories: University, Career, Personal, Admin, Study.
- Support timed events and all-day events.
- Create planned study blocks that can later connect to pomodoro/focus sessions.
- Show upcoming events on a compact dashboard panel.
- Allow events to have title, date, start time, end time, category, notes, and optional location.
- Use clear category colors that match or complement the existing task categories.

Nice-to-have features:

- Day view for detailed planning.
- Drag and drop event rescheduling.
- Recurring events for lectures, seminars, work, habits, or weekly admin.
- Deadline type for assignments and exams.
- Reminders or visual urgency states for upcoming deadlines.
- Link events to tasks.
- Link events to modules once module data exists.
- Compare planned study time with completed focus sessions.

Data model ideas:

- `CalendarEvent`
- `id`
- `title`
- `category`
- `startDateTime`
- `endDateTime`
- `isAllDay`
- `notes`
- `location`
- `linkedTaskId`
- `linkedModuleId`
- `recurrenceRule`
- `createdAt`
- `updatedAt`

Acceptance criteria:

- A user can view a calendar from the app navigation.
- A user can create, edit, and delete an event.
- A user can switch between week and month views.
- Events are visibly grouped by category.
- Upcoming events are shown somewhere useful outside the full calendar view.
- The implementation leaves room for module-linked events without requiring modules to exist yet.

Suggested branch name:

`feature/calendar-planning`
