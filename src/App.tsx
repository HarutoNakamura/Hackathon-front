import React, { useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "./firebase";
import SignUp from "./SignUp";
import Login from "./Login";

type Comment = { email: string; comment: string };
type Post = { id: number; email: string; content: string; created_at: string; likes?: number; };
type Reply = { email: string; content: string; created_at: string };

const API_BASE_URL = "https://hackathon-back-297164197657.us-central1.run.app";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [newPost, setNewPost] = useState("");
  const [newReply, setNewReply] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchComments();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch {
      setError("ログアウトに失敗しました");
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/get`);
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    }
  };
  

  const fetchComments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/comments/get`);
      if (!response.ok) throw new Error("コメントの取得に失敗しました");
      const data = await response.json();
      setComments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "不明なエラーが発生しました");
    }
  };

  const fetchReplies = async (postId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/replies/get?post_id=${postId}`);
      if (!response.ok) throw new Error("リプライの取得に失敗しました");
      const data = await response.json();
      setReplies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "不明なエラーが発生しました");
    }
  };

  const handleLike = async (postId:number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/likes/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, email: user?.email }),
      });
  
      if (response.ok) {
        // いいね数を再取得
        fetchPosts();
      } else {
        const errorData = await response.json();
        console.error("Error liking post:", errorData);
      }
    } catch (err) {
      console.error("Failed to send like request:", err);
    }
  };
  

  const handlePostSubmit = async () => {
    if (!user) return;
    try {
      await fetch(`${API_BASE_URL}/api/posts/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, content: newPost }),
      });
      setNewPost("");
      fetchPosts();
    } catch {
      setError("投稿の作成に失敗しました");
    }
  };

  const handleReplySubmit = async (postId: number) => {
    if (!user) return;
    try {
      await fetch(`${API_BASE_URL}/api/replies/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, email: user.email, content: newReply }),
      });
      setNewReply("");
      fetchReplies(postId);
    } catch {
      setError("リプライの投稿に失敗しました");
    }
  };

  return (
    <div>
      {user ? (
        <div>
          <h1>ようこそ、{user.email}!</h1>
          <button onClick={handleLogout}>ログアウト</button>
          {error && <p style={{ color: "red" }}>{error}</p>}
  
          <h2>新しい投稿</h2>
          <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)} />
          <button onClick={handlePostSubmit}>投稿</button>
  
          <h2>投稿一覧</h2>
          {(posts ?? []).map((post) => (
            <div key={post.id}>
              <p>
                <strong>{post.email}</strong>: {post.content} ({post.created_at})
              </p>
              <p>
                いいね数: {post.likes ?? 0}
                <button onClick={() => handleLike(post.id)}>いいね</button>
              </p>
              <button
                onClick={() => {
                  setSelectedPostId(post.id);
                  fetchReplies(post.id);
                }}
              >
                リプライを見る
              </button>
              {selectedPostId === post.id && (
                <div>
                  {(replies ?? []).map((reply, idx) => (
                    <p key={idx}>
                      <strong>{reply.email}</strong>: {reply.content} ({reply.created_at})
                    </p>
                  ))}
                  <textarea value={newReply} onChange={(e) => setNewReply(e.target.value)} />
                  <button onClick={() => handleReplySubmit(post.id)}>リプライを投稿</button>
                </div>
              )}
            </div>
          ))}
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