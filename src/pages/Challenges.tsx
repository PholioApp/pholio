import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Trophy, Calendar, ThumbsUp, Upload, Award } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const Challenges = () => {
  const [user, setUser] = useState<any>(null);
  const [activeChallenges, setActiveChallenges] = useState<any[]>([]);
  const [votingChallenges, setVotingChallenges] = useState<any[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<any[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [myImages, setMyImages] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState("");
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      setUser(user);
      await fetchChallenges();
      await fetchMyImages(user.id);
    };

    fetchData();
  }, [navigate]);

  const fetchChallenges = async () => {
    try {
      const { data: challenges, error } = await supabase
        .from("challenges")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const now = new Date();
      const active = challenges?.filter(c => c.status === "active" && new Date(c.end_date) > now) || [];
      const voting = challenges?.filter(c => c.status === "voting" || (c.status === "active" && new Date(c.end_date) <= now && new Date(c.voting_end_date) > now)) || [];
      const completed = challenges?.filter(c => c.status === "completed" || new Date(c.voting_end_date) <= now) || [];

      setActiveChallenges(active);
      setVotingChallenges(voting);
      setCompletedChallenges(completed);
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

  const fetchMyImages = async (userId: string) => {
    const { data, error } = await supabase
      .from("images")
      .select("*")
      .eq("seller_id", userId)
      .eq("status", "active");

    if (!error) setMyImages(data || []);
  };

  const fetchSubmissions = async (challengeId: string) => {
    const { data: subs, error } = await supabase
      .from("challenge_submissions")
      .select(`
        *,
        images(*),
        profiles:user_id(username, avatar_url)
      `)
      .eq("challenge_id", challengeId)
      .order("votes_count", { ascending: false });

    if (!error) {
      setSubmissions(subs || []);
      
      // Fetch user's votes for this challenge
      if (user) {
        const submissionIds = subs?.map(s => s.id) || [];
        const { data: votes } = await supabase
          .from("challenge_votes")
          .select("submission_id")
          .eq("user_id", user.id)
          .in("submission_id", submissionIds);

        setUserVotes(new Set(votes?.map(v => v.submission_id) || []));
      }
    }
  };

  const handleSubmitToChallenge = async () => {
    if (!selectedImage || !selectedChallenge || !user) return;

    try {
      const { error } = await supabase
        .from("challenge_submissions")
        .insert({
          challenge_id: selectedChallenge.id,
          image_id: selectedImage,
          user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your photo has been submitted to the challenge",
      });

      fetchSubmissions(selectedChallenge.id);
      setSelectedImage("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleVote = async (submissionId: string) => {
    if (!user) return;

    try {
      if (userVotes.has(submissionId)) {
        // Unvote
        const { error } = await supabase
          .from("challenge_votes")
          .delete()
          .eq("submission_id", submissionId)
          .eq("user_id", user.id);

        if (error) throw error;

        setUserVotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(submissionId);
          return newSet;
        });
      } else {
        // Vote
        const { error } = await supabase
          .from("challenge_votes")
          .insert({
            submission_id: submissionId,
            user_id: user.id,
          });

        if (error) throw error;

        setUserVotes(prev => new Set(prev).add(submissionId));
      }

      fetchSubmissions(selectedChallenge.id);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const openChallenge = (challenge: any) => {
    setSelectedChallenge(challenge);
    fetchSubmissions(challenge.id);
  };

  const ChallengeCard = ({ challenge, showSubmitButton = false }: any) => {
    const endDate = new Date(challenge.end_date);
    const votingEndDate = new Date(challenge.voting_end_date);
    const now = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isVoting = endDate <= now && votingEndDate > now;

    return (
      <Card className="p-6 bg-gradient-card border-border cursor-pointer hover:shadow-glow transition-shadow" onClick={() => openChallenge(challenge)}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold mb-2">{challenge.title}</h3>
            <Badge className="bg-primary/20 text-primary border-primary/30">{challenge.theme}</Badge>
          </div>
          <Trophy className="text-primary" size={24} />
        </div>
        
        <p className="text-muted-foreground mb-4">{challenge.description}</p>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar size={16} />
            <span>{isVoting ? "Voting" : `${daysLeft} days left`}</span>
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return <LoadingSpinner message="Loading challenges..." />;
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <Button variant="secondary" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2" size={18} />
            Back
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Photo Challenges
          </h1>
          <div className="w-20" />
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="active">Active ({activeChallenges.length})</TabsTrigger>
            <TabsTrigger value="voting">Voting ({votingChallenges.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedChallenges.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} showSubmitButton />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="voting">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {votingChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Challenge Submissions Dialog */}
        <Dialog open={!!selectedChallenge} onOpenChange={(open) => !open && setSelectedChallenge(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Trophy className="text-primary" />
                {selectedChallenge?.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div>
                <Badge className="bg-primary/20 text-primary border-primary/30 mb-2">
                  {selectedChallenge?.theme}
                </Badge>
                <p className="text-muted-foreground">{selectedChallenge?.description}</p>
              </div>

              {/* Submit Photo */}
              <Card className="p-4 bg-gradient-card border-border">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Upload size={18} />
                  Submit Your Photo
                </h3>
                <div className="flex gap-3">
                  <Select value={selectedImage} onValueChange={setSelectedImage}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select one of your photos" />
                    </SelectTrigger>
                    <SelectContent>
                      {myImages.map((img) => (
                        <SelectItem key={img.id} value={img.id}>
                          {img.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleSubmitToChallenge} disabled={!selectedImage} className="bg-gradient-primary">
                    Submit
                  </Button>
                </div>
              </Card>

              {/* Submissions */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Award size={18} />
                  Submissions ({submissions.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {submissions.map((submission) => (
                    <Card key={submission.id} className="overflow-hidden bg-gradient-card border-border">
                      <div className="aspect-square bg-secondary">
                        <img
                          src={submission.images.image_url}
                          alt={submission.images.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold truncate flex-1">{submission.images.title}</h4>
                          {submission.is_winner && (
                            <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                              Winner
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          by @{submission.profiles?.username || "Unknown"}
                        </p>
                        <Button
                          variant={userVotes.has(submission.id) ? "default" : "outline"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVote(submission.id);
                          }}
                          className="w-full"
                        >
                          <ThumbsUp size={16} className="mr-2" />
                          {submission.votes_count} {userVotes.has(submission.id) ? "Voted" : "Vote"}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Challenges;
