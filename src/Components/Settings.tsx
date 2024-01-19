import React, { useReducer, useEffect, useState } from 'react';
import { AppGlobal } from '../App';
import Switch from './Switch/Switch';

export interface ISettingsBoolItemProps {
    labelText:string;
}

function SettingsBoolItem(props:ISettingsBoolItemProps){
    return(
        <div className="settings-bool-item">
            <div>{props.labelText}</div>
            <div><Switch /></div>
        </div>
    );
}

export interface ISettingsProps{
    onExit:()=>void;
}
export function Settings(props:any){
    return(
        <div className='ph-mem'>
            <button className="toolbar-button" onClick={()=>{props.onExit()}}>
                <div className="img-btn img-exit" />
            </button>            
            <SettingsBoolItem labelText='Say answer'/>
            <SettingsBoolItem labelText='Listen answer'/>
        </div>
    );
}