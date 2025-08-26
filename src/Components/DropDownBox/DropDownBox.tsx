import React from 'react';
import './DropDownBox.css';

export interface IDropDownProps {
  items: any[];
  selectedItem: any;
  displayMember?: string;
  onItemSelected: (selItem: any) => void;
  clsName?: string;
}

const DropDownBox: React.FC<IDropDownProps> = ({ items, selectedItem, displayMember, onItemSelected,clsName }) => {
  const [selItem, setSelItem] = React.useState(selectedItem);  
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIndex = event.target.selectedIndex;
    const selectedValue = items[selectedIndex];
    setSelItem(selectedValue);
    onItemSelected(selectedValue);
  };
  if(selItem != selectedItem) {
    setSelItem(selectedItem);
  }
  const getDisplayValue = (itm:any) => {
    let itmIndex:any = items.indexOf(itm);
    if(!displayMember){
        return itm;
    } 
    return items[itmIndex][displayMember];
  };
  let clName = clsName + ' ddown_container';
  const compValue = items.indexOf(selItem);
  return (
    <select className={clName} 
      value={compValue}
      onChange={handleChange}
    >
      {items.map((item, index) => (
        <option key={index} value={index}>
          {getDisplayValue(item)}
        </option>
      ))}
    </select>
  );
};

export default DropDownBox;