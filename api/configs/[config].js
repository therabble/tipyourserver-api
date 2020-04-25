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

function toConfig(config) {
  return {
    locale: config.locale,
    name: config.name,
    state: config.state,
    state_code: config.state_code,
    country: config.country,
    homepage: config.homepage,
    signup: config.signup,
    logo: config.logo,
    background: config.background,
    email: config.email,
    usage_note: config.usage_note,
  };
}

module.exports = async (req, res) => {
  try {
    const {
      query: { config },
    } = req;
    console.log("config: ", config);
    const { resource: dataSource } = await container.item(config, config).read();
    const cityConfig = dataSource;
    const data = {
      timestamp: Date.now(),
      config: toConfig(cityConfig),
    };
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(data);
  } catch (error) {
    res.statusCode = 500;
    console.log(error);
    res.send(error.text);
  }
};
