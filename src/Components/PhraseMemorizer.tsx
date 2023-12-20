import React, { useReducer, useEffect, useState } from 'react';
import { IItem, TPlayerStatus } from '../CommonTypes';
import { ColorWords } from './ColorWords';
import { SayText } from './SayText';
import SRResultCmdDetector, { TVoiceCommand } from './SR/SRResultCmdDetector';
import SRResultComparer from './SR/SRResultComparer';
export interface IPhraseMemorizerState {
    items: IItem[];
    currentItem: IItem | undefined;
    status: TPlayerStatus;
    cmpWordsResult: boolean[]
}

export class PhraseMemorizer extends React.Component<any, IPhraseMemorizerState>{
    ref: any;
    constructor(props: any) {
        super(props);
        this.state = {
            items: [],
            currentItem: undefined,
            status: 'Pause',
            cmpWordsResult: []
        }
        this.handleComparisonProgress = this.handleComparisonProgress.bind(this);
        this.onVoiceCommandDetected = this.onVoiceCommandDetected.bind(this);
        SRResultCmdDetector.registerHandler(this.onVoiceCommandDetected);
    }

    componentDidMount(): void {
        let itemlist: IItem[] = [
            { q: { lang: 'en-US', text: 'red roses too' }, a: { lang: 'ru-RU', text: 'красные розы тоже' }, r: undefined },
            { q: { lang: 'en-US', text: 'apple' }, a: { lang: 'ru-RU', text: 'яблоко' }, r: undefined },
            { q: { lang: 'en-US', text: 'cucumber' }, a: { lang: 'ru-RU', text: 'кукумбер' }, r: undefined }
        ];
        this.setState({ items: itemlist });
    }

    onVoiceCommandDetected(cmd: TVoiceCommand) {
        if (cmd === 'GoNextItem') {
            this.setItemResult(false);
            this.setState({ status: 'WaitNextItem' });
            console.log("WaitNextItem");
        }
    }

    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<IPhraseMemorizerState>, snapshot?: any): void {
        if (prevState.status !== this.state.status) {
            //console.log("*** Status: " + this.state.status);
            if (this.state.status === 'SayQuestion') {
                this.sayQuestion();
            }
            if (this.state.status === 'WaitAnswerToBeStarted') {
                let itm = this.state.currentItem;
                if (itm) {
                    SRResultComparer.startNewComparison(itm.a.text, itm.a.lang, 10000, this.handleComparisonProgress);
                }
                this.setState({ status: 'WaitAnswerInProcess' });
                return;
            }
            if (this.state.status === 'WaitNextItem') {
                //console.log("go next item");
                this.goNextItem();
                return;
            }
            if(this.state.status === 'Pause'){
                SRResultComparer.stopComparison();
                this.setState({currentItem:undefined});
            }
        }
        if (this.state.status === 'AnswerIsCorrect' || this.state.status === 'AnswerIsFailed') {
                setTimeout(()=>{
                    this.setState({ status: "WaitNextItem" });
                 }, 1000);
        }
    }


    handleComparisonProgress() {
        let s = SRResultComparer.getWrdCmpResult();
        if(SRResultComparer.cmpStatus === "Success"){
            this.setItemResult(true);
            this.setState({ status:"AnswerIsCorrect", cmpWordsResult: s });
            return;
        } 
        if (SRResultComparer.cmpStatus === "TimeoutElapsed"){
            this.setItemResult(false);
            this.setState({ status:"AnswerIsFailed", cmpWordsResult: s });
            return;
        }
        this.setState({ cmpWordsResult: s });        
    }

    handleBtnStartStopClick() {
        if(this.state.status === 'Pause'){
            SRResultComparer.stopComparison();
            this.goNextItem();
        } else {
            
            this.setState({status:'Pause'});
        }
    }

    handleBtnNextClick(){
        this.setItemResult(false)
        this.setState({status:"WaitNextItem"});
    }

    handleBtnSettingsClick(){

    }

    goNextItem() {
        let comparePredicate = (itmA: IItem, itmB: IItem) => {
            if (!itmA.r && !itmB.r) {
                return 0;
            }
            if (!itmA.r) {
                return -1;
            }
            if (!itmB.r) {
                return 1;
            }
            let ar = itmA.r.fsa / itmA.r.lcnt + itmA.r.rsa / itmA.r.lcnt; 
            let br = itmB.r.fsa / itmB.r.lcnt + itmB.r.rsa / itmB.r.lcnt;
            if (ar === br) {
                if(itmA.r.lcnt === itmB.r.lcnt){
                    return itmA.r.ts - itmB.r.ts;
                } 
                return itmA.r.lcnt - itmB.r.lcnt;
            }
            let result = ar > br ? 1 : -1;
            return result;
        };
        let sortedItems = this.state.items.sort(comparePredicate);        
        let forwardNextItem = sortedItems.find((itm)=>{
            if(this.state.currentItem){
                return this.state.currentItem.q.text !== itm.q.text && this.state.currentItem.a.text !== itm.q.text;
            } else {
                return false;
            }   
        });
        if(!this.state.currentItem && !forwardNextItem){
            forwardNextItem = sortedItems[0];
        }
        if(!forwardNextItem){
            throw new Error("to be handled");
        }
        if (!forwardNextItem.r) {
            this.setState({ currentItem: forwardNextItem,cmpWordsResult:[], status: "SayQuestion" });
            //console.log(forwardNextItem.q.text);
            return;
        }
        if (forwardNextItem.r.fsa < forwardNextItem.r.rsa) {
            this.setState({ currentItem: forwardNextItem,cmpWordsResult:[], status: "SayQuestion" });
            //console.log(forwardNextItem.q.text);
            return;
        }
        let reverseNextItem: IItem = {
            q: forwardNextItem.a,
            a: forwardNextItem.q,
            r: forwardNextItem.r
        }
        this.setState({ currentItem: reverseNextItem,cmpWordsResult:[], status: "SayQuestion" });
        //console.log(reverseNextItem.q.text);
    }

    sayQuestion() {
        let itm = this.state.currentItem;
        if (itm) {
            SayText.addMessage(itm.q, () => {
                this.setState({ status: 'WaitAnswerToBeStarted' });
                if(itm && itm.r){
                    itm.r.ts = Date.now();
                }
            });
        }
    }

    setItemResult(ok: boolean): void {
        if (!this.state.currentItem) {
            return;
        }
        let currItem = this.state.currentItem;
        let srcCurrItem = undefined;
        let isForwardDirection = true;
        for (let i = 0; i < this.state.items.length; i++) {
            let itm = this.state.items[i];
            isForwardDirection = (itm.q.lang === currItem.q.lang);
            if (isForwardDirection) {
                if (itm.q.text.toLocaleLowerCase() === currItem.q.text.toLocaleLowerCase()) {
                    srcCurrItem = itm;
                    break;
                }
            } else {
                if (itm.q.text.toLocaleLowerCase() === currItem.a.text.toLocaleLowerCase()) {
                    srcCurrItem = itm;
                    isForwardDirection = false;
                    break;
                }
            }
        }
        if (srcCurrItem) {
            if (srcCurrItem.r) {
                srcCurrItem.r.lcnt++;
                srcCurrItem.r.ts = Date.now();
                if (isForwardDirection) {
                    if(ok){
                        srcCurrItem.r.fsa++;
                    }
                } else {
                    if(ok){
                        srcCurrItem.r.rsa++;
                    }
                }
            } else {
                srcCurrItem.r = {
                    lcnt: 1,
                    fsa: 0,
                    rsa: 0,
                    ts:Date.now()
                }
                if (isForwardDirection) {
                    if(ok){
                        srcCurrItem.r.fsa++;
                    }
                } else {
                    if(ok){
                        srcCurrItem.r.rsa++;
                    }
                }
            }
        }
    }


    render(): React.ReactNode {
        let qtext = "";
        let atext = "";
        let selItm = this.state.currentItem;
        if (selItm) {
            qtext = selItm.q.text;
            atext = selItm.a.text;
        }
        let classBtnStartStop = this.state.status === 'Pause'?'img-btn img-power-off':'img-btn img-power-on'; 
        return (
            <div className='ph-mem'>
                <div className='ph-mem__toolbar' >
                    <button className="toolbar-button" onClick={() => this.handleBtnStartStopClick()}>
                        <div className={classBtnStartStop} />
                    </button>
                    <button className="toolbar-button" onClick={() => this.handleBtnNextClick()}>
                        <div className="img-btn img-right" />
                    </button>
                    <button className="toolbar-button" onClick={() => this.handleBtnSettingsClick()}>
                        <div className="img-btn img-config" />
                    </button>
                </div>
                <div className='ph-mem__question'>
                    <div className='ph-mem__header'>
                        Q
                    </div>
                    <div className='ph-mem__body'>
                        {qtext}
                    </div>
                </div>
                <div className='ph-mem__answer'>
                    <div className='ph-mem__header'>
                        A
                    </div>
                    <div className='ph-mem__body'>
                        <ColorWords text={atext} wordStatuses={this.state.cmpWordsResult} />
                    </div>
                </div>
            </div>
        );
    }
}