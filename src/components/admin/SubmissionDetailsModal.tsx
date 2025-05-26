import { WeeklyPulseSubmission, Project } from '../../types/weekly-pulse';
import { useEffect, useRef, useState, useCallback } from 'react';
import { buildCommentTree, Comment } from '@/utils/buildCommentTree';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, X, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SubmissionDetailsModalProps {
  submission: WeeklyPulseSubmission;
  isOpen: boolean;
  onClose: () => void;
}

// Define a type for user options
export type UserOption = {
  id: string;
  name?: string | null;
  email: string;
};

export default function SubmissionDetailsModal({ submission, isOpen, onClose }: SubmissionDetailsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [sharedUsers, setSharedUsers] = useState<UserOption[]>([]);
  const [loadingShares, setLoadingShares] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);

  const submissionId = submission?.id;

  // Handle Escape key press
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  const fetchComments = useCallback(async () => {
    if (!submissionId) return;
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/comments?submission_id=${submissionId}`);
      if (!res.ok) {
        setComments([]);
        return;
      }
      const data = await res.json();
      setComments(data.comments || []);
    } catch {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  }, [submissionId]);

  useEffect(() => {
    if (isOpen && submissionId) fetchComments();
  }, [isOpen, submissionId, fetchComments]);

  const handlePostComment = async () => {
    if (!submissionId) return;
    setPosting(true);
    setPostError(null);
    try {
      const res = await fetch('/api/admin/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submissionId,
          content: comment,
        }),
      });
      if (!res.ok) {
        let message = `HTTP ${res.status}`;
        try { message = (await res.json()).error || message; } catch {}
        setPostError(message);
      } else {
        setComment('');
        fetchComments();
      }
    } catch {
      setPostError('Network error');
    } finally {
      setPosting(false);
    }
  };

  // Fetch shared users
  const fetchShares = useCallback(async () => {
    if (!submissionId) return;
    setLoadingShares(true);
    setShareError(null);
    try {
      const res = await fetch(`/api/admin/submissions/${submissionId}/shares`);
      const data = await res.json();
      if (res.ok) setSharedUsers(data.users || []);
      else setShareError(data.error || 'Failed to load shared users');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      setShareError('Network error');
    } finally {
      setLoadingShares(false);
    }
  }, [submissionId]);

  useEffect(() => {
    if (isOpen && submissionId) fetchShares();
  }, [isOpen, submissionId, fetchShares]);

  // Fetch all users once when modal opens
  useEffect(() => {
    if (isOpen) {
      fetch('/api/admin/users')
        .then(res => res.json())
        .then(data => setAllUsers(data.data || []))
        .catch(() => setAllUsers([]));
    }
  }, [isOpen]);

  // User search (frontend filtering)
  useEffect(() => {
    if (!userSearch) {
      setUserOptions([]);
      return;
    }
    setSearchLoading(true);
    const filtered = allUsers.filter(u =>
      (u.name || u.email).toLowerCase().includes(userSearch.toLowerCase())
    );
    setUserOptions(filtered);
    setSearchLoading(false);
  }, [userSearch, allUsers]);

  // Share with user
  const handleShare = async () => {
    if (!selectedUserId || !submissionId) return;
    setSharing(true);
    setShareError(null);
    try {
      const res = await fetch(`/api/admin/submissions/${submissionId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: selectedUserId })
      });
      const data = await res.json();
      if (!res.ok) setShareError(data.error || 'Failed to share');
      else {
        setSelectedUserId(null);
        setUserSearch('');
        fetchShares();
      }
    } catch {
      setShareError('Network error');
    } finally {
      setSharing(false);
    }
  };

  // Remove user
  const handleRemove = async (userId: string) => {
    if (!submissionId) return;
    setRemovingUserId(userId);
    setShareError(null);
    try {
      const res = await fetch(`/api/admin/submissions/${submissionId}/share?user_id=${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) setShareError(data.error || 'Failed to remove');
      else fetchShares();
    } catch {
      setShareError('Network error');
    } finally {
      setRemovingUserId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-500 bg-opacity-30 flex items-center justify-center p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabIndex={-1}
      ref={modalRef}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 id="modal-title" className="text-xl font-semibold">Submission Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
              aria-label="Close modal"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p className="mt-1 text-sm text-gray-900">{submission.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Week</h3>
                <p className="mt-1 text-sm text-gray-900">Week {submission.week_number}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Manager</h3>
                <p className="mt-1 text-sm text-gray-900">{submission.manager}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <p className="mt-1 text-sm text-gray-900">{submission.status}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Submitted At</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(submission.submission_at).toLocaleString()}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Form Completion Time</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {submission.form_completion_time ? `${submission.form_completion_time} minutes` : 'N/A'}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-500">Primary Project</h3>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Project Name</h4>
                  <p className="mt-1 text-sm text-gray-900">{submission.primary_project.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Hours</h4>
                  <p className="mt-1 text-sm text-gray-900">{submission.primary_project.hours}</p>
                </div>
              </div>
            </div>

            {submission.additional_projects && submission.additional_projects.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-500">Additional Projects</h3>
                <div className="mt-2 space-y-4">
                  {submission.additional_projects.map((project: Project, index: number) => (
                    <div key={index} className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Project Name</h4>
                        <p className="mt-1 text-sm text-gray-900">{project.name}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Hours</h4>
                        <p className="mt-1 text-sm text-gray-900">{project.hours}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {submission.feedback && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-500">Feedback</h3>
                <p className="mt-1 text-sm text-gray-900">{submission.feedback}</p>
              </div>
            )}

            {submission.changes_next_week && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-500">Changes Next Week</h3>
                <p className="mt-1 text-sm text-gray-900">{submission.changes_next_week}</p>
              </div>
            )}

            {submission.milestones && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-500">Milestones</h3>
                <p className="mt-1 text-sm text-gray-900">{submission.milestones}</p>
              </div>
            )}

            {submission.other_feedback && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-500">Other Feedback</h3>
                <p className="mt-1 text-sm text-gray-900">{submission.other_feedback}</p>
              </div>
            )}

            {submission.hours_reporting_impact && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-500">Hours Reporting Impact</h3>
                <p className="mt-1 text-sm text-gray-900">{submission.hours_reporting_impact}</p>
              </div>
            )}

          </div>
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Comments</h3>
            {loadingComments ? (
              <div>Loading comments...</div>
            ) : (
              <CommentThread comments={buildCommentTree(comments)} />
            )}
          </div>
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Add Admin Comment</h3>
            <textarea
              className="w-full border rounded p-2"
              rows={3}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Write your comment as admin..."
              disabled={posting}
            />
            <div className="flex items-center gap-2 mt-2">
              <Button
                onClick={handlePostComment}
                disabled={posting || !comment.trim()}
                variant="default"
                className="min-w-[120px] flex items-center justify-center"
              >
                {posting ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Posting...
                  </>
                ) : (
                  'Post Comment'
                )}
              </Button>
              {postError && <span className="text-red-600">{postError}</span>}
            </div>
          </div>
          {/* Share Section */}
          {isOpen && submissionId && (
            <div className="border-t pt-4 my-6">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <UserPlus className="w-4 h-4" /> Share Submission
                </h3>
                <CopyLinkButton submissionId={submissionId} />
              </div>
              <div className="mb-2">
                <Input
                  placeholder="Search users by name or email..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="max-w-md"
                  disabled={searchLoading}
                />
                {userSearch && userOptions.length > 0 && (
                  <div className="bg-white border rounded shadow mt-1 max-h-40 overflow-y-auto z-10">
                    {userOptions.map((u: UserOption) => (
                      <div
                        key={u.id}
                        className={`px-3 py-2 cursor-pointer hover:bg-blue-50 flex items-center justify-between ${selectedUserId === u.id ? 'bg-blue-100' : ''}`}
                        onClick={() => setSelectedUserId(u.id)}
                      >
                        <span>{u.name || u.email}</span>
                        {selectedUserId === u.id && <CheckIcon />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button
                onClick={handleShare}
                disabled={!selectedUserId || sharing}
                className="mt-2"
              >
                {sharing ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                Share
              </Button>
              {shareError && <div className="text-red-600 mt-2 text-sm">{shareError}</div>}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Shared With</h4>
                {loadingShares ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : sharedUsers.length === 0 ? (
                  <div className="text-muted-foreground text-sm">Not shared with anyone yet.</div>
                ) : (
                  <ul className="space-y-2">
                    {sharedUsers.map((u: UserOption) => (
                      <li key={u.id} className="flex items-center gap-2">
                        <span>{u.name || u.email}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemove(u.id)}
                          disabled={removingUserId === u.id}
                          aria-label="Remove user"
                        >
                          {removingUserId === u.id ? <Loader2 className="animate-spin w-4 h-4" /> : <X className="w-4 h-4" />}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getRoleColor(role: string) {
  return role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700';
}

function getInitial(role: string) {
  return role ? role.charAt(0).toUpperCase() : '?';
}

function CommentThread({ comments }: { comments: Comment[] }) {
  if (!comments || comments.length === 0) return <div className="text-muted-foreground">No comments yet.</div>;
  return (
    <ul className="space-y-3">
      {comments.map((comment: Comment) => (
        <li key={comment.id} className="flex items-start space-x-3">
          <Avatar>
            <AvatarFallback className={getRoleColor(comment.author_role)}>
              {getInitial(comment.author_role)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Card className="p-3">
              <div className="mb-1">
                <span className="font-bold">
                  {comment.author_role === 'admin' ? 'admin' : comment.users?.email || 'user'}
                </span>
                <div className="text-xs text-gray-500">
                  {new Date(comment.created_at).toLocaleString()}
                </div>
              </div>
              <div className="text-sm mb-1 whitespace-pre-wrap break-words">
                {comment.content}
              </div>
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-4 border-l pl-2 mt-2">
                  <CommentThread comments={comment.replies!} />
                </div>
              )}
            </Card>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CheckIcon() {
  return <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
}

function CopyLinkButton({ submissionId }: { submissionId: string }) {
  const [copied, setCopied] = useState(false);
  const link = typeof window !== 'undefined' ? `${window.location.origin}/submissions/${submissionId}` : '';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
      onClick={handleCopy}
    >
      <Copy className="w-4 h-4" />
      {copied ? "Copied!" : "Copy Link"}
    </Button>
  );
} 