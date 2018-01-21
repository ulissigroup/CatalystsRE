const ElasticSearch = require('elasticsearch');
const elasticClient = new ElasticSearch.Client({
  host: 'localhost:9200',
  log: 'trace'
});

const getAllRecords = {
  index: 'structures',
  q: '*:*',
  size: 2000
};

exports.init = function (app) {
  app.get("/import", importHandler);
  app.get("/volcano", queryHandler);
  app.get("/", queryHandler);

  // Route Handlers
  // --------------

  function importHandler(req, res) {
    require("../lib/elastic/import").init(elasticClient);
    res.send("");
  }

  function queryHandler(req, res) {
    let query = generateQuery(req);
    sendQuery(req, res, query);
  }

  function generateQuery(req) {
    if(req.query){
      // console.log(req.query);
      filters=buildFilters(req)
      let query = {
        index: 'structures',
        body: {
          "query": {
            "bool": {
              "must": filters[0],
              "must_not": filters[1]
            }
          },
          size: 2000
        }
      };
      return query;
    }
    return getAllRecords;
  }

  function sendQuery(req, res, query) {
    elasticClient.search(query, function (error, data) {
      if (error) {
        console.log(error);
      } else {
        successCallback(req, res, app, resultsArray(data));
      }
    });
  }

  function successCallback(req, res, app, data) {
    require('./reGraph.js').reGraph(req, res, app, data);
  }

  function resultsArray(data) {
    data = data.hits.hits;
    let results = [];
    for (let i = 0; i < data.length; i++) {
      results.push(data[i]["_source"]);
    }
    return results;
  }

  function buildFilters(req){
    let filters = [];
    let must_not = [];
    if (req.query.mpid){
      filters.push({ "match": {"mpid":  req.query.mpid }});
    }
    if (req.query.nextnearestcoordination){
      filters.push({ "match": { "nextnearestcoordination":  req.query.nextnearestcoordination }});
    }
    if (req.query.coordination){
      filters.push({ "match": { "coordination":  req.query.coordination }});
    }
    if (req.query.formula){
      console.log(req.query.formula);
      filters.push({ "match": { "formula":  req.query.formula }});
    }
    if (req.query.formulaContains) {
      //filters.push({"wildcard":{"formula":"*"+req.query.elementContains+"*"}})
      let elements=req.query.formulaContains.split(/(?=[A-Z])/)
      let count = elements.length
      for (var i = 0; i < count;i++) {
          rangedict={}
          rangedict["elements."+elements[i]]={"gte":1}
          filters.push({"range":rangedict})
          //filters.push({"query_string":{"default_field":"formula","query":"*"+elements[i]+"*"}})
      }
    }
    if (req.query.formulaNotContains) {
      //filters.push({"wildcard":{"formula":"*"+req.query.elementContains+"*"}})
      let elements=req.query.formulaNotContains.split(/(?=[A-Z])/)
      let count = elements.length
      for (var i = 0; i < count;i++) {
          must_not.push({"exists":{"field":"elements."+elements[i]}})
          //must_not.push({"query_string":{"default_field":"formula","query":"*"+elements[i]+"*"}})
      }
    }
    if (req.query.catalog){
      filters.push({ "match": { "catalog?":  req.query.catalog }});
    }
    if (req.query.top){
      filters.push({ "match": { "top":  req.query.top }});
    }
    if (req.query.energyLow && req.query.energyHigh){
      filters.push( {"range" : {
        "energies.CO" : {
            "gt" : req.query.energyLow,
            "lt" : req.query.energyHigh
        }
      }});
    }
    //if (req.query.energyLow && req.query.energyHigh){
    //  filters.push( {"range" : {
    //    "shift" : {
     //       "gt" : req.query.shiftLow,
    //        "lt" : req.query.shiftHigh
    //    }
    //  }});
    //}
    return [filters,must_not];
}
};
