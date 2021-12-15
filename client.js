let Omegle = require('./util/om.js');
let log = require('./util/colourLog.js');
let prompt = require('prompt-sync')({ sigint: true });
let fetch = require('node-fetch');
let config = require("./config.json");

let _capmKey = config.capmonsterKey || process.env.capmonsterKey;

class Client {
    constructor(id, options) {
        this.id = id;
        this.om = new Omegle();
        this.messages = options.messages || ["Big oof"];
        this.autoCaptcha = options.autoCaptcha || false;
        this.topics = options.topics || null;
        this.logSentMessages = options.logSentMessages || false;
        this.verbose = options.verbose || false;
        this.launched = false;

        this.om.on('omerror', err => {
            log.bgRed(`Client ${this.id} | ${new Date().toUTCString()}: omerror - ${err}`);
        });

        this.om.on('omegleError', err => {
            log.bgRed(`Client ${this.id} | ${new Date().toUTCString()}: omegleError - ${err}`);
        });

        this.om.on('recaptchaRequired', async challenge => {
            //challenge is the link to the recaptcha image.
            if(this.verbose) log.bgMagenta(`Client ${this.id} | ${new Date().toUTCString()}: Encountered a captcha "${challenge}"`);
            //after solving the captcha, send the answer to omegle by calling
            // om.solveReCAPTCHA(answer);

            if(this.autoCaptcha) {
               if(this.verbose) log.bgMagenta(`Client ${this.id} | ${new Date().toUTCString()}: Auto solving captcha...`);

                let createTaskRes = await (await fetch("https://api.capmonster.cloud/createTask", {
                    method: "post",
                    header: { "content-type": "application/json" },
                    body: JSON.stringify({
                        clientKey: _capmKey,
                        task: {
                            type: "NoCaptchaTaskProxyless",
                            websiteURL: "https://www.omegle.com",
                            websiteKey: "6LekMVAUAAAAAPDp1Cn7YMzjZynSb9csmX5V4a9P"
                        }
                    })
                })).JSON();

                if(createTaskRes.errId !== 0) {
                    let taskId = createTaskRes.taskId;
                    wait(3000);

                    let getTaskResultRes = await (await fetch("https://api.capmonster.cloud/getTaskResult", {
                        method: "post",
                        header: { "content-type": "application/json" },
                        body: JSON.stringify({
                            clientKey: _capmKey,
                            taskId: taskId
                        })
                    })).JSON();

                    if(getTaskResultRes.errorId !== 0) {
                        if(getTaskResultRes.status === "ready") {
                            let answer = getTaskResultRes.solution.gRecaptchaResponse;
                            this.om.solveReCAPTCHA(answer);
                            if(this.verbose) log.bgMagenta(`Client ${this.id} | ${new Date().toUTCString()}: Sent captcha response "${answer}"`);
                        } else if(getTaskResultRes.status === "processing") {
                            await wait(3000);
                            getTaskResultRes = await (await fetch("https://api.capmonster.cloud/getTaskResult", {
                                method: "post",
                                header: { "content-type": "application/json" },
                                body: JSON.stringify({
                                    clientKey: _capmKey,
                                    taskId: taskId
                                })
                            })).JSON();

                            if(getTaskResultRes.errorId !== 0) {
                                if(getTaskResultRes.status === "ready") {
                                    let answer = getTaskResultRes.solution.gRecaptchaResponse;
                                    this.om.solveReCAPTCHA(answer);
                                    if(this.verbose) log.bgMagenta(`Client ${this.id} | ${new Date().toUTCString()}: Sent captcha response "${answer}"`);
                                } else if(getTaskResultRes.status === "processing") {
                                    this.bgRed(`Client ${this.id} | ${new Date().toUTCString()}: Capmonster could not solve the captcha in time, reloading the captcha...`);
                                    this.om.reloadReCAPTCHA();
                                }
                            }
                        }
                    } else {
                        log.bgRed(`Client ${this.id} | ${new Date().toUTCString()}: Error while creating task to solve captcha "${getTaskResultRes?.errCode}"`);
                        log.bgRed(`Client ${this.id} | ${new Date().toUTCString()}: Retrying...`);
                        this.om.reloadReCAPTCHA();
                    }

                } else {
                    log.bgRed(`Client ${this.id} | ${new Date().toUTCString()}: Error while creating task to solve captcha "${createTaskRes?.errCode}"`);
                    log.bgRed(`Client ${this.id} | ${new Date().toUTCString()}: Retrying...`);
                    this.om.reloadReCAPTCHA();
                }
            } else {
                this.promptForCaptcha();
            }

            setTimeout(() => {
                if(!this.om.connected()) {
                    // log.bgMagenta(`Client ${this.id} | ${new Date().toUTCString()}: Last event "${this.om.getLastEvent()}"`);
                    log.bgMagenta(`Client ${this.id} | ${new Date().toUTCString()}: The captcha mightve been rejected (omegle doesnt tell), reloading the captcha...`);
                    this.om.reloadReCAPTCHA();
                }
            }, 5000);

        });

        this.om.on('gotID', sid => {
            log.bgGreen(`Client ${this.id} | ${new Date().toUTCString()}: Connected to server as: ${sid}`);
            // this.om.stopLookingForCommonLikes();
        });

        this.om.on('waiting', () => {
            if(this.verbose) log.fgWhite(`Client ${this.id} | ${new Date().toUTCString()}: Waiting for a stranger.`);
        });

        this.om.on('serverUpdated', server => {
            if(this.verbose) log.fgYellow(`Client ${this.id} | ${new Date().toUTCString()}: Server updated to: ${server}`);
            // this.connect();
        });

        this.om.on('connected', () => {
            if(this.verbose) log.fgWhite(`Client ${this.id} | ${new Date().toUTCString()}: Connected to a stranger...`);
            this.om.startTyping();
            setTimeout(() => {
                if(this.om.connected()) {
                    this.om.stopTyping();
                    let msg = this.messages[Math.floor(Math.random() * this.messages.length)];
                    this.om.send(msg);
                    if(this.logSentMessages) log.fgCyan(`Client ${this.id} | ${new Date().toUTCString()}: Sent "${msg}" in the chat.`);
                    setTimeout(() => {
                        if(this.om.connected()) this.disconnect();
                    }, 2000)
                }
            }, 2000);
        });

        this.om.on('strangerDisconnected', () => {
            if(this.verbose) log.fgWhite(`Client ${this.id} | ${new Date().toUTCString()}: Stranger has disconnected.`);
            this.connect();
        });

        this.om.on('disconnected', () => {
            if(this.verbose) log.bgYellow(`Client ${this.id} | ${new Date().toUTCString()}: You have disconnected.`);
            this.connect();
        });

        this.om.on('antinudeBanned', () => {
            if(this.verbose) log.fgWhite(`Client ${this.id} | ${new Date().toUTCString()}: Banned.`);
        });
    }

    launch() {
        log.bgYellow(`Client ${this.id} | ${new Date().toUTCString()}: Attempting to connect...`);
        this.launched = true;
        this.connect();
        // The library doesnt actually return anything meaningful so i cant tell whether this failed or succeeded
    }

    connect() {
        if(this.verbose) log.fgWhite(`Client ${this.id} | ${new Date().toUTCString()}: Connecting to a random stranger...`);
        if(this.topics) this.om.connect(this.topics);
        else this.om.connect();
    }

    disconnect() {
        if(this.verbose) log.bgYellow(`Client ${this.id} | ${new Date().toUTCString()}: Disconnecting from chat...`);
        this.om.disconnect();
    }

    promptForCaptcha() {
        let answer = prompt(`Client ${this.id} | ${new Date().toUTCString()}: Enter captcha answer to be sent...`);
        this.om.solveReCAPTCHA(answer);
    }
}

function wait(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve()
        }, ms)
    });
}

module.exports = Client;