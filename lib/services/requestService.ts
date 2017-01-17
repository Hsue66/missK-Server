/**
 * Copyright (c) 2016 Produce105 - miss_k
 *
 * Main component - registers all the screens
 *
 * @author hogyun
 */

let request = require("request");
let querystring = require("querystring");

export default class RequestService {
    constructor() {
        console.log("Request Service constructor");
    }

    static requestToUrl(url, qs) {
        return new Promise((resolve, reject) => {
            request({url: url, qs: qs}, (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    resolve({response: response, body: body});
                }else {
                    reject({error: error});
                }
            });
        });
    }

}
