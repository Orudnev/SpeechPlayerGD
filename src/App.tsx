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
import { AppSessionData, TAppSettigs } from './Components/AppData';
import { store, TAllActions, IAppState } from './Reducers/index';
import { SpeechRecognizer, SRResultAlternative, TResultHandler } from './Components/SR/SpeechRecognizer';
import SRResultComparer from './Components/SR/SRResultComparer';
import SRResultCmdDetector from './Components/SR/SRResultCmdDetector';
import { ColorWords } from './Components/ColorWords';
import { PhraseMemorizer } from './Components/PhraseMemorizer';
import { SayText } from './Components/SayText';
import { ISubItem } from './CommonTypes';



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
  let phrase = "Nothing you can do that can't be done";
  //let hl = [false,true,false,true,false,true,false,true];
  const [wrdStatuses,setWrdStatuses] = useState([false]);
  var handleClick = () => {
    let msg:ISubItem = {lang:'ru-RU',text:"чу чу чу стучат копыта"};
    SayText.addMessage(msg);  
        
    // SRResultComparer.startNewComparison(phrase, 20000, () => {
    //   let s = SRResultComparer.getWrdCmpResult();
    //   console.log(JSON.stringify(s));
    //   setWrdStatuses(s);
    // });
  }
  return (
    <div onClick={() => handleClick()}>
      {/* Lesson1      
      <ColorWords text={phrase} wordStatuses={SRResultComparer.getWrdCmpResult()} /> */}
      <PhraseMemorizer getNextItem={()=>{
        return {a:{lang:'en-US',text:'Waterfall'},q:{lang:'ru-RU',text:'водопад'}};
      }} />
    </div>
  );
}

function App() {
  AppGlobal.init(useNavigate());
  //@ts-ignore
  window.appg = AppGlobal;
  let d = SRResultCmdDetector;
  
  useEffect(() => {
    //AppGlobal.navigate("/SpeechPlayerGD/Lesson1");
  }, []);
  let as = AppSessionData.prop('LastRowSetGettingMethod');
  AppSessionData.prop('LastRowSetGettingMethod', "byrbyrbyr1");
  return (
    <div>
      <Routes>
        <Route path={"/"} element={<PhraseMemorizer />} />
        <Route path={"/SpeechPlayerGD"} element={<Root />} />
        <Route path={"/SpeechPlayerGD/Lesson1"} element={<Lesson1 />} />
      </Routes>
    </div>
  );
}

export default App;
