// utils/date.js
const moment = require('moment');

function toDate(dateInput) {
  return moment(dateInput).format('D/M/YYYY');
}

module.exports = { toDate };
