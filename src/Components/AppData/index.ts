export type TRowSetGettingMethod = "getAllRows";
export type TAppSettigs = "AppSessionData"|"AppConfigData";

// export interface IAppSessionDataProps{
//     LastDocumentId:string;
//     LastRowSetGettingMethod:string;
// }

abstract class AppSettingsBase {
    abstract readonly lstorageKey:string;
    abstract readonly initPropsObj:any;
    readSettings():any{
        let jsonStr = localStorage.getItem(this.lstorageKey);
        if(jsonStr){
            try{
                let result = JSON.parse(jsonStr);
                return result;
            }
            catch{
                return undefined;
            }
        }
        return undefined;
    }

    prop(propName:string,value:any = undefined){
        let storedSettings = this.readSettings();
        let hasStoredValue = storedSettings && storedSettings.hasOwnProperty(propName);
        if(value === undefined){
            if(hasStoredValue){
                return storedSettings[propName];
            }
            return this.initPropsObj[propName];
        }
        let jsonStr = "";
        if(hasStoredValue){
            storedSettings[propName] = value;
            jsonStr = JSON.stringify(storedSettings);
        } else {
            this.initPropsObj[propName] = value;
            jsonStr = JSON.stringify(this.initPropsObj);
        }
        localStorage.setItem(this.lstorageKey,jsonStr);
    }
}

export interface IAppSession{
    PlCfg_SayAnswer:boolean;
    PlCfg_ListenAnswer:boolean;
}

const AppSessionDataDefaultValues:IAppSession = {
    PlCfg_SayAnswer:false,
    PlCfg_ListenAnswer:true
}

export type TAppSesstionDataProps = keyof typeof AppSessionDataDefaultValues;

class AppSessionDataClass extends AppSettingsBase {
    lstorageKey="AppSessionData";
    initPropsObj = AppSessionDataDefaultValues;
    prop(propName:TAppSesstionDataProps,value:any=undefined){
        if(value === undefined){
            return super.prop(propName);
        }
        super.prop(propName,value);
    }   
} 

export const AppSessionData = new AppSessionDataClass();
