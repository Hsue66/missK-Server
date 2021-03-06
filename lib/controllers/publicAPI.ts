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
    locName: String,
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
    private AIR_POLUTION_TOTAL_INFO_API_URL: string;
    private AIR_POLUTION_TOTAL_INFO_OPTIONS: Object;
    private DAUM_LOCAL_URL: string;
    private DAUM_LOCAL_OPTIONS: Object;

    constructor() {

        // 왜 ServiceKey는 querystring으로 안 했냐면 API_KEY에 %가 들어가 있어서 퍼센트 인코딩문제가 일어남. 그래서 하드코딩
        this.AIR_POLUTION_INFO_API_URL = CONST.OPEN_API_URL + CONST.AIR_INFO + "?ServiceKey=" + CONST.OPEN_API_KEY;
        // Todo: 현재는 하드코딩 되어있음. 파라미터 변경 가능하게
        this.AIR_POLUTION_INFO_OPTIONS = {
            stationName: "종로구",
            dataTerm: "DAILY", // YEAR, DAILY
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

        this.DAUM_LOCAL_URL = CONST.DAUM_API_URL+"?apikey="+CONST.DAUM_API_KEY;
        this.DAUM_LOCAL_OPTIONS = {
          longitude: 127.10863694633468,
          latitude: 37.40209529907863,
          inputCoordSystem: "WGS84",
          output: "json"
        };
    };



    getAirPolutionInfo(location) {
        return new Promise((resolve, reject) => {
            // Todo parameter 넘어온거 이 부분에서 받을 수 있게만.

            this.AIR_POLUTION_INFO_OPTIONS["stationName"] = location;
            // this.AIR_POLUTION_INFO_OPTIONS["dataTerm"] = term;
            // this.AIR_POLUTION_INFO_OPTIONS["pageNo"] = pageNo;
            // this.AIR_POLUTION_INFO_OPTIONS["numOfRows"] = numOfRows;

            let si = convertDongSi(0,location);
            console.log(si);

            RequestService.requestToUrl(this.AIR_POLUTION_INFO_API_URL, this.AIR_POLUTION_INFO_OPTIONS).then((res) => {
                let parsedBody = JSON.parse(res["body"]);

/*              // 맨 앞정보가 가장 실시간 정보
                for(let listNum=0; listNum < parsedBody["list"].length; listNum++){
                    let parsedBodyIdx =  parsedBody["list"][listNum];
                    let dustInfo = new DustInfoModel();
                    dustInfo.locName = si;
                    Object.keys(parsedBodyIdx).forEach((key)=>{
                        dustInfo[key] = (parsedBodyIdx[key]==='-') ?  -1 : parsedBodyIdx[key];
                    });

                    dustInfo.save().then(()=>{
                    }).catch((err)=>{
                      console.log(err);
                    });
                }
*/
                let parsedBodyIdx =  parsedBody["list"][0];
                let dustInfo = new DustInfoModel();
                dustInfo.locName = si;
                Object.keys(parsedBodyIdx).forEach((key)=>{
                    dustInfo[key] = (parsedBodyIdx[key]==='-') ?  -1 : parsedBodyIdx[key];
                });

                dustInfo.save().then(()=>{
                }).catch((err)=>{
                  console.log(err);
                });


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
                let parsedBody = JSON.parse(res["body"]);

                // 05시,11시,17시,23시마다 7개 정보만 저장
                for(let listNum=0; listNum < 7; listNum++){
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


    async getTotalInfo(lat,long,date,time) {
        try{
            // 1.TODO : lat, long값으로 DAUM REST API에서 location 가져오기

            this.DAUM_LOCAL_OPTIONS["latitude"] = lat;
            this.DAUM_LOCAL_OPTIONS["longitude"] = long;

            let locData = {sendLoc: '서울특별시 중구', location:'서울특별시'};

            await RequestService.requestToUrl(this.DAUM_LOCAL_URL, this.DAUM_LOCAL_OPTIONS).then((res) => {
                let parsedBody = JSON.parse(res["body"]);
                locData.sendLoc = parsedBody["name1"]+" "+parsedBody["name2"];
                locData.location = parsedBody["name1"];
              //  resolve(res);
            }).catch((err) => {
              //  reject({err: err});
            });

            console.log(locData);
            // 2.TODO : 3일치 예보 (오늘, 내일, 모레)
            let announceTime = getTime(date,time);
            // 이거 사용할 경우 업뎃되지 않았을 경우에는 데이터없이 전달되서
            // let predict = await DustPredictModel.find({informCode:"PM25",dataTime: announceTime},{informData:1, informGrade:1,_id:0});

            // 저장된 데이터중 가장 최신의 데이터를 전달
            let predictinfo = await DustPredictModel.find({informCode:"PM25"},{dataTime:1,informData:1, informGrade:1,_id:0}).sort({dataTime: -1}).limit(3);


            // 3.TODO : location에 맞는 pm25,pm10 정보 가져오기

            // 21일 0시 === 20일 24시
            if(time===0){
                let str = date.split('-');
                str[2]= str[2]-1;
                date = str.join('-');
                time = 24;
            }

            time = ((time+'').length < 2) ?  '0'+time : time;

            console.log(announceTime+" & "+date+' '+time)

            // 이거 사용할 경우 업뎃되지 않았을 경우에는 데이터없이 전달되서
            // let dust = await DustInfoModel.find({locName: location, dataTime:date+" "+time+":00"},{pm10Value:1,pm25Value:1,dataTime:1,_id:0} ).limit(1);

            // 저장된 데이터중 가장 최신의 데이터를 전달
            let dustinfo = await DustInfoModel.find({locName: locData.location},{pm10Value:1,pm25Value:1,dataTime:1,_id:0} ).sort({dataTime: -1}).limit(1);

            // 4.TODO : 값 합쳐서 보내기 (location + 3일치 예보 + pm25,pm10값)
            predictinfo = predictinfo.concat(dustinfo);
            predictinfo = predictinfo.concat(locData);
            return predictinfo;
        }catch(error){
          console.error(error);
        }
    }


    async readDustInfo(date,time) {
        try{
            let announceTime = getTime(date,time);

            if((time+'').length < 2)
                time='0'+time;

            console.log(announceTime+" & "+date+' '+time)

            let predict = await DustPredictModel.find({informData :date, informCode:"PM25",dataTime: announceTime},{informGrade:1,_id:0});
            let dustinfo = await DustInfoModel.find({"dataTime":date+" "+time+":00"},{pm10Value:1,pm25Value:1,dataTime:1,_id:0} ).limit(1);

            predict = predict.concat(dustinfo);
            return predict;
        }catch(error){
          console.error(error);
        }
    }

    readPredictInfo(date,time) {
        let announceTime = getTime(date,time);
        let predict = DustPredictModel.find({informCode:"PM25",dataTime: announceTime},{informData:1, informGrade:1,_id:0});

        return predict;
    }

}

function convertDongSi(opt,location)
{
    // opt 0 : Dong to Si  opt 1 : Si to Dong
    let siList = new Array('서울특별시', '제주특별자치도', '전라남도','전라북도', '광주광역시','경상남도','경상북도', '울산광역시',  '대구광역시', '부산광역시','충청남도','충청북도'
                            ,'세종특별자치시','대전광역시', '강원도','경기도','인천광역시');
    let dongList = new Array('중구', '연동',  '장천동',  '삼천동',  '농성동','용지동', '장량동',  '야음동','이현동','연산동','정곡리','칠금동'
                            ,'신흥동','구성동','옥천동','단대동','석남');

    let loopList = (opt===0) ?  dongList : siList;

    let i;
    for(i=0; i<17; i++){
        if(loopList[i] === location)
            break;
    }

    console.log(siList[i]+' '+dongList[i]);

    let result = (opt===0) ?  siList[i] : dongList[i];
    return result;
}

function getTime(date,time) {
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
    return announceTime;
}
