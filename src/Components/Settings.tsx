import React, { useEffect, useState } from 'react';
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
    let selectedItem: any = "";
    if (selectedItemTitle) {
        selectedItem = props.items.find(itm => {
            if (props.displayMember) {
                return itm[props.displayMember] === selectedItemTitle;
            }
            return itm === selectedItemTitle;
        });
    } else {
        if (props.items.length > 0) selectedItem = props.items[0];
        let storedValue: any = selectedItem;
        if (props.displayMember) storedValue = selectedItem[props.displayMember];
        AppSessionData.prop(props.propId, storedValue);
    }
    return (
        <div className="settings-bool-item">
            <div>{props.labelText}</div>
            <DropDownBox items={props.items} clsName="settings_ddown" selectedItem={selectedItem}
                onItemSelected={(selItem: any) => {
                    let storedValue = selItem;
                    if (props.displayMember) storedValue = selItem[props.displayMember];
                    AppSessionData.prop(props.propId, storedValue);
                    props.onItemSelected(selItem);
                }}
                displayMember={props.displayMember} />
        </div>
    );
}


export interface ISettingsMultipleSelectChip {
    labelText: string;
    propId: TAppSesstionDataProps;
    options: string[];
    onSelectionChanged: () => void;
}
export function SettingsMultipleSelectChip(props: ISettingsMultipleSelectChip) {
    let selectedValues: any = AppSessionData.prop(props.propId);
    return (
        <div className="settings-bool-item">
            <div>{props.labelText}</div>
            {props.options.length === 0 && <div>Loading...</div>}
            {props.options.length > 0 &&
                <MultipleSelectChip options={props.options} selectedValues={selectedValues}
                    onSelectionChanged={(selItems: string[]) => {
                        AppSessionData.prop(props.propId, selItems);
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

const selectItemsModeOptions = ['Data sheets', 'Tasks'];

export function Settings(props: any) {
    const [sheetNames, setSheetNames] = useState([]);
    const [selectedSheetListChanged, setSelectedSheetListChanged] = useState(false);
    const [selectItemsMode, setSelectItemsMode] = useState(AppSessionData.prop('PlCfg_SelectItemsMode'));
    const [taskNames, setTaskNames] = useState<string[]>([]);
    const [selectedTaskName, setSelectedTaskName] = useState(AppSessionData.prop('PlCfg_SelectedTask'));

    useEffect(() => {
        let selectedSheetList = AppSessionData.cachedProp('CP_SelectedSheetNames');
        if (taskNames.length === 0) {
            waw.GetTaskList((response) => {
                if (response.data.status === "ok") {
                    let tasks: any[] = response.data.data;
                    let taskNames: string[] = [];
                    tasks.forEach((task) => {
                        taskNames.push(task.name);
                    });
                    setTaskNames(taskNames);
                    AppSessionData.cachedProp('CP_TaskList', tasks);
                }
            });
        }
        if (!selectedSheetList) {
            waw.GetSheetNames((result) => {
                setSheetNames(result.data);
                AppSessionData.cachedProp('CP_SelectedSheetNames', result.data);
            });
        } else {
            setSheetNames(selectedSheetList);
        }

    }, [])

    const handleSelectItemsModeChanged = (mode: string) => {
        setSelectItemsMode(mode);
        AppSessionData.prop('PlCfg_SelectItemsMode', mode);
        setSelectedSheetListChanged(true);
    };

    return (
        <div className='ph-mem'>
            <button className="toolbar-button" onClick={() => { props.onExit(selectedSheetListChanged) }}>
                <div className="img-btn img-exit-tomain" />
            </button>
            <SettingsBoolItem labelText='Say question' propId={'PlCfg_SayQuestion'} />
            <SettingsBoolItem labelText='Say answer' propId={'PlCfg_SayAnswer'} />
            <SettingsBoolItem labelText='Listen answer' propId={'PlCfg_ListenAnswer'} />
            <SettingsDropDownItem labelText='Default page' propId='PlCfg_DefaultPageTitle' items={filterUniqueByProperty(AppPages, 'title')} selectedItem={''} onItemSelected={() => { }} displayMember='title' />
            <SettingsBoolItem labelText='Reverse (question/answer)' propId={'PlCfg_ReverseOrder'} />
            <div className="settings-bool-item">
                <div>Select items mode</div>
                <div>
                    {selectItemsModeOptions.map((mode) => (
                        <label key={mode} style={{ display: 'block' }}>
                            <input
                                type="radio"
                                name="selectItemsMode"
                                checked={selectItemsMode === mode}
                                onChange={() => handleSelectItemsModeChanged(mode)}
                            />
                            {mode}
                        </label>
                    ))}
                </div>
            </div>
            {selectItemsMode === 'Data sheets' &&
                <SettingsMultipleSelectChip
                    propId='PlCfg_DataSheetNames'
                    labelText='Selected data sheets'
                    options={sheetNames}
                    onSelectionChanged={() => { setSelectedSheetListChanged(true) }}
                />
            }
            {selectItemsMode === 'Tasks' && taskNames.length === 0 && <div>Loading tasks...</div>}
            {selectItemsMode === 'Tasks' && taskNames.length > 0 &&
                <SettingsDropDownItem
                    propId='PlCfg_SelectedTask'
                    labelText='Selected task'
                    items={taskNames}
                    selectedItem={selectedTaskName}
                    onItemSelected={(selectedTaskName) => {
                        const taskList = AppSessionData.cachedProp('CP_TaskList') as unknown as any[];
                        setSelectedTaskName(selectedTaskName);
                        if (taskList) {
                            const selectedTask = taskList.find((task: any) => task.name === selectedTaskName);
                            if (selectedTask) {
                                AppSessionData.prop('PlCfg_SelectedTaskItemUids', selectedTask.itemUids);
                            } else {
                                AppSessionData.prop('PlCfg_SelectedTaskItemUids', []);
                            }
                        }
                    }}
                />
            }
        </div>
    );
}
