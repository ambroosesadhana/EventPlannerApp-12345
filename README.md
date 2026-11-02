# Event Planner App

**Name:** Ambroose Sadhana
**Index No:** JF/ICT/25/O1
**Module:** Mobile Application Development (K72T001M15) — Individual Self-Study Project

## App Description

Event Planner is a React Native (Expo) mobile app that helps a user create, organise and be
reminded of their events. Events are stored on the device, so the app works fully offline.

## Features Implemented

| # | Feature | Details |
|---|---------|---------|
| 1 | Create event | Name, date, time, description with input validation (required name, length limits, date must be in the future, reminder must be in the future) |
| 2 | View upcoming events | List sorted by date/time; past events are shown in a separate, collapsible "Past events" section |
| 3 | Edit / delete event | Update any detail; confirmation dialog before deleting |
| 4 | Search | Search by event name or by date (`2026-11-05`, `05/11/2026`, `5 Nov`, `November 2026`) |
| 5 | Reminders | Choose a reminder (at event time, 5/15/30 min, 1 hour, 1 day before); a local notification is scheduled, rescheduled on edit and cancelled on delete |

Extra: empty states for every list, notification permission request (Android 13+), tapping a
notification opens that event, colourful event cards with "In 2 days" style badges.

## Tools / Technologies Used

- React Native with Expo, written in JavaScript, edited in Visual Studio Code
- React Navigation (native stack)
- `@react-native-async-storage/async-storage` — local data storage
- `expo-notifications` — local reminder notifications
- `@react-native-community/datetimepicker` — date and time pickers
- Git and GitHub

## Project Structure

```
App.js                      Navigation + notification setup
src/
  theme.js                  Colours and shared styles
  components/
    EventCard.js            One row in the events list
    EmptyState.js           "Nothing here yet" message
  screens/
    HomeScreen.js           Search, upcoming list, past section
    EventFormScreen.js      Create / edit form with validation
    EventDetailScreen.js    Details, edit, delete (with confirm)
  utils/
    storage.js              AsyncStorage save / load
    notifications.js        Permission, schedule and cancel reminders
    validation.js           Form validation rules
    dateUtils.js            Date formatting and search helpers
```

## How to Run the App

Requirements: Node.js (LTS), VS Code, and an Android phone with the **Expo Go** app
(or an Android emulator).

```bash
# 1. Clone this repository
git clone https://github.com/ambroosesadhana/EventPlannerApp-JF-ICT-25-O1.git
cd EventPlannerApp-JF-ICT-25-O1

# 2. Install dependencies
npm install

# 3. Start the app
npx expo start
```

Scan the QR code with Expo Go (the phone and laptop must be on the same Wi-Fi), or press `a`
to open an Android emulator. If the phone cannot connect, use a phone hotspot.

> Note: remote push notifications are not available in Expo Go. This app only uses **local**
> notifications, which work in Expo Go.

## Screenshots

| Home | Create event | Event details | Search | Reminder notification |
|---|---|---|---|---|
| ![Home](screenshots/home.png) | ![Create](screenshots/create.png) | ![Details](screenshots/details.png) | ![Search](screenshots/search.png) | ![Notification](screenshots/notification.png) |

## Testing

| # | Test case | Steps | Expected result | Result |
|---|-----------|-------|-----------------|--------|
| 1 | Empty name | Leave name blank, tap Create | Error "Event name is required." | Pass / Fail |
| 2 | Past date | Choose a past date/time, tap Create | Error "must be in the future" | Pass / Fail |
| 3 | Create valid event | Fill all fields, tap Create | Event appears in Upcoming list | Pass / Fail |
| 4 | Sorting | Create events in random order | List is sorted by date/time (earliest first) | Pass / Fail |
| 5 | Past events | Wait for an event time to pass | Event moves to "Past events" section | Pass / Fail |
| 6 | Edit event | Open event → Edit → change time → Save | Updated details shown, old reminder replaced | Pass / Fail |
| 7 | Delete cancel | Open event → Delete → Cancel | Event is kept | Pass / Fail |
| 8 | Delete confirm | Open event → Delete → Delete | Event removed, reminder cancelled | Pass / Fail |
| 9 | Search by name | Type part of a name | Only matching events shown | Pass / Fail |
| 10 | Search by date | Type `2026-11-05` or `5 Nov` | Only events on that date shown | Pass / Fail |
| 11 | No results | Search for text that matches nothing | "No matching events" message | Pass / Fail |
| 12 | Empty app | First launch with no events | "No events yet" empty state | Pass / Fail |
| 13 | Reminder fires | Create event with a reminder a few minutes ahead | Notification shown at that time | Pass |
| 14 | Permission denied | Deny notification permission | Event saved, message explains reminder is off | Pass / Fail |