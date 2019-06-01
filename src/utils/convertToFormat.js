const json2csv = require('json2csv');
const XLSX = require('xlsx');

function convertToFormat (object, format) {
    if (format === 'csv') {
        return json2csv.parse(object);
    } else if (format === 'json') {
        return JSON.stringify(object, null, 2);
    } else if (format === 'xlsx') {
        let book = XLSX.utils.book_new();
        let sheet = XLSX.utils.json_to_sheet(object);
        XLSX.utils.book_append_sheet(book, sheet, 'data');
        return XLSX.write(book, { type: 'buffer', bookType: 'xlsx', bookSST: false });
    } else {
        return 'Undefined format';
    }
}

module.exports = convertToFormat;
