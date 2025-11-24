import React, { useReducer, useEffect, useState } from 'react';
import { AppGlobal } from '../App';
import { AppSessionData, TAppSesstionDataProps } from './AppData';
import Switch from './Switch/Switch';
import DropDownBox, { IDropDownProps } from './DropDownBox/DropDownBox';
import { AppPages, filterUniqueByProperty } from '../CommonTypes';
import MultipleSelectChip from './MultipleSelectChip';
import * as waw from '../WebApiWrapper';

export interface ISettingsBoolItemProps {
    labelText: string;
    propId: TAppSesstionDataProps;
}

function SettingsBoolItem(props: ISettingsBoolItemProps) {
    return (
        <div className="settings-bool-item">
            <div>{props.labelText}</div>
            <div><Switch propId={props.propId} /></div>
        </div>
    );
}

export interface ISettingsDropDownItemProps extends IDropDownProps {
    labelText: string;
    propId: TAppSesstionDataProps;
}
export function SettingsDropDownItem(props: ISettingsDropDownItemProps) {
    let selectedItemTitle = AppSessionData.prop(props.propId);
    let selectedItem:any = "";
    if(selectedItemTitle){
        selectedItem = props.items.find(itm=>{
            if(props.displayMember){
                return itm[props.displayMember]===selectedItemTitle;
            } 
            return itm===selectedItemTitle;
        });
    } else {
        if(props.items.length>0) selectedItem = props.items[0];
        let storedValue:any = selectedItem;
        if(props.displayMember) storedValue = selectedItem[props.displayMember];
        AppSessionData.prop(props.propId,storedValue);
    }
    return (
        <div className="settings-bool-item">
            <div>{props.labelText}</div>
            <DropDownBox items={props.items} clsName="settings_ddown" selectedItem={selectedItem}
                onItemSelected={(selItem: any) => {
                    let storedValue = selItem;
                    if(props.displayMember) storedValue = selItem[props.displayMember];
                    AppSessionData.prop(props.propId,storedValue);
                    props.onItemSelected(selItem);
                }}
                displayMember={props.displayMember} />
        </div>
    );
}


export interface ISettingsMultipleSelectChip {
    labelText: string;
    propId: TAppSesstionDataProps;
    options:string[];
    onSelectionChanged:()=>void;
}
export function SettingsMultipleSelectChip(props: ISettingsMultipleSelectChip) {
    let selectedValues:any = AppSessionData.prop(props.propId);
    return (
        <div className="settings-bool-item">
            <div>{props.labelText}</div>
            {props.options.length===0 && <div>Loading...</div>}
            {props.options.length>0 &&
                <MultipleSelectChip options={props.options} selectedValues={selectedValues}
                    onSelectionChanged={(selItems: string[]) => {
                        AppSessionData.prop(props.propId,selItems);
                        props.onSelectionChanged();
                    }}
                 />
            }
        </div>
    );
}

export interface ISettingsProps {
    onExit: (selectedSheetListChanged: boolean) => void;
}

export function Settings(props: any) {
    const [sheetNames,setSheetNames] = useState([]);
    const [selectedSheetListChanged,setSelectedSheetListChanged] = useState(false);
    useEffect(() => {
        let selectedSheetList = AppSessionData.cachedProp('CP_SelectedSheetNames');
        if(!selectedSheetList){
            waw.GetSheetNames((result) => {
                setSheetNames(result.data);
                AppSessionData.cachedProp('CP_SelectedSheetNames',result.data);
            });
        } else {
            setSheetNames(selectedSheetList);
        }

    },[])
    return (
        <div className='ph-mem'>
            <button className="toolbar-button" onClick={() => { props.onExit(selectedSheetListChanged) }}>
                <div className="img-btn img-exit-tomain" />
            </button>
            <SettingsBoolItem labelText='Say answer' propId={'PlCfg_SayAnswer'} />
            <SettingsBoolItem labelText='Listen answer' propId={'PlCfg_ListenAnswer'} />
            <SettingsDropDownItem labelText='Default page' propId='PlCfg_DefaultPageTitle' items={filterUniqueByProperty(AppPages, 'title')} selectedItem={''} onItemSelected={() => { }} displayMember='title' />
            <SettingsBoolItem labelText='Reverse (question/answer)' propId={'PlCfg_ReverseOrder'} />
            <SettingsMultipleSelectChip 
                propId='PlCfg_DataSheetNames' 
                labelText='Selected data sheets' 
                options={sheetNames} 
                onSelectionChanged={()=>{setSelectedSheetListChanged(true)} } 
            />
        </div>
    );
}
