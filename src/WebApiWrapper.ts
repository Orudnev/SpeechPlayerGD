import axios from "axios";
import { IItem } from "./CommonTypes";


const webApiBaseUrl = 'https://script.google.com/macros/s/AKfycby6LK-yQlCbfHeVWJ07OKsucHmedgjRrf4LO6fqPuKeLmZ3o5c4C3JucR68E-J-9CMFJQ/exec';
export interface IApiResponse{
    status:string;
    data:any;
    error?: {
        message:string;
        code?:string;
        httpStatus?:number;
    };
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

export function GetTaskList(handler:(response:IApiResponse)=>void){
    return axios({
        url:webApiBaseUrl,
        method:'GET',
        params:{method:'getTaskList'}
    })
    .then((response:any)=>{
        if(handler){
            if(response.data.status === "ok"){
                //Ok
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
    });
}

export function GetAllRows(shName:string,handler:(response:IApiResponse)=>void):Promise<IApiResponse>{
    const callHandler = (response:IApiResponse) => {
        try {
            handler(response);
        } catch (err) {
            // An exception in UI code must not be reported as an HTTP failure.
            console.error("GetAllRows response handler failed", err);
        }
    };

    return axios<IApiResponse>({
        url:webApiBaseUrl,
        method:'GET',
        params:{method:'getAllRows',sheetName:shName},
        // Axios otherwise waits indefinitely (its default timeout is 0).
        timeout:25_000,
        timeoutErrorMessage:'GetAllRows request timed out after 25 seconds'
    })
    .then((response) => {
        const apiResponse = response.data;
        if (apiResponse.status === "ok") {
            if (!Array.isArray(apiResponse.data)) {
                throw new Error('GetAllRows returned an invalid data payload');
            }

            const items:IItem[] = apiResponse.data.map((itm:any) => ({
                SheetName:itm.SheetName,
                uid:itm.Uid,
                q:{lang:'ru-RU',text:itm.Ru},
                a:{lang:'en-US',text:itm.En},
                r:{lcnt:itm.Lcnt || 0,
                    Asf:itm.Asf || 0,
                    Asr:itm.Asr || 0,
                    Aer:itm.Aer || 0,
                    Aef:itm.Aef || 0,
                    Aw:itm.Aw || 0,
                    ts:itm.Ts || 0,
                    Dfclty:itm.Dfclty || 0}
            }));
            apiResponse.data = items;
        } else {
            console.warn('GetAllRows API returned an error', apiResponse);
        }

        callHandler(apiResponse);
        return apiResponse;
    })
    .catch((err:unknown) => {
        const axiosError = axios.isAxiosError(err) ? err : undefined;
        const errorResponse:IApiResponse = {
            status:'error',
            data:null,
            error:{
                message:axiosError?.message || (err instanceof Error ? err.message : 'Unknown GetAllRows error'),
                code:axiosError?.code,
                httpStatus:axiosError?.response?.status
            }
        };
        console.error('GetAllRows failed', errorResponse.error, err);
        callHandler(errorResponse);
        return errorResponse;
    });
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

export function  GetPrompt(){
    return axios({
        url:webApiBaseUrl,
        method:'GET',
        params:{method:'getPrompt'}
    });
}
