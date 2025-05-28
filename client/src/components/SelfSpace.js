import react,{useState} from 'react';
import Navbar from '../components/Navbar'; 
import React, {  } from 'react';
import '../css/TaskOverview.css';

function SelfSpace(){


return (
  <div className="CalendarPage">
    <Navbar />
    <div style={{ padding: '10px' , marginLeft:"15%", backgroundColor:"#282c34", color:"white",}}>
      <p style={{marginLeft:"2%",color:"#CCC",fontSize:"26px"}}>個人資料庫</p>
      
    </div>
  </div>
);

}
export default SelfSpace;