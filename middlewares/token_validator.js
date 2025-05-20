const jwt = require('jsonwebtoken')
require('dotenv').config()

module.exports = {
    isToken: (req, res, next) => {
        try {
            let token = req.get("Authorization")
            token = token.slice(7)
            jwt.verify(token, process.env.TOKEN_AUTH, null, (err) => {
                if (err) {
                    res.json({
                        message: "Expired Token",
                        code: 401
                    })
                } else {
                    next()
                }
            })
        } catch (err) {
            res.json({
                message: err.message,
                code: 401
            })
        }
    },

    isAdmin: (req, res, next) => {
        try {
            let token = req.get("Authorization")
            token = token.slice(7)
            jwt.verify(token, process.env.TOKEN_AUTH, null, (err, decoded) => {
                if (err) {
                    res.json({
                        message: "Expired Token",
                        code: 401
                    })
                } else {
                    const level = decoded["pegawai"]["level"]

                    if (level !== "ADMIN") {
                        res.json({
                            message: "Unathorized Access. Not an ADMIN",
                            code: 401,
                            level: level
                        })
                    }
                    next()
                }
            })
        } catch (err) {
            res.json({
                message: err.message,
                code: 401
            })
        }
    },

    isVerifikator: (req, res, next) => {
        try {
            let token = req.get("Authorization")
            token = token.slice(7)
            jwt.verify(token, process.env.TOKEN_AUTH, null, (err, decoded) => {
                if (err) {
                    res.json({
                        message: "Expired Token",
                        code: 401
                    })
                } else {
                    const level = decoded["pegawai"]["level"]

                    if (level !== "VERIFIKATOR") {
                        res.json({
                            message: "Unathorized Access. Not a VERIFIKATOR",
                            code: 401,
                            level: level
                        })
                    }
                    next()
                }
            })
        } catch (err) {
            res.json({
                message: err.message,
                code: 401
            })
        }
    },

    isPermitor: (req, res, next) => {
        try {
            let token = req.get("Authorization")
            token = token.slice(7)
            jwt.verify(token, process.env.TOKEN_AUTH, null, (err, decoded) => {
                if (err) {
                    res.json({
                        message: "Expired Token",
                        code: 401
                    })
                } else {
                    const level = decoded["pegawai"]["level"]
                    if (level !== "PERMITOR" || level !== "ADMIN") {
                        res.json({
                            message: "Unathorized Access. Not a PERMITOR",
                            code: 401,
                            level: level
                        })
                    }
                    next()
                }
            })
        } catch (err) {
            res.json({
                message: err.message,
                code: 401
            })
        }
    }
}