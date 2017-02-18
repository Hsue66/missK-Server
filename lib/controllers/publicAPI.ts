/**
 * Copyright (c) 2016 Produce105 - miss_k
 *
 * Main component - registers all the screens
 *
 * @author hogyun
 */

import RequestService from "./../services/requestService";
import CONST from "./../../const";

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

let Schema = mongoose.Schema;
let dustInfoSchema = new Schema({
    dataTime: String,
    mangName: String,
    so2Grade: Number,
    so2Value: Number,
    no2Grade: Number,
    no2Value: Number,
    o3Grade: Number,
    o3Value: Number,
    coGrade: Number,
    coValue: Number,
    pm10Value: Number,
    pm10Value24: Number,
    pm10Grade: Number,
    pm10Grade1h: Number,
    pm25Value: Number,
    pm25Value24: Number,
    pm25Grade: Number,
    pm25Grade1h: Number
});

let dustPredictSchema = new Schema({
    dataTime: String,
    informData: String,
    informCause: String,
    informGrade: String,
    informCode: String
});

const DustInfoModel = mongoose.model("realdust",dustInfoSchema);
const DustPredictModel = mongoose.model("predictdust",dustPredictSchema);

export default class PublicAPI {
    private AIR_POLUTION_PRECIT_URL: string;
    private AIR_POLUTION_INFO_API_URL: string;
    private AIR_POLUTION_INFO_OPTIONS: Object;
    private AIR_POLUTION_PRECIT_OPTIONS: Object;

    constructor() {
        // 왜 ServiceKey는 querystring으로 안 했냐면 API_KEY에 %가 들어가 있어서 퍼센트 인코딩문제가 일어남. 그래서 하드코딩
        this.AIR_POLUTION_INFO_API_URL = CONST.OPEN_API_URL + CONST.AIR_INFO + "?ServiceKey=" + CONST.OPEN_API_KEY;
        // Todo: 현재는 하드코딩 되어있음. 파라미터 변경 가능하게
        this.AIR_POLUTION_INFO_OPTIONS = {
            stationName: "종로구",
            dataTerm: "MONTH", // YEAR, DAILY
            pageNo: 1,
            numOfRows: 1000,
            ver: 1.3,
            _returnType: "json"
        };

        // 왜 ServiceKey는 querystring으로 안 했냐면 API_KEY에 %가 들어가 있어서 퍼센트 인코딩문제가 일어남. 그래서 하드코딩
        this.AIR_POLUTION_PRECIT_URL = CONST.OPEN_API_URL + CONST.AIR_PREDICATE + "?ServiceKey=" + CONST.OPEN_API_KEY;
        this.AIR_POLUTION_PRECIT_OPTIONS = {
            searchDate: "2017-01-15", // Todo: searchDate를 params로 부터 받아온 값으로 바꾸기
            _returnType: "json"
        };
    };

    getAirPolutionInfo(location, term, pageNo, numOfRows) {
        return new Promise((resolve, reject) => {
            // Todo parameter 넘어온거 이 부분에서 받을 수 있게만.
            console.log('NEW '+location+' '+term+' '+pageNo+' '+numOfRows);

            this.AIR_POLUTION_INFO_OPTIONS["stationName"] = location;
            this.AIR_POLUTION_INFO_OPTIONS["dataTerm"] = term;
            this.AIR_POLUTION_INFO_OPTIONS["pageNo"] = pageNo;
            this.AIR_POLUTION_INFO_OPTIONS["numOfRows"] = numOfRows;

            RequestService.requestToUrl(this.AIR_POLUTION_INFO_API_URL, this.AIR_POLUTION_INFO_OPTIONS).then((res) => {
                let parsedBody = JSON.parse(res["body"]);

                for(let listNum=0; listNum < parsedBody["list"].length; listNum++){
                    let parsedBodyIdx =  parsedBody["list"][listNum];
                    let dustInfo = new DustInfoModel();
                    Object.keys(parsedBodyIdx).forEach((key)=>{
                        dustInfo[key] = parsedBodyIdx[key];
                    });
                    dustInfo.save();
                }

                resolve(parsedBody);
            }).catch((err) => {
                reject({err: err});
            });
        });
    }

    getAirPolutionPredict(searchDate) {
        return new Promise((resolve, reject) => {
            this.AIR_POLUTION_PRECIT_OPTIONS["searchDate"] = searchDate;
            RequestService.requestToUrl(this.AIR_POLUTION_PRECIT_URL, this.AIR_POLUTION_PRECIT_OPTIONS).then((res) => {
                // Todo: 지금껀 가장 최근 (배열에서 첫번째 요소)만 response로 줌. 잘 파싱해서 array로 줘도 되고 수민이 마음대로 :)
                let parsedBody = JSON.parse(res["body"]);

                for(let listNum=0; listNum < parsedBody["list"].length; listNum++){
                    let parsedBodyIdx =  parsedBody["list"][listNum];
                    let newpredict = new DustPredictModel();
                    Object.keys(parsedBodyIdx).forEach((key)=>{
                      newpredict[key]= parsedBodyIdx[key];
                    });
                    newpredict.save();
                }

                resolve('Saved');
            }).catch((err) => {
                reject({err: err});
            });
        });
    }

    async readPredictInfo(date,time) {
        try{
            let announceTime ='';
            if( 5 <= time && time < 11)
                announceTime = date+' 05시 발표';
            else if( 11 <= time && time  < 17)
                announceTime = date+' 11시 발표';
            else if( 17 <= time && time < 23)
                announceTime = date+' 17시 발표';
            else
            {
                if(time < 5 || time===24){
                    let str = date.split('-');
                    str[2]= str[2]-1;
                    announceTime = str.join('-')+' 23시 발표';
                }
                else
                    announceTime = date+' 23시 발표';
            }
            if((time+'').length < 2)
                time='0'+time;

            console.log(announceTime+" & "+date+' '+time)
            let predict = await DustPredictModel.find({informData :date, informCode:"PM25",dataTime: announceTime},{informGrade:1,_id:0,});
            let dustinfo = await DustInfoModel.find({"dataTime":date+" "+time+":00"},{pm10Value:1,pm25Value:1,dataTime:1,_id:0} ).limit(1);

            predict = predict.concat(dustinfo);
            return predict;
        }catch(error){
          console.error(error);
        }

    }
}
