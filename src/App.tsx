import React,{useReducer,useEffect,useState} from 'react';
import {
  Routes,
  Route,
  useNavigate,
  Navigate,
  Link  
} from "react-router-dom";
import './App.css';

export const AppGlobal = {
  navigate:(url:any)=>{},
  dispatch:(action:any)=>{},
  state:{}
}

function App() {
  AppGlobal.navigate = useNavigate();
  //const [state, dispatch] = useReducer(appReducer, appInitState);
  //AppGlobal.state = state;
  //AppGlobal.dispatch = dispatch;
  //@ts-ignore
  window.appg = AppGlobal;
  return ( 
    <div> 
      <Routes>
        <Route path={"/"} element={<div>Main Page</div>} />
      </Routes>
    </div> 
    );
  }

export default App;
