import axios from "axios";
import { IItem } from "./CommonTypes";


const webApiBaseUrl = 'https://script.google.com/macros/s/AKfycbytBZypIhkxekiEn52B_GgKhhJBHBauCIhi0pD38zLiXlxFgx0G8vR-9Bt3_5hjtKb4zw/exec';
export interface IApiResponse{
    isOk:boolean;
    result:IItem[];
    error:any;
    eventObj:any
}
export function GetAllRows(handler:(response:IApiResponse)=>void){
    axios({
        url:webApiBaseUrl,
        method:'GET',
        params:{method:'getAllRows'}
    })
    .then((response)=>{
        if(handler){
            if(response.data.isOk){
                let itemsSrc:any[] = response.data.result;
                let items:IItem[] = [];
                itemsSrc.forEach((itm) => {
                    let newItm:IItem = {
                            q:{lang:'en-US',text:itm.En},
                            a:{lang:'ru-RU',text:itm.Ru},
                            r:{lcnt:itm.lcnt?itm.lcnt:0,
                                fsa:itm.fsa?itm.fsa:0,
                                rsa:itm.rsa?itm.rsa:0,
                                ts:itm.ts?itm.ts:0}};
                    items.push(newItm);
                });
                response.data.result = items;                
                handler(response.data);
            } else {
                handler(response.data);
            }
        }
    })
    .catch((err)=>{
        if(handler){
            handler({isOk:false,result:[],error:err,eventObj:undefined});
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