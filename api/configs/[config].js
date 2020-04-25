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
    usage_note: config.usage_note,
  };
}

module.exports = async (req, res) => {
  try {
    const {
      query: { config },
    } = req;
    const cityConfig = DATA_SOURCES.find((source) => source.locale === config);
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
