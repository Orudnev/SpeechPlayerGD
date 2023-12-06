import React, { useReducer, useEffect, useState } from 'react';
import { IItem, TPlayerStatus } from '../CommonTypes';
import { ColorWords } from './ColorWords';
import { SayText } from './SayText';
import SRResultComparer from './SR/SRResultComparer';
export interface IPhraseMemorizerState{
    items:IItem[]; 
    selectedItemIndex:number;
    status:TPlayerStatus;
    cmpWordsResult:boolean[]
}

export class PhraseMemorizer extends React.Component<any,IPhraseMemorizerState>{
    ref:any;
    constructor(props:any){
        super(props);
        this.state = {
            items:[],
            selectedItemIndex:-1,
            status:'Pause',
            cmpWordsResult:[]
        }
        this.handleComparisonProgress = this.handleComparisonProgress.bind(this);
    }

    componentDidMount(): void {
        let itemlist:IItem[] = [
            {q:{lang:'en-US',text:'red roses too'},a:{lang:'ru-RU',text:'красные розы тоже'}},
            {q:{lang:'en-US',text:'apple'},a:{lang:'ru-RU',text:'яблоко'}},
            {q:{lang:'en-US',text:'cucumber'},a:{lang:'ru-RU',text:'кукумбер'}}
        ];
        this.setState({items:itemlist});
    }

    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<IPhraseMemorizerState>, snapshot?: any): void {
        if(prevState.status !== this.state.status){
            console.log("*** Status: "+this.state.status);
            if(this.state.status === 'SayQuestion'){
                this.sayQuestion();                        
            }
            if(this.state.status === 'WaitAnswerToBeStarted'){
                let itm = this.getSelectedItem();
                if(itm){
                    SRResultComparer.startNewComparison(itm.a.text,itm.a.lang, 10000, this.handleComparisonProgress);
                }
                this.setState({status:'WaitAnswerInProcess'});
                return;
            }
            if(this.state.status === 'WaitNextItem'){
                console.log("go next item");
                this.goNextItem();    
                return;
            }    
        }
        if(this.state.status === 'WaitAnswerInProcess'){
            if(SRResultComparer.cmpStatus === 'Success' || SRResultComparer.cmpStatus === 'TimeoutElapsed'){
                console.log("* Success *");
                this.setState({status: 'WaitNextItem'});
            }    
        }
    }

    getSelectedItem():IItem|undefined{
        if(this.state.selectedItemIndex<this.state.items.length){
            return this.state.items[this.state.selectedItemIndex];
        }
    }

    // getWordStatuses(){
    //     if(this.state.status === 'WaitAnswer'){
    //         let itm = this.getSelectedItem();
    //         if(itm){
    //             SRResultComparer.startNewComparison(itm.a.text,itm.a.lang, 20000, this.handleComparisonProgress);
    //         }
    //     } 
    //     return [];
    // }

    handleComparisonProgress(){
        let s = SRResultComparer.getWrdCmpResult();
        console.log(JSON.stringify(s), SRResultComparer.cmpStatus);
        this.setState({cmpWordsResult:s});
    }


    goNextItem(){
        let newIndex = this.state.selectedItemIndex+1;
        this.setState({selectedItemIndex:newIndex, status:'SayQuestion',cmpWordsResult:[]});
    }

    sayQuestion(){
        let itm = this.getSelectedItem();
        if(itm){
            SayText.addMessage(itm.q,()=>{
                this.setState({status:'WaitAnswerToBeStarted'});
            });            
        }
    }

    handleClick(){
        this.goNextItem();
    }

    render(): React.ReactNode {
        let qtext = "";
        let atext = "";
        let selItm = this.getSelectedItem();
        if(selItm){
            qtext = selItm.q.text;
            atext = selItm.a.text;  
        }
        return(
            <div className='ph-mem'>
            <div className='ph-mem__toolbar' >
                <button onClick={()=>this.handleClick()}>Start</button>
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
                    <ColorWords text={atext} wordStatuses={this.state.cmpWordsResult}/>
                </div>
            </div>
        </div>
        );
    }
}

// export function PhraseMemorizerr({getNextItem}:{getNextItem:()=>IItem}){
//     const [status,setStatus] = useState<TPlayerStatus>('WaitNextItem');
//     const [qaItem,setqaItem] = useState(getNextItem());
//     if(status === 'WaitNextItem'){
//         setqaItem(getNextItem());
//         setStatus('SayQuestion');
//     }    
//     return(
//         <div className='ph-mem'>
//             <div className='ph-mem__toolbar'>
//             </div>
//             <div className='ph-mem__question'>
//                 <div className='ph-mem__header'>
//                     Q
//                 </div>
//                 <div className='ph-mem__body'>
//                     {qaItem.q.text}
//                 </div>
//             </div>
//             <div className='ph-mem__answer'>
//             <div className='ph-mem__header'>
//                     A
//                 </div>
//                 <div className='ph-mem__body'>
//                     <ColorWords text={qaItem.a.text} wordStatuses={this.getWordStatuses}/>
//                 </div>
//             </div>
//         </div>
//     );
// }