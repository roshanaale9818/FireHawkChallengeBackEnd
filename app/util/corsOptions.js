let CORS = [
  {
    origin: "http://localhost:4200",
  },
  {
    origin: "http://170.64.196.162:3000/",
  },
  {
    origin: "http://roshanaalemagar.com:3000/",
  },
  {
    origin: "http://roshanaalemagar.com:3000",
  },
];
const allowedCorsList = CORS.map((x) => x.origin);
module.exports = { CORS, allowedCorsList };
