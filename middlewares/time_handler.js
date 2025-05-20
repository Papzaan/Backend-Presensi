module.exports = {
    toTime: function (str) {
        return new Date(parseInt(str)).toLocaleTimeString("id-ID")
    },
    toDate: function (str) {
        return new Date(parseInt(str)).toLocaleDateString("id-ID")
    },
    toString: function (str) {
        return new Date(parseInt(str)).toLocaleString("id-ID")
    },
    toStringFromDate: function (str) {
        return new Date(str).toLocaleString("id-ID")
    }
}