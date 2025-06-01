import React, { useState, useEffect, useRef } from 'react';
import '../css/TaskOverview.css';
import Navbar from '../components/Navbar';
import { useParams, useNavigate } from 'react-router-dom';
import moment from 'moment';

function TaskOverview() {

    const {goalId} = useParams();
    const navigate = useNavigate();
    const [date, setDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [allTasks, setAllTasks] = useState([]);
;
    const [goalInfo, setGoalInfo] = useState(null);
    const [allGoals, setAllGoals] = useState([]);
    const [selectedGoalId, setSelectedGoalId] = useState(goalId || null);
    const [debugInfo, setDebugInfo] = useState({
        apiCalls: [],
        responseData: null
    });

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
    };


    const formattedDate = moment(date).format("YYYY-MM-DD");



    return (
        <div className="CalendarPage">
        <Navbar />
        <div style={{ padding: '10px', marginLeft: "15%", minHeight: '100vh', color: "white"}}>
            <p style={{ marginLeft: "2%", color: "#CCC", fontSize: "26px" }}>事務總覽</p>

            
            <div className="scrollable-goal-list" style={{
                marginLeft: '2%',
                paddingRight: '10px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '15px' // 卡片之間的間距
                }}>
                {allGoals.length === 0 ? (
                    <div style={{ margin: '10px 0', padding: '10px', borderRadius: '5px' }}>
                    <p>載入中～</p>
                    </div>
                ) : (
                allGoals.map(goal => {
                const tasks = goal.tasks;
                const completed = tasks.filter(task => task.status === 'completed').length;
                const progress = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);

                return (
                    
                    <div
                    key={goal.id}
                    onClick={() => navigate(`/GoalDetail/${goal.id}`)}
                    style={{
                        height: '25%',
                    
                        backgroundColor: 'rgba(45, 50, 57, 0.5)',
                        padding: '10px',
                        borderRadius: '3px',
                        flex: '0 0 calc(25% - 15px)',
                        boxSizing: 'border-box',
                        color: 'white',
                        border: '1px solid #484848',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        alignItems: 'flex-start',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                <p><strong>名稱：</strong>{goal.eventName}</p>
                <p><strong>截止日期：</strong>{moment(goal.eventDeadLine).format('YYYY-MM-DD')}</p>

                {tasks.length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#aaa' }}>目前無任務</p>
                ) : (
                    <>
                    <div style={{
                        marginTop: '10px',
                        backgroundColor: '#555',
                        borderRadius: '4px',
                        height: '10px',
                        width: '100%'
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
                    );
                })
                )}

                </div>
        </div>

        </div>
    );

}

export default TaskOverview;