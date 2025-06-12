import React, { useReducer, useEffect, useState } from 'react';
import { IItem, TCrosswordPageStatus } from '../CommonTypes';
import { AppSessionData } from './AppData';
import * as waw from '../WebApiWrapper';
import InputWord from './CrossWordInput/InputWord';

export function CrosswordMemorizer(){
    const [status, setStatus] = useState<TCrosswordPageStatus>('Loading...');
    const [items, setItems] = useState<IItem[]>([]);
    const [currentItem, setCurrentItem] = useState<IItem | undefined>(undefined);
    const [show,setShow] = useState(false);
    let classBtnStartStop = status === 'Stopped'|| status ==='Loading...' ? 'img-btn img-power-off' : 'img-btn img-power-on';
    const handleBtnStartStopClick = ()=>{
        if(status === 'Started'){
            setStatus('Stopped'); 
        } else {
            setStatus('Started');
        }
    };
    const goNextItem = () => {
        let currIndex = items.findIndex(itm => itm.uid === currentItem?.uid);
        let nextIndex = currIndex + 1;
        if(nextIndex < items.length-1){
            setCurrentItem(items[nextIndex]);
        } else {
            setCurrentItem(items[0]);
        }
    }
    const shName = AppSessionData.prop('PlCfg_DataSheetName');
    useEffect(() => {
        waw.GetAllRows(shName,(resp:waw.IApiResponse) => {
            if(resp.data.status == "ok"){
                setItems(resp.data.data);
                setStatus('Stopped');
            }
        });
    }, []);
    const handleBtnNextClick = ()=>{
        if(show){
            goNextItem();
            setShow(false);
        } else {
            setShow(true);
        }
    };
    const handleBtnSettingsClick = ()=>{}; 
    return (
        <div className='ph-mem'>
            {status == 'Loading...' && <div>loading...</div>}
            {status !== 'Loading...' &&(
                <div className='ph-mem__toolbar' >
                <button className="toolbar-button" onClick={() => handleBtnStartStopClick()}>
                    <div className={classBtnStartStop} />
                </button>
                <button className="toolbar-button" onClick={() => handleBtnNextClick()}>
                    <div className="img-btn img-right" />
                </button>
                <button className="toolbar-button" onClick={() => handleBtnSettingsClick()}>
                    <div className="img-btn img-config" />
                </button>
        </div>

            )}
            {currentItem && (
                <InputWord questionString={currentItem.q.text} answerString={currentItem.a.text} 
                onComplete={() => {
                    goNextItem();
                }} showAnswer={show} />
            )}
        </div>
    );}