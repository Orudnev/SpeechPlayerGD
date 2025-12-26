import React, { useReducer, useEffect, useState, useRef } from 'react';
import { IItem, ISubItem, TCrosswordPageStatus } from '../CommonTypes';
import { AppSessionData } from './AppData';
import * as waw from '../WebApiWrapper';
import InputWord, { InputWordsMethods } from './CrossWordInput/InputWord';
import { SayText } from './SayText';
import { Settings } from './Settings';
import { SpeechRecognizer } from './SR/SpeechRecognizer';
import App, { AppGlobal } from '../App';

function UpdateItemRating(currItem: IItem, addSuccessCount: boolean): void {
    if (!currItem.r) {
        currItem.r = { Asf: 0, Aw: 0, Aef: 0, Aer: 0, Asr: 0, lcnt: 0, ts: 0 };
    }
    if (addSuccessCount) {
        if(AppSessionData.prop('PlCfg_ReverseOrder')){
            currItem.r.Asr++;
            if(currItem.r.Aer > 0) currItem.r.Aer--;
            if(currItem.r.lcnt<currItem.r.Asr) currItem.r.lcnt = currItem.r.Asr;
        } else {
            currItem.r.Asf++;
            if(currItem.r.Aef > 0) currItem.r.Aef--;
            if(currItem.r.lcnt<currItem.r.Asf) currItem.r.lcnt = currItem.r.Asf;
        }
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
    waw.UpdateRows(itm.SheetName, [row]);
}


export function SortRows(a:any,b:any){
    let reverseOrder = AppSessionData.prop('PlCfg_ReverseOrder');
    if(a.r && b.r){
        //2. если один из элементов не использовался, сотритуем по количеству просмотров (защита от деления на 0)
        if(a.r.lcnt === 0 || b.r.lcnt === 0) {
            return a.r.lcnt - b.r.lcnt;
        }

        //3. Сортировать по критерию ошибки/количество просмотров
        let result = b.r.Aef - a.r.Aef; 
        if(reverseOrder){
            result = b.r.Aer - a.r.Aer; 
        }
        if(result != 0){
            return result;
        } 
        
        //4. Сортировать по критерию успешные ответы/количество просмотров 
        result = a.r.Asf - b.r.Asf;
        if(reverseOrder){
            result = a.r.Asr - b.r.Asr;
        }    
        return result;
    }
    return 0;
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
        const minIntervalSecond= 600;
        const minInterval = minIntervalSecond * 1000;
        const dtnow = Date.now();
        if(currentItem && currentItem.r){
            currentItem.r.ts = dtnow;
        }
        let reverseOrder = AppSessionData.prop('PlCfg_ReverseOrder');
        let newestItems = items.filter(itm=>{
            return itm.r && dtnow - itm.r.ts <= minInterval;
        });
        let nextItems = items.filter(itm=>{
            //1. отфильтровать элементы которые не использовались более minInterval
            return itm.r && dtnow - itm.r.ts > minInterval;
        })
        .sort(SortRows);
        if(nextItems.length === 0) {
            //Подходящего элемента нет. Извлекаем элемент с наиболее старым таймштампом
            nextItems = items.sort((a,b)=>{
                if(a.r && b.r){
                    let result = a.r.ts - b.r.ts;
                    return result;
                }
                return 0;
            })
        }
        let newCurrItem = nextItems[0];
        if(newCurrItem.SheetName === currentItem?.SheetName) {
            //тот же Spreadsheet что и в прошлый раз
            //попробуем найти элемент из другого Spreadsheet  
            let newCurrItmVariant = nextItems.find(itm=>itm.SheetName !== currentItem?.SheetName);
            if(newCurrItmVariant){
                newCurrItem = newCurrItmVariant;
            }
        }
        if(newCurrItem.uid == currentItem?.uid){
            //алгоритмом выбран тот же элемент, что и в прошлый раз
            if(nextItems.length > 1){
                newCurrItem = nextItems[1];
            }
        }
        if (inpWordRef.current && newCurrItem) {
            if(reverseOrder) {
                inpWordRef.current.loadNewItem(newCurrItem.a.text,newCurrItem.q.text);    
            } else {
                inpWordRef.current.loadNewItem(newCurrItem.q.text, newCurrItem.a.text);
            }

            setStatus("Started");
        }
        if(currentItem){
            UpdateItemRating(currentItem, false);
        }
        setCurrentItem(newCurrItem);
        sayQuestion(newCurrItem);
        setStatus("LoadNewItem");
    }

    const reloadData = () => {
        setStatus('Loading...');
        waw.GetAllRows("All", (resp: waw.IApiResponse) => {
            if (resp.data.status == "ok") {
                let allRows = resp.data.data;
                let selectedSheetList = AppSessionData.prop('PlCfg_DataSheetNames');
                let result = allRows.filter((row:any)=>selectedSheetList.find((shName:string)=>shName==row.SheetName));
                setItems(result);
                setStatus('Stopped');
            }
        });        
    };
    useEffect(() => {
        reloadData();
    }, []);
    const currLang = AppSessionData.prop('PlCfg_ReverseOrder') ? "ru-RU":"en-US";

    const sayQuestion = (item:IItem)=>{
        let sbItem: ISubItem = { text: item.q.text, lang: item.q.lang };
        if(AppSessionData.prop('PlCfg_ReverseOrder')) {
            sbItem = { text: item.a.text, lang: item.a.lang };
        }
        setIsSpeaking(true);
        SayText.addMessage(sbItem, () => {
            setIsSpeaking(false);
        });
    };
    const sayAnswer = (onComplete?: () => void) => {
        if (currentItem) {
            let sbItem: ISubItem = { text: currentItem.a.text, lang: currentItem.a.lang };
            if(AppSessionData.prop('PlCfg_ReverseOrder')) {
                sbItem = { text: currentItem.q.text, lang: currentItem.q.lang };
            }
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
    const handleApplySettings = (selectedSheetListChanged: boolean) => {
        setIsSettingsMode(false);
        if (selectedSheetListChanged) {
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
                lang={currLang}
            />
            {status !== 'Loading...' && currentItem && <div>{currentItem.SheetName}</div>}
            {status !== 'Loading...' && <GetPromptButton items={items} />}            
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

export function GetPromptButton({ items }: { items: IItem[] }) {
    const [visible, setVisible] = useState(false);
    const [caption, setCaption] = useState("Request prompt...");
    const [isRequested, setIsRequested] = useState(false);
    const [prompt,setPrompt] = useState({});
    useEffect(() => {
        const handler = (e:any) => setVisible(e.detail);

        window.addEventListener("promptbtn:toggle", handler);
        return () => window.removeEventListener("promptbtn:toggle", handler);
    }, []);

    if(visible){
        if(!isRequested){
            waw.GetPrompt()
                .then((resp:any)=>{
                  setPrompt(resp);  
                  setCaption("Copy to clipboard")
                })
                .catch((err:any)=>{
                  setCaption("Error");
                });            
        }
        return (
            <button className='get-prompt-button' disabled={caption !== 'Copy to clipboard'} onClick={()=>{
                try {
                    let promptText = (prompt as any).data.data;
                    let promptData = JSON.stringify(items);
                    let promptFullText = promptText + "\n\n" + promptData;
                    navigator.clipboard.writeText(promptFullText);
                    setVisible(false);
                } catch (err) {
                    setCaption("Не удалось скопировать текст");
                }                
            }} >
                {caption}
            </button>
        );
    }
    return null;
}