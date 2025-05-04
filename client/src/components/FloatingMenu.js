import React, { useState } from 'react';
import '../css/FloatingMenu.css';
import ArticleReminder from './ArticleReminder';
import GoalBreakdown from './GoalBreakdown'

export default function FloatingMenu() {
  const [open, setOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(null); // null、'article'、'goal'、'habit'

  // menuItems 要寫在 function 裡面，才能用 setCurrentPage
  const menuItems = [
    { label: '記事提醒', onClick: () => setCurrentPage('article') },
    { label: '目標規劃', onClick: () => setCurrentPage('goal') },
    { label: '習慣養成', onClick: () => setCurrentPage('habit') },
  ];

  // 條件渲染
  return (
    <div className="floating-menu-container">
      {/* 主按鈕 */}
      <button className="fab-btn" onClick={() => { setOpen(true); setCurrentPage(null); }}>
        +
      </button>

      {/* 主選單（只有 open=true 而且 currentPage=null 才顯示） */}
      {open && currentPage === null && (
        <div className="menu-popup">
          <button className="menu-close-btn" onClick={() => setOpen(false)}>
            ×
          </button>
          <div className="menu-title">目標類型</div>
          <div className="menu-options">
            {menuItems.map((item, idx) => (
              <div className="menu-option" key={item.label}>
                <div className="menu-label">{idx + 1}. {item.label}</div>
                <button
                  className="menu-add-btn"
                  onClick={() => item.onClick()}
                >
                  +
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 記事提醒頁面 */}
      {open && currentPage === 'article' && (
        <ArticleReminder onClose={() => setCurrentPage(null)} />
      )}

      {/* 目標規劃、習慣養成頁面可依需求再加 */}
      {open && currentPage === 'goal' && (
        <GoalBreakdown onClose={() => setCurrentPage(null)} />
      )}
    </div>
  );
}
