import React, { useEffect, useState } from 'react';
import {
  Routes,
  Route,
  NavigateFunction,
  useNavigate,
  Navigate,
  Link
} from "react-router-dom";
import './App.css';
import './Images.css';
import { AppSessionData  } from './Components/AppData';
import { store, TAllActions, IAppState } from './Reducers/index';
import { SayText } from './Components/SayText';
import { AppPages, ISubItem } from './CommonTypes';
import { GetAllRows, GetPrompt, IApiResponse } from './WebApiWrapper';
import { SortRows } from './Components/CrosswordMemorizer';

class AppGlobalClass {
  private navfunc: NavigateFunction | undefined = undefined;
  signalR: any;
  //signalRGate:SRGateClass|undefined=undefined;
  prevAction: any = null;
  dispatchFunc: any = undefined;
  hwConnectorPort: string = "";
  constructor() {
    this.getState = this.getState.bind(this);
    this.navigate = this.navigate.bind(this);
  }

  init(navf: NavigateFunction) {
    this.navfunc = navf;
  }

  dispatch(action: TAllActions) {
    store.dispatch(action);
  }

  navigate(url: any) {
    if (this.navfunc) {
      this.navfunc(url);
    }
  }

  getState(): IAppState {
    let st = store.getState();
    return st;
  }

  async getAllRows(): Promise<IApiResponse> {
    const response = await GetAllRows("All");
    if (response.status === "ok") {
      response.data.sort(SortRows);
    }
    console.log("done");
    return response;
  }

  async printAllRows(onlyText:boolean = false){
    const response = await this.getAllRows();
    if (response.status !== "ok") {
      console.error("Unable to load rows", response.error);
      return;
    }

    response.data.forEach((itm:any)=>{
        let d = new Date(itm.r.ts);
        let dStr = d.getFullYear().toString()+(d.getMonth()+1).toString() + d.getDate().toString() +" "+d.getHours().toString() +":"+d.getMinutes().toString()+":"+ d.getSeconds().toString();
        let out=dStr+" "+itm.SheetName+" "+itm.a.text+"\r";
        if(onlyText) {
          out=itm.a.text+"\r";          
          console.log(out);          
        } else {
          console.log(out);          
        } 
    });
  } 

  getPrompt(){
    window.dispatchEvent(new CustomEvent("promptbtn:toggle",{detail:true}));
  }
  
  getAppSessionData(){
    return AppSessionData;
  }

}

export const AppGlobal = new AppGlobalClass();


const Root = () => {
  return (
    <div>Root</div>
  );
}


function App() {
  AppGlobal.init(useNavigate());
  //@ts-ignore
  window.appg = AppGlobal;
  
  useEffect(() => {
    let pgTitle = AppSessionData.prop('PlCfg_DefaultPageTitle');
    if(pgTitle){
      let pg = AppPages.find(p=>{return p.title==pgTitle;});
      AppGlobal.navigate(pg?.path);
    }
  }, []);
  return (
    <div>
      <Routes>
        {AppPages.map((p,i)=><Route key={i} path={p.path} element={p.getElement()} />)}
      </Routes> 
    </div>
  );
}

export default App;

