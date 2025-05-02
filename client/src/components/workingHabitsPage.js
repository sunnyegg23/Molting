import react,{useState} from 'react';

function WorkingHabitsPage(){

    const [userId, setUserId] = useState('Christine'); //等下固定userId
    const [userType, setUserType] = useState('');
    const [profile, setProfile] = useState('');
    const [currentWorkingF, setCurrentWorkingF] = useState('');
    const [idealWorkingF, setIdealWorkingF] = useState('');
    const [learningType, setLearningType] = useState('');
    const [optional, setOptional] = useState('');

    const handleCreatHabit = async() => {  // async() = 非同步函式，自動回傳promise，搭配await使用
 
      const data = {
        user_id : userId,
        profile: profile,
        working_habit_data: {
          user_type : userType,
          current_working_F : currentWorkingF,
          ideal_working_f : idealWorkingF,
          learning_type : learningType,
          optional: optional
        }
      };

      try {               // 等待伺服器回傳資料
        const response = await fetch('http://localhost:5000/api/habits',{ // await = 等待這個Promise結果處理完再繼續下一行
          method: 'POST',
          headers: { 'Content-Type':'application/json'},
          body: JSON.stringify(data),
      });
     

        const result = await response.json(); // 等待JSON解析完，再往下一行
        alert(result.message);
        } catch (error){
        console.error('錯誤:',error);
        }
      };

      const handleGetHabits = async () => {
        try{
          const response = await fetch(`http://localhost:5000/api/habits?user_id=${userId}`);
          const habits  = await response.json();
          console.log('取得的資料',habits);
          alert('資料已經print到console!');
          
        }catch(error){
          console.error('錯誤',error);
        }
      };
      const handleUpdateHabits = async () => {
        const data = {
          user_id : userId,
          profile: profile,
          working_habit_data: {
          user_type : userType,
          current_working_F : currentWorkingF,
          ideal_working_f : idealWorkingF,
          learning_type : learningType,
          optional: optional
          }
        };
        try{
          const response = await fetch('http://localhost:5000/api/habits',{
            method: 'PUT',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify(data),
          });
          
          const result = await response.json();
          alert(result.message);

        }catch(error){
          console.error('錯誤',error);
          } 
      };
      


return (
  <div style={{ padding: '20px' }}>
    <h1>個人做事習慣紀錄</h1>

    <label>使用者 ID（固定）:</label><br/>
    <input value={userId} onChange={(e) => setUserId(e.target.value)} disabled /><br/><br/>

    <label>使用者類型：</label><br/>
    <select value={userType} onChange={(e) => setUserType(e.target.value)}>
      <option value="">請選擇</option>
      <option value="perfectionist">完美主義者</option>
      <option value="dreamer">夢想家</option>
      <option value="worrier">杞人憂天者</option>
      <option value="crisis-maker">死到臨頭</option>
    </select><br/><br/>

    <label>習慣 ID（profile，請自行命名）:</label><br/>
    <input value={profile} onChange={(e) => setProfile(e.target.value)} /><br/><br/>

    <label>現在做事頻率（Current Working F）:</label><br/>
    <input value={currentWorkingF} onChange={(e) => setCurrentWorkingF(e.target.value)} /><br/><br/>

    <label>理想做事頻率（Ideal Working F）:</label><br/>
    <input value={idealWorkingF} onChange={(e) => setIdealWorkingF(e.target.value)} /><br/><br/>

    <label>學習方式：</label><br/>
    <select value={learningType} onChange={(e) => setLearningType(e.target.value)}>
      <option value="">請選擇</option>
      <option value="look">視覺學習</option>
      <option value="hear">聽覺學習</option>
      <option value="read/write">閱讀/寫作練習</option>
      <option value="active">動覺學習</option>
    </select><br/><br/>

    <label>額外補充 (Optional):</label><br/>
    <input value={optional} onChange={(e) => setOptional(e.target.value)} /><br/><br/>

    <button onClick={handleCreatHabit}>➕ 建立習慣</button> &nbsp;
    <button onClick={handleGetHabits}>📚 取得習慣</button> &nbsp;
    <button onClick={handleUpdateHabits}>✏️ 更新習慣</button>
  </div>
);

}
export default WorkingHabitsPage;