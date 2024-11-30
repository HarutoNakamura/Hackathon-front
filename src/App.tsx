import React, { useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "./firebase";
import SignUp from "./SignUp";
import Login from "./Login";

type Comment = {
  email: string;
  comment: string;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState<string | null>(null); // State to hold error message

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleCommentSubmit = async () => {
    if (user) {
      try {
        const response = await fetch("http://localhost:8081/api/comments/post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, comment: newComment }),
        });

        if (!response.ok) {
          throw new Error("Failed to post comment");
        }

        const newComments = await fetchComments();
        setComments(newComments);
        setNewComment("");
      } catch (err) {
        // Cast the error to an Error object to access the message
        if (err instanceof Error) {
          setError(err.message); // Set error message if an error occurs
        } else {
          setError("An unknown error occurred");
        }
      }
    }
  };

  const fetchComments = async (): Promise<Comment[]> => {
    try {
      const response = await fetch("http://localhost:8081/api/comments/get");
      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }
      const data = await response.json();
      return data;
    } catch (err) {
      // Cast the error to an Error object to access the message
      if (err instanceof Error) {
        setError(err.message); // Set error message
      } else {
        setError("An unknown error occurred");
      }
      return [];
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth); // Sign out the user
      setUser(null); // Update the state to reflect the logged-out status
    } catch (err) {
      setError("Failed to log out");
    }
  };

  useEffect(() => {
    fetchComments().then(setComments);
  }, []);

  return (
    <div>
      {user ? (
        <div>
          <h1>ようこそ、{user?.email}!</h1>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button onClick={handleCommentSubmit}>コメントを投稿</button>
          <button onClick={handleLogout}>ログアウト</button> {/* Logout button */}
          {error && <p style={{ color: "red" }}>{error}</p>} {/* Display error message */}
          <div>
            {comments.map((comment, index) => (
              <div key={index}>
                <p>
                  <strong>{comment.email}</strong>: {comment.comment}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <SignUp />
          <Login />
        </div>
      )}
    </div>
  );
}

export default App;
