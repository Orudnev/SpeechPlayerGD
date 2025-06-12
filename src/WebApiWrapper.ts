import axios from "axios";
import { IItem } from "./CommonTypes";


const webApiBaseUrl = 'https://script.google.com/macros/s/AKfycbzGix0nJhP4JaWQgZR6uxWz7i20NikpW1e3lZZHezyeoMEI6IZmWpvoowO5oVJL8uiu_w/exec';
export interface IApiResponse{
    status:string;
    data:any;
}

export function GetSheetNames(handler:(response:IApiResponse)=>void){
    axios({
        url:webApiBaseUrl,
        method:'GET',
        params:{method:'getSheetNames'}
    })
    .then((response:any)=>{
        if(handler){
            handler(response.data);
        }
    });
}
export function GetAllRows(shName:string,handler:(response:IApiResponse)=>void){
    axios({
        url:webApiBaseUrl,
        method:'GET',
        params:{method:'getAllRows',sheetName:'EmoLvl1-2'}
    })
    .then((response:any)=>{
        if(handler){
            if(response.data.status === "ok"){
                //Ok
                let itemsSrc:any[] = response.data.data;
                let items:IItem[] = [];
                itemsSrc.forEach((itm) => {
                    let newItm:IItem = {
                            uid:itm.uid,
                            q:{lang:'en-US',text:itm.En},
                            a:{lang:'ru-RU',text:itm.Ru},
                            r:{lcnt:itm.lcnt?itm.lcnt:0,
                                Asf:itm.Asf?itm.Asf:0,
                                Asr:itm.Asr?itm.Asr:0,
                                Aer:itm.Aer?itm.Aer:0,
                                Aef:itm.Aef?itm.Aef:0,
                                Aw:itm.Aw?itm.Aw:0,
                                ts:itm.ts?itm.ts:0}};
                    items.push(newItm);
                });
                response.data.data = items;
                handler(response);
            } else {
                //Error
                handler(response.data);
            }
        }
    })
    .catch((err)=>{
        if(handler){
            handler(err);
        }
    }
    );
}

export function storeResult(resultItems:IItem[]){
    let dataObj = {method:'storeResult',items:resultItems};
    let dataObjJson = JSON.stringify(dataObj);
    axios({
        url:webApiBaseUrl,
        method:'POST',
        data:dataObjJson
    })
    .then(resp=>{
        let s=1;
    })
    .catch(err=>{
        let s=1;
    });
    
}