import React, { useState, useEffect } from "react";

type Post = {
  id: number;
  email: string;
  content: string;
  likeCount: number;
};

type Reply = {
  postId: number;
  email: string;
  content: string;
};

const App: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [replies, setReplies] = useState<{ [postId: number]: Reply[] }>({});
  const [newPost, setNewPost] = useState("");
  const [replyContent, setReplyContent] = useState<{ [postId: number]: string }>({});

  const user = { email: "test@example.com" }; // 仮のユーザー情報

  // 投稿取得
  const fetchPosts = async () => {
    const res = await fetch("/api/posts/get");
    const data: Post[] = await res.json();
    setPosts(data);
  };

  // リプライ取得
  const fetchReplies = async (postId: number) => {
    const res = await fetch(`/api/replies/get?postId=${postId}`);
    const data: Reply[] = await res.json();
    setReplies((prev) => ({ ...prev, [postId]: data }));
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // 投稿作成
  const handlePostSubmit = async () => {
    await fetch("/api/posts/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, content: newPost }),
    });
    setNewPost("");
    fetchPosts();
  };

  // リプライ作成
  const handleReplySubmit = async (postId: number) => {
    await fetch("/api/replies/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, email: user.email, content: replyContent[postId] }),
    });
    setReplyContent((prev) => ({ ...prev, [postId]: "" }));
    fetchReplies(postId);
  };

  // いいねトグル
  const handleLikeToggle = async (postId: number) => {
    await fetch("/api/likes/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, email: user.email }),
    });
    fetchPosts();
  };

  return (
    <div>
      <h1>Social App</h1>
      <div>
        <h2>Create a Post</h2>
        <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)} />
        <button onClick={handlePostSubmit}>Post</button>
      </div>
      <hr />
      <div>
        <h2>Posts</h2>
        {posts.map((post) => (
          <div key={post.id} style={{ marginBottom: "20px", border: "1px solid #ccc", padding: "10px" }}>
            <p><strong>{post.email}:</strong> {post.content}</p>
            <p>Likes: {post.likeCount}</p>
            <button onClick={() => handleLikeToggle(post.id)}>Like/Unlike</button>
            <div>
              <h4>Replies</h4>
              {replies[post.id]?.map((reply) => (
                <p key={reply.content}><strong>{reply.email}:</strong> {reply.content}</p>
              ))}
              <textarea
                value={replyContent[post.id] || ""}
                onChange={(e) => setReplyContent((prev) => ({ ...prev, [post.id]: e.target.value }))}
              />
              <button onClick={() => handleReplySubmit(post.id)}>Reply</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
