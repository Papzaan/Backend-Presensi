module.exports = {
    toTime: function (str) {
        return new Date(parseInt(str)).toLocaleTimeString("id-ID")
    },
    toDate: function (str) {
        return new Date(parseInt(str)).toLocaleDateString("id-ID")
    },
    // toString: function (str) {
    //     return new Date(parseInt(str)).toLocaleString("id-ID")
    // },
    // toStringFromDate: function (str) {
    //     return new Date(str).toLocaleString("id-ID")
    // }

        toString: function (str) {
        const date = new Date(parseInt(str));
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}.${date.getMinutes().toString().padStart(2, '0')}.${date.getSeconds().toString().padStart(2, '0')}`;
    },

    toStringFromDate: function (str) {
        const date = new Date(str);
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}.${date.getMinutes().toString().padStart(2, '0')}.${date.getSeconds().toString().padStart(2, '0')}`;
    }
}