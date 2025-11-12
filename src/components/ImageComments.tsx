import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  user_id: string;
  comment: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string;
  };
}

interface ImageCommentsProps {
  imageId: string;
  currentUserId: string;
}

export const ImageComments = ({ imageId, currentUserId }: ImageCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [imageId, showComments]);

  const fetchComments = async () => {
    try {
      const { data: commentsData, error } = await supabase
        .from("image_comments")
        .select("*")
        .eq("image_id", imageId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profile data for each comment
      const commentsWithProfiles = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", comment.user_id)
            .single();

          return {
            ...comment,
            profiles: profileData || { username: "Unknown", avatar_url: "" },
          };
        })
      );

      setComments(commentsWithProfiles);
    } catch (error: any) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("image_comments").insert({
        image_id: imageId,
        user_id: currentUserId,
        comment: newComment.trim(),
      });

      if (error) throw error;

      setNewComment("");
      await fetchComments();
      toast({
        title: "Comment posted! 💬",
        description: "Your comment has been added",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("image_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      setComments(comments.filter((c) => c.id !== commentId));
      toast({
        title: "Comment deleted",
        description: "Your comment has been removed",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        onClick={() => setShowComments(!showComments)}
        className="w-full transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-glow animate-slide-down"
      >
        <MessageCircle className="mr-2 animate-bounce-subtle" size={18} />
        {showComments ? "Hide" : "Show"} Comments ({comments.length})
      </Button>

      {showComments && (
        <div className="space-y-3 animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-2 animate-slide-down">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="bg-secondary border-border resize-none transition-all focus:scale-[1.02] focus:shadow-glow"
              rows={2}
            />
            <Button
              type="submit"
              disabled={loading || !newComment.trim()}
              className={`w-full bg-gradient-primary transition-all duration-300 hover:scale-105 active:scale-95 ${
                loading ? "animate-pulse" : ""
              }`}
            >
              <Send className="mr-2" size={18} />
              {loading ? "Posting..." : "Post Comment"}
            </Button>
          </form>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {comments.length === 0 ? (
              <Card className="p-4 text-center bg-gradient-card border-border animate-scale-up">
                <p className="text-sm text-muted-foreground">
                  No comments yet. Be the first to comment!
                </p>
              </Card>
            ) : (
              comments.map((comment, index) => (
                <Card
                  key={comment.id}
                  className="p-3 bg-gradient-card border-border animate-slide-in-left hover:shadow-glow transition-all"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8 transition-transform hover:scale-125">
                      <AvatarImage src={comment.profiles?.avatar_url} />
                      <AvatarFallback className="bg-gradient-primary text-xs">
                        {comment.profiles?.username?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">
                          @{comment.profiles?.username || "Unknown"}
                        </p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm mt-1 break-words">{comment.comment}</p>
                      {comment.user_id === currentUserId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(comment.id)}
                          className="mt-2 h-7 text-xs hover:text-destructive transition-all hover:scale-105"
                        >
                          <Trash2 size={14} className="mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
