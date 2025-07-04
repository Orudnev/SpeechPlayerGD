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

