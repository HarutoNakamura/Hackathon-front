import React, { useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "./firebase";
import SignUp from "./SignUp";
import Login from "./Login";

type Post = { id: number; email: string; content: string; created_at: string; likes?: number; };
type Reply = { email: string; content: string; created_at: string };

//const API_BASE_URL = "https://hackathon-back-297164197657.us-central1.run.app";
const API_BASE_URL = "http://localhost:8081";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [newPost, setNewPost] = useState("");
  const [newReply, setNewReply] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [filterTopic, setFilterTopic] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch {
      setError("ログアウトに失敗しました");
    }
  };

  const fetchRelevantPosts = async (topic: string) => {
    setError(null)
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/get`);
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    }
    const response = await fetch(`${API_BASE_URL}/api/posts/filter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        posts: posts.map((post) => ({ id: post.id, content: post.content })),
      }),
    });

    if (response.ok) {
      const relevantPostIDs: number[] = await response.json();
      if (relevantPostIDs==null){
        try {
          const response = await fetch(`${API_BASE_URL}/api/posts/get`);
          const data = await response.json();
          setPosts(data);
        } catch (err) {
          console.error("Failed to fetch posts:", err);
        }
        setLoading(false);
        setError("フィルター結果に該当するポストがありません")
      }else{
        setLoading(false);
        setPosts(posts.filter((post) => relevantPostIDs.includes(post.id)));
      }
    } else {
      setLoading(false);
      console.error("Failed to fetch relevant posts");
    }
  };

  const fetchPosts = async () => {
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/get`);
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
      setError("コメント取得失敗")
    }
  };

  const fetchReplies = async (postId: number) => {
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/replies/get?post_id=${postId}`);
      if (!response.ok) throw new Error("リプライの取得に失敗しました");
      const data = await response.json();
      setReplies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "不明なエラーが発生しました");
    }
  };

  const handleLike = async (postId: number) => {
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/likes/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, email: user?.email }),
      });

      if (response.ok) {
        fetchPosts(); // いいねの数を更新
      } else {
        console.error("Failed to toggle like");
      }
    } catch (err) {
      console.error("Failed to send like request:", err);
    }
  };

  const handlePostSubmit = async () => {
    setError(null)
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
    setError(null)
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

          <div>
            <h2>トピックでフィルター</h2>
            <input
              type="text"
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              placeholder="トピックを入力してください"
            />
            <button onClick={() => fetchRelevantPosts(filterTopic)}>フィルター</button>
          </div>
          {loading && <p>フィルター処理中... しばらくお待ちください。</p>}

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