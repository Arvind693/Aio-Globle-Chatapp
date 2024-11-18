import React from "react";

const Notification = ({ notifications, onClearNotification, onSelectNotification }) => {
  return (
    <div className="notification-container fixed top-16 right-4 bg-white shadow-lg rounded-lg w-80">
      <h3 className="bg-gray-800 text-white px-4 py-2 rounded-t-lg">Notifications</h3>
      {notifications.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No new notifications</div>
      ) : (
        <ul className="divide-y divide-gray-300">
          {notifications.map((notification, index) => (
            <li
              key={notification._id}
              className="p-3 flex items-start hover:bg-gray-100 cursor-pointer"
              onClick={() => onSelectNotification(notification.chat._id)}
            >
              <div className="flex-1">
                <p className="font-semibold">{notification.sender.name}</p>
                <p className="text-sm text-gray-500">{notification.content || "New message"}</p>
              </div>
              <button
                className="text-red-500 text-xs ml-4"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearNotification(notification._id);
                }}
              >
                Clear
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notification;
