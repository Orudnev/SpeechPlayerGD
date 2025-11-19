import axios from "axios";
import { IItem } from "./CommonTypes";


const webApiBaseUrl = 'https://script.google.com/macros/s/AKfycbzXr84gcGgTyaVwdI9IZTvZMPOlHp8LDX3ZuLBNKs18c1CnwgJj_oY-dm8jOPxCvBtM4A/exec';
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
        params:{method:'getAllRows',sheetName:shName}
    })
    .then((response:any)=>{
        if(handler){
            if(response.data.status === "ok"){
                //Ok
                let itemsSrc:any[] = response.data.data;
                let items:IItem[] = [];
                itemsSrc.forEach((itm) => {
                    let newItm:IItem = {
                            SheetName:itm.SheetName,
                            uid:itm.Uid,
                            q:{lang:'ru-RU',text:itm.Ru},
                            a:{lang:'en-US',text:itm.En},
                            r:{lcnt:itm.Lcnt?itm.Lcnt:0,
                                Asf:itm.Asf?itm.Asf:0,
                                Asr:itm.Asr?itm.Asr:0,
                                Aer:itm.Aer?itm.Aer:0,
                                Aef:itm.Aef?itm.Aef:0,
                                Aw:itm.Aw?itm.Aw:0,
                                ts:itm.Ts?itm.Ts:0}};
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



export function UpdateRows(shName:string,rows:any[]){
    const encoder = new TextEncoder();
    const encodedBytes:Uint8Array = encoder.encode(JSON.stringify(rows));
    let binaryString:string = "";    
    encodedBytes.forEach(byte => {
        binaryString += String.fromCharCode(byte);
    });
    const encodedBase64Rows: string = btoa(binaryString);
    axios({
        url:webApiBaseUrl,
        method:'GET',
        params:{method:'updateRows',sheetName:shName,rows:encodedBase64Rows}
    })
    .then((response:any)=>{
        let s = response;
    });
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