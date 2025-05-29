import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import '../css/TaskOverview.css';
import moment from 'moment';

function GoalDetail() {
    const navigate = useNavigate();
    const { goalId } = useParams();
    const [goal, setGoal] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    const [tasksByDate, setTasksByDate] = useState({});
    const [error, setError] = useState(null); // 新增錯誤狀態
    const API_BASE_URL = 'http://localhost:5000/api';
    const userId = "user123";

    useEffect(() => {
        const fetchGoalData = async () => {
        try {
            const url = `${API_BASE_URL}/users/${userId}/goal_breakdown/${goalId}`;
            const response = await fetch(url);
            const data = await response.json();
            console.log("取得目標資料：", data);

            if (!response.ok) throw new Error(`目標獲取失敗: ${response.status}`);
            setGoal(data);
        } catch (err) {
            console.error("取得目標資料失敗", err);
            setError("無法取得目標資料");
        }
        };

        const fetchGoalTasks = async () => {
        try {
            const url = `${API_BASE_URL}/users/${userId}/goal_breakdown/${goalId}/tasks`;
            const response = await fetch(url);
            const data = await response.json();

            console.log("任務資料：", data);
            if (!response.ok) throw new Error(`任務資料取得失敗: ${response.status}`);
            processTasksData(data.tasks || []);
        } catch (err) {
            console.error("取得任務失敗", err);
            setTasks([]); 
            setError("無法取得任務資料");
        }
        };

        const processTasksData = (tasks) => {
        if (!Array.isArray(tasks)) {
            console.error("任務資料格式錯誤", tasks);
            return;
        }

        const tasksList = [];
        const tasksGroupedByDate = {};

        tasks.forEach(task => {
            if (task.due_date) {
            const dateKey = moment(task.due_date).format('YYYY-MM-DD');

            if (!tasksGroupedByDate[dateKey]) {
                tasksGroupedByDate[dateKey] = [];
            }

            const taskObj = {
                id: task.id,
                taskName: task.task_name,
                date: dateKey,
                priority: task.priority,
                status: task.status || 'pending',
                order: task.order
            };

            tasksGroupedByDate[dateKey].push(taskObj);
            tasksList.push(taskObj);
            }
        });

        setTasks(tasksList);
        setAllTasks(tasksList);
        setTasksByDate(tasksGroupedByDate);
        };

        // 執行兩個 fetch
        fetchGoalData();
        fetchGoalTasks();
    }, [userId, goalId]);

    // 錯誤狀態
    if (error) {
        return (
        <div className="CalendarPage">
            <Navbar />
            <div style={{ padding: '10px', marginLeft: "15%", color: "white" }}>
            <p style={{ color: "#f88" }}>⚠️ {error}</p>
            </div>
        </div>
        );
    }

    // 載入狀態
    if (!goal) {
        return (
        <div className="CalendarPage">
            <Navbar />
            <div  style={{ padding: '10px', marginLeft: "15%", color: "white" }}>
            <p>載入中...</p>
            </div>
        </div>
        );
    }
    const completed = tasks.filter(task => task.status === 'completed').length;
    const progress = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);
    // 正常顯示
    return (
        <div className="CalendarPage">
        <Navbar />
        <div style={{ padding: '10px', marginLeft: "15%", color: "white" }}>
            <button style={{background:'transparent',border:"none", color:"white",fontSize:"20px",marginLeft:"1%", marginTop:"1%"}} onClick={() => navigate(`/TaskOverview`)} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>↼返回</button>
        <div className="scrollable-goal-list">
            <div style={{marginLeft:"3%"}}>
                <h2>目標詳情   ⚙</h2>

                <p><strong>名稱：</strong>{goal.eventName}</p>
                <p><strong>截止日期：</strong>{moment(goal.eventDeadLine).format('YYYY-MM-DD')}</p>
                <p><strong>任務總數：</strong>{tasks.length}</p> 
                <p><strong>目前進度：</strong></p>       
                {tasks.length === 0 ? (
                            <p style={{ fontSize: '12px', color: '#aaa' }}>目前無任務</p>
                        ) : (
                            <>
                            <div style={{
                                marginTop: '10px',
                                backgroundColor: '#555',
                                borderRadius: '4px',
                                height: '10px',
                                width: '30%'
                            }}>
                                <div style={{
                                width: `${progress}%`,
                                height: '100%',
                                backgroundColor: '#4caf50',
                                borderRadius: '4px',
                                transition: 'width 0.3s ease-in-out'
                                }} />
                            </div>
                            <p style={{ fontSize: '12px', marginTop: '5px', color: '#aaa' }}>{progress}% 已完成</p>
                            </>
                        )}
                </div>
            <div style={{ marginTop: '20px',borderTop:"1px solid rgb(168, 168, 168)"}}><h3 style={{marginLeft:"3%"}}>任務列表：</h3></div>
            {tasks.length === 0 ? (
                <p>目前沒有任務喔～</p>
                ) : (
                <ul>
                    <div  style={{
                    paddingRight: '10px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '15px' // 卡片之間的間距
                    }}>
                        {allTasks.length === 0 ? (
                        <div style={{padding: "10px"}}>
                            <p>此目標尚無任務</p>
                        </div>
                        ) : (
                        // 按日期排序並只顯示未來的任務
                        allTasks
                        .filter(task => moment(task.date).isSameOrAfter(moment(), 'day'))
                        .sort((a, b) => moment(a.date).diff(moment(b.date)))
                        .slice(0, 10) // 限制顯示數量
                        .map((task, index) => (
                        <section key={index}>
                        <div
                            key={task.id || index}
                            className={`upcoming-task-card border-priority-${task.priority}`}
                        >
                            <div className="upcoming-task-header">
                                <span className="upcoming-task-title">
                                    {task.taskName}
                                </span>
                                <span className={`task-status-badge status-${task.status}`}>
                                    {task.status === 'pending' ? '待辦' :
                                    task.status === 'in-progress' ? '進行中' :
                                    task.status === 'completed' ? '已完成' :
                                    task.status === 'delayed' ? '延期' : task.status}
                                </span>
                            </div>
                            <p className="upcoming-task-date">
                                期限: {moment(task.date).format("MM/DD")}
                            </p>
                            <p className="upcoming-task-priority">
                                <span className={`priority-dot priority-dot-${task.priority}`}></span>
                                {task.priority === 'high' ? '高優先級' :
                                task.priority === 'medium' ? '中優先級' : '低優先級'}
                            </p>
                        </div>
                        </section>
                        ))
                        )}
                        </div>
                </ul>
                )}
                <div style={{ marginTop: '30px',borderTop:"1px solid rgb(168, 168, 168)"}}><h3 style={{marginLeft:"3%"}}>相關資料：</h3></div>
                <div style={{ marginTop: '10px', marginLeft: "3%" }}>
                    {Array.isArray(goal.learningLinks) && goal.learningLinks.length > 0 ? (
                    <ul>
                        {goal.learningLinks.map((item, index) => (
                        <li key={index} style={{ marginBottom: '6px' }}>
                            <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#4fc3f7', textDecoration: 'underline' }}
                            >
                            🔗 {item.title || `相關連結 ${index + 1}`}
                            </a>
                        </li>
                        ))}
                    </ul>
                    ) : (
                    <p style={{ color: '#aaa' }}>尚未提供相關學習連結</p>
                    )}
                </div>
            </div>
        </div>
        </div>
    );
}

export default GoalDetail;
