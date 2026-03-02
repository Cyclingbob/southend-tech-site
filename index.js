const express = require("express");
const path = require("path");
const app = express();

const event_file = path.join(__dirname, "events.json");
const viewFolder = path.join(__dirname, "views");

const getNextEvents = require("./events");

app.use("/public", express.static(path.join(__dirname, "public")));
app.set('view-engine', 'ejs')

app.get("/", (req, res) => {
    let next_events = getNextEvents(event_file);
    
    res.render(path.join(viewFolder, "index.ejs"), {
        next_events
    });
})

app.listen(80, () => {
    console.log("Server started on port 80");
});