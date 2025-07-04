import React, { useReducer, useEffect, useState, useRef } from 'react';
import { IItem, ISubItem, TCrosswordPageStatus } from '../CommonTypes';
import { AppSessionData } from './AppData';
import * as waw from '../WebApiWrapper';
import InputWord, { InputWordsMethods } from './CrossWordInput/InputWord';
import { SayText } from './SayText';
import { Settings } from './Settings';
import { SpeechRecognizer } from './SR/SpeechRecognizer';

function UpdateItemRating(currItem: IItem, addSuccessCount: boolean): void {
    if (!currItem.r) {
        currItem.r = { Asf: 0, Aw: 0, Aef: 0, Aer: 0, Asr: 0, lcnt: 0, ts: 0 };
    }
    if (addSuccessCount) {
        currItem.r.Asf++;
        return;
    }
    currItem.r.lcnt++;
    currItem.r.ts = Date.now();
    SendItemRatingsToServer([currItem]);
}

function SendItemRatingsToServer(items: IItem[]) {
    let rows = items.map(itm => {
        let row = {
            Uid: itm.uid,
            En: itm.a.text,
            Ru: itm.q.text,
            Lcnt: itm.r?.lcnt,
            Asf: itm.r?.Asf,
            Asr: itm.r?.Asr,
            Aer: itm.r?.Aer,
            Aef: itm.r?.Aef,
            Ts: itm.r?.ts
        }
        return row;
    });
    const shName = AppSessionData.prop('PlCfg_DataSheetName');
    waw.UpdateRows(shName, rows);
}

export function CrosswordMemorizer() {
    const inpWordRef = useRef<InputWordsMethods>(null);
    const [status, setStatus] = useState<TCrosswordPageStatus>('Loading...');
    const [items, setItems] = useState<IItem[]>([]);
    const [currentItem, setCurrentItem] = useState<IItem | undefined>(undefined);
    const [isSettingsMode, setIsSettingsMode] = useState<boolean>(false);
    const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
    const [isMicrophoneOn, setIsMicrophoneOn] = useState<boolean>(false);
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
        if (currentItem) {
            UpdateItemRating(currentItem, false);
        }
        const minIntervalMs = 3000;
        let currItem = items.reduce((acc, curr) => {
            let currTs = Date.now();
            if (acc.r && curr.r) {
                if (currTs - curr.r.ts < 3000) {
                    return acc;
                }
                if (curr.r.lcnt < acc.r.lcnt) {
                    return curr;
                }
                if (curr.r.lcnt < acc.r.lcnt && curr.r.Asf < acc.r.Asf) {
                    return curr;
                }
            }
            return acc;
        }, items[0]);
        if (inpWordRef.current && currItem) {
            inpWordRef.current.loadNewItem(currItem.q.text, currItem.a.text);
            setStatus("Started");
        }
        setCurrentItem(currItem);
        setStatus("LoadNewItem");
    }

    const shName = AppSessionData.prop('PlCfg_DataSheetName');
    if (!shName) {
        setTimeout(() => {
            setIsSettingsMode(true);
        }, 0);
    }
    useEffect(() => {
        waw.GetAllRows(shName, (resp: waw.IApiResponse) => {
            if (resp.data.status == "ok") {
                setItems(resp.data.data);
                setStatus('Stopped');
            }
        });
    }, []);

    const sayAnswer = (onComplete?: () => void) => {
        if (currentItem) {
            let sbItem: ISubItem = { text: currentItem.a.text, lang: currentItem.a.lang };
            setIsSpeaking(true);
            SayText.addMessage(sbItem, () => {
                setIsSpeaking(false);
                if (onComplete) {
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

    const handleBtnSettingsClick = () => setIsSettingsMode(true);
    const handleBtnSoundClick = () => {
        sayAnswer();
    };
    if (isSettingsMode) {
        return (<Settings onExit={() => setIsSettingsMode(false)} />);
    }
    const soundBtnClass = isSpeaking ? 'toolbar-button toolbar-button_pressed' : 'toolbar-button';
    const microphoneBtnClass = isMicrophoneOn ? 'toolbar-button toolbar-button_pressed' : 'toolbar-button';
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
                    {currentItem &&
                        <button className={soundBtnClass} onClick={() => handleBtnSoundClick()}>
                            <div className="img-btn img-sound" />
                        </button>
                    }
                    {currentItem &&
                        <button className={microphoneBtnClass} onMouseDown={() => {
                            setIsMicrophoneOn(true);
                            //
                        }} onMouseUp={() => {
                            setIsMicrophoneOn(false);
                        }}>
                            <div className="img-btn img-microphoneOn" />
                        </button>
                    }
                </div>

            )}
            <SpeechRecognizer
                onWordsRecognized={(words: string[])=>{
                    inpWordRef.current?.inputAnswerProgrammatically(words);
                }}
                listening={isMicrophoneOn}
                lang="en-US"
            />
            <InputWord ref={inpWordRef}
                onComplete={() => {
                    if (currentItem) {
                        UpdateItemRating(currentItem, true);
                    }
                    sayAnswer(() => goNextItem());
                }} />
        </div>
    );
}