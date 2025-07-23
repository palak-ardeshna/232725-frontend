import React, { useState, useEffect } from 'react';
import { Calendar, Badge, Card, Spin, Drawer, Modal, List, Radio } from 'antd';
import dayjs from 'dayjs';
import TaskView from './TaskView';
import { useTheme } from '../../../../../common/theme/ThemeContext';

const TaskCalendarPage = ({
  tasks = [],
  userMap = {},
  isLoading = false
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [fileDeleteStates, setFileDeleteStates] = useState({});
  const { isDark, theme } = useTheme();
  const [calendarMode, setCalendarMode] = useState('month');

  // Track which date cell has expanded tasks
  const [expandedDate, setExpandedDate] = useState(null);

  // State for tasks list modal
  const [tasksListModal, setTasksListModal] = useState({
    visible: false,
    date: null,
    tasks: []
  });

  // Get theme color for styling
  const getThemeColor = () => {
    const themeOptions = [
      { value: 'theme-default', color: '#19a7ce' },
      { value: 'theme-ocean', color: '#0ea5e9' },
      { value: 'theme-purple', color: '#8b5cf6' },
      { value: 'theme-green', color: '#10b981' },
      { value: 'theme-orange', color: '#f97316' },
      { value: 'theme-red', color: '#ef4444' },
      { value: 'theme-pink', color: '#ec4899' },
      { value: 'theme-indigo', color: '#6366f1' }
    ];

    const currentTheme = themeOptions.find(t => t.value === theme);
    return currentTheme?.color || '#1890ff';
  };

  // Get calendar header styles based on theme
  const getCalendarHeaderStyles = () => {
    const themeColor = getThemeColor();

    if (isDark) {
      return `
        .ant-picker-calendar-header {
          background-color: #141414 !important;
          color: rgba(255, 255, 255, 0.85) !important;
        }
        
        .ant-picker-calendar-header .ant-radio-button-wrapper {
          background-color: #141414 !important;
          color: rgba(255, 255, 255, 0.85) !important;
          border-color: #303030 !important;
        }
        
        .ant-picker-calendar-header .ant-radio-button-wrapper-checked {
          background-color: ${themeColor} !important;
          border-color: ${themeColor} !important;
          color: #fff !important;
        }
        
        .ant-picker-calendar-header .ant-radio-button-wrapper:not(:first-child)::before {
          background-color: #303030 !important;
        }
        
        .ant-picker-calendar-header .ant-select-dropdown {
          background-color: #141414 !important;
          color: rgba(255, 255, 255, 0.85) !important;
        }
        
        .ant-picker-calendar-header .ant-select-item {
          color: rgba(255, 255, 255, 0.85) !important;
        }
        
        .ant-picker-calendar-header .ant-select-item-option-selected {
          background-color: ${themeColor} !important;
        }
        
        .ant-picker-calendar-header .ant-select-selector {
          background-color: #141414 !important;
          color: rgba(255, 255, 255, 0.85) !important;
          border-color: #303030 !important;
        }
        
        .ant-picker-calendar-header .ant-select-arrow {
          color: rgba(255, 255, 255, 0.85) !important;
        }
        
        .ant-picker-panel {
          background-color: #141414 !important;
        }
      `;
    } else {
      return `
        .ant-picker-calendar-header {
          background-color: #fff !important;
        }
        
        .ant-picker-calendar-header .ant-radio-button-wrapper-checked {
          background-color: ${themeColor} !important;
          border-color: ${themeColor} !important;
          color: #fff !important;
        }
        
        .ant-picker-calendar-header .ant-select-item-option-selected {
          background-color: ${themeColor} !important;
        }
        
        .ant-picker-calendar-header .ant-select:hover .ant-select-selector {
          border-color: ${themeColor} !important;
        }
        
        .ant-picker-calendar-header .ant-select-focused .ant-select-selector {
          border-color: ${themeColor} !important;
          box-shadow: 0 0 0 2px rgba(${themeColor}, 0.2) !important;
        }
      `;
    }
  };

  // Effect to apply theme styles to calendar header
  useEffect(() => {
    const styleId = 'calendar-header-styles';
    let styleElement = document.getElementById(styleId);

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = getCalendarHeaderStyles();

    return () => {
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, [isDark, theme]);

  const handleDateSelect = (date) => {
    // No direct action on date select
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setSelectedTaskId(task.id);
    setDrawerVisible(true);
  };

  const handleViewCancel = () => {
    setDrawerVisible(false);
    setSelectedTaskId(null);
    setSelectedTask(null);
  };

  const handleDeleteFile = async () => {
    // Placeholder for file deletion functionality
  };

  // Handler for clicking on "more tasks" text
  const handleMoreClick = (date, tasks, e) => {
    if (e) {
      e.stopPropagation();
    }

    // Show modal with all tasks for this date
    setTasksListModal({
      visible: true,
      date: date,
      tasks: tasks
    });
  };

  // Close tasks list modal
  const handleTasksListModalClose = () => {
    setTasksListModal({
      visible: false,
      date: null,
      tasks: []
    });
  };

  // Function to get tasks for a specific date (only show tasks on their start date)
  const getTasksForDate = (date) => {
    const formattedDate = date.format('YYYY-MM-DD');
    return tasks.filter(task => {
      // Only show task on its start date
      const startDate = task.startDate ? dayjs(task.startDate).format('YYYY-MM-DD') : null;

      if (startDate) {
        return formattedDate === startDate;
      }
      return false;
    });
  };

  // Helper function to get badge color based on priority
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  // Custom cell renderer for the calendar
  const dateCellRender = (date) => {
    const tasksForDate = getTasksForDate(date);

    if (tasksForDate.length === 0) {
      return null;
    }

    // Display only 2 tasks max
    const displayTasks = tasksForDate.slice(0, 2);
    const hasMoreTasks = tasksForDate.length > 2;
    const moreCount = tasksForDate.length - 2;

    return (
      <div className="tasks-cell">
        {displayTasks.map(task => (
          <div key={task.id} className="task-item" onClick={() => handleTaskClick(task)}>
            <Badge
              status={getPriorityColor(task.priority)}
              text={task.taskName}
            />
          </div>
        ))}

        {hasMoreTasks && (
          <div className="more-tasks" onClick={(e) => handleMoreClick(date, tasksForDate, e)}>
            +{moreCount} more
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="task-calendar-page-loading">
        <Spin size="large" />
      </div>
    );
  }

  // Apply theme color to drawer header
  const drawerHeaderStyle = isDark ? {
    backgroundColor: '#141414',
    color: 'rgba(255, 255, 255, 0.85)',
    borderBottom: '1px solid #303030'
  } : {};

  // Modal title with date
  const modalTitle = tasksListModal.date ?
    `Tasks for ${tasksListModal.date.format('MMMM D, YYYY')}` :
    'Tasks';

  return (
    <div className="task-calendar-page">
      <Card className="calendar-card">
        <Calendar
          dateCellRender={dateCellRender}
          onSelect={handleDateSelect}
          fullscreen={true}
          cellRender={(date, info) => {
            if (info.type === 'date') {
              return dateCellRender(date);
            }
            return info.originNode;
          }}
          mode={calendarMode}
          onPanelChange={(date, mode) => setCalendarMode(mode)}
        />
      </Card>

      {/* Task Details Drawer */}
      <Drawer
        title="Task Details"
        placement="right"
        onClose={handleViewCancel}
        open={drawerVisible}
        width={500}
        destroyOnClose={true}
        headerStyle={drawerHeaderStyle}
      >
        {selectedTask && (
          <TaskView
            task={selectedTask}
            userMap={userMap}
            isLoading={false}
            visible={true}
            isDrawerContent={true}
            onClose={handleViewCancel}
            onDeleteFile={handleDeleteFile}
            fileDeleteStates={fileDeleteStates}
          />
        )}
      </Drawer>

      {/* Tasks List Modal */}
      <Modal
        title={modalTitle}
        open={tasksListModal.visible}
        onCancel={handleTasksListModalClose}
        footer={null}
        className={`common-modal modern-modal ${isDark ? 'dark-theme-modal' : ''}`}
      >
        <List
          dataSource={tasksListModal.tasks}
          renderItem={task => (
            <List.Item
              key={task.id}
              onClick={() => {
                handleTaskClick(task);
                handleTasksListModalClose();
              }}
              style={{ cursor: 'pointer' }}
            >
              <List.Item.Meta
                avatar={<Badge status={getPriorityColor(task.priority)} />}
                title={task.taskName}
                description={`Assigned to: ${userMap[task.assignedTo] || 'Unassigned'}`}
              />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
};

export default TaskCalendarPage; 