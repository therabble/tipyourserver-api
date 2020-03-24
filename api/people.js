const parse = require('csv-parse/lib/sync');
const fetch = require('node-fetch');

let DATA_SOURCES = [
      {
        "locale": "MSN",
        "type": "gdoc-1",
        "uri": "https://docs.google.com/spreadsheets/d/1rS6lfApsy8VzzAeFCKZzfPM8A3R-4GaYj-OOrznceGc/export?format=csv",
        "format": "csv"
        "row" : [
        "_timestamp",
        "name",
        "_establishmentUnlisted",
        "closed",
        "venmoUser",
        "paypalEmail",
        "paypalURL",
        "establishment",
        "venmoURL"
        ]
      },
      {
        "locale": "PGH",
        "type": "gdoc-1",
        "uri": "https://docs.google.com/spreadsheets/d/1ggLPsikyyjQw5bJF0zN08nneJoBHA8HlhC0mcnH6fYQ/export?format=csv#gid=1564003411",
        "format": "csv"
        "row" : [
        //"_timestamp",
        "name",
        "paypalURL",
        "establishment",
        "venmoURL"
        // "_establishmentUnlisted",
        // "closed",
        // "venmoUser",
        // "paypalEmail",
        ]
      }
    ]

let cache = fetchData(DATA_SOURCES);
let selected_source=0;

function fetchData(sources) {
    console.log("process.env.env_loaded: ", process.env.env_loaded);
    console.log("Fetching source", sources[selected_source].uri);
    return (
        fetch(sources[selected_source].uri)
            .then(validateFetch)
            .then(parseSpreadsheet)
    );
}

function validateFetch(response) {
    if (!response.ok) {
        throw new Error(`Failed to fetch ${response.url}: ${response.statusCode}`);
    }

    return response.text();
}

function parseSpreadsheet(spreadsheet) {
    const rows = parse(spreadsheet).slice(1);
    return {
        timestamp: Date.now(),
        people: rows.map(toRecord)
    };
}

function toRecord(row) {
    const [
        _timestamp,
        name,
        _establishmentUnlisted,
        closed,
        venmoUser,
        paypalEmail,
        paypalURL,
        establishment,
        venmoURL
    ] = DATASrow;

    return {
        name,
        establishment,
        haveClosed: closed || null,
        venmoUser: venmoUser || null,
        venmoURL: venmoURL || null,
        paypalUser: paypalEmail || null,
        paypalURL: paypalURL || null
    };
}

async function invalidateCache() {
    try {
        const data = await fetchData();
        cache = data;
    } catch (error) {
        console.error(`Failed to invalidate cache`, error);
    }
}

module.exports = async (_, res) => {
    try {
        const data = await cache;
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.json(data);

        if (Date.now() - data.timestamp > 1000 * 60 * 60) {
            invalidateCache();
        }
    } catch (error) {
        res.statusCode = 500;
        res.send(error.text);
    }
};
