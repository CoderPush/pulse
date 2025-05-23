'use client';

import { useEffect, useState } from 'react';
import { buildCommentTree, Comment } from '@/utils/buildCommentTree';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Reply, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

function getRoleColor(role: string) {
  return role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700';
}
function getInitial(role: string) {
  return role ? role.charAt(0).toUpperCase() : '?';
}


export default function SubmissionComments({ submissionId, currentUserId }: { submissionId: string; currentUserId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [topLevelContent, setTopLevelContent] = useState('');
  const [postingTopLevel, setPostingTopLevel] = useState(false);
  const [topLevelError, setTopLevelError] = useState<string | null>(null);

  useEffect(() => {
    if (!submissionId) return;
    setLoading(true);
    fetch(`/api/comments?submission_id=${submissionId}`)
      .then(res => res.json())
      .then(data => setComments(data.comments || []))
      .finally(() => setLoading(false));
  }, [submissionId, refreshFlag]);

  const refreshComments = () => setRefreshFlag(f => f + 1);

  // Optimistically add a reply to the comment tree
  const addReplyOptimistically = (parentId: string, reply: Comment) => {
    function addReplyToTree(tree: Comment[]): Comment[] {
      return tree.map(comment => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), reply],
          };
        } else if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: addReplyToTree(comment.replies),
          };
        }
        return comment;
      });
    }
    setComments(prev => addReplyToTree(prev));
  };

  // Remove an optimistic reply (by id)
  const removeReplyById = (replyId: string) => {
    function removeReply(tree: Comment[]): Comment[] {
      return tree.map(comment => {
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: comment.replies.filter(r => r.id !== replyId).map(r => ({
              ...r,
              replies: r.replies ? removeReply(r.replies) : [],
            })),
          };
        }
        return comment;
      });
    }
    setComments(prev => removeReply(prev));
  };

  const handlePostTopLevel = async () => {
    setPostingTopLevel(true);
    setTopLevelError(null);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submissionId,
          content: topLevelContent,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setTopLevelError(data.error || 'Failed to post comment');
      } else {
        setTopLevelContent('');
        refreshComments();
      }
    } catch {
      setTopLevelError('Network error');
    } finally {
      setPostingTopLevel(false);
    }
  };

  return (
    <div className="mt-8">
      <h3 className="font-semibold mb-2">Comments</h3>
      {/* Top-level comment form */}
      <div className="mb-6">
        <textarea
          className="w-full border rounded p-2"
          rows={2}
          value={topLevelContent}
          onChange={e => setTopLevelContent(e.target.value)}
          placeholder="Add a comment..."
          disabled={postingTopLevel}
        />
        <div className="flex items-center gap-2 mt-1">
          <Button
            onClick={handlePostTopLevel}
            disabled={postingTopLevel || !topLevelContent.trim()}
            variant="default"
            className="min-w-[100px] flex items-center justify-center"
          >
            {postingTopLevel ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Posting...
              </>
            ) : (
              'Post Comment'
            )}
          </Button>
          {topLevelError && <span className="text-red-600 text-xs">{topLevelError}</span>}
        </div>
      </div>
      {loading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin h-5 w-5 text-blue-500" />
        </div>
      ) : (
        <CommentThread
          comments={buildCommentTree(comments)}
          submissionId={submissionId}
          onReplySuccess={refreshComments}
          currentUserId={currentUserId}
          addReplyOptimistically={addReplyOptimistically}
          removeReplyById={removeReplyById}
          replaceOptimisticReply={(tempId, realComment) => {
            setComments(prev => {
              // Remove the optimistic reply and add the real comment
              const filtered = prev.filter(c => c.id !== tempId);
              return [...filtered, realComment];
            });
          }}
        />
      )}
    </div>
  );
}

function CommentThread({ comments, submissionId, onReplySuccess, currentUserId, addReplyOptimistically, removeReplyById, replaceOptimisticReply }: {
  comments: Comment[];
  submissionId: string;
  onReplySuccess: () => void;
  currentUserId: string;
  addReplyOptimistically: (parentId: string, reply: Comment) => void;
  removeReplyById: (replyId: string) => void;
  replaceOptimisticReply: (tempId: string, realComment: Comment) => void;
}) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReply = async (parentId: string) => {
    setPosting(true);
    setError(null);
    // Create a temporary optimistic reply
    const tempId = `optimistic-${Date.now()}`;
    const optimisticReply: Comment = {
      id: tempId,
      author_id: currentUserId,
      author_role: 'user', // or get from context if available
      content: replyContent,
      created_at: new Date().toISOString(),
      parent_id: parentId,
      replies: [],
    };
    addReplyOptimistically(parentId, optimisticReply);
    setReplyContent('');
    setReplyingTo(null);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submissionId,
          parent_id: parentId,
          content: optimisticReply.content,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to post reply');
        removeReplyById(tempId);
      } else {
        // Optionally update the optimistic reply with the real data from the server
        const data = await res.json();
        if (data.comment && data.comment.id) {
          replaceOptimisticReply(tempId, data.comment);
        }
      }
    } catch {
      setError('Network error');
      removeReplyById(tempId);
    } finally {
      setPosting(false);
    }
  };

  if (!comments || comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 bg-muted/40 rounded-lg border border-dashed border-blue-200">
        <MessageCircle className="w-10 h-10 text-blue-400 mb-2" />
        <div className="text-muted-foreground font-semibold text-lg mb-1">No comments yet</div>
        <div className="text-xs text-gray-400">Be the first to start the conversation!</div>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {comments.map((comment: Comment) => (
        <li key={comment.id} className="flex items-start space-x-3 opacity-100 transition-opacity">
          <Avatar>
            <AvatarFallback className={getRoleColor(comment.author_role)}>
              {getInitial(comment.author_role)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={comment.author_role === 'admin' ? 'default' : 'secondary'}>
                  {comment.author_role === 'admin'
                    ? 'admin'
                    : comment.author_id === currentUserId
                      ? 'You'
                      : 'user'}
                </Badge>
                <span className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleString()}</span>
              </div>
              <div className="text-sm">{comment.content}</div>
              {/* Reply button for admin comments */}
              {comment.author_role === 'admin' && (
                <motion.div
                  whileTap={{ scale: 0.97 }}
                  className="inline-block w-full"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs px-4 py-1 rounded-full border-blue-200 text-blue-700 font-bold bg-white hover:bg-blue-50 hover:shadow transition-all flex items-center gap-1"
                    onClick={() => setReplyingTo(comment.id)}
                    disabled={posting}
                    style={{ boxShadow: '0 2px 8px 0 rgba(37,99,235,0.07)' }}
                  >
                    <Reply className="w-4 h-4 mr-1" />
                    Reply
                  </Button>
                </motion.div>
              )}
              {/* Reply form */}
              {replyingTo === comment.id && (
                <div className="mt-2">
                  <textarea
                    className="w-full border rounded p-2"
                    rows={2}
                    value={replyContent}
                    onChange={e => setReplyContent(e.target.value)}
                    placeholder="Write your reply..."
                    disabled={posting}
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      onClick={() => handleReply(comment.id)}
                      disabled={posting || !replyContent.trim()}
                      variant="default"
                      className="min-w-[100px] flex items-center justify-center"
                    >
                      {posting ? (
                        <>
                          <Loader2 className="animate-spin mr-2 h-4 w-4" />
                          Posting...
                        </>
                      ) : (
                        'Post Reply'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => { setReplyingTo(null); setReplyContent(''); }}
                      disabled={posting}
                    >
                      Cancel
                    </Button>
                    {error && <span className="text-red-600 text-xs">{error}</span>}
                  </div>
                </div>
              )}
            </Card>
            {/* Render replies recursively */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="ml-8 mt-2 border-l border-muted pl-4">
                <CommentThread
                  comments={comment.replies!}
                  submissionId={submissionId}
                  onReplySuccess={onReplySuccess}
                  currentUserId={currentUserId}
                  addReplyOptimistically={addReplyOptimistically}
                  removeReplyById={removeReplyById}
                  replaceOptimisticReply={replaceOptimisticReply}
                />
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
} 