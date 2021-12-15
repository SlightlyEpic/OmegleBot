module.exports = {
    fgBlack: (text) => console.log("\x1b[30m", text, "\x1b[0m"),
    fgRed: (text) => console.log("\x1b[31m", text, "\x1b[0m"),
    fgGreen: (text) => console.log("\x1b[32m", text, "\x1b[0m"),
    fgYellow: (text) => console.log("\x1b[33m", text, "\x1b[0m"),
    fgBlue: (text) => console.log("\x1b[34m", text, "\x1b[0m"),
    fgMagenta: (text) => console.log("\x1b[35m", text, "\x1b[0m"),
    fgCyan: (text) => console.log("\x1b[36m", text, "\x1b[0m"),
    fgWhite: (text) => console.log("\x1b[37m", text, "\x1b[0m"),

    bgBlack: (text) => console.log("\x1b[40m", text, "\x1b[0m"),
    bgRed: (text) => console.log("\x1b[41m", text, "\x1b[0m"),
    bgGreen: (text) => console.log("\x1b[42m", text, "\x1b[0m"),
    bgYellow: (text) => console.log("\x1b[43m", text, "\x1b[0m"),
    bgBlue: (text) => console.log("\x1b[44m", text, "\x1b[0m"),
    bgMagenta: (text) => console.log("\x1b[45m", text, "\x1b[0m"),
    bgCyan: (text) => console.log("\x1b[46m", text, "\x1b[0m"),
    bgWhite: (text) => console.log("\x1b[47m", text, "\x1b[0m"),
}