import React, { useReducer, useEffect, useState } from 'react';
import './Switch.css';

export default function Switch(){
    return (
        <label className="switch">
            <input type="checkbox" />
            <span className="slider round"></span>
        </label>        
    );
}
