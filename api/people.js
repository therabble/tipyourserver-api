const parse = require("csv-parse/lib/sync");
const fetch = require("node-fetch");
const DATA_SOURCES = require("../config");

let cache = fetchData();

function fetchData() {
  return fetch(DATA_SOURCES[0].uri)
    .then(validateFetch)
    .then(parseSpreadsheet);
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
  ] = row;

  return {
    name,
    establishment,
    haveClosed: closed,
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
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(data);

    if (Date.now() - data.timestamp > 1000 * 60 * 60) {
      invalidateCache();
    }
  } catch (error) {
    res.statusCode = 500;
    res.send(error.text);
  }
};
