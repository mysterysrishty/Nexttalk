import React, { useEffect, useState } from "react";
import "./Home.css";
import Sidebar from "../../components/sidebar/Sidebar";
import ChatBox from "../../components/chatBox/ChatBox";
import axios from "axios";

const Home = () => {
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);

  // Get logged-in user (from localStorage or API)
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);
  }, []);

  // Fetch chat rooms
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/rooms");
        setRooms(res.data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchRooms();
  }, []);

  return (
    <div className="home">
      {/* Sidebar */}
      <div className="homeSidebar">
        <Sidebar
          rooms={rooms}
          setCurrentRoom={setCurrentRoom}
          currentUser={user}
        />
      </div>

      {/* Chat Area */}
      <div className="homeChat">
        {currentRoom ? (
          <ChatBox currentRoom={currentRoom} currentUser={user} />
        ) : (
          <div className="noChat">
            <h2>Select a chat to start messaging 💬</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;