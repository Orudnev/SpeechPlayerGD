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
                console.log("go next item");
                this.goNextItem();
                return;
            }
        }
        if (this.state.status === 'WaitAnswerInProcess') {
            if (SRResultComparer.cmpStatus === 'Success') {
                this.setState({ status: 'AnswerIsCorrect' });
                setTimeout(() => { this.setState({ status: "WaitNextItem" }) }, 1000);
                this.setItemResult(true);
            }
            if (SRResultComparer.cmpStatus === 'TimeoutElapsed') {
                this.setState({ status: 'AnswerIsFailed' });
                setTimeout(() => { this.setState({ status: "WaitNextItem" }) }, 1000);
                this.setItemResult(false);
            }
            if (SRResultComparer.cmpStatus === 'CommandMode') {
            }
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
                if (isForwardDirection) {
                    srcCurrItem.r.fsa++;
                } else {
                    srcCurrItem.r.rsa++;
                }
            } else {
                srcCurrItem.r = {
                    lcnt: 1,
                    fsa: 0,
                    rsa: 0
                }
                if (isForwardDirection) {
                    srcCurrItem.r.fsa++;
                } else {
                    srcCurrItem.r.rsa++;
                }
            }
        }
    }

    handleComparisonProgress() {
        let s = SRResultComparer.getWrdCmpResult();
        //console.log(JSON.stringify(s), SRResultComparer.cmpStatus);
        this.setState({ cmpWordsResult: s });
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
                return 0;
            }
            let result = ar > br ? -1 : 1;
            return result;
        };
        let sortedItems = this.state.items.sort(comparePredicate);
        let forwardNextItem = { ...sortedItems[0] };
        if (!forwardNextItem.r) {
            this.setState({ currentItem: forwardNextItem, status: "SayQuestion" });
            return;
        }
        if (forwardNextItem.r.fsa < forwardNextItem.r.rsa) {
            this.setState({ currentItem: forwardNextItem, status: "SayQuestion" });
            return;
        }
        let reverseNextItem: IItem = {
            q: forwardNextItem.a,
            a: forwardNextItem.q,
            r: forwardNextItem.r
        }
        this.setState({ currentItem: reverseNextItem, status: "SayQuestion" });
    }

    sayQuestion() {
        let itm = this.state.currentItem;
        if (itm) {
            SayText.addMessage(itm.q, () => {
                this.setState({ status: 'WaitAnswerToBeStarted' });
            });
        }
    }

    handleClick() {
        this.goNextItem();
    }

    render(): React.ReactNode {
        let qtext = "";
        let atext = "";
        let selItm = this.state.currentItem;
        if (selItm) {
            qtext = selItm.q.text;
            atext = selItm.a.text;
        }
        return (
            <div className='ph-mem'>
                <div className='ph-mem__toolbar' >
                    <button onClick={() => this.handleClick()}>Start</button>
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