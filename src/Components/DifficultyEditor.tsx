import React, { useReducer, useEffect, useState, useRef } from 'react';
import { IItem } from '../CommonTypes';


export type TDifficultyEditorProps = {
    item:IItem,
    onChange: (newValue:number)=>void;
}

export const DifficultyEditor: React.FC<TDifficultyEditorProps> = ({
  item,
  onChange,
}) => {
  const ratingValue = (!item.r || !item.r.Dfclty || item.r.Dfclty === 0) ? 2 : item.r.Dfclty;  
  const getDescription = ()=>{
    switch (ratingValue) {
        case 2:
            return {text:"Forgot", style:{backgroundColor:'red',color:'white'}};
        case 1:
            return {text:"Forgot", style:{backgroundColor:'yellow',color:'black'}};
        case 0:
            return {text:"Forgot", style:{backgroundColor:'lightGreen',color:'black'}};

    }
  };
  const descriptObj = getDescription();
  return (
    <div className="difficulty-editor">
      <span className="difficulty-editor__label">
        Difficulty rating:
      </span>

      <div className="difficulty-editor__buttons">
        {[2, 1, 0].map((rating) => (
          <button 
            key={rating}
            type="button"
            className={`toolbar-button difficulty-editor__button ${
              ratingValue === rating ? 'difficulty-editor__button--selected' : ''
            }`}
            onClick={() => onChange(rating)}
            aria-pressed={ratingValue === rating}
          >
            {rating}
          </button>          
        ))}
      </div>
        <span className="difficulty-editor__description" style={descriptObj?.style}>{descriptObj?.text}</span>
    </div>
  );
};