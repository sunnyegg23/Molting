// 修改後的CalendarPage.js
import React, {useState, useEffect, useRef} from 'react';
import {Calendar} from 'primereact/calendar';
import {useParams, useNavigate} from 'react-router-dom';
import "primereact/resources/themes/lara-light-cyan/theme.css";
import moment from 'moment';
import '../css/Calendar.css';
import Navbar from '../components/Navbar';
import FloatingMenu from "./FloatingMenu";
import Chatroom from './Chatroom';  // 引入Chatroom組件

function CalendarPage() {
    const {goalId} = useParams();
    const navigate = useNavigate();
    const [date, setDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [allTasks, setAllTasks] = useState([]);
    const [tasksByDate, setTasksByDate] = useState({});
    const [goalInfo, setGoalInfo] = useState(null);
    const [allGoals, setAllGoals] = useState([]);
    const [selectedGoalId, setSelectedGoalId] = useState(goalId || null);
    const [debugInfo, setDebugInfo] = useState({
        apiCalls: [],
        responseData: null
    });
    // 添加聊天室狀態
    const [isChatOpen, setIsChatOpen] = useState(false);

    // 用於防止循環請求的標誌
    const isInitialLoad = useRef(true);
    const isChangingGoal = useRef(false);
    const fetchAllGoalsRef = useRef(false);

    // 基礎 API URL
    const API_BASE_URL = 'http://localhost:5000/api';

    // 請求資料 - 初始加載
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const userId = "user123";

                console.log('初始加載執行，goalId:', goalId);
                isInitialLoad.current = true;

                if (goalId) {
                    await fetchGoalData(userId, goalId);
                } else {
                    // 修改為直接呼叫 API，不再使用 mockData
                    await fetchAllGoals(userId);
                }
            } catch (error) {
                console.error('資料獲取錯誤:', error);
                setError(error.message);
            } finally {
                setLoading(false);
                isInitialLoad.current = false;
            }
        };

        fetchData();
    }, []); // 不再將 goalId 作為依賴項，改為手動控制

    // 當 goalId 更改時，進行資料請求
    useEffect(() => {
        // 避免初始加載重複請求
        if (!isInitialLoad.current && goalId && !isChangingGoal.current) {
            console.log('URL 參數 goalId 改變:', goalId);

            const fetchData = async () => {
                try {
                    setLoading(true);
                    const userId = "user123";
                    await fetchGoalData(userId, goalId);
                } catch (error) {
                    console.error('資料獲取錯誤:', error);
                    setError(error.message);
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }
    }, [goalId]);

    // 獲取所有目標 - 修正處理返回數據的方式
    const fetchAllGoals = async (userId) => {
        // 防止重複請求
        if (fetchAllGoalsRef.current) {
            console.log('防止重複請求 fetchAllGoals');
            return;
        }

        fetchAllGoalsRef.current = true;

        const url = `${API_BASE_URL}/users/${userId}/goal_breakdown_all`;
        setDebugInfo(prev => ({
            ...prev,
            apiCalls: [...prev.apiCalls, { endpoint: url, time: new Date().toISOString() }]
        }));

        try {
            console.log('正在獲取所有目標:', url);

            const response = await fetch(url);
            const responseData = await response.json();

            console.log('獲取的目標數據:', responseData);
            setDebugInfo(prev => ({ ...prev, responseData }));

            if (!response.ok) {
                throw new Error(`目標列表獲取失敗: ${response.status}`);
            }

            // 根據後端服務代碼，數據應該在 responseData.goals 中
            const goalsData = responseData.goals || [];

            // 更新目標列表
            setAllGoals(goalsData);

            // 如果有 URL 參數的 goalId，優先使用它
            if (goalId) {
                const selectedGoal = goalsData.find(goal => goal.id === goalId);
                if (selectedGoal) {
                    console.log('根據 URL 參數選擇目標:', selectedGoal.id);
                    setGoalInfo(selectedGoal);
                    setSelectedGoalId(selectedGoal.id);

                    // 處理任務數據
                    if (selectedGoal.tasks && Array.isArray(selectedGoal.tasks)) {
                        processTasksData(selectedGoal.tasks);
                    } else {
                        await fetchGoalTasks(userId, selectedGoal.id);
                    }
                } else if (goalsData.length > 0) {
                    // 如果沒有找到指定 ID 的目標，使用第一個
                    handleFirstGoal(goalsData, userId);
                }
            } else if (goalsData.length > 0) {
                // 沒有 URL 參數時，使用第一個目標
                handleFirstGoal(goalsData, userId);
            }
        } catch (error) {
            console.error('獲取目標列表失敗:', error);
            setError('無法獲取目標列表，請稍後再試或聯繫系統管理員');
            setAllGoals([]);
        } finally {
            fetchAllGoalsRef.current = false;
        }
    };

    // 處理選擇第一個目標的邏輯，抽取為函數避免重複代碼
    const handleFirstGoal = (goalsData, userId) => {
        const firstGoal = goalsData[0];
        console.log('選擇第一個目標:', firstGoal.id);
        setGoalInfo(firstGoal);
        setSelectedGoalId(firstGoal.id);

        // 如果目標已經包含任務，直接處理它們
        if (firstGoal.tasks && Array.isArray(firstGoal.tasks)) {
            processTasksData(firstGoal.tasks);
        } else {
            // 否則獲取任務
            fetchGoalTasks(userId, firstGoal.id);
        }
    };

    // 獲取目標的任務 - 修正處理返回數據的方式
    const fetchGoalTasks = async (userId, goalId) => {
        const url = `${API_BASE_URL}/users/${userId}/goal_breakdown/${goalId}/tasks`;
        setDebugInfo(prev => ({
            ...prev,
            apiCalls: [...prev.apiCalls, { endpoint: url, time: new Date().toISOString() }]
        }));

        try {
            console.log('正在獲取任務:', url);

            const tasksResponse = await fetch(url);
            const tasksData = await tasksResponse.json();

            console.log('獲取的任務數據:', tasksData);

            if (!tasksResponse.ok) {
                throw new Error(`任務資料取得失敗: ${tasksResponse.status}`);
            }

            // 根據後端服務代碼，任務應該在 tasksData.tasks 中
            processTasksData(tasksData.tasks || []);
        } catch (error) {
            console.error('獲取任務失敗:', error);
            setAllTasks([]);
            setTasksByDate({});
        }
    };

    // 獲取指定目標的資料 - 修正處理返回數據的方式
    const fetchGoalData = async (userId, goalId) => {
        const url = `${API_BASE_URL}/users/${userId}/goal_breakdown/${goalId}`;
        setDebugInfo(prev => ({
            ...prev,
            apiCalls: [...prev.apiCalls, { endpoint: url, time: new Date().toISOString() }]
        }));

        try {
            console.log('正在獲取目標詳情:', url);

            // 1. 獲取目標基本資訊
            const goalResponse = await fetch(url);
            const goalData = await goalResponse.json();

            console.log('獲取的目標詳情:', goalData);

            if (!goalResponse.ok) {
                throw new Error(`目標資料取得失敗: ${goalResponse.status}`);
            }

            // 直接設置目標信息 - 後端服務直接返回目標對象
            setGoalInfo(goalData);

            // 2. 獲取目標下的所有任務
            await fetchGoalTasks(userId, goalId);

            // 3. 獲取所有目標列表以便選擇器使用，但避免重複選擇
            if (fetchAllGoalsRef.current === false) {
                await fetchAllGoals(userId);
            }
        } catch (error) {
            console.error('API 請求失敗:', error);
            setError('無法獲取目標數據，請稍後再試或聯繫系統管理員');
        }
    };

    // 處理任務資料
    const processTasksData = (tasks) => {
        if (!Array.isArray(tasks)) {
            console.error('無效的任務資料:', tasks);
            return;
        }

        console.log('處理任務數據:', tasks);

        const tasksList = [];
        const tasksGroupedByDate = {};

        tasks.forEach(task => {
            if (task.due_date) {
                // 使用 moment 處理 ISO 格式日期字符串
                const dateKey = moment(task.due_date).format('YYYY-MM-DD');

                if (!tasksGroupedByDate[dateKey]) {
                    tasksGroupedByDate[dateKey] = [];
                }

                const taskObj = {
                    id: task.id,
                    name: task.task_name,
                    date: dateKey,
                    priority: task.priority,
                    status: task.status || 'pending',
                    order: task.order
                };

                tasksGroupedByDate[dateKey].push(taskObj);
                tasksList.push(taskObj);
            }
        });

        // 按順序排序每一天的任務
        Object.keys(tasksGroupedByDate).forEach(date => {
            tasksGroupedByDate[date].sort((a, b) => a.order - b.order);
        });

        console.log('處理後的任務數據:', { tasksList, tasksByDate: tasksGroupedByDate });

        setAllTasks(tasksList);
        setTasksByDate(tasksGroupedByDate);
    };

    // 切換選中的目標
    const handleGoalChange = (newGoalId) => {
        console.log('手動切換目標:', newGoalId);

        const selectedGoal = allGoals.find(goal => goal.id === newGoalId);
        if (selectedGoal) {
            isChangingGoal.current = true;  // 設置標誌，防止循環更新

            // 更新狀態
            setGoalInfo(selectedGoal);
            setSelectedGoalId(newGoalId);

            // 如果目標包含任務，直接處理
            if (selectedGoal.tasks && Array.isArray(selectedGoal.tasks)) {
                processTasksData(selectedGoal.tasks);
            } else {
                // 否則獲取任務
                const userId = "user123";
                fetchGoalTasks(userId, newGoalId);
            }

            // 更新 URL 但不觸發新的加載
            navigate(`/calendar/${newGoalId}`, {replace: true});

            // 短暫延遲後重置標誌
            setTimeout(() => {
                isChangingGoal.current = false;
            }, 500);
        }
    };

    // 測試API連接
    const testApiConnection = async () => {
        try {
            const userId = "user123";
            const url = `${API_BASE_URL}/users/${userId}/goal_breakdown_all`;

            console.log('測試API連接:', url);

            const response = await fetch(url);
            const data = await response.json();

            console.log('API測試響應:', data);
            alert(`API連接測試結果:\n${JSON.stringify(data, null, 2)}`);

            setDebugInfo(prev => ({
                ...prev,
                testResponse: data,
                apiCalls: [...prev.apiCalls, { endpoint: url, time: new Date().toISOString(), result: 'test' }]
            }));
        } catch (error) {
            console.error('API測試錯誤:', error);
            alert(`API測試錯誤: ${error.message}`);
        }
    };

    // 切換聊天室開關
    const toggleChat = () => {
        setIsChatOpen(!isChatOpen);
    };

    const formattedDate = moment(date).format("YYYY-MM-DD");
    const todayTasks = tasksByDate[formattedDate] || [];

    // 處理載入中狀態
    if (loading) {
        return (
            <div className="CalendarPage">
                <Navbar/>
                <div className="calendar-content">
                    {/* 浮動菜單 */}
                    <div className="floating-menu-wrapper">
                        <FloatingMenu />
                    </div>
                    <div className="loading-container">
                        <p>載入中...</p>
                    </div>
                </div>
            </div>
        );
    }

    // 處理錯誤狀態
    if (error) {
        return (
            <div className="CalendarPage">
                <Navbar/>
                <div className="calendar-content">
                    {/* 浮動菜單 */}
                    <div className="floating-menu-wrapper">
                        <FloatingMenu />
                    </div>
                    <div className="error-container">
                        <p>錯誤：{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{marginRight: '10px'}}
                        >
                            重試
                        </button>
                        <button
                            onClick={testApiConnection}
                            style={{background: '#4a5568'}}
                        >
                            測試API連接
                        </button>

                        {/* 調試信息 */}
                        <div style={{marginTop: '20px', textAlign: 'left', fontSize: '12px'}}>
                            <details>
                                <summary>調試信息</summary>
                                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                            </details>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 處理無目標的情況
    if (allGoals.length === 0 && !goalInfo) {
        return (
            <div className="CalendarPage">
                <Navbar/>
                <div className="calendar-content">
                    {/* 浮動菜單 */}
                    <div className="floating-menu-wrapper">
                        <FloatingMenu />
                    </div>

                    <div className="no-tasks-container">
                        <p>您目前沒有任何目標。</p>
                        <p>請點擊右上角的「+ 新增事務」按鈕開始創建。</p>

                        <button
                            onClick={testApiConnection}
                            style={{marginTop: '20px', padding: '8px 15px', background: '#4a5568', color: 'white', border: 'none', borderRadius: '4px'}}
                        >
                            測試API連接
                        </button>

                        {/* 調試信息 */}
                        <div style={{marginTop: '20px', textAlign: 'left', fontSize: '12px'}}>
                            <details>
                                <summary>調試信息</summary>
                                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                            </details>
                        </div>
                    </div>

                    {/* 移除這裡的聊天按鈕和聊天室，放到外層了 */}
                </div>
            </div>
        );
    }

    // 主要內容
    return (
        <div className="CalendarPage">
            <Navbar/>
            <div className="floating-menu-wrapper">
                <FloatingMenu />
            </div>
            <div className="calendar-content">
                {/* 頂部控制區 - 只保留選單 */}
                <div className="top-controls">
                    {/* 目標選擇器 */}
                    {allGoals.length > 0 && (
                        <div className="goal-selector">
                            <select
                                value={selectedGoalId || ''}
                                onChange={(e) => handleGoalChange(e.target.value)}
                            >
                                <option value="" disabled>選擇目標</option>
                                {allGoals.map(goal => (
                                    <option key={goal.id} value={goal.id}>
                                        {goal.eventName} (截止日期: {moment(goal.eventDeadLine).format('YYYY-MM-DD')})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* 日曆容器 */}
                <div className="calendar-container">
                    <div className="calendar-flex-container">
                        <div className="calendar-box">
                            <Calendar
                                style={{width: "100%", height: "100%"}}
                                value={date}
                                onChange={(e) => setDate(e.value)}
                                inline
                                dateTemplate={(dateObj) => {
                                    const formattedDate = moment(new Date(dateObj.year, dateObj.month, dateObj.day)).format('YYYY-MM-DD');
                                    const hasTasks = tasksByDate[formattedDate] && tasksByDate[formattedDate].length > 0;

                                    return (
                                        <span className={hasTasks ? 'has-task' : ''}>
                                            {dateObj.day}
                                            {hasTasks &&
                                                <span className="task-count">
                                                    {tasksByDate[formattedDate].length}
                                                </span>
                                            }
                                        </span>
                                    );
                                }}
                            />
                        </div>
                        <div className="date-display">
                            <h1>{moment(date).format("MM/DD")}</h1>
                            <div className='task-display'>
                                {todayTasks.length === 0 ? (
                                    <p style={{color: "#989898", marginLeft: "10px"}}>本日無任務</p>
                                ) : (
                                    <div>
                                        {todayTasks.map((task, idx) => (
                                            <div
                                                key={task.id || idx}
                                                className={`task-card priority-${task.priority}`}
                                            >
                                                <div className="task-card-header">
                                                    <p className="task-card-title">{task.name}</p>
                                                    <span
                                                        className={`task-status-badge status-${task.status}`}
                                                    >
                                                        {
                                                        task.status === 'pending' ? '待辦' :
                                                        task.status === 'in-progress' ? '進行中' :
                                                        task.status === 'completed' ? '已完成' :
                                                        task.status === 'delayed' ? '延期' : task.status}
                                                    </span>
                                                </div>
                                                <p className="task-priority">
                                                    優先級: {
                                                            task.priority === 'high' ? '高' :
                                                            task.priority === 'medium' ? '中' : '低'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 任務輪播 */}
                    <div style={{marginTop: "20px"}}>
                        <h3 className="section-title">即將到來的任務</h3>
                        <div className="scroller">
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
                                                    {task.name}
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
                    </div>
                </div>

                {/* 聊天按鈕和聊天室 - 移至 CalendarPage 的最外層，確保定位正確 */}
            </div>

            {/* 聊天按鈕 */}
            <button className="chat-button" onClick={toggleChat}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" fill="white"/>
                    <path d="M7 9h10M7 12h7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
            </button>

            {/* 聊天室 */}
            {isChatOpen && <Chatroom onClose={toggleChat} goalInfo={goalInfo} />}
        </div>
    );
}

export default CalendarPage;