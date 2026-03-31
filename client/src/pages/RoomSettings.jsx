import React, { useState } from "react";
import "./RoomSetting.css";
import axios from "axios";

const RoomSetting = ({ room, setCurrentRoom, refreshRooms }) => {
  const [roomName, setRoomName] = useState(room?.name || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Update room name
  const handleUpdate = async () => {
    if (!roomName) return;

    setLoading(true);
    setMessage("");

    try {
      await axios.put(
        `http://localhost:5000/api/rooms/${room._id}`,
        { name: roomName }
      );

      setMessage("Room updated successfully ✅");
      refreshRooms(); // reload rooms
    } catch (err) {
      setMessage("Failed to update room ❌");
    } finally {
      setLoading(false);
    }
  };

  // Delete room
  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this room?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:5000/api/rooms/${room._id}`);
      setCurrentRoom(null);
      refreshRooms();
    } catch (err) {
      alert("Failed to delete room");
    }
  };

  return (
    <div className="roomSetting">
      <h2>Room Settings ⚙️</h2>

      <div className="roomInfo">
        <label>Room Name</label>
        <input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />
      </div>

      <button onClick={handleUpdate} disabled={loading}>
        {loading ? "Updating..." : "Update Room"}
      </button>

      <button className="deleteBtn" onClick={handleDelete}>
        Delete Room
      </button>

      {message && <p className="message">{message}</p>}

      {/* Optional: Members */}
      {room?.members && (
        <div className="members">
          <h4>Members 👥</h4>
          {room.members.map((member, index) => (
            <div key={index} className="member">
              {member.username || member}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoomSetting;