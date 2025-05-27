export interface Comment {
  id: string;
  parent_id: string | null;
  author_id: string;
  author_role: string;
  content: string;
  created_at: string;
  replies?: Comment[];
  users?: { email?: string } | null;
}

export function buildCommentTree(comments: Comment[]): Comment[] {
  const map: Record<string, Comment> = {};
  const roots: Comment[] = [];
  comments.forEach((comment: Comment) => {
    map[comment.id] = { ...comment, replies: [] };
  });
  comments.forEach((comment: Comment) => {
    if (comment.parent_id) {
      map[comment.parent_id]?.replies?.push(map[comment.id]);
    } else {
      roots.push(map[comment.id]);
    }
  });
  return roots;
} 