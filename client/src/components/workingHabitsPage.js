import React, { useState, useRef } from 'react';
import Navbar from '../components/Navbar'; 
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';

function WorkingHabitsPage(){
    const toast = useRef(null);
    const [userId, setUserId] = useState('Christine'); // 固定 userId
    const [userType, setUserType] = useState('');
    const [profile, setProfile] = useState('');
    const [currentWorkingF, setCurrentWorkingF] = useState('');
    const [idealWorkingF, setIdealWorkingF] = useState('');
    const [learningType, setLearningType] = useState('');
    const [optional, setOptional] = useState('');
    const [habitData, setHabitData] = useState(null);

    const handleCreateHabit = async () => {
      const data = {
        user_id: userId,
        profile: profile,
        working_habit_data: {
          user_type: userType,
          current_working_F: currentWorkingF,
          ideal_working_f: idealWorkingF,
          learning_type: learningType,
          optional: optional
        }
      };
      try {
        const response = await fetch('http://localhost:5000/api/habits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await response.json();
        toast.current.show({
          severity: 'success',
          summary: '建立成功',
          detail: result.message,
          life: 3000
        });
      } catch (error) {
        toast.current.show({
          severity: 'error',
          summary: '錯誤',
          detail: error.message || error,
          life: 3000
        });
      }
    };

    const handleGetHabits = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/habits?user_id=${userId}`);
        const habits = await response.json();
        setHabitData(habits); // 存進 state 裡
        toast.current.show({
          severity: 'info',
          summary: '資料取得成功',
          detail: '已顯示於畫面上',
          life: 3000
        });
      } catch (error) {
        console.error('錯誤', error);
      }
    };

    const handleUpdateHabits = async () => {
      const data = {
        user_id: userId,
        profile: profile,
        working_habit_data: {
          user_type: userType,
          current_working_F: currentWorkingF,
          ideal_working_f: idealWorkingF,
          learning_type: learningType,
          optional: optional
        }
      };
      try {
        const response = await fetch('http://localhost:5000/api/habits', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await response.json();
        toast.current.show({
          severity: 'success',
          summary: '更新成功',
          detail: result.message,
          life: 3000
        });
      } catch (error) {
        toast.current.show({
          severity: 'error',
          summary: '錯誤',
          detail: error.message || error,
          life: 3000
        });
      }
    };

  return (
    <div className='CalendarPage'>
      <Navbar />
      <Toast ref={toast} />
      <div style={{ padding: '10px' , marginLeft:"15%",height:"100%", minHeight: '100vh', color:"white",}}>
        <p style={{marginLeft:"2%",color:"#CCC",fontSize:"26px"}}>個人做事習慣紀錄</p>
        <div style={{display:"flex"}}>
          <div style={{ color:"white",marginLeft:"3%",marginTop:"2%",display:"inline-block"}}>
            <label>使用者 ID:</label><br/>
            <input 
              value={userId} 
              onChange={(e) => setUserId(e.target.value)} 
              disabled  
              style={{backgroundColor:"#282c34",border:"none",color:"#D0D0D0",height:"40px",fontSize:"18px"}}
            /><br/><br/>

            <label>使用者類型</label><br/>
            <select value={userType} onChange={(e) => setUserType(e.target.value)} style={{height:"28px",marginTop:"10px",width:"100px"}}>
              <option value="">請選擇</option>
              <option value="perfectionist">完美主義者</option>
              <option value="dreamer">夢想家</option>
              <option value="worrier">杞人憂天者</option>
              <option value="crisis-maker">死到臨頭</option>
            </select><br/><br/>

            <label>習慣 ID（profile，請自行命名）:</label><br/>
            <input value={profile} onChange={(e) => setProfile(e.target.value)}  style={{height:"28px",marginTop:"10px"}}/><br/><br/>

            <label>現在做事頻率（Current Working F）:</label><br/>
            <input value={currentWorkingF} onChange={(e) => setCurrentWorkingF(e.target.value)} style={{height:"28px",marginTop:"10px"}} /><br/><br/>

            <label>理想做事頻率（Ideal Working F）:</label><br/>
            <input value={idealWorkingF} onChange={(e) => setIdealWorkingF(e.target.value)} style={{height:"28px",marginTop:"10px"}} /><br/><br/>

            <label>學習方式：</label><br/>
            <select value={learningType} onChange={(e) => setLearningType(e.target.value)} style={{height:"28px",marginTop:"10px",width:"150px"}}>
              <option value="">請選擇</option>
              <option value="look">視覺學習</option>
              <option value="hear">聽覺學習</option>
              <option value="read/write">閱讀/寫作練習</option>
              <option value="active">動覺學習</option>
            </select><br/><br/>

            <button
              onClick={handleCreateHabit}
              style={{
                backgroundColor: "#90a4ae00",
                border: "1px solid rgb(227, 227, 227)",
                width: "100px",
                height: "35px",
                color: "white",
                borderRadius: "3px",
                marginTop: "10px",
                transition: "all 0.1s ease-in-out",
              }}
              onPointerDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
              onPointerUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              + 建立習慣
            </button> &nbsp;

            <button
              onClick={handleGetHabits}
              style={{
                backgroundColor: "#90a4ae00",
                border: "1px solid rgb(227, 227, 227)",
                width: "100px",
                height: "35px",
                color: "white",
                borderRadius: "3px",
                marginTop: "10px",
                transition: "all 0.1s ease-in-out",
              }}
              onPointerDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
              onPointerUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              📚 取得習慣
            </button> &nbsp;

            <button
              onClick={handleUpdateHabits}
              style={{
                backgroundColor: "#90a4ae00",
                border: "1px solid rgb(227, 227, 227)",
                width: "100px",
                height: "35px",
                color: "white",
                borderRadius: "3px",
                marginTop: "10px",
                transition: "all 0.1s ease-in-out",
              }}
              onPointerDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
              onPointerUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              ✏️ 更新習慣
            </button>
          </div>       
          <div style={{ color:"white",marginLeft:"2%",marginTop:"5%",display:"inline-block"}}>
              <label>額外補充 (Optional):</label><br/>
              <textarea value={optional} onChange={(e) => setOptional(e.target.value)} style={{height:"150px",marginTop:"10px",width:"300px"}} /><br/><br/>

          </div>
          {habitData && (
                <div style={{ marginTop: '30px', marginLeft: '3%', color: 'white', backgroundColor: 'rgba(51, 49, 56, 0.32)', padding: '10px', borderRadius: '5px', maxWidth: '600px' }}>
                  <h3>已取得的習慣資料：</h3>
                  <pre style={{ whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(habitData, null, 2)}
                  </pre>
                </div>
              )}
        </div>
      </div>
    </div>
  );
}

export default WorkingHabitsPage;
