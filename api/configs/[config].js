const parse = require("csv-parse/lib/sync");
const fetch = require("node-fetch");
const DATA_SOURCES = require("../../config");

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
  };
}

module.exports = async (req, res) => {
  try {
    const {
      query: { config }
    } = req;
    const cityConfig = DATA_SOURCES.find(source => source.locale === config);
    // const response = await fetch(dataSource.uri);
    // const rawSheet = await response.text();
    // const rows = parse(rawSheet).slice(1);
    // console.log(rows);
    const data = {
      timestamp: Date.now(),
      config: toConfig(cityConfig),
    };
    // res.setHeader("Cache-Control", "s-maxage=300");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(data);
  } catch (error) {
    res.statusCode = 500;
    console.log(error);
    res.send(error.text);
  }
};
