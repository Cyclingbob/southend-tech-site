const fs = require("fs")

function getNthWeekdayOfMonth(year, month, weekday, n) {
    const firstDay = new Date(year, month, 1);
    const firstWeekdayOffset = (7 + weekday - firstDay.getDay()) % 7;
    const date = 1 + firstWeekdayOffset + (n - 1) * 7;

    return new Date(year, month, date);
}

function getNextWeekday(fromDate, dayNumber) {
  const date = new Date(fromDate);
  const day = date.getDay(); // 0 = Sunday, 4 = Thursday for example

  const diff = (dayNumber - day + 7) % 7;
  date.setDate(date.getDate() + diff);

  return date;
}

function getWeekdayNumber(dayName) {
    const days = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6
    };

    return days[dayName];
}

function getUkDate(date) {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/London",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false
    }).formatToParts(date);

    const values = Object.fromEntries(
        parts.filter(p => p.type !== "literal").map(p => [p.type, p.value])
    );

    return new Date(
        values.year,
        values.month - 1,
        values.day,
        values.hour,
        values.minute,
        values.second
    );
}

function formatUkDate(dateInput) {
    const date = new Date(dateInput);

    // Convert to UK time explicitly
    const ukDate = getUkDate(date)

    const days = [
        "Sunday", "Monday", "Tuesday", "Wednesday",
        "Thursday", "Friday", "Saturday"
    ];

    const months = [
        "January", "February", "March", "April",
        "May", "June", "July", "August",
        "September", "October", "November", "December"
    ];

    const dayName = days[ukDate.getDay()];
    const dayNumber = ukDate.getDate();
    const monthName = months[ukDate.getMonth()];
    const year = ukDate.getFullYear();

    function getOrdinal(n) {
        if (n > 3 && n < 21) return "th";
        switch (n % 10) {
            case 1: return "st";
            case 2: return "nd";
            case 3: return "rd";
            default: return "th";
        }
    }

    return `${dayName} ${dayNumber}${getOrdinal(dayNumber)} ${monthName} ${year} at ${date.getHours()}:${date.getMinutes() < 10 ? date.getMinutes().toString() + "0" : date.getMinutes().toString()}`;
}

function getNextEvents(file){
    const contents = fs.readFileSync(file, "utf-8");
    const parsed = JSON.parse(contents);
    let events = [];

    let now = new Date();

    for(const event of parsed){
        if (event.timing.reccurring) {

            const weekday = getWeekdayNumber(event.timing.day);
            const weekNo = parseInt(event.timing.week_nos);

            let year = now.getFullYear();
            let month = now.getMonth();

            let eventDate;
            if(event.timing.every === "month"){
                eventDate = getNthWeekdayOfMonth(year, month, weekday, weekNo);
            } else {
                eventDate = getNextWeekday(new Date(), weekNo);
            }

            // If this month's event already passed, move to next month
            if (eventDate < now && event.timing.every === "month") {
                month += 1;

                if (month > 11) {
                    month = 0;
                    year += 1;
                }

                eventDate = getNthWeekdayOfMonth(year, month, weekday, weekNo);
            }

            // Add start time
            const startHour = parseInt(event.timing.start_time.slice(0, 2));
            const startMinute = parseInt(event.timing.start_time.slice(2, 4));

            eventDate.setHours(startHour, startMinute, 0, 0);
            events.push({
                name: event.name,
                location: event.location,
                description: event.description,
                nextEvent: eventDate,
                readable_date: formatUkDate(eventDate)
            });
        }
    }

    events = events.sort((a, b) => {
        return a.nextEvent.getTime() - b.nextEvent.getTime()
    })

    return events
}

module.exports = getNextEvents