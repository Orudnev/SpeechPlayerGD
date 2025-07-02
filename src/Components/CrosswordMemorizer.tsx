import React, { useReducer, useEffect, useState, useRef } from 'react';
import { IItem, ISubItem, TCrosswordPageStatus } from '../CommonTypes';
import { AppSessionData } from './AppData';
import * as waw from '../WebApiWrapper';
import InputWord, { InputWordsMethods } from './CrossWordInput/InputWord';
import { SayText } from './SayText';

export function CrosswordMemorizer() {
    const inpWordRef = useRef<InputWordsMethods>(null);
    const [status, setStatus] = useState<TCrosswordPageStatus>('Loading...');
    const [items, setItems] = useState<IItem[]>([]);
    const [currentItem, setCurrentItem] = useState<IItem | undefined>(undefined);
    let classBtnStartStop = status === 'Stopped' || status === 'Loading...' ? 'img-btn img-power-off' : 'img-btn img-power-on';
    const handleBtnStartStopClick = () => {
        if (status === 'Started') {
            setStatus('Stopped');
        } else {
            setStatus('Started');
            if (!currentItem) {
                goNextItem();
            }
        }
    };
    const goNextItem = () => {
        let currIndex = items.findIndex(itm => itm.uid === currentItem?.uid);
        let nextIndex = currIndex + 1;
        let currItem = items[0];
        if (nextIndex < items.length - 1) {
            currItem = items[nextIndex];
        }
        if (inpWordRef.current && currItem ) {
            inpWordRef.current.loadNewItem(currItem.q.text, currItem.a.text);
            setStatus("Started");
        }
        setCurrentItem(currItem);
        setStatus("LoadNewItem");
    }

    const shName = AppSessionData.prop('PlCfg_DataSheetName');
    useEffect(() => {
        waw.GetAllRows(shName, (resp: waw.IApiResponse) => {
            if (resp.data.status == "ok") {
                setItems(resp.data.data);
                setStatus('Stopped');
            }
        });
    }, []);

    const sayAnswer = (onComplete?:()=>void) => { 
        if(currentItem) {
            let sbItem:ISubItem = {text:currentItem.a.text,lang:currentItem.a.lang};
            SayText.addMessage(sbItem,()=>{
                if(onComplete) {
                    onComplete();
                }
            });                    
        }
    };
    const handleBtnNextClick = () => {
        if (status !== "ShowAnswer") {
            setStatus("ShowAnswer");
            inpWordRef.current?.showAnswer(true);
            sayAnswer();
        }
        if (status === "ShowAnswer") {
            setStatus("Started");
            inpWordRef.current?.showAnswer(false);
            goNextItem();
        }
    };

    const handleBtnSettingsClick = () => { };
    return (
        <div className='ph-mem'>
            {status == 'Loading...' && <div>loading...</div>}
            {status !== 'Loading...' && (
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
            <InputWord ref={inpWordRef}
                onComplete={() => {
                    sayAnswer(()=>goNextItem());
                }} />
        </div>
    );
}