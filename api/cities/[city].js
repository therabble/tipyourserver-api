const parse = require("csv-parse/lib/sync");
const fetch = require("node-fetch");
const DATA_SOURCES = require("../../config");

// let cache = fetchData(DATA_SOURCES);
// let selected_source = 0;

// function fetchData(sources) {
//   console.log("process.env.env_loaded: ", process.env.env_loaded);
//   console.log("Fetching source", sources[selected_source].uri);
//   return fetch(sources[selected_source].uri)
//     .then(validateFetch)
//     .then(parseSpreadsheet);
// }

// function validateFetch(response) {
//   if (!response.ok) {
//     throw new Error(`Failed to fetch ${response.url}: ${response.statusCode}`);
//   }

//   return response.text();
// }

// function parseSpreadsheet(spreadsheet) {
//   const rows = parse(spreadsheet).slice(1);
//   return {
//     timestamp: Date.now(),
//     people: rows.map(toRecord)
//   };
// }

function toRecord(row, rowMap) {
  return {
    name: row[rowMap.indexOf("name")],
    establishment: row[rowMap.indexOf("establishment")],
    haveClosed: row[rowMap.indexOf("haveClosed")] || null,
    venmoUser: row[rowMap.indexOf("venmoUser")] || null,
    venmoURL: row[rowMap.indexOf("venmoURL")] || null,
    paypalUser: row[rowMap.indexOf("paypalUser")] || null,
    paypalURL: row[rowMap.indexOf("paypalURL")] || null,
    cashappUser: row[rowMap.indexOf("cashappUser")] || null,
    cashappURL: row[rowMap.indexOf("cashappURL")] || null
  };
}

// async function invalidateCache() {
//   try {
//     const data = await fetchData();
//     cache = data;
//   } catch (error) {
//     console.error(`Failed to invalidate cache`, error);
//   }
// }

module.exports = async (req, res) => {
  try {
    const {
      query: { city }
    } = req;
    const dataSource = DATA_SOURCES.find(source => source.locale === city);
    const response = await fetch(dataSource.uri);
    const rawSheet = await response.text();
    const rows = parse(rawSheet).slice(1);
    console.log(rows);
    const data = {
      timestamp: Date.now(),
      people: rows.map(row => toRecord(row, dataSource.row))
    };
    // const data = await cache;
    res.setHeader("Cache-Control", "s-maxage=300");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(data);

    // if (Date.now() - data.timestamp > 1000 * 60 * 60) {
    //   invalidateCache();
    // }
  } catch (error) {
    res.statusCode = 500;
    console.log(error);
    res.send(error.text);
  }
};
