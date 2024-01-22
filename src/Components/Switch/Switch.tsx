import React, { useReducer, useEffect, useState } from 'react';
import { AppSessionData, TAppSesstionDataProps } from '../AppData';
import './Switch.css';


export interface ISwitchProps{
    propId:TAppSesstionDataProps
}
export default function Switch(props:ISwitchProps){
    const [selected,setSelection] = useState(AppSessionData.prop(props.propId));
    return (
        <label className="switch">
            <input type="checkbox" checked={selected} onChange={(e:any)=>{
                AppSessionData.prop(props.propId,e.currentTarget.checked);
                setSelection(e.currentTarget.checked);
            }} />
            <span className="slider round"></span>
        </label>        
    );
}
