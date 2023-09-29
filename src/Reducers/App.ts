import { Reducer } from 'redux';


export interface IAppSettings {
    testSetting: string;
}
export const initAppSettings: IAppSettings = {
    testSetting:"blablabla"
};

export interface ITestAction{
    type:"TestAction",
    testSetting:string
}

export type TAppAction = ITestAction;

const appReducer:Reducer<IAppSettings,TAppAction> = (state = initAppSettings,action)=>{
    let newState = {...state};
    switch (action.type){
        case 'TestAction':
            newState.testSetting = action.testSetting;
            return newState;
            break; 
    }
    return state;
}   

export default appReducer;