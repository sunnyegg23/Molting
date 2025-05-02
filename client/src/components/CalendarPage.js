import React, { useState } from 'react';
import { Calendar } from 'primereact/calendar';
import "primereact/resources/themes/lara-light-cyan/theme.css";
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import '../css/Calendar.css';
import Navbar from '../components/Navbar'; // 路徑根據實際位置調整

function CalenderPage() {
  const [date, setDate] = useState(new Date());

    // 模擬的任務資料（之後可以改成從資料庫拉）
  const tasks = {
    '2025-04-23': '讀書 50 分鐘',
    '2025-04-24': '運動 30 分鐘'
  };
  const formattedDate = moment(date).format("YYYY-MM-DD");

  return (
    <div className="CalendarPage">
      <Navbar />
      <header className="Calender-header">
        <div className="calendar-container">
          <div style={{display:"flex",padding:"5px"}}>
            <div className="calendar-box"style={{width: '575px',marginRight:"20px"}}>
              <Calendar style={{width:"100%",height:"100%"}} value={date} onChange={(e) => setDate(e.value)} inline/>
            </div>
            <div className="date-display" >
              <h1>{moment(date).format("MM/DD")}</h1>
              <div className='task-display'>
                <p style={{color:"#989898", marginLeft:"10px"}}>{tasks[formattedDate] || 'no 任務'}</p>
              </div>
            </div>
          </div>
          <div className="task-carousel">
            <div style={{width:'30%',height:'80%',backgroundColor:'#FDFDFD', marginLeft:"10px", marginTop:"10px", borderRadius:"15px",marginRight:"5px"}}>
              <p style={{fontSize:"12px",color:"#989898"}}>
                4/23 讀書 50 分鐘
              </p>
            </div>
            <div style={{width:'30%',height:'80%',backgroundColor:'#FDFDFD', marginLeft:"10px", marginTop:"10px", borderRadius:"15px",marginRight:"5px"}}>
              <p style={{fontSize:"12px",color:"#989898"}}>
                4/24 運動 30 分鐘
              </p>
            </div>
          </div>
        </div>

      </header>

    </div>
  );

}

export default CalenderPage;