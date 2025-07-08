const moment = require('moment');

exports.generateDateList = function (start, end) {
  const dates = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(moment(cursor).format('YYYY-MM-DD'));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};