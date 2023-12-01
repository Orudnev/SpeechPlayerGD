import React, { useEffect, useState } from 'react';

function ColorWord ({wrdText,isHilighted}:{wrdText:string,isHilighted:boolean}){
    let wrdClass = isHilighted?"color_Word color_Word__Hilighted":"color_Word";
    return(
      <div className={wrdClass}>{wrdText}</div>
    );
  }
  

export function ColorWords({text,wordStatuses}:{text:string,wordStatuses:boolean[]}){
    let words = text.split(" ");
    if(wordStatuses.length === 0){
      wordStatuses = new Array(words.length);
    }
    let wordsJsx:any = [];
    text.split(" ").forEach((itm,index)=>{
      let itmJsx = <ColorWord key={'cwrd'+index} wrdText={itm} isHilighted={wordStatuses[index]} />
      wordsJsx.push(itmJsx);
    });
    console.log("@@@");
    return(
      <div>
        {wordsJsx}
      </div>
    );
  }