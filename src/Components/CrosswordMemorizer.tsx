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
        if(currItem.r.Aef > 0) currItem.r.Aef--;
        if(currItem.r.lcnt<currItem.r.Asf) currItem.r.lcnt = currItem.r.Asf;
        SendItemRatingsToServer(currItem);
        return;
    }
    currItem.r.lcnt++;
    currItem.r.ts = Date.now();
    SendItemRatingsToServer(currItem);
}

function SendItemRatingsToServer(itm: IItem) {
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
    };
    const shName = AppSessionData.prop('PlCfg_DataSheetName');
    waw.UpdateRows(itm.SheetName, [row]);
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
        const minIntervalSecond= 60;
        const minInterval = minIntervalSecond * 1000;
        const dtnow = Date.now();
        if(currentItem && currentItem.r){
            currentItem.r.ts = dtnow;
        }
        let nextItems = items.filter(itm=>{
            //1. отфильтровать элементы которые не использовались более minInterval
            return itm.r && dtnow - itm.r.ts > minInterval;
        })
        .sort((a,b)=>{
            if(a.r && b.r){
                //2. Сортировать по Aef (отказ от ответа, большее количество повторений в начале)
                let result = b.r.Aef - a.r.Aef; 
                if(result){
                    return result;
                } 
                //3. Сортировать по Lcnt (меньшие значения в начале)
                result = a.r.lcnt - b.r.lcnt;
                if(result !==0) {
                    return result;
                }
                //3. Сортировать по Asf (количество правильных ответов, меньшие значения в начале)
                result = a.r.Asf - b.r.Asf;
                return result;
            }
            return 0;
        });
        if(nextItems.length === 0) {
            //Подходящего элемента нет. Извлекаем элемент с наимболее старым таймштампом
            nextItems = items.sort((a,b)=>{
                if(a.r && b.r){
                    let result = a.r.ts - b.r.ts;
                    return result;
                }
                return 0;
            })
        }
        let newCurrItem = nextItems[0];
        if (inpWordRef.current && newCurrItem) {
            inpWordRef.current.loadNewItem(newCurrItem.q.text, newCurrItem.a.text);
            setStatus("Started");
        }
        if(currentItem){
            UpdateItemRating(currentItem, false);

        }
        setCurrentItem(newCurrItem);
        setStatus("LoadNewItem");
    }

    let shName = AppSessionData.prop('PlCfg_DataSheetName');
    if (!shName) {
        setTimeout(() => {
            setIsSettingsMode(true);
        }, 0);
    }
    const reloadData = () => {
        setStatus('Loading...');
        waw.GetAllRows(shName, (resp: waw.IApiResponse) => {
            if (resp.data.status == "ok") {
                setItems(resp.data.data);
                setStatus('Stopped');
            }
        });        
    };
    useEffect(() => {
        reloadData();
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
            let rptTimes = 1; //Количество повторений при отказе от ответа
            if(currentItem && currentItem.r){
                currentItem.r.Aef+=rptTimes;
                currentItem.r.ts = Date.now();
            }            
        }
        if (status === "ShowAnswer") {
            setStatus("Started");
            inpWordRef.current?.showAnswer(false);
            goNextItem();
        }
    };
    const handleApplySettings = (dataSheetChanged: boolean) => {
        setIsSettingsMode(false);
        if (dataSheetChanged) {
            shName = AppSessionData.prop('PlCfg_DataSheetName');
            setCurrentItem(undefined);
            reloadData();            
        }
    };

    const handleBtnSettingsClick = () => setIsSettingsMode(true);
    const handleBtnSoundClick = () => {
        sayAnswer();
    };
    if (isSettingsMode) {
        return (<Settings onExit={handleApplySettings} />);
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
                        }} onMouseUp={() => {
                            setIsMicrophoneOn(false);
                        }}
                        onTouchStart={() => {
                            setIsMicrophoneOn(true);
                        }}
                        onTouchEnd={()=>{
                            setIsMicrophoneOn(false);
                        }}
                        >
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