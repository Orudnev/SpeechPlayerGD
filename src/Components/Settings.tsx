import React, { useReducer, useEffect, useState } from 'react';
import { AppGlobal } from '../App';
import { AppSessionData, TAppSesstionDataProps } from './AppData';
import Switch from './Switch/Switch';
import DropDownBox, { IDropDownProps } from './DropDownBox/DropDownBox';
import { AppPages, filterUniqueByProperty } from '../CommonTypes';

export interface ISettingsBoolItemProps {
    labelText:string;
    propId:TAppSesstionDataProps;
}

function SettingsBoolItem(props:ISettingsBoolItemProps){
    return(
        <div className="settings-bool-item">
            <div>{props.labelText}</div>
            <div><Switch propId={props.propId} /></div>
        </div>
    );
}

export interface ISettingsDropDownItemProps extends IDropDownProps {
    labelText:string;
    propId:TAppSesstionDataProps;    
}
export function SettingsDropDownItem(props:ISettingsDropDownItemProps){
    return(
        <div className="settings-bool-item">
            <div>{props.labelText}</div>
            <DropDownBox items={props.items} clsName="settings_ddown" selectedItem={props.selectedItem} onItemSelected={props.onItemSelected} displayMember={props.displayMember} />
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
            <SettingsBoolItem labelText='Say answer' propId={'PlCfg_SayAnswer'}/>
            <SettingsBoolItem labelText='Listen answer' propId={'PlCfg_ListenAnswer'}  />
            <SettingsDropDownItem labelText='Default page' propId='PlCfg_DefaultPageUrl' items={filterUniqueByProperty(AppPages,'title')} selectedItem={'bbb'} onItemSelected={()=>{}} displayMember='title'  />
        </div>
    );
}
