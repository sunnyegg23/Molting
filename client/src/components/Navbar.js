import React from 'react';
import '../css/Navbar.css'; // 可以把樣式也獨立出去

function Navbar() {
  return (
    <div className="navbar">
      <ul>
        <li><a href="/">日曆</a></li>
        <li><a href="/tasks">事務總覽</a></li>
        <li><a href="/settings">個人資料庫</a></li>
          <li><a href="/WorkingHabitsPage">個人工作習慣</a></li>
      </ul>
    </div>
  );
}

export default Navbar;
