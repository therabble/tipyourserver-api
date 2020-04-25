const parse = require("csv-parse/lib/sync");
const fetch = require("node-fetch");
const { CosmosClient } = require("@azure/cosmos");
const { performance } = require("perf_hooks");

const connectionString = process.env.SECRET_CONNECTION_STRING;

if (!connectionString) {
  throw new Error("SECRET_CONNECTION_STRING env variable not set");
}

const [endpointString, keyString] = connectionString.split(";");
const [, endpoint] = endpointString.split("=");
const [, key] = keyString.split("=");

const requestPlugin = async (requestContext, next) => {
  const start = performance.now();
  const response = await next(requestContext);
  const end = performance.now();
  console.log(requestContext.method, requestContext.path, end - start);
  return response;
};

const client = new CosmosClient({
  endpoint,
  key,
  plugins: [{ on: "request", plugin: requestPlugin }],
  connectionPolicy: {
    enableEndpointDiscovery: false,
  },
});

const container = client.database("tip-your-server").container("production");

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
    cashappURL: row[rowMap.indexOf("cashappURL")] || null,
  };
}

module.exports = async (req, res) => {
  try {
    const {
      query: { city },
    } = req;
    const { resource: dataSource } = await container.item(city, city).read();
    const response = await fetch(dataSource.uri);
    const rawSheet = await response.text();
    const rows = parse(rawSheet).slice(1);
    const data = {
      timestamp: Date.now(),
      people: rows.map((row) => toRecord(row, dataSource.row)),
    };
    res.setHeader("Cache-Control", "s-maxage=300");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(data);
  } catch (error) {
    res.statusCode = 500;
    console.log(error);
    res.send(error.text);
  }
};
