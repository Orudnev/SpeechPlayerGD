import React, { useReducer, useEffect, useState } from 'react';
import {
  Routes,
  Route,
  NavigateFunction,
  useNavigate,
  Navigate,
  Link
} from "react-router-dom";
import './App.css';
import { AppSessionData, TAppSettigs } from './Components/AppData';
import { store, TAllActions, IAppState } from './Reducers/index';
import { SpeechRecognizer, SRResultAlternative, TResultHandler } from './Components/SpeechRecognizer';
import SRResultComparer from './Components/SRResultComparer';
import SRResultCmdDetector from './Components/SRResultCmdDetector';



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

  navigate(url: string) {
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




const Lesson1 = () => {
  var handleClick = () => {
    SRResultComparer.startNewComparison("Nothing you can do that can't be done", 20000, (bresult) => {
      console.log(bresult);
    });
  }
  return (
    <div onClick={() => handleClick()}>Lesson1</div>
  );
}

function App() {
  AppGlobal.init(useNavigate());
  //@ts-ignore
  window.appg = AppGlobal;
  let d = SRResultCmdDetector;
  useEffect(() => {
    AppGlobal.navigate("/SpeechPlayerGD/Lesson1");
  }, []);
  let as = AppSessionData.prop('LastRowSetGettingMethod');
  AppSessionData.prop('LastRowSetGettingMethod', "byrbyrbyr1");
  return (
    <div>
      <Routes>
        <Route path={"/"} element={<Root />} />
        <Route path={"/SpeechPlayerGD"} element={<Root />} />
        <Route path={"/SpeechPlayerGD/Lesson1"} element={<Lesson1 />} />
      </Routes>
    </div>
  );
}

export default App;
